import { NextResponse } from 'next/server';
import { getEvents, addEvent, removeEvent } from '@/lib/eventsStore';

export async function GET() {
  const events = await getEvents();
  return NextResponse.json({ events });
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, dates, description } = body;
    const event = await addEvent({ name, dates, description });
    return NextResponse.json({ event }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to add event' }, { status: 400 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const removed = await removeEvent(id);
    return NextResponse.json({ removed });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to remove event' }, { status: 400 });
  }
}
