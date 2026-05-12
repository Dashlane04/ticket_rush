import { NextResponse } from 'next/server';
import { getMockEventById } from '@/lib/mock-events';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = getMockEventById(id);
  if (!event) {
    return NextResponse.json({ success: false, error: 'Không tìm thấy sự kiện' }, { status: 404 });
  }
  return NextResponse.json({ success: true, data: event });
}
