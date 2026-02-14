import { NextResponse } from 'next/server';
import { deleteAllTickets } from '@/lib/ticketsStore';

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ 
        error: 'Missing eventId' 
      }, { status: 400 });
    }

    const deletedCount = await deleteAllTickets(eventId);
    
    return NextResponse.json({ 
      success: true, 
      message: `${deletedCount} ticket(s) deleted successfully`,
      deletedCount
    });

  } catch (error) {
    console.error('Error deleting all tickets:', error);
    return NextResponse.json({ 
      error: 'Failed to delete tickets',
      details: error.message 
    }, { status: 500 });
  }
}
