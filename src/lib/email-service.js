import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendTicketEmail(
  recipientEmail,
  recipientName,
  eventName,
  ticketImageBuffer
) {
  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: recipientEmail,
    subject: `Your Ticket for ${eventName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Your Event Ticket</h2>
        <p>Dear ${recipientName},</p>
        <p>Thank you for registering for <strong>${eventName}</strong>!</p>
        <p>Please find your ticket attached to this email. Present this ticket at the event entrance.</p>
        <p>We look forward to seeing you at the event!</p>
        <br>
        <p>Best regards,<br>Event Team</p>
      </div>
    `,
    attachments: [
      {
        filename: `${eventName.replace(/[^a-zA-Z0-9]/g, '_')}_ticket.png`,
        content: ticketImageBuffer,
        contentType: 'image/png',
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, error: error.message };
  }
}