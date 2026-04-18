'use client';
import { useRouter, useSearchParams } from 'next/navigation';

const CATEGORIES = ['Tất cả', 'Âm nhạc', 'Thể thao', 'Sân khấu & Nghệ thuật', 'Hội thảo / Talkshow'];

export default function EventFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || 'Tất cả';

  const handleSelect = (category: string) => {
    // Đẩy Query Params lên URL, Next.js sẽ kích hoạt Server fetch logic một cách tối ưu
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', category);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mb-10 overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-3 min-w-max">
         {CATEGORIES.map(category => (
           <button
             key={category}
             onClick={() => handleSelect(category)}
             className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
               activeCategory === category 
                 ? 'bg-rose-600 text-white shadow-md shadow-rose-500/20' 
                 : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600'
             }`}
           >
             {category}
           </button>
         ))}
      </div>
    </div>
  );
}
