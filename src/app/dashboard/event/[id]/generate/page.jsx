import { getEvents } from '@/lib/eventsStore';
import TicketGenerator from '@/components/TicketGenerator';

export default async function GenerateTicketPage({ params }) {
  const { id } = await params; // await params per Next.js 15 dynamic route requirements
  const events = await getEvents();
  const event = events.find(e => e.id === id);
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col gap-6 items-center justify-center">
        <h1 className="text-2xl font-semibold">Event Not Found</h1>
        <a href="/dashboard" className="text-sm text-blue-400 underline">Back to Dashboard</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Generate Ticket - {event.name}</h1>
      <TicketGenerator event={event} />
    </div>
  );
}
