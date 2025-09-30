"use client";
import React, { useRef, useState, useEffect } from 'react';
import jsQR from 'jsqr';

export default function QrScanner({ eventId }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [active, setActive] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [statusCode, setStatusCode] = useState(null); // 'first_entry' | 'already_entered' | 'not_found'

  useEffect(() => {
    let stream;
    if (active) {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }})
        .then(s => { stream = s; videoRef.current.srcObject = s; videoRef.current.play(); scanLoop(); })
        .catch(e => setError(e.message));
    }
    return () => { if (stream) stream.getTracks().forEach(t=>t.stop()); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const scanLoop = () => {
    if (!active) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && video.readyState === 4) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video,0,0,canvas.width,canvas.height);
      const img = ctx.getImageData(0,0,canvas.width,canvas.height);
      const code = jsQR(img.data, canvas.width, canvas.height);
      if (code) {
        handleCode(code.data);
      }
    }
    requestAnimationFrame(scanLoop);
  };

  const handleCode = async (data) => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.eventId !== eventId) {
        setError('Ticket for different event');
        return;
      }
      const res = await fetch('/api/scan', { method: 'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify(parsed)});
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Scan failed');
      if (!json.ok && json.status === 'not_found') {
        setStatusCode('not_found');
        setResult(null);
        return;
      }
      setStatusCode(json.status);
      setResult(json.ticket);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        <button onClick={()=>setActive(a=>!a)} className="px-4 py-2 rounded bg-indigo-600 text-white text-sm">{active? 'Stop':'Start'} Scanner</button>
        {statusCode === 'first_entry' && <span className="text-xs text-emerald-400">Entry Granted</span>}
        {statusCode === 'already_entered' && <span className="text-xs text-red-400">Already Entered</span>}
        {statusCode === 'not_found' && <span className="text-xs text-red-400">Unknown Ticket</span>}
      </div>
      {error && <div className="text-sm text-red-400">{error}</div>}
      <video ref={videoRef} className="w-full max-w-md rounded border border-gray-700" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
      {result && (
        <div className="text-xs border border-gray-700 p-3 rounded bg-gray-800">
          <div>Ticket ID: {result.ticketId}</div>
          <div>Name: {result.name}</div>
          {result.date && <div>Date: {result.date}</div>}
          {result.other && <div>Other: {result.other}</div>}
          <div>Issued: {new Date(result.issuedAt).toLocaleString()}</div>
          <div>Has Entered: {result.hasEntered ? 'Yes' : 'No'}</div>
          {result.enteredAt && <div>Entered At: {new Date(result.enteredAt).toLocaleString()}</div>}
        </div>
      )}
    </div>
  );
}
