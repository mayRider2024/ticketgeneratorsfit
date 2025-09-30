import { getEvents } from '@/lib/eventsStore';
import EventActions from '@/components/EventActions';

export default async function EventDetailPage({ params }) {
  // In Next.js 15 params is now async; await before destructuring
  const { id } = await params;
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
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-10 flex flex-col gap-10">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{event.name}</h1>
          <p className="text-sm text-gray-400 mt-1">Created {new Date(event.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <section className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-medium">Dates</h2>
          <ul className="mt-2 list-disc list-inside text-sm text-gray-300">
            {event.dates.map(d => <li key={d}>{d}</li>)}
          </ul>
        </div>
        {event.description && (
          <div>
            <h2 className="text-lg font-medium">Description</h2>
            <p className="mt-1 text-sm text-gray-300 whitespace-pre-line">{event.description}</p>
          </div>
        )}
      </section>

      <EventActions event={event} />
    </div>
  );
}
