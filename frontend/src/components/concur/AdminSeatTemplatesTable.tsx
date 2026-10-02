"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import { nestFetch } from "@/lib/nest-api";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type AdminSeatTemplateRow = {
  templateId: string;
  templateName: string;
  hallName: string;
};

type Props = {
  /** `embedded`: table-only for modal scroll area. `page`: wrapped in card section. */
  variant?: "page" | "embedded";
  /** Use Ticket Rush dashboard table tokens (scoped `.cam-admin-shell`). */
  appearance?: "tailwind" | "concur";
  /** If omitted, navigates to `/admin/seat-templates?edit=…`. */
  onEditTemplate?: (templateId: string) => void;
  /** Hub trang templates: empty state hiển thị link tạo mới (vd `/admin/seat-templates?new=1`). */
  createNewHref?: string;
};

async function fetchTemplates(): Promise<AdminSeatTemplateRow[]> {
  const res = await nestFetch("admin/seat-templates");
  if (!res.ok) throw new Error("fetch failed");
  const data = (await res.json()) as AdminSeatTemplateRow[];
  return Array.isArray(data) ? data : [];
}

async function deleteSeatTemplate(templateId: string): Promise<void> {
  await nestFetch(`admin/seat-template/${templateId}`, { method: "DELETE" });
}

