import Link from 'next/link';
import HeroBanner from '@/components/home/HeroBanner';
import FeaturedEvents from '@/components/home/FeaturedEvents';
import EventFilter from '@/components/home/EventFilter';
import { customerBffBaseUrl } from '@/lib/customer-bff-url';

async function getFeaturedEvents() {
  try {
    const res = await fetch(`${customerBffBaseUrl()}/events/featured`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Lỗi khi gọi API Banner:", error);
    return [];
  }
}

async function getEvents(category: string) {
  try {
    const query = new URLSearchParams({ category }).toString();
    const res = await fetch(`${customerBffBaseUrl()}/events?${query}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error("Lỗi khi gọi API Sự kiện:", error);
    return [];
  }
}

export default async function HomePage(props: { searchParams?: Promise<{ category?: string }> }) {
  // Lấy params từ URL để phục vụ query lọc (App Router)
  const searchParams = await props.searchParams;
  const currentCategory = searchParams?.category || 'Tất cả';

  // Chuyển Data sang Parallel Fetching
  const [featuredData, eventsData] = await Promise.all([
    getFeaturedEvents(),
    getEvents(currentCategory)
  ]);

  const heroEvent = featuredData.length > 0 ? featuredData[0] : null;

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-7xl">
      <HeroBanner featuredEvent={heroEvent} />
      
      {/* Bộ lọc Data động thay đổi URL searchParams */}
      <EventFilter />

      <FeaturedEvents events={eventsData} />
      
      <div className="flex justify-center mt-8">
         <Link
           href="/events"
           className="inline-flex px-6 py-2.5 rounded-full border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-rose-600 hover:border-rose-400 font-medium transition-colors cursor-pointer bg-white dark:bg-slate-900 shadow-sm"
         >
            Tải thêm sự kiện
         </Link>
      </div>
    </div>
  );
}
