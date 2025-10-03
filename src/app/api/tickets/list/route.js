import { NextResponse } from 'next/server';
import { listTicketsByEvent } from '@/lib/ticketsStore';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const eventId = url.searchParams.get('eventId');
    
    if (!eventId) {
      return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    }

    const tickets = await listTicketsByEvent(eventId);
    
    return NextResponse.json({ 
      success: true, 
      tickets,
      total: tickets.length 
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch tickets' 
    }, { status: 500 });
  }
}