import { NextRequest, NextResponse } from 'next/server';
import { sendTicketEmail } from '@/lib/email-service';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const recipientEmail = formData.get('email');
    const recipientName = formData.get('name');
    const eventName = formData.get('eventName');
    const ticketImage = formData.get('ticketImage');

    if (!recipientEmail || !recipientName || !eventName || !ticketImage) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert the image file to buffer
    const ticketImageBuffer = Buffer.from(await ticketImage.arrayBuffer());

    const result = await sendTicketEmail(
      recipientEmail,
      recipientName,
      eventName,
      ticketImageBuffer
    );

    if (result.success) {
      return NextResponse.json({ message: 'Ticket sent successfully!' });
    } else {
      return NextResponse.json(
        { error: 'Failed to send ticket email' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in send-ticket API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}