import { getEvents } from '@/lib/eventsStore';
import TemplateDesigner from '@/components/TemplateDesigner';

export default async function DesignPage({ params }) {
  const { id } = await params; // await params for Next.js 15
  const events = await getEvents();
  const event = events.find(e => e.id === id);
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-xl font-semibold">Event Not Found</h1>
        <a href={`/dashboard/event/${id}`} className="text-sm text-blue-400 underline">Back</a>
      </div>
    );
  }
  return (
    <div className="min-h-screen max-w-4xl mx-auto px-6 py-10 flex flex-col gap-8">
      <h1 className="text-2xl font-semibold">Design Ticket - {event.name}</h1>
      <TemplateDesigner event={event} />
    </div>
  );
}
