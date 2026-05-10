import { DollarSign, Ticket, Calendar, Users, TrendingUp } from "lucide-react";

export default function AdminDashboardPage() {
  const stats = [
    { title: "Tổng Doanh Thu", value: "245.500.000 ₫", icon: DollarSign, trend: "+12.5%", color: "text-emerald-600", bg: "bg-emerald-100" },
    { title: "Vé Đã Bán", value: "1,234", icon: Ticket, trend: "+8.2%", color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Sự Kiện Đang Chạy", value: "3", icon: Calendar, trend: "0%", color: "text-rose-600", bg: "bg-rose-100" },
    { title: "Khán Giả Mới", value: "856", icon: Users, trend: "+24.1%", color: "text-purple-600", bg: "bg-purple-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="flex items-center space-x-1 text-sm font-medium text-emerald-600">
                <TrendingUp className="h-4 w-4" />
                <span>{stat.trend}</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.title}</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* Charts / Data Tables Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart Placeholder */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900">Biểu Đồ Doanh Thu</h3>
            <select className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-rose-500 focus:border-rose-500 block p-2">
              <option>7 ngày qua</option>
              <option>30 ngày qua</option>
              <option>Năm nay</option>
            </select>
          </div>
          <div className="h-72 w-full bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center flex-col text-slate-400">
             <BarChart3 className="h-12 w-12 mb-2 opacity-50" />
             <p className="text-sm">Khu vực hiển thị biểu đồ (Chart.js / Recharts)</p>
          </div>
        </div>

        {/* Recent Sales Placeholder */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Giao Dịch Gần Đây</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
                    <User className="h-5 w-5 text-slate-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Người dùng {i}</p>
                    <p className="text-xs text-slate-500">Vé VIP - Đêm nhạc mùa hè</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-900">1.500.000 ₫</p>
                  <p className="text-xs text-emerald-600 font-medium">Thành công</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
// For icon mock
const User = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
);
const BarChart3 = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
);
