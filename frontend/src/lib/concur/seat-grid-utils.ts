export type SeatApiRecord = {
  seatNumber: string;
  type: string;
  status: string;
  rowNumber?: number | null;
  colNumber?: number | null;
  price?: number;
};

export type ParsedSeat = SeatApiRecord & {
  gridRow: number;
  gridCol: number;
};

export function parseSeatRecords(raw: SeatApiRecord[]): ParsedSeat[] {
  return raw.map((seat) => {
    let r = seat.rowNumber;
    let c = seat.colNumber;
    if (r == null) {
      const m = seat.seatNumber?.match(/^[A-Z]+/);
      r = m ? m[0].charCodeAt(0) - 65 : 0;
    }
    if (c == null) {
      const m = seat.seatNumber?.match(/\d+$/);
      c = m ? parseInt(m[0], 10) - 1 : 0;
    }
    return { ...seat, gridRow: r ?? 0, gridCol: c ?? 0 };
  });
}

export function gridDimensions(parsed: ParsedSeat[]): { rows: number; cols: number } {
  if (parsed.length === 0) return { rows: 0, cols: 0 };
  const rows = Math.max(...parsed.map((s) => s.gridRow || 0)) + 1;
  const cols = Math.max(...parsed.map((s) => s.gridCol || 0)) + 1;
  return { rows, cols };
}

export function getDynamicColor(typeStr: string): string {
  if (typeStr === "normal") return "#10b981";
  if (typeStr === "vip") return "#f43f5e";
  if (typeStr === "sweetbox") return "#8b5cf6";
  let hash = 0;
  for (let i = 0; i < typeStr.length; i++) hash = typeStr.charCodeAt(i) + ((hash << 5) - hash);
  return `hsl(${Math.abs(hash) % 360}, 70%, 45%)`;
}
