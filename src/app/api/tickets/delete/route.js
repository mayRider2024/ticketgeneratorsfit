import { NextResponse } from 'next/server';
import { deleteTicket } from '@/lib/ticketsStore';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const ticketId = searchParams.get('ticketId');

    if (!eventId || !ticketId) {
      return NextResponse.json({ 
        error: 'Missing eventId or ticketId' 
      }, { status: 400 });
    }

    const success = await deleteTicket(eventId, ticketId);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Ticket deleted successfully' 
      });
    } else {
      return NextResponse.json({ 
        error: 'Ticket not found or could not be deleted' 
      }, { status: 404 });
    }

  } catch (error) {
    console.error('Error deleting ticket:', error);
    return NextResponse.json({ 
      error: 'Failed to delete ticket',
      details: error.message 
    }, { status: 500 });
  }
}