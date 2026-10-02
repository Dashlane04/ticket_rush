import { TicketDetailClient } from "@/components/my-tickets/TicketDetailClient";

import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ ticketId: string }> }): Promise<Metadata> {
  const { ticketId } = await params;
  return { title: `Vé ${ticketId.split('-')[0].toUpperCase()}` };
}

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <TicketDetailClient ticketId={ticketId} />;
}
