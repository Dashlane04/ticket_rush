"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { nestFetch } from "@/lib/nest-api";
import { formatVND } from "@/lib/format-currency";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type SeatTierConfig = {
  name: string;
  color: string;
  isFill: boolean;
  textColor: string;
  price: number;
};

type GridCell = {
  type: string;
  blocked: boolean;
  selected: boolean;
  label: string;
};

const LETTERS = "ABCDEFGHJKLMNOPQRSTUVWXYZ";

function getRowLetter(index: number): string {
  let res = "";
  let num = index;
  while (num >= 0) {
    res = LETTERS[num % 25] + res;
    num = Math.floor(num / 25) - 1;
  }
  return res;
}

function cloneGrid(g: GridCell[][]): GridCell[][] {
  return g.map((row) => row.map((c) => ({ ...c })));
}

function initialSeatConfig(): Record<string, SeatTierConfig> {
  return {
    normal: { name: "Normal", color: "#10b981", isFill: false, textColor: "#111827", price: 15 },
    vip: { name: "VIP", color: "#f43f5e", isFill: false, textColor: "#111827", price: 40 },
    sweetbox: { name: "Sweetbox", color: "#8b5cf6", isFill: true, textColor: "#ffffff", price: 65 },
  };
}

function recalculateSeatNumbers(grid: GridCell[][]): GridCell[][] {
  const next = cloneGrid(grid);
  for (let r = 0; r < next.length; r++) {
    let seatCounter = 1;
    for (let c = 0; c < next[r].length; c++) {
      const cell = next[r][c];
      if (cell.type === "empty") {
        cell.label = "";
        cell.selected = false;
      } else {
        cell.label = String(seatCounter);
        seatCounter++;
      }
    }
  }
  return next;
}

function freshEditorGrid(rows: number, cols: number): GridCell[][] {
  const g: GridCell[][] = [];
  for (let r = 0; r < rows; r++) {
    const row: GridCell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({ type: "normal", blocked: false, selected: false, label: "" });
    }
    g.push(row);
  }
  return recalculateSeatNumbers(g);
}

function exportLayout(grid: GridCell[][], seatConfiguration: Record<string, SeatTierConfig>) {
  const layout: Array<{ id: string; gridCol: number; gridRow: number; type: string; isBlocked: boolean }> = [];
  for (let r = 0; r < grid.length; r++) {
    const rowLetter = getRowLetter(r);
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.type === "empty") continue;
      layout.push({
        id: `${rowLetter}${cell.label}`,
        gridCol: c,
        gridRow: r,
        type: cell.type,
        isBlocked: cell.blocked,
      });
    }
  }
  return { layout, seatConfiguration };
}

function computeStats(grid: GridCell[][], seatConfig: Record<string, SeatTierConfig>) {
  const counts: Record<string, number> = {};
  for (const k of Object.keys(seatConfig)) counts[k] = 0;
  let blocked = 0;
  let revenue = 0;
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const cell = grid[r][c];
      if (cell.type === "empty") continue;
      if (seatConfig[cell.type]) counts[cell.type]++;
      if (cell.blocked) blocked++;
      else if (seatConfig[cell.type]) revenue += seatConfig[cell.type].price;
    }
  }
  return { counts, blocked, revenue };
}

type SeatTemplateDetailsApi = {
  templateId: string;
  templateName: string;
  hallName: string;
  dimensions: { rows: number; columns: number };
  layout: Array<{ id: string; gridRow: number; gridCol: number; type: string; isBlocked: boolean }>;
};

export type SeatBlueprintEditorProps = {
  eventLabel?: string;
  editTemplateId?: string;
  /** Trên `/admin/seat-templates`: không overlay tạo mới cho đến khi có `?new=1` hoặc `?edit=`. */
  hubMode?: boolean;
  /** Hub: `searchParams.new === "1"` — mở overlay cấu hình kích thước canvas. */
  createRequested?: boolean;
};

