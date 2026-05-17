"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { nestFetch } from "@/lib/nest-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatVND } from "@/lib/format-currency";
import { Users, Activity, Ticket, User, CalendarDays, PieChart, Info, BarChart3, TrendingUp, DollarSign, Clock } from "lucide-react";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  is_active: boolean;
};

type UserTelemetry = {
  age: number | null;
  totalPurchases: number;
  totalSpent: number;
  avgTicketPrice: number;
  lastPurchaseDate: string | null;
  preferences: { name: string; count: number }[];
  purchaseHistory: { month: string; count: number; spent: number }[];
};

type UserListResponse = {
  total: number;
  page: number;
  size: number;
  data: UserRow[];
};

function nestErrorMessage(body: unknown): string {
  if (!body || typeof body !== "object") return "Đã xảy ra lỗi";
  const msg = (body as { message?: unknown }).message;
  if (Array.isArray(msg) && msg[0] && typeof msg[0] === "string") return msg[0];
  if (typeof msg === "string") return msg;
  return "Đã xảy ra lỗi";
}

function rowIsActive(v: unknown): boolean {
  if (v === true || v === 1) return true;
  if (v === false || v === 0 || v === null || v === undefined) return false;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    return s === "true" || s === "t" || s === "1" || s === "yes";
  }
  return false;
}

function ModalChrome({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div
      className="modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box large" role="dialog" aria-labelledby="admin-users-modal-title">
        <div className="modal-head">
          <h2 id="admin-users-modal-title">{title}</h2>
          <button type="button" className="action-btn" aria-label="Đóng" onClick={onClose}>
            <i className="fa-solid fa-xmark" aria-hidden />
          </button>
        </div>
        {children}
        <div className="modal-footer-actions">{footer}</div>
      </div>
    </div>
  );
}

