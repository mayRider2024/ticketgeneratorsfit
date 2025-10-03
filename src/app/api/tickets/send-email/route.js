import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { getTicket } from "@/lib/ticketsStore";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const body = await request.json();
    const { ticketId, recipientEmail, recipientName, eventId, imageDataUrl } = body;

    if (!ticketId || !recipientEmail || !eventId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ticket = await getTicket(eventId, ticketId);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    const transporter = nodemailer.createTransporter({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    await transporter.verify();

    const attachments = [];
    if (imageDataUrl) {
      const base64 = imageDataUrl.split(",")[1];
      attachments.push({
        filename: `ticket_${ticketId}.png`,
        content: Buffer.from(base64, "base64"),
        contentType: "image/png"
      });
    }

    const eventName = ticket.eventName || "Event";
    const recipientDisplayName = recipientName || ticket.name;
    
    const textContent = `Hi ${recipientDisplayName},

Your ticket for ${eventName} is ready!

Event: ${eventName}
Name: ${ticket.name}
Ticket ID: ${ticketId}

Please show the attached QR code at the event entrance.
Thank you!`;

    const htmlContent = `<div>
      <h2>Your Event Ticket</h2>
      <p>Hi ${recipientDisplayName},</p>
      <div style="background-color: #f5f5f5; padding: 20px;">
        <h3>Event Details</h3>
        <p><strong>Event:</strong> ${eventName}</p>
        <p><strong>Attendee:</strong> ${ticket.name}</p>
        <p><strong>Ticket ID:</strong> ${ticketId}</p>
      </div>
      <p>Please show the attached QR code at the event entrance.</p>
    </div>`;

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: recipientEmail,
      subject: `Your Ticket - ${eventName}`,
      text: textContent,
      html: htmlContent,
      attachments: attachments
    };

    const info = await transporter.sendMail(mailOptions);
    
    return NextResponse.json({ 
      success: true, 
      message: "Ticket sent successfully",
      messageId: info.messageId
    });

  } catch (error) {
    console.error("Error sending ticket email:", error);
    return NextResponse.json({ 
      error: "Failed to send email",
      details: error.message 
    }, { status: 500 });
  }
}