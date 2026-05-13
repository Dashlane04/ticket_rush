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

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  is_active: boolean;
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

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="cam-mission w-full">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="form-group mb-0 min-w-[200px] flex-1">
            <label htmlFor="user-search">Tìm theo tên</label>
            <Input
              id="user-search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Gõ tên…"
              className="h-9"
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
              <th>Trạng thái</th>
              <th className="min-w-36 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="cell-muted py-10 text-center">
                  Đang tải…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="cell-muted py-10 text-center">
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
                  <td>
                    <span className={rowIsActive(row.is_active) ? "text-emerald-700" : "text-amber-800"}>
                      {rowIsActive(row.is_active) ? "Hoạt động" : "Vô hiệu"}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex flex-wrap items-center justify-end gap-1">
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
    </div>
  );
}