function UserStatsDashboard() {
  const [stats, setStats] = useState<{
    gender: { name: string; count: number }[];
    age: { name: string; count: number }[];
    genres: { name: string; count: number }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await nestFetch("admin/users/stats");
        if (!res.ok) throw new Error("Failed to load stats");
        const data = await res.json();
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    void loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-primary" />
          <span className="text-sm font-medium text-slate-500">Đang tải dữ liệu thống kê...</span>
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const totalGender = stats.gender.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const totalAge = stats.age.reduce((acc, curr) => acc + curr.count, 0) || 1;
  const maxGenre = Math.max(...stats.genres.map(g => g.count), 1);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Age Demographics */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/30">
            <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-none">Độ tuổi</h3>
            <p className="text-sm text-slate-500 mt-1">Phân bổ người dùng</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {stats.age.map((item) => {
            const pct = Math.round((item.count / totalAge) * 100);
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">
                    {item.name === 'Unknown' ? 'Chưa rõ' : item.name}
                  </span>
                  <span className="text-slate-500 font-medium">{pct}% ({item.count})</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Gender Distribution */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
            <PieChart className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-none">Giới tính</h3>
            <p className="text-sm text-slate-500 mt-1">Tỉ lệ người dùng</p>
          </div>
        </div>
        
        <div className="space-y-4 mt-8">
          {stats.gender.map((item) => {
            const pct = Math.round((item.count / totalGender) * 100);
            let label = item.name;
            let color = "bg-indigo-500";
            if (item.name.toUpperCase() === "MALE") { label = "Nam"; color = "bg-sky-500"; }
            else if (item.name.toUpperCase() === "FEMALE") { label = "Nữ"; color = "bg-rose-400"; }
            else if (item.name === "UNKNOWN") { label = "Chưa rõ"; color = "bg-slate-400"; }

            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{label}</span>
                  <span className="text-slate-500 font-medium">{pct}% ({item.count})</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div 
                    className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)} 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Favorite Genres */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-1 md:col-span-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/30">
            <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white leading-none">Thể loại yêu thích</h3>
            <p className="text-sm text-slate-500 mt-1">Dựa trên số lượng vé bán ra</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {stats.genres.length === 0 ? (
             <div className="py-8 text-center text-slate-500 text-sm">Chưa có dữ liệu vé</div>
          ) : stats.genres.map((item, index) => {
            const pct = Math.round((item.count / maxGenre) * 100);
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="font-medium flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="text-xs font-bold text-amber-500">#{index + 1}</span> {item.name}
                  </span>
                  <span className="text-slate-500 font-medium">{item.count} vé</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div 
                    className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-out" 
                    style={{ width: `${pct}%` }} 
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

export function AdminUsersPanel() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pageIndex, setPageIndex] = useState(0);
  const pageSize = 10;
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"1" | "-1">("1");
  const [activeFilter, setActiveFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [currentTab, setCurrentTab] = useState<"list" | "stats">("list");

  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createSaving, setCreateSaving] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  const [userTelemetry, setUserTelemetry] = useState<UserTelemetry | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsUser, setDetailsUser] = useState<UserRow | null>(null);

  const loadTelemetry = async (userId: string) => {
    setUserTelemetry(null);
    try {
      const res = await nestFetch(`user/${encodeURIComponent(userId)}/telemetry`);
      if (res.ok) {
        setUserTelemetry(await res.json());
      } else {
        console.error("[loadTelemetry] Non-OK response:", res.status, await res.text().catch(() => ""));
        setUserTelemetry({ age: null, totalPurchases: 0, totalSpent: 0, avgTicketPrice: 0, lastPurchaseDate: null, preferences: [], purchaseHistory: [] });
      }
    } catch (err) {
      console.error("[loadTelemetry] Fetch error:", err);
      setUserTelemetry({ age: null, totalPurchases: 0, totalSpent: 0, avgTicketPrice: 0, lastPurchaseDate: null, preferences: [], purchaseHistory: [] });
    }
  };

  useEffect(() => {
    const t = setTimeout(() => setQuery(searchInput), 320);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPageIndex(0);
  }, [query, pageSize, activeFilter, sort]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("size", String(pageSize));
      if (query.trim()) params.set("query", query.trim());
      params.set("sort", sort);
      if (activeFilter === "active") params.set("is_active", "true");
      if (activeFilter === "inactive") params.set("is_active", "false");
      if (pageIndex > 0) params.set("page", String(pageIndex));

      const res = await nestFetch(`user?${params.toString()}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(nestErrorMessage(body));
      const parsed = body as UserListResponse;
      setRows(Array.isArray(parsed.data) ? parsed.data : []);
      setTotal(typeof parsed.total === "number" ? parsed.total : 0);
      setSelectedIds(new Set());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải được user");
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [pageIndex, pageSize, query, sort, activeFilter]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const pageIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const allPageSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  const toggleAllPage = () => {
    if (allPageSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pageIds));
    }
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkIds = useMemo(() => Array.from(selectedIds), [selectedIds]);

  const bulkActivate = async () => {
    if (bulkIds.length === 0) return;
    try {
      const res = await nestFetch("user/activate", {
        method: "PUT",
        body: JSON.stringify({ ids: bulkIds }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(nestErrorMessage(body));
      toast.success("Đã kích hoạt");
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi kích hoạt");
    }
  };

  const bulkInactivate = async () => {
    if (bulkIds.length === 0) return;
    try {
      const res = await nestFetch("user/inactivate", {
        method: "PUT",
        body: JSON.stringify({ ids: bulkIds }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(nestErrorMessage(body));
      toast.success("Đã vô hiệu hóa");
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi vô hiệu hóa");
    }
  };

  const bulkDelete = async () => {
    if (bulkIds.length === 0) return;
    if (!window.confirm(`Xóa mềm ${bulkIds.length} user đã chọn?`)) return;
    try {
      const res = await nestFetch("user", {
        method: "DELETE",
        body: JSON.stringify({ ids: bulkIds }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(nestErrorMessage(body));
      toast.success("Đã xóa mềm");
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa");
    }
  };

  const deleteUserRow = async (id: string, email: string) => {
    if (!window.confirm(`Xóa mềm user ${email}?`)) return;
    try {
      const res = await nestFetch("user", {
        method: "DELETE",
        body: JSON.stringify({ ids: [id] }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(nestErrorMessage(body));
      toast.success("Đã xóa user");
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Lỗi xóa");
    }
  };

  const openCreate = () => {
    setCreateName("");
    setCreateEmail("");
    setCreatePassword("");
    setCreatePhone("");
    setCreateOpen(true);
  };

  const submitCreate = async () => {
    if (!createName.trim() || !createEmail.trim() || !createPassword) {
      toast.error("Điền đủ tên, email và mật khẩu");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createEmail.trim())) {
      toast.error("Email không hợp lệ");
      return;
    }
    if (createPhone.trim()) {
      const phoneRegex = /^[0-9\-\+\s()]{8,15}$/;
      if (!phoneRegex.test(createPhone.trim())) {
        toast.error("Số điện thoại không hợp lệ");
        return;
      }
    }
    if (createPassword.length < 6) {
      toast.error("Mật khẩu phải dài ít nhất 6 ký tự");
      return;
    }
    setCreateSaving(true);
    try {
      const res = await nestFetch("user", {
        method: "POST",
        body: JSON.stringify({
          name: createName.trim(),
          email: createEmail.trim(),
          password: createPassword,
          phone: createPhone.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(nestErrorMessage(body));
      toast.success("Đã tạo user");
      setCreateOpen(false);
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tạo được user");
    } finally {
      setCreateSaving(false);
    }
  };

  const openEdit = async (row: UserRow) => {
    setEditId(row.id);
    setEditPassword("");
    void loadTelemetry(row.id);
    try {
      const res = await nestFetch(`user/${encodeURIComponent(row.id)}`);
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(nestErrorMessage(body));
      const u = body as UserRow;
      setEditName(u.name ?? "");
      setEditEmail(u.email ?? "");
      setEditPhone(u.phone ?? "");
      setEditOpen(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không tải chi tiết user");
    }
  };

  const submitEdit = async () => {
    if (!editId) return;
    if (!editName.trim() || !editEmail.trim()) {
      toast.error("Tên và email là bắt buộc");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editEmail.trim())) {
      toast.error("Email không hợp lệ");
      return;
    }
    if (editPhone.trim()) {
      const phoneRegex = /^[0-9\-\+\s()]{8,15}$/;
      if (!phoneRegex.test(editPhone.trim())) {
        toast.error("Số điện thoại không hợp lệ");
        return;
      }
    }
    if (editPassword && editPassword.length < 6) {
      toast.error("Mật khẩu phải dài ít nhất 6 ký tự");
      return;
    }
    setEditSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: editName.trim(),
        email: editEmail.trim(),
      };
      if (editPhone.trim()) payload.phone = editPhone.trim();
      if (editPassword) payload.password = editPassword;

      const res = await nestFetch(`user/${encodeURIComponent(editId)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(nestErrorMessage(body));
      toast.success("Đã cập nhật user");
      setEditOpen(false);
      setEditId(null);
      await loadUsers();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không cập nhật được");
    } finally {
      setEditSaving(false);
    }
  };

  const openDetails = (row: UserRow) => {
    setDetailsUser(row);
    void loadTelemetry(row.id);
    setDetailsOpen(true);
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="cam-mission w-full">
      <div className="mb-6 flex space-x-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/50 w-fit">
        <button
          onClick={() => setCurrentTab("list")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            currentTab === "list" 
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          )}
        >
          <Users className="h-4 w-4" />
          Danh sách User
        </button>
        <button
          onClick={() => setCurrentTab("stats")}
          className={cn(
            "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all",
            currentTab === "stats" 
              ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white" 
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
          )}
        >
          <Activity className="h-4 w-4" />
          Thống kê
        </button>
      </div>

      {currentTab === "stats" ? (
        <UserStatsDashboard />
      ) : (
        <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-6">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
              <div className="form-group mb-0 min-w-[260px] flex-1">
                <label htmlFor="user-search">Tìm kiếm</label>
                <Input
                  id="user-search"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Gõ tên, email hoặc SĐT…"
                  className="h-10 bg-white dark:bg-slate-950"
                />
              </div>
          <div className="form-group mb-0 w-full sm:w-40">
            <label>Trạng thái</label>
            <Select value={activeFilter} onValueChange={(v) => setActiveFilter(v as typeof activeFilter)}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="active">Đang hoạt động</SelectItem>
                <SelectItem value="inactive">Vô hiệu</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="form-group mb-0 w-full sm:w-44">
            <label>Sắp xếp</label>
            <Select value={sort} onValueChange={(v) => setSort(v as "1" | "-1")}>
              <SelectTrigger className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Mới nhất trước</SelectItem>
                <SelectItem value="-1">Cũ nhất trước</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => void loadUsers()}
            className={cn(
              "h-7 border-slate-300 bg-white text-foreground shadow-none",
              "hover:bg-slate-50 hover:text-foreground",
            )}
          >
            Làm mới
          </Button>
          <Button type="button" size="sm" onClick={openCreate}>
            Tạo user
          </Button>
        </div>
      </div>

      {bulkIds.length > 0 ? (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm">
          <span className="text-muted-foreground">Đã chọn {bulkIds.length}</span>
          <Button type="button" size="xs" variant="secondary" onClick={() => void bulkActivate()}>
            Kích hoạt
          </Button>
          <Button type="button" size="xs" variant="secondary" onClick={() => void bulkInactivate()}>
            Vô hiệu
          </Button>
          <Button type="button" size="xs" variant="destructive" onClick={() => void bulkDelete()}>
            Xóa mềm
          </Button>
        </div>
      ) : null}

      <div className="table-container cam-table-flat">
        <table className="showtime-table w-full">
          <thead>
            <tr>
              <th className="w-10">
                <Checkbox checked={allPageSelected} onCheckedChange={() => toggleAllPage()} aria-label="Chọn cả trang" />
              </th>
              <th>Tên</th>
              <th>Email</th>
              <th>Điện thoại</th>
              <th>Giới tính</th>
              <th>Ngày sinh</th>
              <th>Trạng thái</th>
              <th className="min-w-36 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="cell-muted py-10 text-center">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="cell-muted py-10 text-center">
                  Không có user phù hợp.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Checkbox
                      checked={selectedIds.has(row.id)}
                      onCheckedChange={() => toggleOne(row.id)}
                      aria-label={`Chọn ${row.email}`}
                    />
                  </td>
                  <td>{row.name ?? "—"}</td>
                  <td>{row.email}</td>
                  <td className="cell-muted">{row.phone ?? "—"}</td>
                  <td className="cell-muted">
                    {row.gender === 'MALE' ? 'Nam' : row.gender === 'FEMALE' ? 'Nữ' : row.gender === 'OTHER' ? 'Khác' : "—"}
                  </td>
                  <td className="cell-muted">
                    {row.date_of_birth ? new Date(row.date_of_birth).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td>
                    <span className={rowIsActive(row.is_active) ? "text-emerald-700" : "text-amber-800"}>
                      {rowIsActive(row.is_active) ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
                      <Button type="button" variant="ghost" size="xs" onClick={() => void openDetails(row)}>
                        Chi tiết
                      </Button>
                      <Button type="button" variant="ghost" size="xs" onClick={() => void openEdit(row)}>
                        Sửa
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="xs"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => void deleteUserRow(row.id, row.email)}
                      >
                        Xóa
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {total} user · Trang {pageIndex + 1}/{pageCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageIndex <= 0 || loading}
            onClick={() => setPageIndex((p) => Math.max(0, p - 1))}
            className={cn(
              "h-7 border-slate-300 bg-white text-foreground shadow-none",
              "hover:bg-slate-50 hover:text-foreground",
            )}
          >
            Trước
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pageIndex >= pageCount - 1 || loading}
            onClick={() => setPageIndex((p) => p + 1)}
            className={cn(
              "h-7 border-slate-300 bg-white text-foreground shadow-none",
              "hover:bg-slate-50 hover:text-foreground",
            )}
          >
            Sau
          </Button>
        </div>
      </div>

      {createOpen ? (
        <ModalChrome
          title="Tạo user"
          onClose={() => !createSaving && setCreateOpen(false)}
          footer={
            <>
              <Button type="button" variant="outline" size="sm" disabled={createSaving} onClick={() => setCreateOpen(false)}>
                Hủy
              </Button>
              <Button type="button" size="sm" disabled={createSaving} onClick={() => void submitCreate()}>
                {createSaving ? "Đang lưu…" : "Tạo"}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            <div className="form-group">
              <Label htmlFor="c-name">Tên</Label>
              <Input id="c-name" value={createName} onChange={(e) => setCreateName(e.target.value)} className="h-9" />
            </div>
            <div className="form-group">
              <Label htmlFor="c-email">Email</Label>
              <Input id="c-email" type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} className="h-9" />
            </div>
            <div className="form-group">
              <Label htmlFor="c-phone">Điện thoại (tuỳ chọn)</Label>
              <Input id="c-phone" value={createPhone} onChange={(e) => setCreatePhone(e.target.value)} className="h-9" />
            </div>
            <div className="form-group">
              <Label htmlFor="c-pass">Mật khẩu</Label>
              <Input id="c-pass" type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} className="h-9" />
            </div>
          </div>
        </ModalChrome>
      ) : null}

      {editOpen ? (
        <ModalChrome
          title="Sửa user"
          onClose={() => !editSaving && setEditOpen(false)}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={editSaving}
                onClick={() => {
                  setEditOpen(false);
                  setEditId(null);
                }}
              >
                Hủy
              </Button>
              <Button type="button" size="sm" disabled={editSaving} onClick={() => void submitEdit()}>
                {editSaving ? "Đang lưu…" : "Lưu"}
              </Button>
            </>
          }
        >
          <div className="space-y-3">
            {userTelemetry && (
              <div className="mb-4 rounded-lg bg-slate-50 p-4 border border-slate-100 dark:bg-slate-900 dark:border-slate-800">
                <h4 className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Thông tin phụ</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 block text-xs">Tuổi:</span>
                    <span className="font-medium">{userTelemetry.age ?? "Chưa rõ"}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Tổng chi tiêu:</span>
                    <span className="font-medium">{formatVND(userTelemetry.totalSpent)}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500 block text-xs mb-1">Thể loại yêu thích:</span>
                    <div className="flex gap-1 flex-wrap">
                      {userTelemetry.preferences.length > 0 ? userTelemetry.preferences.map(p => (
                        <span key={p.name} className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-xs rounded-full">
                          {p.name} ({p.count})
                        </span>
                      )) : <span className="text-slate-400 text-xs">Chưa có dữ liệu</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="form-group">
              <Label htmlFor="e-name">Tên</Label>
              <Input id="e-name" value={editName} onChange={(e) => setEditName(e.target.value)} className="h-9" />
            </div>
            <div className="form-group">
              <Label htmlFor="e-email">Email</Label>
              <Input id="e-email" type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="h-9" />
            </div>
            <div className="form-group">
              <Label htmlFor="e-phone">Điện thoại</Label>
              <Input id="e-phone" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} className="h-9" />
            </div>
            <div className="form-group">
              <Label htmlFor="e-pass">Mật khẩu mới (để trống nếu giữ)</Label>
              <Input id="e-pass" type="password" value={editPassword} onChange={(e) => setEditPassword(e.target.value)} className="h-9" />
            </div>
          </div>
        </ModalChrome>
      ) : null}

      {detailsOpen && detailsUser ? (
        <ModalChrome
          title="Chi tiết User"
          onClose={() => setDetailsOpen(false)}
          footer={
            <Button type="button" size="sm" onClick={() => setDetailsOpen(false)}>
              Đóng
            </Button>
          }
        >
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
            <div className="flex items-center gap-4">
               <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400 shrink-0">
                 {detailsUser.name ? detailsUser.name.charAt(0).toUpperCase() : <User />}
               </div>
               <div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">{detailsUser.name || "Chưa có tên"}</h3>
                 <p className="text-slate-500 text-sm">{detailsUser.email}</p>
                 <div className="flex items-center gap-2 mt-1">
                   <span className={cn("text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full", rowIsActive(detailsUser.is_active) ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                      {rowIsActive(detailsUser.is_active) ? "Hoạt động" : "Vô hiệu"}
                   </span>
                 </div>
               </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
               <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
                 <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm">
                   <Ticket className="h-4 w-4" />
                   <span>Tổng vé đã mua</span>
                 </div>
                 <div className="text-2xl font-bold text-slate-900 dark:text-white">
                   {userTelemetry ? userTelemetry.totalPurchases : "..."}
                 </div>
               </div>
               <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
                 <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm">
                   <DollarSign className="h-4 w-4" />
                   <span>Tổng chi tiêu</span>
                 </div>
                 <div className="text-2xl font-bold text-emerald-600">
                   {userTelemetry ? formatVND(userTelemetry.totalSpent) : "..."}
                 </div>
               </div>
               <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
                 <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm">
                   <Activity className="h-4 w-4" />
                   <span>Giá vé trung bình</span>
                 </div>
                 <div className="text-2xl font-bold text-blue-600">
                   {userTelemetry ? formatVND(userTelemetry.avgTicketPrice) : "..."}
                 </div>
               </div>
               <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
                 <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm">
                   <CalendarDays className="h-4 w-4" />
                   <span>Ngày sinh & Tuổi</span>
                 </div>
                 <div className="text-sm font-medium text-slate-900 dark:text-white">
                   {detailsUser.date_of_birth ? new Date(detailsUser.date_of_birth).toLocaleDateString("vi-VN") : "Chưa rõ"}
                   {userTelemetry?.age ? ` (${userTelemetry.age} tuổi)` : ""}
                 </div>
               </div>
               <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
                 <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm">
                   <PieChart className="h-4 w-4" />
                   <span>Giới tính</span>
                 </div>
                 <div className="text-sm font-medium text-slate-900 dark:text-white">
                    {detailsUser.gender === 'MALE' ? 'Nam' : detailsUser.gender === 'FEMALE' ? 'Nữ' : detailsUser.gender === 'OTHER' ? 'Khác' : "Chưa rõ"}
                 </div>
               </div>
               <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 shadow-sm">
                 <div className="flex items-center gap-2 text-slate-500 mb-2 text-sm">
                   <Clock className="h-4 w-4" />
                   <span>Lần mua gần nhất</span>
                 </div>
                 <div className="text-sm font-medium text-slate-900 dark:text-white">
                   {userTelemetry?.lastPurchaseDate ? new Date(userTelemetry.lastPurchaseDate).toLocaleDateString("vi-VN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Chưa có"}
                 </div>
               </div>
            </div>

            {/* Purchase Volume Line Chart */}
            {userTelemetry && userTelemetry.purchaseHistory.length > 0 && (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm">
                <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  Lượng mua vé theo tháng
                </h4>
                {(() => {
                  const data = userTelemetry.purchaseHistory;
                  const maxCount = Math.max(...data.map(d => d.count), 1);
                  const maxSpent = Math.max(...data.map(d => d.spent), 1);
                  const chartW = 400;
                  const chartH = 140;
                  const padL = 30;
                  const padR = 10;
                  const padT = 10;
                  const padB = 30;
                  const plotW = chartW - padL - padR;
                  const plotH = chartH - padT - padB;
                  const stepX = data.length > 1 ? plotW / (data.length - 1) : plotW / 2;

                  const countPoints = data.map((d, i) => {
                    const x = padL + i * stepX;
                    const y = padT + plotH - (d.count / maxCount) * plotH;
                    return `${x},${y}`;
                  }).join(" ");

                  const spentPoints = data.map((d, i) => {
                    const x = padL + i * stepX;
                    const y = padT + plotH - (d.spent / maxSpent) * plotH;
                    return `${x},${y}`;
                  }).join(" ");

                  const countFill = `${padL},${padT + plotH} ${countPoints} ${padL + (data.length - 1) * stepX},${padT + plotH}`;

                  return (
                    <div className="w-full overflow-x-auto">
                      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto max-h-[180px]" preserveAspectRatio="xMidYMid meet">
                        {/* Grid lines */}
                        {[0, 0.25, 0.5, 0.75, 1].map(f => (
                          <line key={f} x1={padL} y1={padT + plotH * (1 - f)} x2={chartW - padR} y2={padT + plotH * (1 - f)} stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth={0.5} />
                        ))}
                        {/* Y-axis labels */}
                        <text x={padL - 4} y={padT + 4} textAnchor="end" className="fill-slate-400" fontSize={8}>{maxCount}</text>
                        <text x={padL - 4} y={padT + plotH + 3} textAnchor="end" className="fill-slate-400" fontSize={8}>0</text>
                        {/* Area fill */}
                        <polygon points={countFill} fill="url(#countGrad)" opacity={0.3} />
                        {/* Count line */}
                        <polyline points={countPoints} fill="none" stroke="#3b82f6" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        {/* Spent line */}
                        <polyline points={spentPoints} fill="none" stroke="#10b981" strokeWidth={1.5} strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" />
                        {/* Dots */}
                        {data.map((d, i) => {
                          const x = padL + i * stepX;
                          const y = padT + plotH - (d.count / maxCount) * plotH;
                          return <circle key={i} cx={x} cy={y} r={3} fill="#3b82f6" stroke="white" strokeWidth={1.5} />;
                        })}
                        {/* X-axis labels */}
                        {data.map((d, i) => (
                          <text key={i} x={padL + i * stepX} y={chartH - 6} textAnchor="middle" className="fill-slate-400" fontSize={8}>
                            {d.month.slice(5)}/{d.month.slice(2, 4)}
                          </text>
                        ))}
                        <defs>
                          <linearGradient id="countGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="flex items-center justify-center gap-6 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-blue-500 rounded" /> Số vé</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 bg-emerald-500 rounded border-dashed" style={{ borderTop: "1px dashed #10b981", height: 0 }} /> Chi tiêu (₫)</span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 shadow-sm">
              <h4 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-amber-500" />
                Sở thích & Thói quen mua vé
              </h4>
              {userTelemetry ? (
                userTelemetry.preferences.length > 0 ? (
                  <div className="space-y-4">
                    {userTelemetry.preferences.map((p, i) => {
                       const max = userTelemetry.preferences[0].count;
                       const pct = Math.max(1, Math.round((p.count / max) * 100));
                       return (
                         <div key={p.name} className="space-y-1.5">
                           <div className="flex justify-between text-sm">
                             <span className="font-medium text-slate-700 dark:text-slate-300">{p.name}</span>
                             <span className="text-slate-500 font-medium">{p.count} vé</span>
                           </div>
                           <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                             <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                           </div>
                         </div>
                       );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 text-center py-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">Chưa có lịch sử mua vé để phân tích.</p>
                )
              ) : (
                <div className="h-20 flex items-center justify-center">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-200 border-t-amber-500" />
                </div>
              )}
            </div>
          </div>
        </ModalChrome>
      ) : null}
        </>
      )}
    </div>
  );
}
