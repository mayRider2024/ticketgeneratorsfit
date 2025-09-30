"use client";
import React, { useEffect, useRef, useState } from 'react';
import * as QRCode from 'qrcode';

// Simplified TicketGenerator: uses saved layout only; no manual position/style editing here.
export default function TicketGenerator({ event }) {
  const canvasRef = useRef(null);
  const [name, setName] = useState('');
  const [selectedDate, setSelectedDate] = useState(event.dates?.[0] || '');
  const [otherInput, setOtherInput] = useState('');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState(false);
  const [imageEl, setImageEl] = useState(null);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  const config = event.templateConfig || {};
  const dateEnabled = config?.dateEnabled !== false && !!config?.date;
  const otherEnabled = !!config?.otherEnabled && !!config?.other;
  const outline = config?.outline ?? true;
  const [ticketId] = useState(() => cryptoRandomId());
  const issuedSnapshotRef = useRef(null); // store last issued payload (stringified) to avoid re-issuing unnecessarily
  const [issuing, setIssuing] = useState(false);
  const [issued, setIssued] = useState(false);

  // Preload image
  useEffect(() => {
    if (!event.templateImage) return;
    loadImage(event.templateImage).then(img => setImageEl(img)).catch(()=>{});
  }, [event.templateImage]);

  // Redraw on input changes or config/image load
  useEffect(() => {
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, selectedDate, otherInput, config, imageEl]);

  const draw = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      if (!event.templateImage) throw new Error('No template uploaded for this event');
      if (!imageEl) return; // wait until loaded
      const ctx = canvas.getContext('2d');
      canvas.width = imageEl.width;
      canvas.height = imageEl.height;
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(imageEl,0,0);

      const drawBlock = (blockCfg, text, isName=false, kind='generic') => {
        if (!blockCfg) return;
        const renderText = (text && text.length > 0) ? text : (isName ? '' : 'OTHER');
        if (!renderText) return; // still allow skipping empty name while typing
        ctx.save();
  const size = blockCfg.fontSize || (isName?48:28);
  const family = blockCfg.fontFamily || 'Arial';
  ctx.font = `${isName? 'bold ': ''}${size}px ${family}`;
        ctx.fillStyle = blockCfg.color || '#ffffff';
        ctx.textAlign = blockCfg.align || 'left';
        ctx.textBaseline = mapBaseline(outline, kind, blockCfg.baseline || 'top');
        ctx.translate(blockCfg.x || 0, blockCfg.y || 0);
        if (blockCfg.rotation) ctx.rotate(blockCfg.rotation * Math.PI/180);
        drawTextWithOutline(ctx, renderText, 0, 0, outline);
        ctx.restore();
      };

      drawBlock(config.name, name, true, 'name');
      if (dateEnabled) drawBlock(config.date, selectedDate, false, 'date');
      if (otherEnabled) {
        const combinedOther = (otherInput !== '' ? otherInput : (config.other.text || ''));
        drawBlock(config.other, combinedOther, false, 'other');
      }
  // Draw QR using configurable position (fallback to bottom-left if not set).
      const qrPayload = {
        v: 1,
        eventId: event.id,
        ticketId,
        name,
        date: dateEnabled ? selectedDate : undefined,
        other: otherEnabled ? (otherInput || config.other.text || '') : undefined,
        eventName: event.name
      };
      const qrString = JSON.stringify(qrPayload);
      // Generate a small QR data URL
      // Use cached offscreen canvas for performance
  const qrCfg = config.qr || { x: 378, y: 1100, size: 400 };
  const qrSize = qrCfg.size || 400;
  const qrX = typeof qrCfg.x === 'number' ? qrCfg.x : 378;
  const qrY = typeof qrCfg.y === 'number' ? qrCfg.y : 1100;
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, qrString, { width: qrSize, margin: 0 });
    ctx.save();
    ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      ctx.restore();
      setGenerated(true);
      setStatus('Preview updated');
    } catch (e) {
      setError(e.message);
      setGenerated(false);
      setStatus('');
    }
  };

  function validateEmail(val){
    return /.+@.+\..+/.test(val);
  }

  async function ensureIssued() {
    const payload = {
      eventId: event.id,
      ticketId,
      name: name.trim(),
      date: dateEnabled ? selectedDate : '',
      other: otherEnabled ? (otherInput || config.other.text || '') : '',
      email: email ? email.trim() : ''
    };
    const snap = JSON.stringify(payload);
    if (issued && issuedSnapshotRef.current === snap) return; // already issued identical
    setIssuing(true);
    try {
      const res = await fetch('/api/tickets/issue', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Issue failed');
      issuedSnapshotRef.current = snap;
      setIssued(true);
    } finally {
      setIssuing(false);
    }
  }

  const handleDownload = async () => {
    await ensureIssued();
    await draw(); // ensure QR payload & canvas up to date
    const canvas = canvasRef.current; if (!canvas) return;
    const link = document.createElement('a');
    link.download = `${event.name.replace(/\s+/g,'_')}_${(name||'ticket').replace(/\s+/g,'_')}_${ticketId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  async function handleSendEmail() {
    try {
      await ensureIssued();
      setSending(true);
      // Always redraw to ensure latest canvas; attach as data URL maybe later.
      await draw();
      const canvas = canvasRef.current;
      let imageDataUrl = '';
      if (canvas) {
        // Ticket image as PNG data URL; server can decode & attach.
        imageDataUrl = canvas.toDataURL('image/png');
      }
      const res = await fetch('/api/tickets/send-email', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ eventId: event.id, ticketId, email: email.trim(), imageDataUrl }) });
      let json;
      try { json = await res.json(); } catch { json = {}; }
      if (!res.ok || !json.ok) {
        const detail = [json.error, json.details, json.provider].filter(Boolean).join(' | ');
        throw new Error(detail || 'Failed to send');
      }
      setStatus('Email sent');
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={e=>{e.preventDefault(); draw();}} className="flex flex-col gap-6 max-w-2xl">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-300">Person Name *</span>
          <input value={name} onChange={e=>setName(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600" placeholder="Jane Doe" required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-300">Email *</span>
          <input value={email} type="email" onChange={e=>setEmail(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600" placeholder="user@example.com" required />
        </label>
        {dateEnabled && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-300">Date *</span>
            <select value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600">
              {event.dates.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        )}
  {(otherEnabled) && (
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-gray-300">Other Text</span>
            <input value={otherInput} onChange={e=>setOtherInput(e.target.value)} placeholder={config?.other?.text || 'Enter text'} className="bg-gray-800 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-600" />
          </label>
        )}
        {error && <div className="text-sm text-red-400">{error}</div>}
        {status && <div className="text-xs text-gray-400">{status}</div>}
        <div className="flex gap-3">
          <button type="submit" className="px-5 py-2 rounded-md bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500">Refresh Preview</button>
          <a href={`/dashboard/event/${event.id}`} className="px-5 py-2 rounded-md bg-gray-700 text-white text-sm hover:bg-gray-600">Back</a>
          {generated && (
            <>
              <button type="button" disabled={issuing} onClick={handleDownload} className="px-5 py-2 rounded-md bg-indigo-600 disabled:opacity-60 text-white text-sm font-medium hover:bg-indigo-500">{issuing? 'Issuing...' : issued? 'Download (Issued)' : 'Issue & Download'}</button>
              <button type="button" disabled={issuing || sending || !validateEmail(email)} onClick={handleSendEmail} className="px-5 py-2 rounded-md bg-emerald-600 disabled:opacity-60 text-white text-sm font-medium hover:bg-emerald-500">{sending? 'Sending...' : 'Send Ticket via Email'}</button>
            </>
          )}
        </div>
      </form>

      <div>
        <h2 className="text-lg font-medium mb-2">Preview</h2>
        {!event.templateImage && (
          <p className="text-sm text-yellow-400">No template uploaded yet. Upload one in the Design page.</p>
        )}
        <canvas ref={canvasRef} className="border border-gray-700 rounded bg-gray-900 max-w-full"></canvas>
        {generated && <p className="text-xs text-gray-500 mt-2">Right-click image or use Download button. Ticket must be issued (server saved) before entry scan. Use the email button to send a copy.</p>}
      </div>
    </div>
  );
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function drawTextWithOutline(ctx, text, x, y, outline) {
  if (!text) return;
  if (outline) {
    ctx.lineWidth = 4;
    ctx.strokeStyle = 'rgba(0,0,0,0.85)';
    ctx.strokeText(text, x, y);
  }
  ctx.fillText(text, x, y);
}

function mapBaseline(outlineEnabled, kind, value) { // value: top|middle|bottom
  switch (value) {
    case 'middle': return 'middle';
    case 'bottom': return 'bottom';
    default: return 'top';
  }
}

function cryptoRandomId() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint32Array(4);
    crypto.getRandomValues(arr);
    return Array.from(arr, n => n.toString(16).padStart(8,'0')).join('').slice(0,24);
  }
  return Math.random().toString(36).slice(2, 14);
}
