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
        <p style="color: #d32f2f; font-weight: bold;">IMPORTANT: This ticket is for your personal use only. Strictly do not share this ticket with anyone else. Shared or duplicated tickets will not be accepted at the venue.</p>
        <p>Want to enjoy the event with your friends? Encourage them to buy their own tickets so you can make memories together!</p>
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
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Email sending failed:', error.message, error.code, error.response);
    return { success: false, error: error.message };
  }
}