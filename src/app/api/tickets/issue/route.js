import { NextResponse } from 'next/server';
import { issueTicket } from '@/lib/ticketsStore';

export async function POST(req) {
  try {
    const body = await req.json();
    const { eventId, ticketId, name, date, other, email } = body || {};
    if (!eventId || !ticketId || !name) {
      return NextResponse.json({ error: 'eventId, ticketId, name required' }, { status: 400 });
    }
    const result = await issueTicket({ eventId, ticketId, name, date, other, email });
    return NextResponse.json({ ok: true, created: result.created, ticket: result.ticket });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