export function SeatBlueprintEditor({
  eventLabel,
  editTemplateId,
  hubMode = false,
  createRequested = false,
}: SeatBlueprintEditorProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"setup" | "editor">("setup");
  const [setupRows, setSetupRows] = useState(13);
  const [setupCols, setSetupCols] = useState(22);
  const [seatConfig, setSeatConfig] = useState<Record<string, SeatTierConfig>>(initialSeatConfig);
  const [grid, setGrid] = useState<GridCell[][]>([]);
  const [currentTool, setCurrentTool] = useState<string>("select");

  const [verifyOpen, setVerifyOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [templateName, setTemplateName] = useState("Standard Cinema Layout");
  const [hallName, setHallName] = useState("Hall A");
  const [saveBusy, setSaveBusy] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [templateLoadState, setTemplateLoadState] = useState<"idle" | "loading">("idle");
  const prevEditFromPropsRef = useRef<string | undefined>(undefined);

  const [seatMgrOpen, setSeatMgrOpen] = useState(false);
  const [newSeatName, setNewSeatName] = useState("");
  const [newSeatPrice, setNewSeatPrice] = useState("0");
  const [newSeatColor, setNewSeatColor] = useState("#8b5cf6");
  const [newSeatFill, setNewSeatFill] = useState("false");
  const [newSeatText, setNewSeatText] = useState("#000000");
  const [editingSeatId, setEditingSeatId] = useState<string | null>(null);

  const isDrawing = useRef(false);
  const anchor = useRef<{ r: number; c: number } | null>(null);
  const dragSnapshot = useRef<GridCell[][] | null>(null);
  const targetSelectState = useRef(true);

  const historyRef = useRef<GridCell[][][]>([]);
  const historyIndexRef = useRef(-1);
  const gridRef = useRef<GridCell[][]>([]);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    const id = editTemplateId?.trim();
    const prev = prevEditFromPropsRef.current;
    prevEditFromPropsRef.current = id;

    if (!id) {
      setTemplateLoadState("idle");
      if (prev) {
        setEditingTemplateId(null);
        setPhase("setup");
        setGrid([]);
        historyRef.current = [];
        historyIndexRef.current = -1;
        setSeatConfig(initialSeatConfig());
        setTemplateName("Standard Cinema Layout");
        setHallName("Hall A");
        setVerifyOpen(false);
        setSaveOpen(false);
      }
      return;
    }

    let cancelled = false;
    setTemplateLoadState("loading");
    void (async () => {
      try {
        const res = await nestFetch(`admin/seat-template/${encodeURIComponent(id)}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SeatTemplateDetailsApi;
        if (cancelled) return;

        const rows = data.dimensions.rows;
        const cols = data.dimensions.columns;
        setEditingTemplateId(data.templateId);
        setTemplateName(data.templateName);
        setHallName(data.hallName);
        setSetupRows(rows);
        setSetupCols(cols);

        const emptyGrid: GridCell[][] = [];
        for (let r = 0; r < rows; r++) {
          const row: GridCell[] = [];
          for (let c = 0; c < cols; c++) {
            row.push({ type: "empty", blocked: false, selected: false, label: "" });
          }
          emptyGrid.push(row);
        }
        for (const item of data.layout) {
          if (item.gridRow >= 0 && item.gridRow < rows && item.gridCol >= 0 && item.gridCol < cols) {
            emptyGrid[item.gridRow][item.gridCol] = {
              type: item.type,
              blocked: item.isBlocked,
              selected: false,
              label: "",
            };
          }
        }
        const fullGrid = recalculateSeatNumbers(emptyGrid);

        const mergedCfg: Record<string, SeatTierConfig> = { ...initialSeatConfig() };
        for (const row of fullGrid) {
          for (const cell of row) {
            if (cell.type !== "empty" && !mergedCfg[cell.type]) {
              mergedCfg[cell.type] = {
                name: cell.type,
                color: "#94a3b8",
                isFill: false,
                textColor: "#111827",
                price: 0,
              };
            }
          }
        }
        setSeatConfig(mergedCfg);
        setGrid(fullGrid);
        historyRef.current = [cloneGrid(fullGrid)];
        historyIndexRef.current = 0;
        setPhase("editor");
        setCurrentTool("select");
        setTemplateLoadState("idle");
      } catch {
        if (!cancelled) {
          toast.error("Could not load seat template.");
          setEditingTemplateId(null);
          setTemplateLoadState("idle");
          router.replace("/admin/seat-templates");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editTemplateId, router]);

  /** Hub browse: không có edit và không đang luồng tạo → không render editor (tránh overlay ép tạo). */
  const hubBrowseOnly =
    hubMode && !createRequested && !editTemplateId?.trim();

  useEffect(() => {
    if (!hubMode || createRequested || editTemplateId?.trim()) return;
    setPhase("setup");
    setEditingTemplateId(null);
    setGrid([]);
    historyRef.current = [];
    historyIndexRef.current = -1;
    setSeatConfig(initialSeatConfig());
    setTemplateName("Standard Cinema Layout");
    setHallName("Hall A");
    setVerifyOpen(false);
    setSaveOpen(false);
    setSeatMgrOpen(false);
  }, [hubMode, createRequested, editTemplateId]);

  useEffect(() => {
    if (!hubMode || !createRequested || editTemplateId?.trim()) return;
    setEditingTemplateId(null);
    setPhase("setup");
    setGrid([]);
    historyRef.current = [];
    historyIndexRef.current = -1;
    setSeatConfig(initialSeatConfig());
    setTemplateName("Standard Cinema Layout");
    setHallName("Hall A");
    setVerifyOpen(false);
    setSaveOpen(false);
  }, [hubMode, createRequested, editTemplateId]);

  const pushHistory = useCallback((g: GridCell[][]) => {
    const snap = cloneGrid(g);
    const h = historyRef.current.slice(0, historyIndexRef.current + 1);
    h.push(snap);
    historyRef.current = h.slice(-50);
    historyIndexRef.current = historyRef.current.length - 1;
  }, []);

  const statsPack = useMemo(() => computeStats(grid, seatConfig), [grid, seatConfig]);

  const applyDragArea = useCallback(
    (currentR: number, currentC: number) => {
      if (!isDrawing.current || !anchor.current || !dragSnapshot.current) return;
      const ar = anchor.current.r;
      const ac = anchor.current.c;
      const minR = Math.min(ar, currentR);
      const maxR = Math.max(ar, currentR);
      const minC = Math.min(ac, currentC);
      const maxC = Math.max(ac, currentC);
      const snap = dragSnapshot.current;
      const next = cloneGrid(snap);

      for (let r = 0; r < next.length; r++) {
        for (let c = 0; c < next[r].length; c++) {
          const orig = snap[r][c];
          if (r >= minR && r <= maxR && c >= minC && c <= maxC) {
            if (currentTool === "select") {
              if (orig.type !== "empty") next[r][c].selected = targetSelectState.current;
            } else if (currentTool === "empty") {
              next[r][c].type = "empty";
              next[r][c].selected = false;
            } else {
              next[r][c].type = currentTool;
              next[r][c].blocked = orig.blocked;
              if (orig.selected && currentTool !== "empty") next[r][c].selected = true;
            }
          } else {
            next[r][c] = { ...orig };
          }
        }
      }
      setGrid(recalculateSeatNumbers(next));
    },
    [currentTool],
  );

  const onCellMouseDown = (r: number, c: number, e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDrawing.current = true;
    anchor.current = { r, c };
    dragSnapshot.current = cloneGrid(grid);
    targetSelectState.current = !grid[r][c].selected;
    applyDragArea(r, c);
  };

  const onCellMouseEnter = (r: number, c: number) => {
    if (!isDrawing.current) return;
    applyDragArea(r, c);
  };

  useEffect(() => {
    const stopDrawingAndMaybeHistory = () => {
      if (!isDrawing.current) return;
      isDrawing.current = false;
      if (currentTool !== "select") pushHistory(gridRef.current);
    };
    window.addEventListener("mouseup", stopDrawingAndMaybeHistory);
    return () => window.removeEventListener("mouseup", stopDrawingAndMaybeHistory);
  }, [currentTool, pushHistory]);

  const clearSelection = useCallback(() => {
    setGrid((g) => {
      const next = cloneGrid(g);
      for (const row of next) for (const cell of row) cell.selected = false;
      return next;
    });
  }, []);

  const bulkSelectedCount = useMemo(() => {
    let n = 0;
    for (const row of grid) for (const cell of row) if (cell.selected) n++;
    return n;
  }, [grid]);

  const bulkChangeType = (newType: string) => {
    setGrid((g) => {
      const next = cloneGrid(g);
      for (const row of next) for (const cell of row) if (cell.selected) cell.type = newType;
      const rec = recalculateSeatNumbers(next);
      pushHistory(rec);
      return rec;
    });
  };

  const bulkToggleBlock = () => {
    setGrid((g) => {
      const next = cloneGrid(g);
      for (const row of next) for (const cell of row) if (cell.selected) cell.blocked = !cell.blocked;
      const rec = recalculateSeatNumbers(next);
      pushHistory(rec);
      return rec;
    });
  };

  const resetMap = () => {
    if (!confirm("Are you sure you want to clear all seats? This cannot be undone.")) return;
    const rows = grid.length;
    const cols = grid[0]?.length ?? setupCols;
    const fresh: GridCell[][] = [];
    for (let r = 0; r < rows; r++) {
      const row: GridCell[] = [];
      for (let c = 0; c < cols; c++) {
        row.push({ type: "empty", blocked: false, selected: false, label: "" });
      }
      fresh.push(row);
    }
    const recalc = recalculateSeatNumbers(fresh);
    pushHistory(recalc);
    setGrid(recalc);
    clearSelection();
  };

  const undo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx <= 0) return;
    historyIndexRef.current = idx - 1;
    setGrid(cloneGrid(historyRef.current[historyIndexRef.current]));
  }, []);

  const redo = useCallback(() => {
    const idx = historyIndexRef.current;
    if (idx >= historyRef.current.length - 1) return;
    historyIndexRef.current = idx + 1;
    setGrid(cloneGrid(historyRef.current[historyIndexRef.current]));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearSelection();
      if (e.ctrlKey && e.key.toLowerCase() === "z") {
        e.preventDefault();
        undo();
      }
      if (e.ctrlKey && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clearSelection, undo, redo]);

  const startMapping = () => {
    const rows = Math.max(1, Math.min(100, setupRows));
    const cols = Math.max(1, Math.min(200, setupCols));
    const g = freshEditorGrid(rows, cols);
    setGrid(g);
    historyRef.current = [cloneGrid(g)];
    historyIndexRef.current = 0;
    setPhase("editor");
    setCurrentTool("select");
  };

  const saveSeatType = () => {
    const name = newSeatName.trim();
    if (!name) {
      toast.error("Please enter a name.");
      return;
    }
    let id = editingSeatId;
    if (!id) {
      id = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
      if (seatConfig[id]) {
        toast.error("A seat type with a similar name already exists.");
        return;
      }
    }
    const cfg = {
      name,
      price: parseFloat(newSeatPrice) || 0,
      color: newSeatColor,
      isFill: newSeatFill === "true",
      textColor: newSeatText,
    };
    const nextCfg = { ...seatConfig, [id]: cfg };
    setSeatConfig(nextCfg);
    setEditingSeatId(null);
    setNewSeatName("");
    setNewSeatPrice("0");
    setNewSeatColor("#8b5cf6");
    setNewSeatFill("false");
    setNewSeatText("#000000");
    setGrid((g) => recalculateSeatNumbers(cloneGrid(g)));
  };

  const beginEditSeatType = (id: string) => {
    const cfg = seatConfig[id];
    if (!cfg) return;
    setEditingSeatId(id);
    setNewSeatName(cfg.name);
    setNewSeatPrice(String(cfg.price));
    setNewSeatColor(cfg.color);
    setNewSeatFill(cfg.isFill ? "true" : "false");
    setNewSeatText(cfg.textColor);
  };

  const deleteSeatType = (id: string) => {
    if (!confirm(`Delete tier "${seatConfig[id]?.name}"? Seats become Normal.`)) return;
    const rest = { ...seatConfig };
    delete rest[id];
    setSeatConfig(rest);
    setGrid((g) => {
      const next = cloneGrid(g);
      for (const row of next) for (const cell of row) if (cell.type === id) cell.type = "normal";
      const rec = recalculateSeatNumbers(next);
      pushHistory(rec);
      return rec;
    });
  };

  const cancelHubCreateSetup = () => {
    router.replace("/admin/seat-templates");
  };

  const executeSave = async () => {
    const templateIdForPut = editingTemplateId;
    const isUpdate = templateIdForPut !== null;
    setSaveBusy(true);
    try {
      const { layout, seatConfiguration } = exportLayout(grid, seatConfig);
      const payload = {
        templateName,
        hallName,
        dimensions: { rows: grid.length, columns: grid[0]?.length ?? 0 },
        seatConfiguration,
        layout,
      };
      const response = isUpdate
        ? await nestFetch(`admin/seat-template/${encodeURIComponent(templateIdForPut)}`, {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await nestFetch("admin/seat-template", {
            method: "POST",
            body: JSON.stringify(payload),
          });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = (await response.json()) as { templateName?: string; savedSeats?: number };
      toast.success(
        isUpdate
          ? `Updated '${result.templateName}' (${result.savedSeats} seats).`
          : `Success! Template '${result.templateName}' saved with ${result.savedSeats} active seats.`,
      );
      setSaveOpen(false);
      setVerifyOpen(false);
      if (hubMode && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("seat-templates:mutated"));
      }
      if (!isUpdate && hubMode) {
        router.replace("/admin/seat-templates");
      }
    } catch {
      toast.error(
        isUpdate
          ? "Failed to update template. Please check the backend connection."
          : "Failed to save template. Please make sure your NestJS backend is running.",
      );
    } finally {
      setSaveBusy(false);
    }
  };

  const screenWidth = Math.min((setupCols * 36) - 4, 1000);

  const toolIds = ["select", ...Object.keys(seatConfig), "empty"];

  const showSetupOverlay =
    phase === "setup" &&
    !editTemplateId?.trim() &&
    (!hubMode || createRequested);

  if (hubBrowseOnly) {
    return null;
  }

  return (
    <div className="cam-blueprint w-full pb-32">
      {editTemplateId?.trim() && templateLoadState === "loading" ? (
        <div className="modal-overlay" style={{ zIndex: 1015 }}>
          <div className="modal-box">
            <p className="cam-bp-modal-title" style={{ margin: 0 }}>
              <i className="fa-solid fa-spinner fa-spin" aria-hidden /> Loading blueprint…
            </p>
          </div>
        </div>
      ) : null}

      {showSetupOverlay ? (
        <div className="modal-overlay" style={{ zIndex: 1010 }}>
          <div className="modal-box">
            <h2 className="cam-bp-modal-title">
              <i className="fa-solid fa-map" style={{ color: "var(--primary)", fontSize: 22 }} aria-hidden />
              Seat Map Configuration
            </h2>
            <div style={{ display: "flex", gap: 16 }}>
              <div className="input-group" style={{ flex: 1 }}>
                <Label htmlFor="bp-setup-rows">Total Rows:</Label>
                <Input id="bp-setup-rows" type="number" min={1} max={100} value={setupRows} onChange={(e) => setSetupRows(+e.target.value)} className="h-10 shadow-none" />
              </div>
              <div className="input-group" style={{ flex: 1 }}>
                <Label htmlFor="bp-setup-cols">Total Columns:</Label>
                <Input id="bp-setup-cols" type="number" min={1} max={200} value={setupCols} onChange={(e) => setSetupCols(+e.target.value)} className="h-10 shadow-none" />
              </div>
            </div>
            <div className={`flex gap-2 ${hubMode ? "mt-2 flex-col sm:flex-row" : "mt-2 flex-col"}`} style={{ marginTop: 8 }}>
              {hubMode ? (
                <Button
                  type="button"
                  variant="outline"
                  className="cam-bp-btn btn-secondary flex-1 border-0 shadow-none"
                  onClick={cancelHubCreateSetup}
                >
                  Huỷ
                </Button>
              ) : null}
              <Button type="button" className="cam-bp-btn btn-primary flex-1 border-0 shadow-none" onClick={startMapping}>
                Generate Canvas
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {phase === "editor" ? (
        <>
          {eventLabel ? (
            <div className="bp-event-context">
              Mapping context: <strong>{eventLabel}</strong>
            </div>
          ) : null}
          {editingTemplateId ? (
            <div className="bp-event-context">
              Đang chỉnh: <strong>{templateName}</strong>
              <span className="ml-2 font-mono text-xs text-neutral-900" title={editingTemplateId}>
                {editingTemplateId.slice(0, 8)}…
              </span>
            </div>
          ) : null}
          <div className="dashboard">
            <div className="stat-group">
              {Object.entries(seatConfig).map(([id, cfg]) => (
                <span key={id} className="stat-item">
                  <span
                    className="stat-color"
                    style={
                      cfg.isFill
                        ? { background: cfg.color }
                        : { border: `2px solid ${cfg.color}`, background: "white", boxSizing: "border-box" }
                    }
                  />
                  {statsPack.counts[id] ?? 0} {cfg.name}
                </span>
              ))}
              <span className="stat-item">
                <span className="stat-color" style={{ background: "#cbd5e1" }} />
                {statsPack.blocked} Blocked
              </span>
            </div>
            <div className="revenue-box">
              <span style={{ color: "#166534", fontWeight: 500 }}>Max Revenue:</span>
              <span className="stat-total">{formatVND(statsPack.revenue)}</span>
            </div>
          </div>

          <div className="admin-panel">
            <div className="toolbar">
              <div className="history-group">
                <Button type="button" title="Undo" variant="ghost" size="icon" className="action-btn h-auto w-auto shrink-0 border-0 p-2 shadow-none hover:bg-transparent" onClick={undo}>
                  <i className="fa-solid fa-rotate-left" aria-hidden />
                </Button>
                <Button type="button" title="Redo" variant="ghost" size="icon" className="action-btn h-auto w-auto shrink-0 border-0 p-2 shadow-none hover:bg-transparent" onClick={redo}>
                  <i className="fa-solid fa-rotate-right" aria-hidden />
                </Button>
                <Button type="button" title="Clear" variant="ghost" size="icon" className="action-btn danger h-auto w-auto shrink-0 border-0 p-2 shadow-none hover:bg-transparent" onClick={resetMap}>
                  <i className="fa-solid fa-trash-can" aria-hidden />
                </Button>
              </div>
              <div className="toolbar-divider">
                <Button type="button" variant="ghost" className="cam-bp-btn btn-secondary h-auto gap-2 border-0 px-4 py-2 shadow-none hover:bg-transparent" onClick={() => setSeatMgrOpen(true)}>
                  <i className="fa-solid fa-gear" aria-hidden />
                  Config &amp; Pricing
                </Button>
              </div>
              <div className="toolbar-section">
                {toolIds.map((tid, i) => {
                  const active = currentTool === tid;
                  const label =
                    tid === "select" ? "Select" : tid === "empty" ? "Erase" : seatConfig[tid]?.name ?? tid;
                  const cfg = tid !== "select" && tid !== "empty" ? seatConfig[tid] : undefined;
                  return (
                    <Button
                      key={tid}
                      type="button"
                      variant="ghost"
                      onClick={() => setCurrentTool(tid)}
                      className={cn("tool-btn border-0 shadow-none hover:bg-transparent", active && "active")}
                    >
                      {tid === "select" ? <i className="fa-solid fa-arrow-pointer" aria-hidden /> : null}
                      {tid === "empty" ? <i className="fa-solid fa-eraser" aria-hidden /> : null}
                      {cfg ? (
                        <span
                          className="bp-tool-swatch"
                          style={
                            cfg.isFill
                              ? { background: cfg.color }
                              : {
                                  background: "var(--surface)",
                                  border: `2px solid ${cfg.color}`,
                                  boxSizing: "border-box",
                                }
                          }
                        />
                      ) : null}
                      {label}
                      <span className="shortcut">{i + 1}</span>
                    </Button>
                  );
                })}
              </div>
            </div>
            <Button type="button" variant="ghost" className="cam-bp-btn btn-success cam-bp-publish border-0 shadow-none hover:bg-transparent" onClick={() => setVerifyOpen(true)}>
              <i className="fa-solid fa-cloud-arrow-up" aria-hidden />
              {editingTemplateId ? "Update blueprint" : "Publish"}
            </Button>
          </div>

          <div className="grid-wrapper">
            <div className="screen-container" style={{ width: screenWidth }}>
              <div className="screen-bar" />
              <div className="screen-text">SCREEN</div>
            </div>
            <div className="grid-container">
              <div className="row-labels">
                {grid.map((row, r) => (
                  <div key={r} className="row-label">
                    {getRowLetter(r)}
                  </div>
                ))}
              </div>
              <div
                className="bp-grid"
                style={{ gridTemplateColumns: `repeat(${grid[0]?.length ?? 0}, 32px)` }}
              >
                {grid.map((row, r) =>
                  row.map((cell, c) => {
                    const cfg = seatConfig[cell.type];
                    const isEmpty = cell.type === "empty";
                    const fillStyle =
                      cfg && cfg.isFill
                        ? { background: cfg.color, color: cfg.textColor, border: "none" }
                        : cfg && !cfg.isFill
                          ? {
                              background: "white",
                              color: cfg.textColor,
                              border: `2px solid ${cfg.color}`,
                              boxSizing: "border-box" as const,
                            }
                          : {};
                    return (
                      <div
                        key={`${r}-${c}`}
                        className={`cell-slot ${cell.blocked && !isEmpty ? "bp-cell-blocked" : ""} ${
                          cell.selected && !isEmpty ? "bp-cell-selected" : ""
                        } ${isEmpty ? "bp-cell-empty-slot" : ""}`}
                        onMouseDown={(e) => onCellMouseDown(r, c, e)}
                        onMouseEnter={() => onCellMouseEnter(r, c)}
                      >
                        {!isEmpty ? (
                          <div className="bp-seat-cell" style={fillStyle}>
                            {cell.label}
                          </div>
                        ) : null}
                      </div>
                    );
                  }),
                )}
              </div>
              <div className="row-labels">
                {grid.map((row, r) => (
                  <div key={r} className="row-label">
                    {getRowLetter(r)}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`bulk-panel ${bulkSelectedCount > 0 ? "visible" : ""}`}>
            <span className="bulk-heading">{bulkSelectedCount} Selected</span>
            <div className="bp-bulk-dynamic-actions">
              {Object.keys(seatConfig).map((id) => (
                <Button key={id} type="button" variant="ghost" className="bulk-btn border-0 shadow-none hover:bg-transparent" onClick={() => bulkChangeType(id)}>
                  Set {seatConfig[id].name}
                </Button>
              ))}
            </div>
            <span className="bulk-divider" />
            <Button type="button" variant="ghost" className="bulk-btn danger border-0 shadow-none hover:bg-transparent" onClick={bulkToggleBlock}>
              <i className="fa-solid fa-ban" aria-hidden /> Toggle Blocked
            </Button>
            <Button type="button" variant="ghost" className="bulk-btn bulk-spacer border-0 shadow-none hover:bg-transparent" onClick={clearSelection}>
              Deselect All (Esc)
            </Button>
          </div>
        </>
      ) : null}

      {verifyOpen ? (
        <div className="modal-overlay" style={{ zIndex: 1020 }}>
          <div className="modal-box" style={{ maxWidth: 520 }}>
            <h2>{editingTemplateId ? "Confirm blueprint update" : "Confirm Blueprint Save"}</h2>
            <p className="modal-lead" style={{ marginTop: 8 }}>
              You are about to save a template with{" "}
              <strong style={{ color: "var(--text-main)" }}>{grid.flat().filter((c) => c.type !== "empty").length} active seats</strong>{" "}
              ({statsPack.blocked} blocked).
              <br />
              <br />
              Estimated Maximum Revenue Capacity:{" "}
              <strong style={{ color: "#15803d" }}>{formatVND(statsPack.revenue)}</strong>.
            </p>
            <div className="modal-footer">
              <Button type="button" variant="ghost" className="cam-bp-btn btn-secondary border-0 shadow-none hover:bg-transparent" onClick={() => setVerifyOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="cam-bp-btn btn-success border-0 shadow-none hover:bg-transparent"
                onClick={() => {
                  setVerifyOpen(false);
                  setSaveOpen(true);
                }}
              >
                {editingTemplateId ? "Confirm & Update" : "Confirm & Save"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {saveOpen ? (
        <div className="modal-overlay" style={{ zIndex: 1020 }}>
          <div className="modal-box">
            <h2>{editingTemplateId ? "Update template" : "Publish template"}</h2>
            <div className="input-group">
              <Label htmlFor="bp-template-name">Template name</Label>
              <Input id="bp-template-name" value={templateName} onChange={(e) => setTemplateName(e.target.value)} className="h-10 shadow-none" />
            </div>
            <div className="input-group">
              <Label htmlFor="bp-hall-name">Hall name</Label>
              <Input id="bp-hall-name" value={hallName} onChange={(e) => setHallName(e.target.value)} className="h-10 shadow-none" />
            </div>
            <div className="modal-footer">
              <Button type="button" variant="ghost" className="cam-bp-btn btn-secondary border-0 shadow-none hover:bg-transparent" onClick={() => setSaveOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="ghost"
                disabled={saveBusy || !templateName.trim() || !hallName.trim()}
                className="cam-bp-btn btn-primary border-0 shadow-none hover:bg-transparent"
                onClick={() => void executeSave()}
              >
                {saveBusy ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin" aria-hidden /> Saving…
                  </>
                ) : editingTemplateId ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {seatMgrOpen ? (
        <div className="modal-overlay" style={{ zIndex: 1020, alignItems: "flex-start", overflowY: "auto" }}>
          <div className="modal-box wide" style={{ margin: "32px 0" }}>
            <div className="bp-modal-toolbar">
              <h2>Manage Seat Types</h2>
              <Button type="button" variant="ghost" size="icon" className="bp-icon-btn h-auto w-auto shrink-0 border-0 p-2 shadow-none hover:bg-transparent" aria-label="Close" onClick={() => setSeatMgrOpen(false)}>
                <i className="fa-solid fa-xmark" aria-hidden />
              </Button>
            </div>
            <div className="table-container">
              <table className="seat-table">
                <thead>
                  <tr>
                    <th>Preview</th>
                    <th>Name</th>
                    <th>Style</th>
                    <th>Text</th>
                    <th>Price</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(seatConfig).map(([id, cfg]) => (
                    <tr key={id}>
                      <td>
                        <span
                          className="bp-preview-box"
                          style={
                            cfg.isFill ? { background: cfg.color } : { border: `2px solid ${cfg.color}`, boxSizing: "border-box" }
                          }
                        />
                      </td>
                      <td style={{ fontWeight: 500 }}>{cfg.name}</td>
                      <td>{cfg.isFill ? "Solid Fill" : "Outline"}</td>
                      <td>
                        <span className="bp-seat-type-text-badge">
                          {cfg.textColor === "#ffffff" ? "WHITE" : "BLACK"}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600 }}>${cfg.price}</td>
                      <td>
                        <div className="bp-inline-actions">
                          <Button type="button" title="Edit tier" variant="ghost" size="icon" className="action-btn h-auto w-auto shrink-0 border-0 p-2 shadow-none hover:bg-transparent" onClick={() => beginEditSeatType(id)}>
                            <i className="fa-solid fa-pen" aria-hidden />
                          </Button>
                          {id !== "normal" ? (
                            <Button type="button" title="Delete tier" variant="ghost" size="icon" className="action-btn danger h-auto w-auto shrink-0 border-0 p-2 shadow-none hover:bg-transparent" onClick={() => deleteSeatType(id)}>
                              <i className="fa-solid fa-trash-can" aria-hidden />
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="add-seat-form" style={{ marginTop: 24 }}>
              <h3>
                {editingSeatId ? (
                  <>
                    <i className="fa-solid fa-pen" style={{ color: "var(--primary)" }} aria-hidden /> Editing:{" "}
                    <strong>{seatConfig[editingSeatId]?.name}</strong>
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-plus" style={{ color: "var(--primary)" }} aria-hidden /> Create New Seat Type
                  </>
                )}
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
                <div className="input-group" style={{ flex: "1 1 140px", marginBottom: 0 }}>
                  <Label htmlFor="bp-new-seat-name">Name</Label>
                  <Input
                    id="bp-new-seat-name"
                    value={newSeatName}
                    onChange={(e) => setNewSeatName(e.target.value)}
                    placeholder="e.g. Balcony"
                    className="h-10 shadow-none"
                  />
                </div>
                <div className="input-group" style={{ flex: "0 0 auto", marginBottom: 0, width: 120 }}>
                  <Label htmlFor="bp-new-seat-price">Price ($)</Label>
                  <Input
                    id="bp-new-seat-price"
                    type="number"
                    value={newSeatPrice}
                    onChange={(e) => setNewSeatPrice(e.target.value)}
                    className="h-10 shadow-none"
                  />
                </div>
                <div className="input-group" style={{ flex: "0 0 120px", marginBottom: 0 }}>
                  <Label htmlFor="bp-new-seat-color">Color</Label>
                  <Input id="bp-new-seat-color" type="color" value={newSeatColor} onChange={(e) => setNewSeatColor(e.target.value)} className="h-10 cursor-pointer shadow-none" />
                </div>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginTop: 8 }}>
                <div className="input-group" style={{ flex: 1, marginBottom: 0, minWidth: 180 }}>
                  <Label htmlFor="bp-new-seat-fill">Fill Style</Label>
                  <Select value={newSeatFill} onValueChange={setNewSeatFill}>
                    <SelectTrigger id="bp-new-seat-fill" className="h-10 w-full shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="false">Outline (White Background)</SelectItem>
                      <SelectItem value="true">Solid Fill (Colored Background)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="input-group" style={{ flex: 1, marginBottom: 0, minWidth: 160 }}>
                  <Label htmlFor="bp-new-seat-text">Text Color</Label>
                  <Select value={newSeatText} onValueChange={setNewSeatText}>
                    <SelectTrigger id="bp-new-seat-text" className="h-10 w-full shadow-none">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="#000000">Black</SelectItem>
                      <SelectItem value="#ffffff">White</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                <Button type="button" variant="ghost" className="cam-bp-btn btn-primary border-0 shadow-none hover:bg-transparent" onClick={saveSeatType}>
                  {editingSeatId ? "Update Type" : "Add Type"}
                </Button>
                {editingSeatId ? (
                  <Button type="button" variant="ghost" className="cam-bp-btn btn-secondary border-0 shadow-none hover:bg-transparent" onClick={() => setEditingSeatId(null)}>
                    Cancel Edit
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
