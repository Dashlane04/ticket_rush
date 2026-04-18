export default function Loading() {
  // UI Loading đơn giản để hiển thị ngay khi chuyển trang
  return (
    <div className="flex h-[50vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-300 border-t-rose-600"></div>
        <p className="text-sm text-slate-500 font-medium">Đang tải dữ liệu...</p>
      </div>
    </div>
  );
}
