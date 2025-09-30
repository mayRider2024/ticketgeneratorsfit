import { NextResponse } from 'next/server';
import { getTicket, markEntry } from '@/lib/ticketsStore';

export async function POST(req) {
  try {
    const body = await req.json();
    const payload = body.ticket || body;
    if (!payload || typeof payload !== 'object') return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    const { eventId, ticketId, v } = payload;
    if (v !== 1) return NextResponse.json({ error: 'Unsupported ticket version' }, { status: 400 });
    if (!eventId || !ticketId) return NextResponse.json({ error: 'eventId & ticketId required' }, { status: 400 });

    const ticket = await getTicket(eventId, ticketId);
    if (!ticket) {
      return NextResponse.json({ ok: false, status: 'not_found', error: 'Ticket not issued / unknown' }, { status: 404 });
    }
    if (!ticket.hasEntered) {
      await markEntry(eventId, ticketId);
      const updated = await getTicket(eventId, ticketId);
      return NextResponse.json({ ok: true, status: 'first_entry', ticket: updated });
    }
    // already entered
    return NextResponse.json({ ok: true, status: 'already_entered', ticket });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
