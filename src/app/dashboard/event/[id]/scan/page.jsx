// Corrected path aliases: jsconfig.json defines "@/*" -> "./src/*" so we should not include an extra /src segment.
import { getEvents } from '@/lib/eventsStore';
import QrScanner from '@/components/QrScanner';

export default async function ScanPage({ params }) {
  const events = await getEvents();
  const event = events.find(e => e.id === params.id);
  if (!event) return <div className="p-6">Event not found</div>;
  return (
    <div className="p-6 flex flex-col gap-6">
      <h1 className="text-xl font-semibold">Scan Tickets - {event.name}</h1>
      <QrScanner eventId={event.id} />
      <a href={`/dashboard/event/${event.id}`} className="text-sm text-indigo-400 hover:underline">Back to Event</a>
    </div>
  );
}
