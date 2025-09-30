import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import { Resend } from 'resend';
export const runtime = 'nodejs';
import { getTicket } from '@/lib/ticketsStore';
import { prisma } from '@/lib/prismaClient';

const required = (v,name) => { if(!v) throw new Error(name+ ' required'); return v; };

async function buildTransport() {
  // Resend path: use API (no SMTP) if vars present.
  if (process.env.RESEND_API_KEY && process.env.RESEND_FROM) {
    // We'll return a pseudo-transport object with a sendMail method to mimic nodemailer usage.
    const resend = new Resend(process.env.RESEND_API_KEY);
    return {
      isResend: true,
      async verify() { return true; },
      async sendMail({ to, from, subject, text, html, attachments }) {
        // Force from to RESEND_FROM
        const finalFrom = process.env.RESEND_FROM;
        const sendOpts = { from: finalFrom, to, subject, text, html };
        if (attachments && attachments.length) {
          // Map nodemailer-style attachments to Resend expectation
            sendOpts.attachments = attachments.map(a => ({
              filename: a.filename,
              content: a.content, // Buffer ok for Resend
              contentType: a.contentType
            }));
        }
        const res = await resend.emails.send(sendOpts);
        if (res.error) {
          const err = new Error(res.error.message || 'Resend send error');
          err.provider = 'resend';
          err.meta = res.error;
          throw err;
        }
        return { accepted: Array.isArray(to) ? to : [to], rejected: [], messageId: res.data?.id || 'resend:unknown', envelope: { from: finalFrom, to: Array.isArray(to) ? to : [to] }, response: 'RESEND_API_OK', provider: 'resend' };
      }
    };
  }
  // If Gmail OAuth2 vars are present, prefer that path.
  if (process.env.GMAIL_CLIENT_ID && process.env.GMAIL_CLIENT_SECRET && process.env.GMAIL_REFRESH_TOKEN && process.env.GMAIL_USER) {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI || 'https://developers.google.com/oauthplayground'
    );
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    let accessToken;
    try {
      const res = await oAuth2Client.getAccessToken();
      accessToken = typeof res === 'string' ? res : res?.token;
    } catch (e) {
      throw new Error('Failed to get Gmail access token: ' + e.message);
    }
    const auth = {
      type: 'OAuth2',
      user: process.env.GMAIL_USER,
      clientId: process.env.GMAIL_CLIENT_ID,
      clientSecret: process.env.GMAIL_CLIENT_SECRET,
      refreshToken: process.env.GMAIL_REFRESH_TOKEN,
      accessToken
    };
    const base = { service: 'gmail', auth };
    if (process.env.EMAIL_DEBUG === 'true') {
      return nodemailer.createTransport({ ...base, logger: true, debug: true });
    }
    return nodemailer.createTransport(base);
  }

  // Fallback to basic SMTP host/port/pass auth.
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) throw new Error('SMTP env vars missing (or Gmail OAuth2 not fully configured)');
  const base = { host, port, secure: port === 465, auth: { user, pass } };
  if (process.env.EMAIL_DEBUG === 'true') {
    return nodemailer.createTransport({ ...base, logger: true, debug: true });
  }
  return nodemailer.createTransport(base);
}

export async function POST(req) {
  try {
    const body = await req.json();
    const eventId = required(body.eventId, 'eventId');
  const ticketId = required(body.ticketId, 'ticketId');
  const email = required(body.email, 'email');
  const imageDataUrl = body.imageDataUrl; // optional base64 data URL
    const ticket = await getTicket(eventId, ticketId);
    if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });

    let eventName = 'Event';
    if (prisma) {
      try {
        const evt = await prisma.event.findUnique({ where: { id: eventId }});
        if (evt) eventName = evt.name;
      } catch {/* ignore */}
    }

  const transport = await buildTransport();

    // Run a quick verification so we can surface auth or connection issues clearly.
    try {
      await transport.verify();
    } catch (verifyErr) {
      return NextResponse.json({ error: 'SMTP verify failed', details: verifyErr.message }, { status: 500 });
    }

    // Determine from address per transport/provider.
    let from;
    if (transport.isResend) {
      from = process.env.RESEND_FROM; // already validated in buildTransport
    } else {
      from = process.env.EMAIL_FROM || process.env.SMTP_USER;
      if (process.env.EMAIL_STRICT_FROM === 'true') {
        from = process.env.SMTP_USER;
      }
    }

    const subject = `Your Ticket for ${eventName}`;
    const text = [
      `Event: ${eventName}`,
      `Name: ${ticket.name}`,
      ticket.date ? `Date: ${ticket.date}` : null,
      ticket.other ? `Other: ${ticket.other}` : null,
      `Ticket ID: ${ticket.ticketId}`,
      '',
      'Show the QR code image you downloaded at entry.'
    ].filter(Boolean).join('\n');

    const html = `<p>Hi ${ticket.name},</p>
<p>Here are your ticket details:</p>
<ul>
  <li><b>Name:</b> ${ticket.name}</li>
  <li><b>Event:</b> ${eventName}</li>
  ${ticket.date? `<li><b>Date:</b> ${ticket.date}</li>`:''}
  ${ticket.other? `<li><b>PID :</b> ${ticket.other}</li>`:''}
  <li><b>Ticket ID:</b> ${ticket.ticketId}</li>
</ul>
<p>Show the QR code image you downloaded at entry.</p>
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
