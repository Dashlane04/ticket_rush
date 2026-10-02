/** Đồng bộ với EventFilter + giá trị lưu DB cho showtime.category */
export const EVENT_FILTER_CATEGORIES = [
  "Tất cả",
  "Phim chiếu rạp",
  "Âm nhạc",
  "Thể thao",
  "Sân khấu & Nghệ thuật",
  "Hội thảo / Talkshow",
  "Khác",
] as const;

export const EVENT_ASSIGNABLE_CATEGORIES = EVENT_FILTER_CATEGORIES.filter((c) => c !== "Tất cả");
