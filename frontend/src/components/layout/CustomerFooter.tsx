import Link from 'next/link';

export default function CustomerFooter() {
  return (
    <footer className="w-full bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 pt-16 pb-8 mt-20">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="text-2xl font-black tracking-tight text-slate-900 dark:text-white mb-4">
              Ticket<span className="text-rose-600">Rush</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed">
              Nền tảng phân phối vé điện tử hàng đầu, thiết kế chuyên biệt cho hệ thống sự kiện chịu tải cao và flash sale.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Khám phá</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/" className="hover:text-rose-600 transition-colors">Sự kiện nổi bật</Link></li>
              <li><Link href="/events/4" className="hover:text-rose-600 transition-colors">Sơ đồ ghế (theo sự kiện)</Link></li>
              <li><Link href="/events" className="hover:text-rose-600 transition-colors">Hướng dẫn mua vé</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-4">Chính sách</h4>
            <ul className="space-y-3 text-sm text-slate-500 dark:text-slate-400">
              <li><Link href="/events" className="hover:text-rose-600 transition-colors">Điều khoản dịch vụ</Link></li>
              <li><Link href="/login" className="hover:text-rose-600 transition-colors">Chính sách bảo mật</Link></li>
              <li><Link href="/my-tickets" className="hover:text-rose-600 transition-colors">Quy định hoàn vé</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} TicketRush. Bản quyền thuộc về INT3306.
          </p>
          <div className="flex gap-4">
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
            <div className="w-10 h-6 bg-slate-200 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      </div>
    </footer>
  );
}
