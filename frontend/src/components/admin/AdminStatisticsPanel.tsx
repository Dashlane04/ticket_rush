"use client";

import { useEffect, useState } from "react";
import { nestFetch } from "@/lib/nest-api";
import { formatVND } from "@/lib/format-currency";
import { DollarSign, TrendingUp, Ticket, Users, BarChart3, PieChart } from "lucide-react";

/* ---------- types ---------- */
type Overview = {
  totalTickets: number;
  totalRevenue: number;
  avgTicketPrice: number;
  uniqueBuyers: number;
};
type DailyRow = { date: string; tickets: number; revenue: number };
type MonthlyRow = { month: string; tickets: number; revenue: number };
type CatRow = { name: string; revenue: number; count: number };
type TopEvent = { title: string; category: string; ticketsSold: number; revenue: number };
type UserStats = {
  gender: { name: string; count: number }[];
  age: { name: string; count: number }[];
  genres: { name: string; count: number }[];
};
type PurchaseStats = {
  dailyRevenue: DailyRow[];
  monthlyRevenue: MonthlyRow[];
  revenueByCategory: CatRow[];
  topEvents: TopEvent[];
  overview: Overview;
};
type PromoRow = { id: string; code: string; discountPercent: number; currentUses: number; maxUses: number | null; isActive: boolean };

/* ---------- colors ---------- */
const PIE_COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444", "#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6"];

/* ---------- helpers ---------- */

/* ========== SVG Mini-Chart Components ========== */

function LineChart({ data, xKey, yKeys, colors, height = 180 }: {
  data: any[]; xKey: string; yKeys: string[]; colors: string[]; height?: number;
}) {
  if (!data.length) return <EmptyState msg="Chưa có dữ liệu" />;
  const W = 520, H = height, pL = 50, pR = 16, pT = 16, pB = 36;
  const plotW = W - pL - pR, plotH = H - pT - pB;

  const maxes = yKeys.map(k => Math.max(...data.map(d => d[k] ?? 0), 1));
  const stepX = data.length > 1 ? plotW / (data.length - 1) : plotW;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" preserveAspectRatio="xMidYMid meet">
      {/* Grid */}
      {[0, .25, .5, .75, 1].map(f => (
        <line key={f} x1={pL} y1={pT + plotH * (1 - f)} x2={W - pR} y2={pT + plotH * (1 - f)} stroke="currentColor" className="text-slate-700/30" strokeWidth={.5} />
      ))}
      {/* Y labels (first series) */}
      {[0, .5, 1].map(f => (
        <text key={f} x={pL - 6} y={pT + plotH * (1 - f) + 3} textAnchor="end" className="fill-slate-500" fontSize={9}>
          {Math.round(maxes[0] * f)}
        </text>
      ))}
      {yKeys.map((yk, ki) => {
        const mx = maxes[ki];
        const pts = data.map((d, i) => {
          const x = pL + i * stepX;
          const y = pT + plotH - ((d[yk] ?? 0) / mx) * plotH;
          return { x, y };
        });
        const polyline = pts.map(p => `${p.x},${p.y}`).join(" ");
        const area = `${pL},${pT + plotH} ${polyline} ${pts[pts.length - 1].x},${pT + plotH}`;
        return (
          <g key={yk}>
            {ki === 0 && <polygon points={area} fill={colors[ki]} opacity={.12} />}
            <polyline points={polyline} fill="none" stroke={colors[ki]} strokeWidth={ki === 0 ? 2.5 : 1.8}
              strokeLinecap="round" strokeLinejoin="round" strokeDasharray={ki > 0 ? "6 3" : undefined} />
            {pts.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill={colors[ki]} stroke="#0f172a" strokeWidth={1.5} />)}
          </g>
        );
      })}
      {/* X labels */}
      {data.map((d, i) => {
        const label = typeof d[xKey] === "string" && d[xKey].length > 7
          ? d[xKey].slice(5) : d[xKey];
        return (
          <text key={i} x={pL + i * stepX} y={H - 8} textAnchor="middle" className="fill-slate-500" fontSize={8.5}>
            {label}
          </text>
        );
      })}
    </svg>
  );
}

