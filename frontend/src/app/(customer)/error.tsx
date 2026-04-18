'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log lỗi ra hệ thống monitoring (VD: Sentry) trong thực tế
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <h2 className="text-2xl font-bold text-rose-600 mb-2">Đã xảy ra lỗi!</h2>
      <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md">
        Không thể tải giao diện trang chủ ở thời điểm hiện tại. Vui lòng thử lại sau giây lát.
      </p>
      <button
        onClick={() => reset()}
        className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white font-medium rounded-md transition-colors"
      >
        Thử lại ngay (Refresh)
      </button>
    </div>
  );
}