export function AdminSeatTemplatesTable({
  variant = "page",
  appearance = "tailwind",
  onEditTemplate,
  createNewHref,
}: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<AdminSeatTemplateRow[]>([]);
  const [phase, setPhase] = useState<"loading" | "empty" | "ready" | "error">("loading");
  const pageSize = 10;
  const [pageIndex, setPageIndex] = useState(0);

  const reload = useCallback(async () => {
    setPhase("loading");
    try {
      const templates = await fetchTemplates();
      setRows(templates);
      setPhase(templates.length === 0 ? "empty" : "ready");
    } catch {
      setRows([]);
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchTemplates()
      .then((templates) => {
        if (cancelled) return;
        setRows(templates);
        setPhase(templates.length === 0 ? "empty" : "ready");
      })
      .catch(() => {
        if (cancelled) return;
        setRows([]);
        setPhase("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onMutated = () => {
      void reload();
    };
    window.addEventListener("seat-templates:mutated", onMutated);
    return () => window.removeEventListener("seat-templates:mutated", onMutated);
  }, [reload]);

  const totalRows = rows.length;
  const pageCount = Math.max(1, Math.ceil(totalRows / pageSize));

  useEffect(() => {
    setPageIndex((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const clampedPage = Math.min(pageIndex, Math.max(0, pageCount - 1));
  const pagedRows = useMemo(() => {
    const start = clampedPage * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, clampedPage, pageSize]);

  const handleEdit = (templateId: string) => {
    if (onEditTemplate) onEditTemplate(templateId);
    else router.push(`/admin/seat-templates?edit=${encodeURIComponent(templateId)}`);
  };

  const onDelete = async (templateId: string) => {
    if (!confirm("Are you sure? This deletes the blueprint completely!")) return;
    try {
      await deleteSeatTemplate(templateId);
      await reload();
    } catch {
      toast.error("Failed to delete template.");
    }
  };

  const wrapCls =
    appearance === "concur"
      ? variant === "embedded"
        ? ""
        : "overflow-x-auto"
      : variant === "page"
        ? "overflow-x-auto"
        : "max-h-[400px] overflow-y-auto rounded-lg border border-slate-200";

  const tblClass = appearance === "concur" ? "showtime-table" : "w-full text-sm";

  const inner = (
      <table className={tblClass}>
        {appearance === "concur" ? (
          <thead>
            <tr>
              <th>Template Name</th>
              <th>Hall Assignment</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
        ) : (
          <thead className={variant === "embedded" ? "sticky top-0 bg-slate-50" : undefined}>
            <tr
              className={
                variant === "page"
                  ? "border-b border-slate-200 bg-slate-50 text-left text-xs font-semibold uppercase text-slate-500"
                  : "border-b border-slate-200 text-left text-xs font-semibold uppercase text-slate-500 bg-slate-50"
              }
            >
              <th className="px-5 py-3">Template Name</th>
              <th className="px-5 py-3">Hall Assignment</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
        )}
        <tbody>
          {phase === "loading" ? (
            <tr>
              <td colSpan={3} className={appearance === "concur" ? "cell-muted" : "p-5 text-center text-slate-500"}>
                Loading templates...
              </td>
            </tr>
          ) : phase === "error" ? (
            <tr>
              <td colSpan={3} className={appearance === "concur" ? "cell-error" : "p-5 text-center text-red-600"}>
                Failed to load templates.
              </td>
            </tr>
          ) : phase === "empty" ? (
            <tr>
              <td colSpan={3} className={appearance === "concur" ? "cell-muted" : "p-5 text-center text-slate-400"}>
                {variant === "page" && createNewHref ?
                  <span className="inline-flex flex-col items-center gap-3 sm:inline-flex sm:flex-row sm:items-center sm:justify-center sm:gap-4">
                    <span>Chưa có blueprint nào.</span>
                    <Link
                      href={createNewHref}
                      className={
                        appearance === "concur"
                          ? "inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                          : "inline-flex rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
                      }
                    >
                      Tạo blueprint đầu tiên
                    </Link>
                  </span>
                : "No blueprints found."}
              </td>
            </tr>
          ) : (
            pagedRows.map((t) => (
              <tr key={t.templateId}>
                <td>{appearance === "concur" ? <span className="movie-title">{t.templateName}</span> : t.templateName}</td>
                <td style={appearance === "concur" ? { fontWeight: 500 } : undefined}>{t.hallName}</td>
                <td style={{ textAlign: "right" }}>
                  <div
                    className={appearance === "concur" ? "cam-dashboard-btn-row" : "flex justify-end gap-1"}
                    style={appearance === "concur" ? { justifyContent: "flex-end", gap: 4 } : undefined}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={
                        appearance === "concur"
                          ? "action-btn edit h-auto w-auto shrink-0 border-0 p-2 shadow-none hover:bg-transparent"
                          : "rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-800 border-0 shadow-none"
                      }
                      title="Edit blueprint"
                      onClick={() => handleEdit(t.templateId)}
                    >
                      {appearance === "concur" ? <i className="fa-solid fa-pen" aria-hidden /> : <Pencil className="h-4 w-4" />}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className={
                        appearance === "concur"
                          ? "action-btn delete h-auto w-auto shrink-0 border-0 p-2 shadow-none hover:bg-transparent"
                          : "rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 border-0 shadow-none"
                      }
                      title="Delete Blueprint"
                      onClick={() => void onDelete(t.templateId)}
                    >
                      {appearance === "concur" ? <i className="fa-solid fa-trash" aria-hidden /> : <Trash2 className="h-4 w-4" />}
                    </Button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    );

  const paginationFooter =
    phase === "ready" && totalRows > 0 ? (
      <div
        className={
          appearance === "concur"
            ? "flex flex-wrap items-center justify-between gap-3 border-t border-border px-2 py-2 text-sm text-muted-foreground"
            : "flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-2 text-xs text-slate-500"
        }
      >
        <span>
          {totalRows} blueprint · Trang {clampedPage + 1}/{pageCount}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={clampedPage <= 0}
            onClick={() => setPageIndex(Math.max(0, clampedPage - 1))}
            className={cn(
              "h-7 shadow-none",
              appearance === "concur"
                ? "border-slate-300 bg-white text-foreground hover:bg-slate-50 hover:text-foreground dark:border-slate-600 dark:bg-slate-900"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
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
              "h-7 shadow-none",
              appearance === "concur"
                ? "border-slate-300 bg-white text-foreground hover:bg-slate-50 hover:text-foreground dark:border-slate-600 dark:bg-slate-900"
                : "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
            )}
          >
            Sau
          </Button>
        </div>
      </div>
    ) : null;

  const wrappedInner = wrapCls ? <div className={wrapCls}>{inner}</div> : inner;

  if (variant === "embedded")
    return (
      <div className="flex min-h-0 flex-col">
        {wrappedInner}
        {paginationFooter}
      </div>
    );

  return appearance === "concur" ? (
    <section className="table-container flex flex-col">{wrappedInner}{paginationFooter}</section>
  ) : (
    <section className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {wrappedInner}
      {paginationFooter}
    </section>
  );
}
