import { NextResponse } from 'next/server';

export async function GET() {
  // Lấy thời gian hiện tại cộng thêm 3 ngày 14 giờ làm dữ liệu mock cho đếm ngược
  const saleStartTime = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString();

  // Mock data Hero Banner
  const featuredEvents = [
    {
      id: '1',
      title: 'The Eras Tour',
      subtitle: 'Live in Asia (Mock API)',
      description: 'Trải nghiệm đêm nhạc hoành tráng nhất năm nay. Sẵn sàng tham gia vào hàng chờ ảo để giành lấy những vị trí đẹp nhất!',
      saleStartTime,
      bannerUrl: 'bg-gradient-to-r from-slate-800 via-rose-950 to-slate-950',
      status: 'upcoming' // available, upcoming
    }
  ];

  return NextResponse.json({ success: true, data: featuredEvents });
}