function DonutChart({ data, colorKey }: { data: { name: string; value: number }[]; colorKey?: string[] }) {
  if (!data.length || data.every(d => d.value === 0)) return <EmptyState msg="Chưa có dữ liệu" />;
  const total = data.reduce((s, d) => s + d.value, 0);
  const colors = colorKey ?? PIE_COLORS;
  const R = 70, r = 44, cx = 100, cy = 100;
  let cumAngle = -Math.PI / 2;

  const arcs = data.map((d, i) => {
    const angle = (d.value / total) * 2 * Math.PI;
    const start = cumAngle;
    cumAngle += angle;
    const end = cumAngle;
    const largeArc = angle > Math.PI ? 1 : 0;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
    const ix1 = cx + r * Math.cos(start), iy1 = cy + r * Math.sin(start);
    const ix2 = cx + r * Math.cos(end), iy2 = cy + r * Math.sin(end);
    const path = `M${x1},${y1} A${R},${R} 0 ${largeArc} 1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${largeArc} 0 ${ix1},${iy1} Z`;
    return <path key={i} d={path} fill={colors[i % colors.length]} className="transition-opacity hover:opacity-80" />;
  });

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 200 200" className="w-[160px] h-[160px] shrink-0">
        {arcs}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-white" fontSize={20} fontWeight={700}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400" fontSize={10}>tổng</text>
      </svg>
      <div className="flex flex-col gap-1.5 text-sm min-w-0">
        {data.map((d, i) => (
          <div key={d.name} className="flex items-center gap-2 truncate">
            <span className="inline-block h-2.5 w-2.5 rounded-full shrink-0" style={{ background: colors[i % colors.length] }} />
            <span className="truncate text-slate-300">{d.name}</span>
            <span className="ml-auto font-semibold text-slate-100 tabular-nums">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div className="flex items-center justify-center h-32 text-slate-500 text-sm border border-dashed border-slate-700 rounded-lg">
      {msg}
    </div>
  );
}

/* ========== KPI Card ========== */
function KpiCard({ icon: Icon, label, value, sub, color }: {
  icon: any; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 shadow-sm backdrop-blur-sm">
      <div className="flex items-center gap-2 text-slate-400 mb-3 text-sm">
        <Icon className="h-4 w-4" style={{ color }} />
        <span>{label}</span>
      </div>
      <div className="text-3xl font-bold text-white tracking-tight">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

/* ========== Main Component ========== */
export default function AdminStatisticsPanel() {
  const [purchase, setPurchase] = useState<PurchaseStats | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [promos, setPromos] = useState<PromoRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [pRes, uRes, promoRes] = await Promise.all([
          nestFetch("admin/purchase-stats"),
          nestFetch("admin/users/stats"),
          nestFetch("admin/promo-codes"),
        ]);
        if (pRes.ok) setPurchase(await pRes.json());
        if (uRes.ok) setUserStats(await uRes.json());
        if (promoRes.ok) setPromos(await promoRes.json());
      } catch { /* ignore */ }
      finally { setLoading(false); }
    }
    void load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-indigo-500" />
          <span className="text-sm text-slate-400">Đang tải thống kê...</span>
        </div>
      </div>
    );
  }

  const ov = purchase?.overview ?? { totalTickets: 0, totalRevenue: 0, avgTicketPrice: 0, uniqueBuyers: 0 };

  return (
    <div className="space-y-8 pb-12">
      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Ticket} label="Tổng vé bán ra" value={ov.totalTickets.toLocaleString()} color="#6366f1" />
        <KpiCard icon={DollarSign} label="Tổng doanh thu" value={formatVND(ov.totalRevenue)} color="#10b981" />
        <KpiCard icon={TrendingUp} label="Giá vé trung bình" value={formatVND(ov.avgTicketPrice)} color="#f59e0b" />
        <KpiCard icon={Users} label="Người mua riêng biệt" value={ov.uniqueBuyers.toLocaleString()} color="#3b82f6" />
      </div>

      {/* Revenue Timeline */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-indigo-400" />
            Doanh thu & Lượng vé (30 ngày gần nhất)
          </h3>
          <LineChart
            data={purchase?.dailyRevenue ?? []}
            xKey="date"
            yKeys={["tickets", "revenue"]}
            colors={["#6366f1", "#10b981"]}
          />
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 rounded bg-indigo-500" /> Số vé</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 rounded bg-emerald-500" style={{ borderTop: "1.5px dashed #10b981", height: 0 }} /> Doanh thu (₫)</span>
          </div>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-amber-400" />
            Xu hướng theo tháng (6 tháng)
          </h3>
          <LineChart
            data={purchase?.monthlyRevenue ?? []}
            xKey="month"
            yKeys={["tickets", "revenue"]}
            colors={["#f59e0b", "#3b82f6"]}
          />
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 rounded bg-amber-500" /> Số vé</span>
            <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-0.5 rounded bg-blue-500" style={{ borderTop: "1.5px dashed #3b82f6", height: 0 }} /> Doanh thu (₫)</span>
          </div>
        </div>
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-indigo-400" />
            Doanh thu theo thể loại
          </h3>
          <DonutChart data={(purchase?.revenueByCategory ?? []).map(c => ({ name: c.name, value: Math.round(c.revenue) }))} />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-pink-400" />
            Phân bố giới tính
          </h3>
          <DonutChart data={(userStats?.gender ?? []).map(g => ({ name: g.name === "MALE" ? "Nam" : g.name === "FEMALE" ? "Nữ" : g.name === "OTHER" ? "Khác" : "Chưa rõ", value: g.count }))}
            colorKey={["#6366f1", "#ec4899", "#8b5cf6", "#475569"]} />
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <PieChart className="h-4 w-4 text-emerald-400" />
            Phân bố độ tuổi
          </h3>
          <DonutChart data={(userStats?.age ?? []).filter(a => a.count > 0).map(a => ({ name: a.name, value: a.count }))}
            colorKey={["#14b8a6", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#475569"]} />
        </div>
      </div>

      {/* Top Events Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
        <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-amber-400" />
          Top sự kiện theo doanh thu
        </h3>
        {purchase?.topEvents && purchase.topEvents.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-400 text-left border-b border-slate-800">
                  <th className="pb-3 pr-4 font-medium">#</th>
                  <th className="pb-3 pr-4 font-medium">Sự kiện</th>
                  <th className="pb-3 pr-4 font-medium">Thể loại</th>
                  <th className="pb-3 pr-4 font-medium text-right">Vé bán</th>
                  <th className="pb-3 font-medium text-right">Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {purchase.topEvents.map((ev, i) => {
                  const maxRev = purchase.topEvents[0].revenue || 1;
                  const pct = Math.round((ev.revenue / maxRev) * 100);
                  return (
                    <tr key={i} className="border-b border-slate-800/50 last:border-0">
                      <td className="py-3 pr-4 text-slate-500 font-bold">{i + 1}</td>
                      <td className="py-3 pr-4">
                        <div className="text-white font-medium truncate max-w-[260px]">{ev.title}</div>
                        <div className="mt-1 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-xs rounded-full">{ev.category}</span>
                      </td>
                      <td className="py-3 pr-4 text-right text-slate-300 font-semibold tabular-nums">{ev.ticketsSold}</td>
                      <td className="py-3 text-right text-emerald-400 font-bold tabular-nums">{formatVND(ev.revenue)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState msg="Chưa có dữ liệu bán vé" />
        )}
      </div>

      {/* Genre Popularity Bar Chart */}
      {userStats?.genres && userStats.genres.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-rose-400" />
            Thể loại phổ biến (theo lượng vé)
          </h3>
          <div className="space-y-3">
            {userStats.genres.map((g, i) => {
              const max = userStats.genres[0].count || 1;
              const pct = Math.max(2, Math.round((g.count / max) * 100));
              return (
                <div key={g.name} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 w-28 truncate shrink-0">{g.name}</span>
                  <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all flex items-center px-2"
                      style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}>
                      <span className="text-[10px] font-bold text-white">{g.count}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Promo Code Usage Chart */}
      {promos.filter(p => p.currentUses > 0).length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 shadow-sm">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-rose-400" />
            Top Promo Codes by Usage
          </h3>
          <div className="space-y-3">
            {[...promos]
              .filter(p => p.currentUses > 0)
              .sort((a, b) => b.currentUses - a.currentUses)
              .slice(0, 8)
              .map((p) => {
                const maxUses = promos.filter(x => x.currentUses > 0).reduce((m, x) => Math.max(m, x.currentUses), 1);
                const pct = Math.max(4, Math.round((p.currentUses / maxUses) * 100));
                return (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="font-mono text-sm font-bold text-rose-400 w-28 truncate shrink-0" title={p.code}>{p.code}</span>
                    <div className="flex-1 h-5 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full flex items-center px-2 transition-all"
                        style={{ width: `${pct}%`, background: p.isActive ? "#e11d48" : "#475569" }}
                      >
                        <span className="text-[10px] font-bold text-white">{p.currentUses}</span>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400 w-16 text-right shrink-0">
                      {p.discountPercent}% off · {p.maxUses ? `${p.currentUses}/${p.maxUses}` : `∞`}
                    </span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
