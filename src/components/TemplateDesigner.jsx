"use client";
import React, { useEffect, useRef, useState } from 'react';

export default function TemplateDesigner({ event }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(event.templateImage || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingLayout, setSavingLayout] = useState(false);

  // Define a default font family for canvas text rendering (was previously implicit)
  const fontFamily = 'Arial';

  // Layout state (load from event.templateConfig if exists)
  const initialConfig = event.templateConfig || {};
  const [namePos, setNamePos] = useState({
    x: initialConfig?.name?.x ?? 100,
    y: initialConfig?.name?.y ?? 150,
    fontSize: initialConfig?.name?.fontSize ?? 48,
    color: initialConfig?.name?.color || '#ffffff',
    align: initialConfig?.name?.align || 'left',
    baseline: initialConfig?.name?.baseline || 'top',
    rotation: initialConfig?.name?.rotation || 0,
    fontFamily: initialConfig?.name?.fontFamily || 'Arial'
  });
  const [datePos, setDatePos] = useState({
    x: initialConfig?.date?.x ?? 100,
    y: initialConfig?.date?.y ?? 230,
    fontSize: initialConfig?.date?.fontSize ?? 28,
    color: initialConfig?.date?.color || '#ffeb3b',
    align: initialConfig?.date?.align || 'left',
    baseline: initialConfig?.date?.baseline || 'top',
    rotation: initialConfig?.date?.rotation || 0,
    fontFamily: initialConfig?.date?.fontFamily || 'Arial'
  });
  const [otherPos, setOtherPos] = useState({
    x: initialConfig?.other?.x ?? 100,
    y: initialConfig?.other?.y ?? 300,
    fontSize: initialConfig?.other?.fontSize ?? 24,
    color: initialConfig?.other?.color || '#ffffff',
    align: initialConfig?.other?.align || 'left',
    baseline: initialConfig?.other?.baseline || 'top',
    rotation: initialConfig?.other?.rotation || 0,
    text: initialConfig?.other?.text || 'OTHER',
    fontFamily: initialConfig?.other?.fontFamily || 'Arial'
  });
  const [outline, setOutline] = useState(initialConfig?.outline ?? true);
  const [dateEnabled, setDateEnabled] = useState(initialConfig?.dateEnabled !== false); // default true for backward compat
  const [otherEnabled, setOtherEnabled] = useState(initialConfig?.otherEnabled || false);
  const [qrPos, setQrPos] = useState({
    x: initialConfig?.qr?.x ?? 378,
    y: initialConfig?.qr?.y ?? 1100,
    size: initialConfig?.qr?.size ?? 400
  });

  // Canvas refs
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imgEl, setImgEl] = useState(null);
  const [dragging, setDragging] = useState(null); // 'name' | 'date' | null
  const [scale, setScale] = useState(1);
  const [showSample, setShowSample] = useState(true);
  const sampleNameText = 'Sample Name';
  const sampleDateText = '2025-01-01';

  // Load image into offscreen object when preview updates
  useEffect(() => {
    if (!preview) return;
    const img = new Image();
    img.onload = () => {
      setImgEl(img);
      draw();
    };
    img.src = preview;
  }, [preview]);

  useEffect(() => { draw(); }, [imgEl, namePos, datePos, otherPos, outline, dateEnabled, otherEnabled, qrPos]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imgEl) return;
    const ctx = canvas.getContext('2d');
    const maxWidth = 800; // scale down large images for editing
    // NOTE: We store coordinates in original image pixel space. When the image
    // is downscaled for editing we multiply coordinates by `scale` only when
    // rendering (text, markers). Drag math divides mouse position by scale so
    // saved positions remain correct for full-size generation.
    let w = imgEl.width;
    let h = imgEl.height;
    if (w > maxWidth) {
      const ratio = maxWidth / w;
      w = maxWidth;
      h = h * ratio;
      setScale(ratio);
    } else {
      setScale(1);
    }
    canvas.width = w;
    canvas.height = h;
    canvas.setAttribute('data-scale', (w / imgEl.width).toString());
    ctx.clearRect(0,0,w,h);
    ctx.drawImage(imgEl, 0, 0, w, h);

    // Render markers
    // Render sample text (if enabled) BEFORE markers so markers sit on top
  if (showSample) {
        ctx.save();
    // Scale font visually to match downscaled image while storing original size
    ctx.font = `${Math.round(namePos.fontSize * scale)}px ${fontFamily}`;
        ctx.fillStyle = namePos.color;
        ctx.textAlign = namePos.align;
        ctx.textBaseline = namePos.baseline;
        ctx.translate(namePos.x * scale, namePos.y * scale);
        ctx.rotate((namePos.rotation || 0) * Math.PI / 180);
        ctx.fillText('NAME', 0, 0);
        ctx.restore();
        if (dateEnabled) {
          ctx.save();
          ctx.font = `${Math.round(datePos.fontSize * scale)}px ${fontFamily}`;
          ctx.fillStyle = datePos.color;
          ctx.textAlign = datePos.align;
          ctx.textBaseline = datePos.baseline;
          ctx.translate(datePos.x * scale, datePos.y * scale);
          ctx.rotate((datePos.rotation || 0) * Math.PI / 180);
          ctx.fillText('DATE', 0, 0);
          ctx.restore();
        }
        if (otherEnabled) {
          ctx.save();
          ctx.font = `${Math.round(otherPos.fontSize * scale)}px ${fontFamily}`;
          ctx.fillStyle = otherPos.color;
          ctx.textAlign = otherPos.align;
          ctx.textBaseline = otherPos.baseline;
          ctx.translate(otherPos.x * scale, otherPos.y * scale);
          ctx.rotate((otherPos.rotation || 0) * Math.PI / 180);
          ctx.fillText(otherPos.text || 'OTHER', 0, 0);
          ctx.restore();
        }
    }
    renderMarker(ctx, namePos, 'NAME', '#6366f1');
    if (dateEnabled) renderMarker(ctx, datePos, 'DATE', '#f59e0b');
    if (otherEnabled) renderMarker(ctx, otherPos, 'OTHER', '#10b981');
    // QR marker (square outline + marker) - use qrPos or default bottom-left
    const qrSize = qrPos.size;
    const qrX = qrPos.x;
    const qrY = (qrPos.y !== null ? qrPos.y : (imgEl.height - qrSize - 12));
    // draw preview square
    ctx.save();
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 2;
    ctx.setLineDash([6,4]);
    ctx.strokeRect(qrX * scale, qrY * scale, qrSize * scale, qrSize * scale);
    ctx.restore();
    renderMarker(ctx, { x: qrX, y: qrY }, 'QR', '#14b8a6');
  };

  const renderMarker = (ctx, pos, label, color) => {
    const x = pos.x * scale;
    const y = pos.y * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let short = 'M';
    if(label === 'NAME') short = 'N';
    else if(label === 'DATE') short = 'D';
    else if(label === 'OTHER') short = 'O';
    ctx.fillText(short, x, y);
  };

  const pickHandle = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const hitRadius = 14;
    const qrDerived = { x: qrPos.x, y: (qrPos.y !== null ? qrPos.y : (imgEl?.height ? (imgEl.height - qrPos.size - 12) : qrPos.y || 0)) };
    const candidates = [
      { key: 'name', pos: namePos },
      ...(dateEnabled ? [{ key: 'date', pos: datePos }] : []),
      ...(otherEnabled ? [{ key: 'other', pos: otherPos }] : []),
      { key: 'qr', pos: qrDerived }
    ];
    // Check marker circles first
    for (const p of candidates) {
      const dx = cx - p.pos.x * scale;
      const dy = cy - p.pos.y * scale;
      if (Math.sqrt(dx*dx + dy*dy) <= hitRadius) {
        setDragging(p.key); return;
      }
    }
    // If clicking on sample text bounding box
    if (showSample) {
      const nameBox = measureTextBox(namePos, sampleNameText, true, scale);
      const dateBox = dateEnabled ? measureTextBox(datePos, sampleDateText, false, scale) : null;
      const otherSample = otherPos.text || 'OTHER';
      const otherBox = otherEnabled ? measureTextBox(otherPos, otherSample, false, scale) : null;
      if (pointInBox(cx, cy, nameBox)) { setDragging('name'); return; }
      if (dateBox && pointInBox(cx, cy, dateBox)) { setDragging('date'); return; }
      if (otherBox && pointInBox(cx, cy, otherBox)) { setDragging('other'); return; }
    }
  };

  const onMove = (e) => {
    if (!dragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;
    const newX = Math.round(cx / scale);
    const newY = Math.round(cy / scale);
    if (dragging === 'name') setNamePos(v => ({ ...v, x: newX, y: newY }));
    if (dragging === 'date') setDatePos(v => ({ ...v, x: newX, y: newY }));
    if (dragging === 'other') setOtherPos(v => ({ ...v, x: newX, y: newY }));
    if (dragging === 'qr') setQrPos(v => ({ ...v, x: newX, y: newY }));
  };

  const endDrag = () => setDragging(null);

  const saveLayout = async () => {
    setSavingLayout(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch('/api/events/template/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: event.id, config: {
          name: namePos,
          date: datePos,
          other: otherPos,
          qr: qrPos,
          dateEnabled,
          otherEnabled,
          outline
        } })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save layout');
      setSuccess('Layout saved');
    } catch (e) {
      setError(e.message);
    } finally {
      setSavingLayout(false);
    }
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setError('');
    setSuccess('');
    if (f) {
      if (!/\.(png|jpe?g|webp)$/i.test(f.name)) {
        setError('Only PNG, JPG, JPEG, WEBP');
        return;
      }
      setFile(f);
      const url = URL.createObjectURL(f);
      setPreview(url);
    }
  };

  const handleUpload = async () => {
    if (!file) { setError('Select a file first'); return; }
    setError('');
    setSuccess('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('id', event.id);
      form.append('file', file);
      const res = await fetch('/api/events/template', { method: 'POST', body: form });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setSuccess('Template saved');
      if (data.event?.templateImage) setPreview(data.event.templateImage);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFileChange} />
        <div className="flex gap-3">
          <button onClick={handleUpload} disabled={uploading || !file} className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">
            {uploading ? 'Uploading...' : 'Save Template'}
          </button>
          <a href={`/dashboard/event/${event.id}`} className="px-4 py-2 rounded-md bg-gray-700 text-white text-sm hover:bg-gray-600">Back</a>
        </div>
        {error && <div className="text-sm text-red-400">{error}</div>}
        {success && <div className="text-sm text-green-400">{success}</div>}
      </div>

      <div>
        <h2 className="text-lg font-medium mb-3">Template Layout</h2>
        {!preview && <p className="text-sm text-gray-500">No template uploaded yet.</p>}
        {preview && (
          <div className="flex flex-col gap-4">
            <canvas
              ref={canvasRef}
              onMouseDown={pickHandle}
              onMouseMove={onMove}
              onMouseUp={endDrag}
              onMouseLeave={endDrag}
              className="border border-gray-700 rounded bg-gray-900 max-w-full cursor-move shadow-lg"
            />
            <div className="flex items-center gap-3 text-xs mb-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={showSample} onChange={e=>{setShowSample(e.target.checked); setTimeout(draw,0);}} /> Show Sample Text
              </label>
              <button onClick={()=>{draw();}} type="button" className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">Redraw</button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-xs">
              <div className="flex flex-col gap-1 p-2 border border-gray-700 rounded">
                <span className="font-semibold text-indigo-300">Name Pos</span>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>X</span>
                  <input type="number" value={namePos.x} onChange={e=>setNamePos(v=>({...v,x:Number(e.target.value)||0}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Y</span>
                  <input type="number" value={namePos.y} onChange={e=>setNamePos(v=>({...v,y:Number(e.target.value)||0}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <span>Font</span>
                  <input type="number" value={namePos.fontSize} onChange={e=>setNamePos(v=>({...v,fontSize:Number(e.target.value)||0}))} className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Family</span>
                  <select value={namePos.fontFamily} onChange={e=>setNamePos(v=>({...v,fontFamily:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option>Arial</option>
                    <option>Montserrat</option>
                    <option>Playfair Display</option>
                    <option>Pacifico</option>
                    <option>Lobster</option>
                    <option>Caveat</option>
                    <option>Great Vibes</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <span>Color</span>
                  <input type="color" value={namePos.color} onChange={e=>setNamePos(v=>({...v,color:e.target.value}))} />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Align</span>
                  <select value={namePos.align} onChange={e=>setNamePos(v=>({...v,align:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option>left</option>
                    <option>center</option>
                    <option>right</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Baseline</span>
                  <select value={namePos.baseline} onChange={e=>setNamePos(v=>({...v,baseline:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option value="top">top</option>
                    <option value="middle">middle</option>
                    <option value="bottom">bottom</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Rotation°</span>
                  <input type="number" value={namePos.rotation} onChange={e=>setNamePos(v=>({...v,rotation:Number(e.target.value)||0}))} className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
              </div>
              <div className="flex flex-col gap-1 p-2 border border-gray-700 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-300">Date Pos</span>
                  <label className="flex items-center gap-1 text-[10px]">
                    <input type="checkbox" checked={dateEnabled} onChange={e=>setDateEnabled(e.target.checked)} /> Enable
                  </label>
                </div>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>X</span>
                  <input type="number" value={datePos.x} onChange={e=>setDatePos(v=>({...v,x:Number(e.target.value)||0}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Y</span>
                  <input type="number" value={datePos.y} onChange={e=>setDatePos(v=>({...v,y:Number(e.target.value)||0}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <span>Font</span>
                  <input type="number" value={datePos.fontSize} onChange={e=>setDatePos(v=>({...v,fontSize:Number(e.target.value)||0}))} className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Family</span>
                  <select value={datePos.fontFamily} onChange={e=>setDatePos(v=>({...v,fontFamily:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option>Arial</option>
                    <option>Montserrat</option>
                    <option>Playfair Display</option>
                    <option>Pacifico</option>
                    <option>Lobster</option>
                    <option>Caveat</option>
                    <option>Great Vibes</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <span>Color</span>
                  <input type="color" value={datePos.color} onChange={e=>setDatePos(v=>({...v,color:e.target.value}))} />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Align</span>
                  <select value={datePos.align} onChange={e=>setDatePos(v=>({...v,align:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option>left</option>
                    <option>center</option>
                    <option>right</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Baseline</span>
                  <select value={datePos.baseline} onChange={e=>setDatePos(v=>({...v,baseline:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option value="top">top</option>
                    <option value="middle">middle</option>
                    <option value="bottom">bottom</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Rotation°</span>
                  <input type="number" value={datePos.rotation} onChange={e=>setDatePos(v=>({...v,rotation:Number(e.target.value)||0}))} className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
              </div>
              <div className="flex flex-col gap-1 p-2 border border-gray-700 rounded">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-emerald-300">Other Pos</span>
                  <label className="flex items-center gap-1 text-[10px]">
                    <input type="checkbox" checked={otherEnabled} onChange={e=>setOtherEnabled(e.target.checked)} /> Enable
                  </label>
                </div>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>X</span>
                  <input type="number" value={otherPos.x} onChange={e=>setOtherPos(v=>({...v,x:Number(e.target.value)||0}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Y</span>
                  <input type="number" value={otherPos.y} onChange={e=>setOtherPos(v=>({...v,y:Number(e.target.value)||0}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <span>Text</span>
                  <input type="text" value={otherPos.text} onChange={e=>setOtherPos(v=>({...v,text:e.target.value}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <span>Font</span>
                  <input type="number" value={otherPos.fontSize} onChange={e=>setOtherPos(v=>({...v,fontSize:Number(e.target.value)||0}))} className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Family</span>
                  <select value={otherPos.fontFamily} onChange={e=>setOtherPos(v=>({...v,fontFamily:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option>Arial</option>
                    <option>Montserrat</option>
                    <option>Playfair Display</option>
                    <option>Pacifico</option>
                    <option>Lobster</option>
                    <option>Caveat</option>
                    <option>Great Vibes</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1">
                  <span>Color</span>
                  <input type="color" value={otherPos.color} onChange={e=>setOtherPos(v=>({...v,color:e.target.value}))} />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Align</span>
                  <select value={otherPos.align} onChange={e=>setOtherPos(v=>({...v,align:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option>left</option>
                    <option>center</option>
                    <option>right</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Baseline</span>
                  <select value={otherPos.baseline} onChange={e=>setOtherPos(v=>({...v,baseline:e.target.value}))} className="bg-gray-800 border border-gray-700 rounded px-1 py-0.5">
                    <option value="top">top</option>
                    <option value="middle">middle</option>
                    <option value="bottom">bottom</option>
                  </select>
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Rotation°</span>
                  <input type="number" value={otherPos.rotation} onChange={e=>setOtherPos(v=>({...v,rotation:Number(e.target.value)||0}))} className="w-20 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
              </div>
              <div className="flex flex-col gap-2 p-2 border border-gray-700 rounded">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={outline} onChange={e=>setOutline(e.target.checked)} /> Outline Text
                </label>
                <button onClick={saveLayout} disabled={savingLayout} className="px-3 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 text-xs">{savingLayout ? 'Saving...' : 'Save Layout'}</button>
              </div>
              <div className="flex flex-col gap-1 p-2 border border-gray-700 rounded">
                <span className="font-semibold text-teal-300">QR Pos</span>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>X</span>
                  <input type="number" value={qrPos.x} onChange={e=>setQrPos(v=>({...v,x:Number(e.target.value)||0}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Y</span>
                  <input type="number" value={qrPos.y === null ? '' : qrPos.y} placeholder="auto" onChange={e=>{
                    const val = e.target.value;
                    setQrPos(v=>({...v,y: val === '' ? null : (Number(val)||0)}));
                  }} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <label className="flex items-center gap-2 mt-1 text-xs">
                  <span>Size</span>
                  <input type="number" value={qrPos.size} onChange={e=>setQrPos(v=>({...v,size: Math.max(40, Number(e.target.value)||0)}))} className="w-24 bg-gray-800 border border-gray-700 rounded px-1 py-0.5" />
                </label>
                <p className="text-[10px] text-gray-500 mt-1">Leave Y blank for bottom auto position. Drag green circle or edit numbers.</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Drag the circular markers to change where NAME and DATE will render on tickets. Save Layout to persist.</p>
            {showSample && <p className="text-[10px] text-gray-500">You can also drag directly on the sample text.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function pointInBox(x,y,box){
  if(!box) return false;return x>=box.x && x<=box.x+box.w && y>=box.y && y<=box.y+box.h;
}

// Measure approximate bounding box (used for dragging text itself)
function measureTextBox(pos, text, isName, scale){
  if(!text) return null;
  const fontSize = pos.fontSize || (isName?48:28);
  const scaledFont = fontSize * scale;
  const width = Math.max(10, text.length * scaledFont * 0.6);
  const height = scaledFont * 1.2;
  return { x: pos.x * scale, y: pos.y * scale, w: width, h: height };
}

function drawSampleText(ctx, pos, text, isName){
  if(!text) return;
  const maxWidth = ctx.canvas.width; // not used yet for wrapping
  // Derive scale by comparing stored coordinate to rendered coordinate of marker (marker uses pos * scale already before call)
  // We'll approximate scale as 1 since we already scaled coordinates externally via draw() logic using pos*scale.
  // For consistent sizing with downscaled image, compute scale ratio from marker: we stored global scale in closure via hack: width/originalWidth.
  // Simpler: infer scale from displayed font vs stored font: if image was scaled we updated 'scale' state and multiply font size.
  // We'll store scale on the canvas element dataset (set in draw()).
  const scaleAttr = ctx.canvas.getAttribute('data-scale');
  const scale = scaleAttr ? Number(scaleAttr) : 1;
  ctx.save();
  const baseSize = pos.fontSize || (isName?48:28);
  // Use same font family constant (fallback to Arial if not present in closure)
  const ff = 'Arial';
  ctx.font = `${isName? 'bold ': ''}${Math.round(baseSize*scale)}px ${ff}`;
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const x = pos.x * scale;
  const y = pos.y * scale;
  ctx.fillStyle = (isName? pos.color || '#ffffff' : pos.color || '#ffeb3b') + 'dd';
  ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.65)';
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}
