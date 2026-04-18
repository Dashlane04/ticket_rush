import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';

  // Dữ liệu Mock Sự kiện
  const events = [
    { id: '1', title: 'Đêm Nhạc Hội Indie Thu 2026 (Mock API)', date: '20 Thg 5, 2026', location: 'Sân vận động Mỹ Đình, Hà Nội', state: 'available', category: 'music', image: 'bg-emerald-900/20' },
    { id: '2', title: 'Rap Việt All-Star Concert', date: '01 Thg 6, 2026', location: 'SECC, TP.Hồ Chí Minh', state: 'locked', category: 'music', image: 'bg-amber-900/20' },
    { id: '3', title: 'Hài Kịch Cuối Tuần: Nụ Cười Mới', date: '28 Thg 5, 2026', location: 'Nhà hát lớn, Hà Nội', state: 'sold', category: 'theater', image: 'bg-slate-800' },
    { id: '4', title: 'Chung kết Bóng Rổ Cúp Quốc Gia', date: '15 Thg 6, 2026', location: 'Nhà thi đấu Nguyễn Du', state: 'available', category: 'sports', image: 'bg-rose-900/20' },
    { id: '5', title: 'Triển lãm Nghệ thuật Đương đại', date: '10 Thg 7, 2026', location: 'Bảo tàng Mỹ Thuật', state: 'available', category: 'art', image: 'bg-cyan-900/20' },
    { id: '6', title: 'Hội nghị Công nghệ V-Tech 2026', date: '05 Thg 8, 2026', location: 'Trung tâm Hội nghị Quốc gia', state: 'available', category: 'conference', image: 'bg-indigo-900/20' }
  ];

  let filtered = events;
  if (category !== 'all' && category !== 'Tất cả') {
     if (category === 'Âm nhạc') {
         filtered = events.filter(e => e.category === 'music');
     } else if (category === 'Thể thao') {
         filtered = events.filter(e => e.category === 'sports');
     } else if (category === 'Sân khấu & Nghệ thuật') {
         filtered = events.filter(e => e.category === 'theater' || e.category === 'art');
     } else if (category === 'Hội thảo / Talkshow') {
         filtered = events.filter(e => e.category === 'conference');
     } else {
         filtered = [];
     }
  }

  return NextResponse.json({ 
    success: true, 
    data: filtered, 
    pagination: { total: filtered.length, page: 1, limit: 10 } 
  });
}
