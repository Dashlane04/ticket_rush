import { TicketDetailClient } from "@/components/my-tickets/TicketDetailClient";

export default async function TicketDetailPage({ params }: { params: Promise<{ ticketId: string }> }) {
  const { ticketId } = await params;
  return <TicketDetailClient ticketId={ticketId} />;
}
