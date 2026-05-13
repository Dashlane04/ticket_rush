"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { EVENT_FILTER_CATEGORIES } from "@/lib/event-categories";
import { cn } from "@/lib/utils";

type EventFilterProps = {
  basePath?: string;
};

export default function EventFilter({ basePath = "/" }: EventFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category") || "Tất cả";

  const handleSelect = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", category);
    const path = basePath.endsWith("/") && basePath !== "/" ? basePath.slice(0, -1) : basePath;
    router.push(`${path === "/" ? "/" : path}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mb-10 overflow-x-auto pb-4 scrollbar-hide">
      <div className="flex gap-3 min-w-max">
        {EVENT_FILTER_CATEGORIES.map((category) => (
          <Button
            key={category}
            type="button"
            variant={activeCategory === category ? "default" : "outline"}
            onClick={() => handleSelect(category)}
            className={cn(
              "px-5 py-2.5 h-auto rounded-full text-sm font-medium transition-all duration-200 cursor-pointer",
              activeCategory === category
                ? "bg-rose-600 hover:bg-rose-600 text-white shadow-md shadow-rose-500/20 border-transparent"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-500 hover:text-rose-600",
            )}
          >
            {category}
          </Button>
        ))}
      </div>
    </div>
  );
}
