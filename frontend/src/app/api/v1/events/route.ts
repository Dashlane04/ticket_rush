import { NextResponse } from 'next/server';
import { filterMockEventsByCategory } from '@/lib/mock-events';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category') || 'all';
  const filtered = filterMockEventsByCategory(category);

  return NextResponse.json({
    success: true,
    data: filtered,
    pagination: { total: filtered.length, page: 1, limit: 10 },
  });
}
