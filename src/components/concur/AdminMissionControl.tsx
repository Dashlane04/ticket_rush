"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { AdminSeatTemplatesTable, type AdminSeatTemplateRow } from "@/components/concur/AdminSeatTemplatesTable";
import { nestFetch } from "@/lib/nest-api";
import {
  getDynamicColor,
  gridDimensions,
  parseSeatRecords,
  type ParsedSeat,
  type SeatApiRecord,
} from "@/lib/concur/seat-grid-utils";
import "@/styles/concur-admin-monitor.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { EVENT_ASSIGNABLE_CATEGORIES } from "@/lib/event-categories";

export type AdminEvent = {
  id: string;
  movieTitle: string;
  hallName: string;
  theatreName?: string;
  startTime: string;
  description?: string;
  totalSeats: number;
  availableSeats: number;
  category?: string;
  ticketSaleOpensAt?: string | null;
  projectionType?: string;
  ageRating?: string;
  maxSeatsPerBooking?: number;
};

const PROJECTION_OPTIONS = ["2D", "3D", "IMAX"] as const;
const AGE_RATING_OPTIONS = ["P", "K", "T13", "T16", "T18", "C18"] as const;

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
  });
}

export function AdminMissionControl() {
  const router = useRouter();
  const [allEvents, setAllEvents] = useState<AdminEvent[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hallFilter, setHallFilter] = useState("all");
  const [liveUsers, setLiveUsers] = useState(0);

  const [activeTab, setActiveTab] = useState<"events" | "promos">("events");

  const [templatesOpen, setTemplatesOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const [createTitle, setCreateTitle] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createBannerFile, setCreateBannerFile] = useState<File | null>(null);
  const [createStart, setCreateStart] = useState("");
  const [createDuration, setCreateDuration] = useState("120");
  const [createCategory, setCreateCategory] = useState<string>("Phim chiếu rạp");
  const [createTicketSaleOpens, setCreateTicketSaleOpens] = useState("");
  const [createProjectionType, setCreateProjectionType] = useState("2D");
  const [createAgeRating, setCreateAgeRating] = useState("T16");
  const [createTemplateId, setCreateTemplateId] = useState("");
  const [createMaxSeats, setCreateMaxSeats] = useState("8");
  const [templateOptions, setTemplateOptions] = useState<AdminSeatTemplateRow[]>([]);
  const [createSaving, setCreateSaving] = useState(false);

  const [editId, setEditId] = useState("");
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editBannerFile, setEditBannerFile] = useState<File | null>(null);
  const [editStart, setEditStart] = useState("");
  const [editCategory, setEditCategory] = useState<string>("Phim chiếu rạp");
  const [editTicketSaleOpens, setEditTicketSaleOpens] = useState("");
  const [editProjectionType, setEditProjectionType] = useState("2D");
  const [editAgeRating, setEditAgeRating] = useState("T16");
  const [editMaxSeats, setEditMaxSeats] = useState("8");
  const [editSaving, setEditSaving] = useState(false);

  const [monitorOpen, setMonitorOpen] = useState(false);
  const [monitorTitle, setMonitorTitle] = useState("");
  const [monitorEventId, setMonitorEventId] = useState<string | null>(null);
  const [monitorSeats, setMonitorSeats] = useState<ParsedSeat[]>([]);
  const [monitorCols, setMonitorCols] = useState(0);
  const [monitorCss, setMonitorCss] = useState("");
  const monitorIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideSeatLabel, setOverrideSeatLabel] = useState("");
  const [overrideCurrentStatus, setOverrideCurrentStatus] = useState("");
  const [overrideNewStatus, setOverrideNewStatus] = useState("available");
  const [overrideEventId, setOverrideEventId] = useState("");
  const [overrideSeatId, setOverrideSeatId] = useState("");
  const [overrideBusy, setOverrideBusy] = useState(false);

  const [promos, setPromos] = useState<any[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);
  const [createPromoOpen, setCreatePromoOpen] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState("10");
  const [promoMaxUses, setPromoMaxUses] = useState("");
  const [promoValidUntil, setPromoValidUntil] = useState("");
  const [promoSaving, setPromoSaving] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await nestFetch("admin/events");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = (await res.json()) as AdminEvent[];
      setAllEvents(data);
      setLoadError(null);
    } catch {
      setLoadError("Failed to connect to backend API.");
      setAllEvents([]);
    }
  }, []);

  const fetchPromos = useCallback(async () => {
    try {
      setPromosLoading(true);
      const res = await nestFetch("admin/promo-codes");
      if (res.ok) {
        setPromos(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setPromosLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      void fetchEvents();
      void fetchPromos();
    });
    return () => cancelAnimationFrame(id);
  }, [fetchEvents, fetchPromos]);

  const executeCreatePromo = async () => {
    if (!promoCode || !promoDiscount) return toast.error("Missing required fields");
    setPromoSaving(true);
    try {
      const payload: { code: string; discountPercent: number; maxUses?: number; validUntil?: string } = {
        code: promoCode,
        discountPercent: parseInt(promoDiscount, 10),
      };
      if (promoMaxUses) payload.maxUses = parseInt(promoMaxUses, 10);
      if (promoValidUntil) payload.validUntil = new Date(promoValidUntil).toISOString();

      const res = await nestFetch("admin/promo-codes", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to create promo");
      toast.success("Promo code created!");
      setCreatePromoOpen(false);
      setPromoCode("");
      setPromoDiscount("10");
      setPromoMaxUses("");
      setPromoValidUntil("");
      await fetchPromos();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPromoSaving(false);
    }
  };

  const executeDeletePromo = async (id: string) => {
    if (!confirm("Delete this promo code?")) return;
    try {
      const res = await nestFetch(`admin/promo-codes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Deleted promo code");
      await fetchPromos();
    } catch {
      toast.error("Error deleting promo code");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const fetchLiveUsers = async () => {
      try {
        const res = await nestFetch("admin/live-users");
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled && typeof data.count === "number") {
          setLiveUsers(data.count);
        }
      } catch {
        // ignore
      }
    };

    fetchLiveUsers();
    const id = setInterval(fetchLiveUsers, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const stats = useMemo(() => {
    let totalCapacity = 0;
    let totalAvailable = 0;
    allEvents.forEach((show) => {
      totalCapacity += show.totalSeats || 0;
      totalAvailable += show.availableSeats || 0;
    });
    const ticketsSold = totalCapacity - totalAvailable;
    return {
      shows: allEvents.length,
      capacity: totalCapacity,
      sold: ticketsSold,
    };
  }, [allEvents]);

  const uniqueHalls = useMemo(
    () => [...new Set(allEvents.map((s) => s.hallName).filter(Boolean))],
    [allEvents],
  );

  const filtered = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return allEvents.filter(
      (show) =>
        show.movieTitle.toLowerCase().includes(q) &&
        (hallFilter === "all" || show.hallName === hallFilter),
    );
  }, [allEvents, searchTerm, hallFilter]);

  const pageSize = 10;
  const [pageIndex, setPageIndex] = useState(0);

  useEffect(() => {
    setPageIndex(0);
  }, [searchTerm, hallFilter]);

  const filteredTotal = filtered.length;
  const pageCount = Math.max(1, Math.ceil(filteredTotal / pageSize));

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const clampedPage = Math.min(pageIndex, Math.max(0, pageCount - 1));
  const pagedRows = useMemo(() => {
    const start = clampedPage * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, clampedPage, pageSize]);

  const editProjectionChoices = useMemo(() => {
    const base = [...PROJECTION_OPTIONS] as string[];
    if (editProjectionType && !base.includes(editProjectionType)) return [editProjectionType, ...base];
    return base;
  }, [editProjectionType]);

  const editAgeChoices = useMemo(() => {
    const base = [...AGE_RATING_OPTIONS] as string[];
    if (editAgeRating && !base.includes(editAgeRating)) return [editAgeRating, ...base];
    return base;
  }, [editAgeRating]);

  const editCategoryChoices = useMemo(() => {
    const base = [...EVENT_ASSIGNABLE_CATEGORIES] as string[];
    if (editCategory && !base.includes(editCategory)) return [editCategory, ...base];
    return base;
  }, [editCategory]);

  const openCreateModal = async () => {
    setCreateOpen(true);
    try {
      const res = await nestFetch("admin/seat-templates");
      const templates = (await res.json()) as AdminSeatTemplateRow[];
      setTemplateOptions(templates);
      setCreateTemplateId("");
      setCreateCategory("Phim chiếu rạp");
      setCreateTicketSaleOpens("");
      setCreateProjectionType("2D");
      setCreateAgeRating("T16");
    } catch {
      setTemplateOptions([]);
    }
  };

  const executeCreateEvent = async () => {
    if (!createTitle || !createStart || !createTemplateId) {
      toast.error("Required fields missing.");
      return;
    }
    setCreateSaving(true);
    try {
      let bannerBase64: string | null = null;
      if (createBannerFile) bannerBase64 = await toBase64(createBannerFile);

      const tRes = await nestFetch(`admin/seat-template/${createTemplateId}`);
      const templateData = (await tRes.json()) as {
        hallName: string;
        dimensions: { rows: number; columns: number };
      };

      const body: Record<string, unknown> = {
        movieTitle: createTitle,
        description: createDescription,
        bannerImage: bannerBase64,
        startTime: new Date(createStart).toISOString(),
        durationMinutes: parseInt(createDuration, 10),
        hallName: templateData.hallName,
        rows: templateData.dimensions.rows,
        cols: templateData.dimensions.columns,
        category: createCategory,
        ticketSaleOpensAt: createTicketSaleOpens.trim() || undefined,
        projectionType: createCategory === "Phim chiếu rạp" ? createProjectionType : undefined,
        ageRating: createAgeRating,
        maxSeatsPerBooking: parseInt(createMaxSeats, 10),
      };

      const createRes = await nestFetch("admin/events", {
        method: "POST",
        body: JSON.stringify(body),
      });

      const newShow = (await createRes.json()) as { id?: string; data?: { id?: string }; showtimeId?: string };
      const targetEventId = newShow.id ?? newShow.data?.id ?? newShow.showtimeId;
      if (!targetEventId) throw new Error("Backend did not return a valid event ID");

      const applyRes = await nestFetch(`admin/events/${targetEventId}/apply-template`, {
        method: "POST",
        body: JSON.stringify({ templateId: createTemplateId }),
      });

      if (!applyRes.ok) throw new Error("Event created, but failed to apply template.");

      setCreateOpen(false);
      setCreateTitle("");
      setCreateDescription("");
      setCreateBannerFile(null);
      setCreateCategory(EVENT_ASSIGNABLE_CATEGORIES[0]);
      setCreateTicketSaleOpens("");
      setCreateProjectionType("2D");
      setCreateAgeRating("T16");
      setCreateMaxSeats("8");
      await fetchEvents();
    } catch {
      toast.error("Error creating event.");
    } finally {
      setCreateSaving(false);
    }
  };

  const openEditModal = (id: string) => {
    const show = allEvents.find((s) => s.id === id);
    if (!show) return;
    setEditId(show.id);
    setEditTitle(show.movieTitle);
    setEditDescription(show.description || "");
    const date = new Date(show.startTime);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    setEditStart(date.toISOString().slice(0, 16));
    setEditBannerFile(null);
    setEditCategory(show.category ?? EVENT_ASSIGNABLE_CATEGORIES[0]);
    setEditProjectionType(show.projectionType ?? "2D");
    setEditAgeRating(show.ageRating ?? "T16");
    setEditMaxSeats(show.maxSeatsPerBooking?.toString() ?? "8");
    if (show.ticketSaleOpensAt) {
      const d = new Date(show.ticketSaleOpensAt);
      if (!Number.isNaN(d.getTime())) {
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setEditTicketSaleOpens(d.toISOString().slice(0, 16));
      } else setEditTicketSaleOpens("");
    } else setEditTicketSaleOpens("");
    setEditOpen(true);
  };

  const executeEditEvent = async () => {
    setEditSaving(true);
    try {
      let bannerBase64: string | undefined;
      if (editBannerFile) bannerBase64 = await toBase64(editBannerFile);

      const res = await nestFetch(`admin/events/${editId}`, {
        method: "PUT",
        body: JSON.stringify({
          movieTitle: editTitle,
          description: editDescription,
          startTime: new Date(editStart).toISOString(),
          category: editCategory,
          projectionType: editCategory === "Phim chiếu rạp" ? editProjectionType : undefined,
          ageRating: editAgeRating,
          maxSeatsPerBooking: parseInt(editMaxSeats, 10),
          ...(bannerBase64 ? { bannerImage: bannerBase64 } : {}),
          ticketSaleOpensAt: editTicketSaleOpens.trim() ? new Date(editTicketSaleOpens).toISOString() : "",
        }),
      });

      if (!res.ok) throw new Error("Update failed");
      setEditOpen(false);
      await fetchEvents();
    } catch {
      toast.error("Error updating event.");
    } finally {
      setEditSaving(false);
    }
  };

  const deleteEventRow = async (id: string) => {
    if (!confirm("Are you sure? This deletes all associated tickets!")) return;
    try {
      await nestFetch(`admin/events/${id}`, { method: "DELETE" });
      await fetchEvents();
    } catch {
      toast.error("Failed to delete.");
    }
  };

  const closeMonitor = () => {
    setMonitorOpen(false);
    if (monitorIntervalRef.current) {
      clearInterval(monitorIntervalRef.current);
      monitorIntervalRef.current = null;
    }
  };

  const fetchAndRenderMonitor = async (eventId: string, rebuildGrid: boolean) => {
    try {
      const mapRes = await nestFetch(`tickets/${eventId}/seats`);
      const raw = (await mapRes.json()) as SeatApiRecord[];
      const parsedData = parseSeatRecords(raw);

      if (rebuildGrid) {
        const uniqueTypes = [...new Set(parsedData.map((s) => s.type).filter((t) => t && t !== "empty"))];
        let cssStr = "";
        const scope = `.cam-admin-shell .cam-radar-scope`;
        uniqueTypes.forEach((type) => {
          const color = getDynamicColor(type);
          cssStr += `${scope} .seat.available[data-type="${type}"] { background: var(--surface); color: var(--text-main); border: 2px solid ${color}; }\n`;
          cssStr += `${scope} .seat.held[data-type="${type}"] { background: #fff7ed; color: #c2410c; border: 2px solid #f97316; animation: cam-radar-hold-blink 1.5s infinite; }\n`;
        });
        setMonitorCss(cssStr);
      }

      setMonitorSeats(parsedData);
      const { cols } = gridDimensions(parsedData);
      setMonitorCols(cols);
    } catch {
      console.warn("Radar update failed.");
    }
  };

  const openLiveMonitor = (eventId: string, movieTitle: string) => {
    setMonitorEventId(eventId);
    setMonitorTitle(movieTitle);
    setMonitorOpen(true);
    void fetchAndRenderMonitor(eventId, true);
    if (monitorIntervalRef.current) clearInterval(monitorIntervalRef.current);
    monitorIntervalRef.current = setInterval(() => {
      void fetchAndRenderMonitor(eventId, false);
    }, 1500);
  };

  const openOverrideModal = (seatId: string, currentStatus: string) => {
    if (!monitorEventId) return;
    setOverrideSeatLabel(seatId);
    setOverrideCurrentStatus(currentStatus.toUpperCase());
    setOverrideEventId(monitorEventId);
    setOverrideSeatId(seatId);
    setOverrideNewStatus("available");
    setOverrideOpen(true);
  };

  const executeSeatOverride = async () => {
    setOverrideBusy(true);
    try {
      const res = await nestFetch(
        `admin/events/${overrideEventId}/seat/${encodeURIComponent(overrideSeatId)}/override`,
        {
          method: "POST",
          body: JSON.stringify({ status: overrideNewStatus }),
        },
      );
      if (!res.ok) throw new Error("Failed to override seat.");
      setOverrideOpen(false);
      if (monitorEventId) void fetchAndRenderMonitor(monitorEventId, false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error");
    } finally {
      setOverrideBusy(false);
    }
  };

  const monitorDims = gridDimensions(monitorSeats);

  function radarSeatStateClass(status: ParsedSeat["status"]): string {
    if (status === "sold") return "sold";
    if (status === "held") return "held";
    if (status === "unavailable" || status === "broken") return "broken";
    return "available";
  }

  const monitorSeatByPos = useMemo(() => {
    const m = new Map<string, ParsedSeat>();
    monitorSeats.forEach((s) => m.set(`${s.gridRow}-${s.gridCol}`, s));
    return m;
  }, [monitorSeats]);


  const monitorLegendTypes = useMemo(() => {
    const uniqueTypes = [...new Set(monitorSeats.map((s) => s.type).filter((t) => t && t !== "empty"))];
    return uniqueTypes;
  }, [monitorSeats]);

  return (
    <div className="cam-mission">
      <div className="stats-board">
        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="fa-solid fa-calendar-days" aria-hidden />
          </div>
          <div className="stat-details">
            <h3>Total Events</h3>
            <p>{stats.shows}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fa-solid fa-ticket-simple" aria-hidden />
          </div>
          <div className="stat-details">
            <h3>Tickets Sold</h3>
            <p>{stats.sold.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">
            <i className="fa-solid fa-chair" aria-hidden />
          </div>
          <div className="stat-details">
            <h3>Total Capacity</h3>
            <p>{stats.capacity.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange">
            <i className="fa-solid fa-users-rays" aria-hidden />
          </div>
          <div className="stat-details">
            <h3>Live Users</h3>
            <p>{liveUsers}</p>
          </div>
        </div>
      </div>

      <div className="header-actions">
        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 pb-2 mb-4 w-full">
          <button
            type="button"
            className={cn("px-4 py-2 font-medium text-sm rounded-t-lg transition-colors border-b-2", activeTab === "events" ? "border-rose-500 text-rose-600 dark:text-rose-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300")}
            onClick={() => setActiveTab("events")}
          >
            Events
          </button>
          <button
            type="button"
            className={cn("px-4 py-2 font-medium text-sm rounded-t-lg transition-colors border-b-2", activeTab === "promos" ? "border-rose-500 text-rose-600 dark:text-rose-400" : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300")}
            onClick={() => setActiveTab("promos")}
          >
            Promo Codes
          </button>
        </div>
      </div>

      {activeTab === "events" && (
        <>
          <div className="header-actions">
            <h2>Event management</h2>
            <div className="header-actions-btns">
              <Button type="button" onClick={() => setTemplatesOpen(true)} className="btn-secondary gap-2">
                <i className="fa-solid fa-map" aria-hidden />
                Manage Templates
              </Button>
              <Button type="button" onClick={() => void openCreateModal()} className="btn-primary gap-2">
                <i className="fa-solid fa-plus" aria-hidden />
                Schedule new event
              </Button>
            </div>
          </div>

          <div className="controls">
        <div className="search-box">
          <i className="fa-solid fa-magnifying-glass search-icon" aria-hidden />
          <Input
            type="search"
            placeholder="Search by Movie Title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="cam-search-input border-0 shadow-none focus-visible:ring-0"
          />
        </div>
        <Select value={hallFilter} onValueChange={setHallFilter}>
          <SelectTrigger className={cn("cam-filter-select filter-select h-10 min-h-10 w-[min(100%,260px)] justify-between shadow-none")}>
            <SelectValue placeholder="Hall" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Halls</SelectItem>
            {uniqueHalls.map((h) => (
              <SelectItem key={h} value={h}>
                {h}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="table-container">
        <table className="showtime-table">
          <thead>
            <tr>
              <th>Movie Details</th>
              <th>Hall</th>
              <th>Start Time</th>
              <th>Occupancy</th>
              <th>Status</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loadError ? (
              <tr>
                <td colSpan={6} className="cell-error">
                  {loadError}
                </td>
              </tr>
            ) : filteredTotal === 0 ? (
              <tr>
                <td colSpan={6} className="cell-muted">
                  No events found. Click &quot;Schedule new event&quot; to begin.
                </td>
              </tr>
            ) : (
              pagedRows.map((show) => {
                const showDate = new Date(show.startTime);
                const isUpcoming = showDate > new Date();
                const soldSeats = show.totalSeats - show.availableSeats;
                const percentSold =
                  show.totalSeats > 0 ? Math.round((soldSeats / show.totalSeats) * 100) : 0;
                return (
                  <tr key={show.id}>
                    <td>
                      <Link
                        href={`/admin/events/${show.id}`}
                        className="movie-title block text-inherit no-underline hover:underline focus-visible:underline outline-none"
                      >
                        {show.movieTitle}
                      </Link>
                      <div className="movie-id">ID: {show.id}</div>
                    </td>
                    <td style={{ fontWeight: 500 }}>{show.hallName}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>
                        {showDate.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>
                        {showDate.toLocaleTimeString(undefined, {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td style={{ minWidth: 140 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          marginBottom: 6,
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <span>
                          {soldSeats}{" "}
                          <span style={{ color: "#94a3b8", fontWeight: "normal" }}>/ {show.totalSeats}</span>
                        </span>
                        <span style={{ color: "var(--primary)" }}>{percentSold}%</span>
                      </div>
                      <div style={{ width: "100%", background: "#e2e8f0", height: 6, borderRadius: 4, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${percentSold}%`,
                            background: "var(--primary)",
                            height: "100%",
                            borderRadius: 4,
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${isUpcoming ? "status-upcoming" : "status-past"}`}>{isUpcoming ? "Upcoming" : "Past"}</span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="cam-dashboard-btn-row" style={{ justifyContent: "flex-end", gap: 4 }}>
                        <Button type="button" title="Live Radar" variant="ghost" size="icon" className="action-btn radar h-auto w-auto shrink-0 p-0 shadow-none border-0 hover:bg-transparent" onClick={() => openLiveMonitor(show.id, show.movieTitle)}>
                          <i className="fa-solid fa-satellite-dish" aria-hidden />
                        </Button>
                        <Button type="button" title="Edit Details" variant="ghost" size="icon" className="action-btn edit h-auto w-auto shrink-0 p-0 shadow-none border-0 hover:bg-transparent" onClick={() => openEditModal(show.id)}>
                          <i className="fa-solid fa-pen" aria-hidden />
                        </Button>
                        <Button type="button" title="Delete" variant="ghost" size="icon" className="action-btn delete h-auto w-auto shrink-0 p-0 shadow-none border-0 hover:bg-transparent" onClick={() => void deleteEventRow(show.id)}>
                          <i className="fa-solid fa-trash" aria-hidden />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!loadError && (
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-500 dark:text-slate-400 px-1 pt-3">
          <span>
            {filteredTotal} sự kiện · Trang {clampedPage + 1}/{pageCount}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={clampedPage <= 0}
              onClick={() => setPageIndex(Math.max(0, clampedPage - 1))}
              className={cn(
                "h-7 border-slate-300 bg-white text-foreground shadow-none",
                "hover:bg-slate-50 hover:text-foreground dark:border-slate-600 dark:bg-slate-900",
              )}
            >
              Trước
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={clampedPage >= pageCount - 1}
              onClick={() => setPageIndex(Math.min(pageCount - 1, clampedPage + 1))}
              className={cn(
                "h-7 border-slate-300 bg-white text-foreground shadow-none",
                "hover:bg-slate-50 hover:text-foreground dark:border-slate-600 dark:bg-slate-900",
              )}
            >
              Sau
            </Button>
          </div>
        </div>
      )}
        </>
      )}

      {activeTab === "promos" && (
        <>
          <div className="header-actions">
            <h2>Manage Promo Codes</h2>
            <div className="header-actions-btns">
              <Button type="button" onClick={() => setCreatePromoOpen(true)} className="btn-primary gap-2">
                <i className="fa-solid fa-plus" aria-hidden />
                Create Promo Code
              </Button>
            </div>
          </div>
          <div className="table-container">
            <table className="showtime-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Code</th>
                  <th style={{ textAlign: "left" }}>Discount</th>
                  <th style={{ textAlign: "left" }}>Usage</th>
                  <th style={{ textAlign: "left" }}>Valid Until</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {promosLoading ? (
                  <tr>
                    <td colSpan={5} className="cell-muted">Loading promos...</td>
                  </tr>
                ) : promos.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="cell-muted">No promo codes found. Click &quot;Create Promo Code&quot; to add one.</td>
                  </tr>
                ) : (
                  promos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: "0.05em",
                            background: "var(--surface, #f1f5f9)",
                            border: "1px solid var(--border, #e2e8f0)",
                            borderRadius: 6,
                            padding: "2px 8px",
                            color: "var(--primary, #e11d48)",
                          }}
                        >
                          {p.code}
                        </span>
                        {!p.isActive && <span style={{ marginLeft: 8, fontSize: 11, color: "#f43f5e" }}>(Inactive)</span>}
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.discountPercent}%</td>
                      <td>
                        <span style={{ fontWeight: 500 }}>{p.currentUses}</span>
                        <span style={{ color: "#94a3b8" }}> / {p.maxUses ? p.maxUses : "∞"}</span>
                      </td>
                      <td>
                        {p.validUntil
                          ? new Date(p.validUntil).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })
                          : <span style={{ color: "#94a3b8" }}>Never</span>}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => void executeDeletePromo(p.id)}
                          className="action-btn delete h-auto w-auto shrink-0 p-0 shadow-none border-0 hover:bg-transparent"
                        >
                          <i className="fa-solid fa-trash" aria-hidden />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {createPromoOpen ? (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-box" style={{ width: "100%", maxWidth: 400 }}>
            <h2>Create Promo Code</h2>
            <div className="form-group">
              <Label htmlFor="promo-code">Code</Label>
              <Input id="promo-code" type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER50" className="uppercase" />
            </div>
            <div className="form-group">
              <Label htmlFor="promo-discount">Discount Percent (%)</Label>
              <Input id="promo-discount" type="number" min="1" max="100" value={promoDiscount} onChange={(e) => setPromoDiscount(e.target.value)} />
            </div>
            <div className="form-group">
              <Label htmlFor="promo-maxUses">Max Uses (Optional)</Label>
              <Input id="promo-maxUses" type="number" min="1" value={promoMaxUses} onChange={(e) => setPromoMaxUses(e.target.value)} placeholder="Leave blank for infinite" />
            </div>
            <div className="form-group">
              <Label htmlFor="promo-valid">Valid Until (Optional)</Label>
              <Input id="promo-valid" type="date" value={promoValidUntil} onChange={(e) => setPromoValidUntil(e.target.value)} />
            </div>
            <div className="modal-actions" style={{ marginTop: 24, justifyContent: "flex-end", gap: 12 }}>
              <Button type="button" variant="outline" onClick={() => setCreatePromoOpen(false)} className="cam-cancel-btn">
                Cancel
              </Button>
              <Button type="button" onClick={() => void executeCreatePromo()} disabled={promoSaving} className="btn-primary">
                {promoSaving ? "Saving..." : "Create Promo"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {templatesOpen ? (
        <div className="modal-overlay">
          <div className="modal-box large">
            <div className="modal-head">
              <h2>Seat Blueprints (Templates)</h2>
              <Button type="button" variant="ghost" size="icon" className="action-btn h-auto w-auto shrink-0 p-0 shadow-none border-0 hover:bg-transparent" onClick={() => setTemplatesOpen(false)} aria-label="Close">
                <i className="fa-solid fa-xmark" aria-hidden />
              </Button>
            </div>
            <div className="table-container cam-table-flat cam-manage-templates-scroll">
              <AdminSeatTemplatesTable
                variant="embedded"
                appearance="concur"
                onEditTemplate={(id) => {
                  setTemplatesOpen(false);
                  router.push(`/admin/seat-templates?edit=${encodeURIComponent(id)}`);
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {createOpen ? (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-box" style={{ width: "100%", maxWidth: 520 }}>
            <h2>Schedule new event</h2>
            <div className="form-group">
              <Label htmlFor="cam-create-title">Movie Title</Label>
              <Input
                id="cam-create-title"
                type="text"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                placeholder="Enter movie title..."
                className="h-10 shadow-none"
              />
            </div>
            <div className="form-group">
              <Label htmlFor="cam-create-desc">Movie Description</Label>
              <Textarea id="cam-create-desc" rows={3} value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Brief summary..." className="min-h-[5rem] shadow-none" />
            </div>
            <div className="form-group">
              <Label htmlFor="cam-create-banner">Movie Banner / Poster</Label>
              <Input id="cam-create-banner" type="file" accept="image/*" onChange={(e) => setCreateBannerFile(e.target.files?.[0] ?? null)} className="h-auto cursor-pointer py-2 shadow-none file:cursor-pointer" />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div className="form-group" style={{ flex: 2 }}>
                <Label htmlFor="cam-create-start">Date &amp; Time</Label>
                <Input id="cam-create-start" type="datetime-local" value={createStart} onChange={(e) => setCreateStart(e.target.value)} className="h-10 shadow-none" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <Label htmlFor="cam-create-duration">Duration (m)</Label>
                <Input id="cam-create-duration" type="number" value={createDuration} onChange={(e) => setCreateDuration(e.target.value)} className="h-10 shadow-none" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <Label htmlFor="cam-create-maxseats">Max Seats / Booking</Label>
                <Input id="cam-create-maxseats" type="number" value={createMaxSeats} onChange={(e) => setCreateMaxSeats(e.target.value)} className="h-10 shadow-none" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <Label htmlFor="cam-create-category">Danh mục</Label>
                <Select value={createCategory} onValueChange={setCreateCategory}>
                  <SelectTrigger id="cam-create-category" className="h-10 w-full shadow-none">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_ASSIGNABLE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {createCategory === "Phim chiếu rạp" && (
                <div className="form-group" style={{ flex: 1 }}>
                  <Label htmlFor="cam-create-projection">Định dạng chiếu</Label>
                  <Select value={createProjectionType} onValueChange={setCreateProjectionType}>
                    <SelectTrigger id="cam-create-projection" className="h-10 w-full shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECTION_OPTIONS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="form-group">
              <Label htmlFor="cam-create-sale-opens">Mở bán vé (tùy chọn)</Label>
              <Input
                id="cam-create-sale-opens"
                type="datetime-local"
                value={createTicketSaleOpens}
                onChange={(e) => setCreateTicketSaleOpens(e.target.value)}
                className="h-10 shadow-none"
              />
              <p className="mt-1 text-xs text-slate-500">Để trống nếu vé đã mở bán hoặc không giới hạn thời điểm mở bán.</p>
            </div>
            <div className="form-group">
              <Label htmlFor="cam-create-age">Độ tuổi</Label>
              <Select value={createAgeRating} onValueChange={setCreateAgeRating}>
                <SelectTrigger id="cam-create-age" className="h-10 w-full shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AGE_RATING_OPTIONS.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="form-group">
              <Label htmlFor="cam-create-template">Seat Blueprint (Template)</Label>
              <Select
                value={createTemplateId || undefined}
                onValueChange={setCreateTemplateId}
                disabled={templateOptions.length === 0}
              >
                <SelectTrigger id="cam-create-template" className="h-10 w-full shadow-none">
                  <SelectValue
                    placeholder={
                      templateOptions.length === 0 ? "No blueprints available" : "-- Select Blueprint --"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {templateOptions.map((t) => (
                    <SelectItem key={t.templateId} value={t.templateId}>
                      {t.templateName} ({t.hallName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {templateOptions.length === 0 ? (
                <p className="mt-1.5 text-xs text-slate-500" role="status">
                  Create a seat blueprint under Seat Templates first.
                </p>
              ) : null}
            </div>
            <div className="modal-footer">
              <Button type="button" variant="outline" className="btn-secondary border-0 shadow-none" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={createSaving} className="btn-primary gap-2 border-0 shadow-none" onClick={() => void executeCreateEvent()}>
                {createSaving ? <i className="fa-solid fa-spinner fa-spin" aria-hidden /> : null}
                Create event
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {editOpen ? (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <div className="modal-box" style={{ width: "100%", maxWidth: 520 }}>
            <h2>Edit event details</h2>
            <div className="form-group">
              <Label htmlFor="cam-edit-title">Movie Title</Label>
              <Input id="cam-edit-title" type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-10 shadow-none" />
            </div>
            <div className="form-group">
              <Label htmlFor="cam-edit-desc">Movie Description</Label>
              <Textarea id="cam-edit-desc" rows={3} value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className="min-h-[5rem] shadow-none" />
            </div>
            <div className="form-group">
              <Label htmlFor="cam-edit-banner">Update Banner (Optional)</Label>
              <Input id="cam-edit-banner" type="file" accept="image/*" onChange={(e) => setEditBannerFile(e.target.files?.[0] ?? null)} className="h-auto cursor-pointer py-2 shadow-none file:cursor-pointer" />
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <Label htmlFor="cam-edit-start">Date &amp; Time</Label>
                <Input id="cam-edit-start" type="datetime-local" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="h-10 shadow-none" />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <Label htmlFor="cam-edit-maxseats">Max Seats / Booking</Label>
                <Input id="cam-edit-maxseats" type="number" value={editMaxSeats} onChange={(e) => setEditMaxSeats(e.target.value)} className="h-10 shadow-none" />
              </div>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <Label htmlFor="cam-edit-category">Danh mục</Label>
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger id="cam-edit-category" className="h-10 w-full shadow-none">
                    <SelectValue placeholder="Danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    {editCategoryChoices.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {editCategory === "Phim chiếu rạp" && (
                <div className="form-group" style={{ flex: 1 }}>
                  <Label htmlFor="cam-edit-projection">Định dạng chiếu</Label>
                  <Select value={editProjectionType} onValueChange={setEditProjectionType}>
                    <SelectTrigger id="cam-edit-projection" className="h-10 w-full shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {editProjectionChoices.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="form-group">
              <Label htmlFor="cam-edit-sale-opens">Mở bán vé</Label>
              <Input
                id="cam-edit-sale-opens"
                type="datetime-local"
                value={editTicketSaleOpens}
                onChange={(e) => setEditTicketSaleOpens(e.target.value)}
                className="h-10 shadow-none"
              />
              <p className="mt-1 text-xs text-slate-500">Để trống để coi như đã mở bán / bỏ giới hạn.</p>
            </div>
            <div className="form-group">
              <Label htmlFor="cam-edit-age">Độ tuổi</Label>
              <Select value={editAgeRating} onValueChange={setEditAgeRating}>
                <SelectTrigger id="cam-edit-age" className="h-10 w-full shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {editAgeChoices.map((a) => (
                    <SelectItem key={a} value={a}>
                      {a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="modal-footer">
              <Button type="button" variant="outline" className="btn-secondary border-0 shadow-none" onClick={() => setEditOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={editSaving} className="btn-primary gap-2 border-0 shadow-none" onClick={() => void executeEditEvent()}>
                {editSaving ? <i className="fa-solid fa-spinner fa-spin" aria-hidden /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {monitorOpen ? (
        <div className="modal-overlay" style={{ zIndex: 1000 }}>
          <style dangerouslySetInnerHTML={{ __html: monitorCss }} />
          <div className="modal-box large cam-radar-scope">
            <div className="monitor-header">
              <div className="monitor-header-title">
                <span className="pulse-indicator" aria-hidden />
                <h2>Live Radar</h2>
              </div>
              <div className="cam-radar-toolbar">
                <span className="cam-radar-subtitle">{monitorTitle}</span>
                <Button type="button" variant="ghost" size="icon" className="action-btn h-auto w-auto shrink-0 p-0 shadow-none border-0 hover:bg-transparent" title="Close" onClick={closeMonitor}>
                  <i className="fa-solid fa-xmark" aria-hidden />
                </Button>
              </div>
            </div>
            <div className="monitor-grid-stage">
              <div
                className="monitor-grid-root"
                style={{
                  gridTemplateColumns: monitorCols ? `24px repeat(${monitorCols}, 28px)` : undefined,
                }}
              >
                {monitorDims.rows > 0 &&
                  monitorCols > 0 &&
                  Array.from({ length: monitorDims.rows }).map((_, r) => (
                    <Fragment key={`row-${r}`}>
                      {/* Row label */}
                      <div key={`label-${r}`} className="cell-slot" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#94a3b8", userSelect: "none" }}>
                          {String.fromCharCode(65 + r)}
                        </span>
                      </div>
                      {Array.from({ length: monitorCols }).map((__, c) => {
                        const seat = monitorSeatByPos.get(`${r}-${c}`);
                        if (!seat || seat.type === "empty") {
                          return (
                            <div key={`${r}-${c}`} className="cell-slot" data-r={r} data-c={c}>
                              <div className="seat empty" />
                            </div>
                          );
                        }
                        const state = radarSeatStateClass(seat.status);
                        const num = seat.seatNumber?.replace(/^[A-Z]+/, "") ?? "";
                        return (
                          <div key={`${r}-${c}`} className="cell-slot" data-r={r} data-c={c}>
                            <Button
                              type="button"
                              variant="ghost"
                              data-type={seat.type}
                              className={cn("seat", state, "h-auto min-h-0 w-auto shrink-0 rounded-none border-0 p-0 shadow-none hover:bg-transparent")}
                              onClick={() => {
                                if (seat.status === "sold") return;
                                void openOverrideModal(seat.seatNumber, seat.status);
                              }}
                            >
                              {num}
                            </Button>
                          </div>
                        );
                      })}
                    </Fragment>
                  ))}
              </div>
            </div>
            <div className="monitor-legend">
              <div className="monitor-legend-item">
                <div className="monitor-color" style={{ background: "#f97316" }} />
                Held (In Cart)
              </div>
              <div className="monitor-legend-item">
                <div className="monitor-color" style={{ background: "#94a3b8" }} />
                Sold
              </div>
              <div className="monitor-legend-item">
                <div className="monitor-color" style={{ background: "#ef4444" }} />
                Unavailable
              </div>
              <div className="monitor-legend-divider" aria-hidden />
              {monitorLegendTypes.map((type) => (
                <div key={type} className="monitor-legend-item">
                  <div
                    className="monitor-color"
                    style={{
                      background: "var(--surface)",
                      border: `2px solid ${getDynamicColor(type)}`,
                      boxSizing: "border-box",
                    }}
                  />
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {overrideOpen ? (
        <div className="modal-overlay" style={{ zIndex: 1050 }}>
          <div className="modal-box" style={{ width: "100%", maxWidth: 400 }}>
            <h2>
              Override Seat: <span style={{ color: "var(--primary)" }}>{overrideSeatLabel}</span>
            </h2>
            <p style={{ marginTop: -16, marginBottom: 24, fontSize: 13, color: "var(--text-muted)" }}>
              Current Status: <strong style={{ color: "var(--text-main)" }}>{overrideCurrentStatus}</strong>
            </p>
            <div className="form-group">
              <Label htmlFor="cam-override-status">Force New Status</Label>
              <Select value={overrideNewStatus} onValueChange={setOverrideNewStatus}>
                <SelectTrigger id="cam-override-status" className="h-10 w-full shadow-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available (Release Lock)</SelectItem>
                  <SelectItem value="sold">Sold (Manual Cash Sale)</SelectItem>
                  <SelectItem value="unavailable">Unavailable (Emergency Block)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="modal-footer">
              <Button type="button" variant="outline" className="btn-secondary border-0 shadow-none" onClick={() => setOverrideOpen(false)}>
                Cancel
              </Button>
              <Button type="button" disabled={overrideBusy} className="btn-warning gap-2 border-0 shadow-none" onClick={() => void executeSeatOverride()}>
                {overrideBusy ? <i className="fa-solid fa-spinner fa-spin" aria-hidden /> : null}
                Apply Override
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
