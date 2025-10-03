import { NextResponse } from 'next/server';import { NextResponse } from 'next/server';import { NextResponse } from 'next/server';import { NextResponse } from 'next/server';

import nodemailer from 'nodemailer';

import { getTicket } from '@/lib/ticketsStore';import nodemailer from 'nodemailer';



export const runtime = 'nodejs';import { getTicket } from '@/lib/ticketsStore';import nodemailer from 'nodemailer';import nodemailer from 'nodemailer';



export async function POST(request) {

  try {

    const { ticketId, recipientEmail, recipientName, eventId, imageDataUrl } = await request.json();export const runtime = 'nodejs';import { getTicket } from '@/lib/ticketsStore';import { Resend } from 'resend';



    if (!ticketId || !recipientEmail || !eventId) {

      return NextResponse.json({ 

        error: 'Missing required fields' export async function POST(request) {export const runtime = 'nodejs';

      }, { status: 400 });

    }  try {



    // Get ticket data    const { ticketId, recipientEmail, recipientName, eventId, imageDataUrl } = await request.json();export const runtime = 'nodejs';import { getTicket } from '@/lib/ticketsStore';

    const ticket = await getTicket(eventId, ticketId);

    if (!ticket) {

      return NextResponse.json({ 

        error: 'Ticket not found'     if (!ticketId || !recipientEmail || !eventId) {import { prisma } from '@/lib/prismaClient';

      }, { status: 404 });

    }      return NextResponse.json({ 



    // Create Gmail SMTP transporter        error: 'Missing required fields' export async function POST(request) {

    const transporter = nodemailer.createTransporter({

      service: 'gmail',      }, { status: 400 });

      auth: {

        user: process.env.GMAIL_USER,    }  try {const required = (v,name) => { if(!v) throw new Error(name+ ' required'); return v; };

        pass: process.env.GMAIL_APP_PASSWORD,

      },

    });

    // Get ticket data    const { ticketId, recipientEmail, recipientName, eventId, imageDataUrl } = await request.json();

    // Verify transporter

    try {    const ticket = await getTicket(eventId, ticketId);

      await transporter.verify();

    } catch (error) {    if (!ticket) {async function buildTransport() {

      console.error('Gmail SMTP verification failed:', error);

      return NextResponse.json({       return NextResponse.json({ 

        error: 'Email service configuration error' 

      }, { status: 500 });        error: 'Ticket not found'     if (!ticketId || !recipientEmail || !eventId) {  // Resend path: use API (no SMTP) if vars present.

    }

      }, { status: 404 });

    // Prepare attachments

    const attachments = [];    }      return NextResponse.json({   if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {

    if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/png;base64,')) {

      const base64 = imageDataUrl.split(',')[1];

      attachments.push({

        filename: `ticket_${ticketId}.png`,    // Create Gmail SMTP transporter        error: 'Missing required fields'     // We'll return a pseudo-transport object with a sendMail method to mimic nodemailer usage.

        content: Buffer.from(base64, 'base64'),

        contentType: 'image/png'    const transporter = nodemailer.createTransporter({

      });

    }      service: 'gmail',      }, { status: 400 });    const resend = new Resend(process.env.RESEND_API_KEY);



    // Email content      auth: {

    const eventName = ticket.eventName || 'Event';

    const subject = `Your Ticket - ${eventName}`;        user: process.env.GMAIL_USER,    }    return {

    

    const textContent = [        pass: process.env.GMAIL_APP_PASSWORD,

      `Hi ${recipientName || ticket.name},`,

      '',      },      isResend: true,

      'Here are your ticket details:',

      `Event: ${eventName}`,    });

      `Name: ${ticket.name}`,

      `Ticket ID: ${ticketId}`,    // Get ticket data      async verify() { return true; },

      ticket.date ? `Date: ${ticket.date}` : '',

      ticket.other ? `Additional Info: ${ticket.other}` : '',    // Verify transporter

      '',

      'Please show the attached QR code at the event entrance.',    try {    const ticket = await getTicket(eventId, ticketId);      async sendMail({ to, from, subject, text, html, attachments }) {

      'Thank you!'

    ].filter(Boolean).join('\n');      await transporter.verify();



    const htmlContent = `    } catch (error) {    if (!ticket) {        // Force from to RESEND_FROM

      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

        <h2 style="color: #333;">Your Event Ticket</h2>      console.error('Gmail SMTP verification failed:', error);

        

        <p>Hi ${recipientName || ticket.name},</p>      return NextResponse.json({       return NextResponse.json({         const finalFrom = process.env.RESEND_FROM;

        

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">        error: 'Email service configuration error' 

          <h3 style="margin-top: 0;">Event Details</h3>

          <p><strong>Event:</strong> ${eventName}</p>      }, { status: 500 });        error: 'Ticket not found'         const sendOpts = { from: finalFrom, to, subject, text, html };

          <p><strong>Attendee:</strong> ${ticket.name}</p>

          <p><strong>Ticket ID:</strong> ${ticketId}</p>    }

          ${ticket.date ? `<p><strong>Date:</strong> ${ticket.date}</p>` : ''}

          ${ticket.other ? `<p><strong>Additional Info:</strong> ${ticket.other}</p>` : ''}      }, { status: 404 });        if (attachments && attachments.length) {

        </div>

            // Prepare attachments

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">

          <h4 style="margin-top: 0; color: #1976d2;">Important Instructions</h4>    const attachments = [];    }          // Map nodemailer-style attachments to Resend expectation

          <ul style="margin: 0; padding-left: 20px;">

            <li>Keep this email safe - it contains your entry QR code</li>    if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/png;base64,')) {

            <li>Present the attached QR code image at the event entrance</li>

            <li>Arrive at least 15 minutes before the event</li>      const base64 = imageDataUrl.split(',')[1];            sendOpts.attachments = attachments.map(a => ({

            <li>Have a valid ID ready for verification</li>

            <li>Contact support if you have any issues</li>      attachments.push({

          </ul>

        </div>        filename: `ticket_${ticketId}.png`,    // Create Gmail SMTP transporter              filename: a.filename,

        

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 12px;">        content: Buffer.from(base64, 'base64'),

          <p>This is an automated email. Please do not reply.</p>

          <p>© 2025 TicketGen - Event Ticket Management System</p>        contentType: 'image/png'    const transporter = nodemailer.createTransporter({              content: a.content, // Buffer ok for Resend

        </div>

      </div>      });

    `;

    }      service: 'gmail',              contentType: a.contentType

    // Email options

    const mailOptions = {

      from: process.env.GMAIL_USER,

      to: recipientEmail,    // Email content      auth: {            }));

      replyTo: process.env.GMAIL_USER,

      subject: subject,    const eventName = ticket.eventName || 'Event';

      text: textContent,

      html: htmlContent,    const subject = `Your Ticket - ${eventName}`;        user: process.env.GMAIL_USER,        }

      attachments: attachments

    };    



    // Send email    const text = [        pass: process.env.GMAIL_APP_PASSWORD,        const res = await resend.emails.send(sendOpts);

    const info = await transporter.sendMail(mailOptions);

          `Hi ${recipientName || ticket.name},`,

    // Check for rejected recipients

    if (info.rejected && info.rejected.length > 0) {      '',      },        if (res.error) {

      return NextResponse.json({ 

        error: 'Email was rejected by recipient server',      `Here are your ticket details:`,

        rejected: info.rejected 

      }, { status: 400 });      `Event: ${eventName}`,    });          const err = new Error(res.error.message || 'Resend send error');

    }

      `Name: ${ticket.name}`,

    return NextResponse.json({ 

      success: true,       `Ticket ID: ${ticketId}`,          err.provider = 'resend';

      message: 'Ticket sent successfully',

      messageId: info.messageId,      ticket.date ? `Date: ${ticket.date}` : '',

      accepted: info.accepted

    });      ticket.other ? `Additional Info: ${ticket.other}` : '',    // Verify transporter          err.meta = res.error;



  } catch (error) {      '',

    console.error('Error sending ticket email:', error);

    return NextResponse.json({       'Please show the attached QR code at the event entrance.',    try {          throw err;

      error: 'Failed to send email',

      details: error.message       'Thank you!'

    }, { status: 500 });

  }    ].filter(Boolean).join('\\n');      await transporter.verify();        }

}


    const html = `    } catch (error) {        return { accepted: Array.isArray(to) ? to : [to], rejected: [], messageId: res.data?.id || 'resend:unknown', envelope: { from: finalFrom, to: Array.isArray(to) ? to : [to] }, response: 'RESEND_API_OK', provider: 'resend' };

      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">

        <h2 style="color: #333;">Your Event Ticket</h2>      console.error('Gmail SMTP verification failed:', error);      }

        

        <p>Hi ${recipientName || ticket.name},</p>      return NextResponse.json({     };

        

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">        error: 'Email service configuration error'   }

          <h3 style="margin-top: 0;">Event Details</h3>

          <p><strong>Event:</strong> ${eventName}</p>      }, { status: 500 });  // If Gmail OAuth2 vars are present, prefer that path.

          <p><strong>Attendee:</strong> ${ticket.name}</p>

          <p><strong>Ticket ID:</strong> ${ticketId}</p>    }  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN && process.env.GMAIL_USER) {

          ${ticket.date ? `<p><strong>Date:</strong> ${ticket.date}</p>` : ''}

          ${ticket.other ? `<p><strong>Additional Info:</strong> ${ticket.other}</p>` : ''}    const oAuth2Client = new google.auth.OAuth2(

        </div>

            // Prepare attachments      process.env.GMAIL_CLIENT_ID,

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">

          <h4 style="margin-top: 0; color: #1976d2;">Important Instructions</h4>    const attachments = [];      process.env.GMAIL_CLIENT_SECRET,

          <ul style="margin: 0; padding-left: 20px;">

            <li>Keep this email safe - it contains your entry QR code</li>    if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/png;base64,')) {      process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'

            <li>Present the attached QR code image at the event entrance</li>

            <li>Arrive at least 15 minutes before the event</li>      const base64 = imageDataUrl.split(',')[1];    );

            <li>Have a valid ID ready for verification</li>

            <li>Contact support if you have any issues</li>      attachments.push({    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });

          </ul>

        </div>        filename: `ticket_${ticketId}.png`,    let accessToken;

        

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 12px;">        content: Buffer.from(base64, 'base64'),    try {

          <p>This is an automated email. Please do not reply.</p>

          <p>© 2025 TicketGen - Event Ticket Management System</p>        contentType: 'image/png'      const res = await oAuth2Client.getAccessToken();

        </div>

      </div>      });      accessToken = typeof res === 'string' ? res : res?.token;

    `;

    }    } catch (e) {

    // Email options

    const mailOptions = {      throw new Error('Failed to get Gmail access token: ' + e.message);

      from: process.env.GMAIL_USER,

      to: recipientEmail,    // Email content    }

      replyTo: process.env.GMAIL_USER,

      subject: subject,    const eventName = ticket.eventName || 'Event';    const auth = {

      text: text,

      html: html,    const subject = `Your Ticket - ${eventName}`;      type: 'OAuth2',

      attachments: attachments

    };          user: process.env.GMAIL_USER,



    // Send email    const text = [      clientId: process.env.GMAIL_CLIENT_ID,

    const info = await transporter.sendMail(mailOptions);

          `Hi ${recipientName || ticket.name},`,      clientSecret: process.env.GMAIL_CLIENT_SECRET,

    // Check for rejected recipients

    if (info.rejected && info.rejected.length > 0) {      '',      refreshToken: process.env.GMAIL_REFRESH_TOKEN,

      return NextResponse.json({ 

        error: 'Email was rejected by recipient server',      `Here are your ticket details:`,      accessToken

        rejected: info.rejected 

      }, { status: 400 });      `Event: ${eventName}`,    };

    }

      `Name: ${ticket.name}`,    const base = { service: 'gmail', auth };

    return NextResponse.json({ 

      success: true,       `Ticket ID: ${ticketId}`,    if (process.env.EMAIL_DEBUG === 'true') {

      message: 'Ticket sent successfully',

      messageId: info.messageId,      ticket.date ? `Date: ${ticket.date}` : '',      return nodemailer.createTransport({ ...base, logger: true, debug: true });

      accepted: info.accepted

    });      ticket.other ? `Additional Info: ${ticket.other}` : '',    }



  } catch (error) {      '',    return nodemailer.createTransport(base);

    console.error('Error sending ticket email:', error);

    return NextResponse.json({       'Please show the attached QR code at the event entrance.',  }

      error: 'Failed to send email',

      details: error.message       'Thank you!'

    }, { status: 500 });

  }    ].filter(Boolean).join('\n');  // Fallback to basic SMTP host/port/pass auth.

}
  const host = process.env.SMTP_HOST;

    const html = `  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;

      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">  const user = process.env.SMTP_USER;

        <h2 style="color: #333;">Your Event Ticket</h2>  const pass = process.env.SMTP_PASS;

          if (!host || !user || !pass) throw new Error('SMTP env vars missing (or Gmail OAuth2 not fully configured)');

        <p>Hi ${recipientName || ticket.name},</p>  const base = { host, port, secure: port === 465, auth: { user, pass } };

          if (process.env.EMAIL_DEBUG === 'true') {

        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">    return nodemailer.createTransport({ ...base, logger: true, debug: true });

          <h3 style="margin-top: 0;">Event Details</h3>  }

          <p><strong>Event:</strong> ${eventName}</p>  return nodemailer.createTransport(base);

          <p><strong>Attendee:</strong> ${ticket.name}</p>}

          <p><strong>Ticket ID:</strong> ${ticketId}</p>

          ${ticket.date ? `<p><strong>Date:</strong> ${ticket.date}</p>` : ''}export async function POST(req) {

          ${ticket.other ? `<p><strong>Additional Info:</strong> ${ticket.other}</p>` : ''}  try {

        </div>    const body = await req.json();

            const eventId = required(body.eventId, 'eventId');

        <div style="background-color: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">  const ticketId = required(body.ticketId, 'ticketId');

          <h4 style="margin-top: 0; color: #1976d2;">Important Instructions</h4>  const email = required(body.email, 'email');

          <ul style="margin: 0; padding-left: 20px;">  const imageDataUrl = body.imageDataUrl; // optional base64 data URL

            <li>Keep this email safe - it contains your entry QR code</li>    const ticket = await getTicket(eventId, ticketId);

            <li>Present the attached QR code image at the event entrance</li>    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

            <li>Arrive at least 15 minutes before the event</li>

            <li>Have a valid ID ready for verification</li>    let eventName = 'Event';

            <li>Contact support if you have any issues</li>    if (prisma) {

          </ul>      try {

        </div>        const evt = await prisma.event.findUnique({ where: { id: eventId }});

                if (evt) eventName = evt.name;

        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; text-align: center; color: #666; font-size: 12px;">      } catch {/* ignore */}

          <p>This is an automated email. Please do not reply.</p>    }

          <p>© 2025 TicketGen - Event Ticket Management System</p>

        </div>  const transport = await buildTransport();

      </div>

    `;    // Run a quick verification so we can surface auth or connection issues clearly.

    try {

    // Email options      await transport.verify();

    const mailOptions = {    } catch (verifyErr) {

      from: process.env.GMAIL_USER,      return NextResponse.json({ error: 'SMTP verify failed', details: verifyErr.message }, { status: 500 });

      to: recipientEmail,    }

      replyTo: process.env.GMAIL_USER,

      subject: subject,    // Determine from address per transport/provider.

      text: text,    let from;

      html: html,    if (transport.isResend) {

      attachments: attachments      from = process.env.RESEND_FROM; // already validated in buildTransport

    };    } else {

      from = process.env.EMAIL_FROM || process.env.SMTP_USER;

    // Send email      if (process.env.EMAIL_STRICT_FROM === 'true') {

    const info = await transporter.sendMail(mailOptions);        from = process.env.SMTP_USER;

          }

    // Check for rejected recipients    }

    if (info.rejected && info.rejected.length > 0) {

      return NextResponse.json({     const subject = `Your Ticket for ${eventName}`;

        error: 'Email was rejected by recipient server',    const text = [

        rejected: info.rejected       `Event: ${eventName}`,

      }, { status: 400 });      `Name: ${ticket.name}`,

    }      ticket.date ? `Date: ${ticket.date}` : null,

      ticket.other ? `Other: ${ticket.other}` : null,

    return NextResponse.json({       `Ticket ID: ${ticket.ticketId}`,

      success: true,       '',

      message: 'Ticket sent successfully',      'Show the QR code image you downloaded at entry.'

      messageId: info.messageId,    ].filter(Boolean).join('\n');

      accepted: info.accepted

    });    const html = `<p>Hi ${ticket.name},</p>

<p>Here are your ticket details:</p>

  } catch (error) {<ul>

    console.error('Error sending ticket email:', error);  <li><b>Name:</b> ${ticket.name}</li>

    return NextResponse.json({   <li><b>Event:</b> ${eventName}</li>

      error: 'Failed to send email',  ${ticket.date? `<li><b>Date:</b> ${ticket.date}</li>`:''}

      details: error.message   ${ticket.other? `<li><b>PID :</b> ${ticket.other}</li>`:''}

    }, { status: 500 });  <li><b>Ticket ID:</b> ${ticket.ticketId}</li>

  }</ul>

}<p>Show the QR code image you downloaded at entry.</p>
<p>Thank you.</p>`;

    let info;
    // Build attachments if image present
    const attachments = [];
    if (imageDataUrl && typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/png;base64,')) {
      const base64 = imageDataUrl.split(',')[1];
      attachments.push({ filename: `${eventName.replace(/\s+/g,'_')}_${ticket.ticketId}.png`, content: Buffer.from(base64, 'base64'), contentType: 'image/png' });
    }

    try {
      info = await transport.sendMail({ to: email, from, replyTo: from, subject, text, html, attachments });
    } catch (sendErr) {
      const activeProvider = transport.isResend ? 'resend' : (process.env.GMAIL_CLIENT_ID ? 'gmail-oauth2' : 'smtp');
      const msg = sendErr.message || '';
      // If Resend sandbox restriction, attempt automatic fallback to SMTP credentials (Brevo) once.
      if (activeProvider === 'resend' && /only send testing emails/i.test(msg) && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          // eslint-disable-next-line no-console
          console.warn('RESEND_SANDBOX_LIMIT: Falling back to SMTP transport');
          const host = process.env.SMTP_HOST;
          const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
          const user = process.env.SMTP_USER;
          const pass = process.env.SMTP_PASS;
          const smtpTransport = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass }, logger: process.env.EMAIL_DEBUG === 'true', debug: process.env.EMAIL_DEBUG === 'true' });
          await smtpTransport.verify();
          // Recompute from for SMTP path
          let smtpFrom = process.env.EMAIL_FROM || user;
          if (process.env.EMAIL_STRICT_FROM === 'true') smtpFrom = user;
          const fallbackInfo = await smtpTransport.sendMail({ to: email, from: smtpFrom, replyTo: smtpFrom, subject, text, html, attachments });
          if (fallbackInfo.rejected && fallbackInfo.rejected.length) {
            return NextResponse.json({ error: 'SMTP send failed', details: 'Fallback SMTP rejected recipient', provider: 'smtp', rejected: fallbackInfo.rejected }, { status: 400 });
          }
          const baseResp = { ok: true, messageId: fallbackInfo.messageId, accepted: fallbackInfo.accepted, rejected: fallbackInfo.rejected, envelope: fallbackInfo.envelope, fallback: true, provider: 'smtp' };
          if (process.env.EMAIL_DEBUG === 'true') {
            baseResp.response = fallbackInfo.response;
            baseResp.debug = { fromUsed: smtpFrom, host, port, fallback: true };
          }
          // eslint-disable-next-line no-console
          console.log('EMAIL_SEND_FALLBACK', { to: email, from: smtpFrom, accepted: fallbackInfo.accepted, envelope: fallbackInfo.envelope, response: fallbackInfo.response });
          return NextResponse.json(baseResp);
        } catch (fallbackErr) {
          // eslint-disable-next-line no-console
          console.error('EMAIL_FALLBACK_ERROR', { message: fallbackErr.message });
          return NextResponse.json({ error: 'SMTP send failed', details: msg + ' | Fallback failed: ' + fallbackErr.message, provider: 'resend->smtp' }, { status: 500 });
        }
      }
      // eslint-disable-next-line no-console
      console.error('EMAIL_SEND_ERROR', {
        provider: activeProvider,
        message: msg,
        stack: sendErr.stack?.split('\n').slice(0,3).join(' | '),
        code: sendErr.code,
        meta: sendErr.meta
      });
      return NextResponse.json({ error: 'SMTP send failed', details: msg, provider: activeProvider }, { status: 500 });
    }

  const baseResp = { ok: true, messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, envelope: info.envelope };

    // Treat any rejected recipients as error even if nodemailer didn't throw.
    if (info.rejected && info.rejected.length) {
      return NextResponse.json({ error: 'Recipient rejected', details: info.rejected }, { status: 400 });
    }

    if ((!info.accepted || info.accepted.length === 0) && (!info.rejected || info.rejected.length === 0)) {
      return NextResponse.json({ error: 'No recipients accepted by SMTP server', details: info.response || 'Empty accepted list' }, { status: 500 });
    }

    if (process.env.EMAIL_DEBUG === 'true') {
      baseResp.response = info.response;
      baseResp.debug = {
        timestamp: new Date().toISOString(),
        host: transport.isResend ? 'resend-api' : process.env.SMTP_HOST,
        port: transport.isResend ? 'n/a' : process.env.SMTP_PORT,
        fromUsed: from,
        provider: transport.isResend ? 'resend' : (process.env.GMAIL_CLIENT_ID ? 'gmail-oauth2|smtp' : 'smtp')
      };
    }
    // no preview URL in normal mode
    // Log on server for local dev visibility
    // eslint-disable-next-line no-console
  console.log('EMAIL_SEND', { to: email, from, accepted: info.accepted, envelope: info.envelope, response: info.response, attachment: attachments.length ? 'png' : 'none' });
    return NextResponse.json(baseResp);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
