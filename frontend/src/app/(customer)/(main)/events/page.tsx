import EventFilter from '@/components/home/EventFilter';
import FeaturedEvents from '@/components/home/FeaturedEvents';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api/v1';

async function getEvents(category: string) {
  try {
    const query = new URLSearchParams({ category }).toString();
    const res = await fetch(`${API_BASE_URL}/events?${query}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || [];
  } catch (error) {
    console.error('Lỗi khi gọi API Sự kiện:', error);
    return [];
  }
}

export default async function EventsListPage(props: { searchParams?: Promise<{ category?: string }> }) {
  const searchParams = await props.searchParams;
  const currentCategory = searchParams?.category || 'Tất cả';
  const eventsData = await getEvents(currentCategory);

  return (
    <div className="container mx-auto px-4 md:px-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Tất cả sự kiện</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm md:text-base">
          Lọc theo danh mục và chọn vé phù hợp với bạn.
        </p>
      </div>

      <EventFilter basePath="/events" />

      <FeaturedEvents events={eventsData} sectionTitle="Danh sách sự kiện" showViewAllLink={false} />
    </div>
  );
}
