export type MockEventRecord = {
  id: string;
  title: string;
  date: string;
  location: string;
  state: 'available' | 'locked' | 'sold';
  category: string;
  image: string;
  description: string;
  priceFrom: string;
};

export const MOCK_EVENTS: MockEventRecord[] = [
  {
    id: '1',
    title: 'Đêm Nhạc Hội Indie Thu 2026 (Mock API)',
    date: '20 Thg 5, 2026',
    location: 'Sân vận động Mỹ Đình, Hà Nội',
    state: 'available',
    category: 'music',
    image: 'bg-emerald-900/20',
    description:
      'Đêm diễn indie với line-up nghệ sĩ trong nước. Sân khấu 360°, âm thanh chuẩn concert và khu ẩm thực kèm theo.',
    priceFrom: '450.000 ₫',
  },
  {
    id: '2',
    title: 'Rap Việt All-Star Concert',
    date: '01 Thg 6, 2026',
    location: 'SECC, TP.Hồ Chí Minh',
    state: 'locked',
    category: 'music',
    image: 'bg-amber-900/20',
    description: 'Đêm nhạc rap quy tụ các chiến binh Rap Việt. Mở bán vé theo đợt — theo dõi thông báo mở bán.',
    priceFrom: '890.000 ₫',
  },
  {
    id: '3',
    title: 'Hài Kịch Cuối Tuần: Nụ Cười Mới',
    date: '28 Thg 5, 2026',
    location: 'Nhà hát lớn, Hà Nội',
    state: 'sold',
    category: 'theater',
    image: 'bg-slate-800',
    description: 'Vở hài kịch mới nhất của đoàn. Hiện đã hết vé — bạn vẫn có thể xem thông tin sự kiện.',
    priceFrom: '350.000 ₫',
  },
  {
    id: '4',
    title: 'Chung kết Bóng Rổ Cúp Quốc Gia',
    date: '15 Thg 6, 2026',
    location: 'Nhà thi đấu Nguyễn Du',
    state: 'available',
    category: 'sports',
    image: 'bg-rose-900/20',
    description: 'Trận chung kết đỉnh cao giữa hai đội mạnh nhất mùa giải. Ghế được phân theo khán đài.',
    priceFrom: '200.000 ₫',
  },
  {
    id: '5',
    title: 'Triển lãm Nghệ thuật Đương đại',
    date: '10 Thg 7, 2026',
    location: 'Bảo tàng Mỹ Thuật',
    state: 'available',
    category: 'art',
    image: 'bg-cyan-900/20',
    description: 'Hơn 40 tác phẩm từ nghệ sĩ Việt và quốc tế. Vé vào cửa theo ngày.',
    priceFrom: '120.000 ₫',
  },
  {
    id: '6',
    title: 'Hội nghị Công nghệ V-Tech 2026',
    date: '05 Thg 8, 2026',
    location: 'Trung tâm Hội nghị Quốc gia',
    state: 'available',
    category: 'conference',
    image: 'bg-indigo-900/20',
    description: 'Sự kiện B2B/B2C về AI và cloud. Pass tham dự theo track.',
    priceFrom: '1.500.000 ₫',
  },
];

export function filterMockEventsByCategory(categoryParam: string): MockEventRecord[] {
  if (categoryParam === 'all' || categoryParam === 'Tất cả') {
    return MOCK_EVENTS;
  }
  if (categoryParam === 'Âm nhạc') {
    return MOCK_EVENTS.filter((e) => e.category === 'music');
  }
  if (categoryParam === 'Thể thao') {
    return MOCK_EVENTS.filter((e) => e.category === 'sports');
  }
  if (categoryParam === 'Sân khấu & Nghệ thuật') {
    return MOCK_EVENTS.filter((e) => e.category === 'theater' || e.category === 'art');
  }
  if (categoryParam === 'Hội thảo / Talkshow') {
    return MOCK_EVENTS.filter((e) => e.category === 'conference');
  }
  return [];
}

export function getMockEventById(id: string): MockEventRecord | undefined {
  return MOCK_EVENTS.find((e) => e.id === id);
}
