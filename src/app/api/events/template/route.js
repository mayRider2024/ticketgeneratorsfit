import { NextResponse } from 'next/server';
import { setEventTemplate } from '@/lib/eventsStore';
import { setMemoryData, getMemoryData } from '../../../../lib/storage.js';
import path from 'path';
import crypto from 'crypto';

export const runtime = 'nodejs';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const id = formData.get('id');
    const file = formData.get('file');
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'file required' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (buffer.length === 0) return NextResponse.json({ error: 'empty file' }, { status: 400 });

    const ext = path.extname(file.name || '').toLowerCase() || '.png';
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    // Convert image to base64 data URL for memory storage (Vercel compatible)
    const mimeType = ext === '.png' ? 'image/png' : 
                     ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const base64 = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64}`;

    // Store in memory with a unique identifier
    const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0,12);
    const templateId = `${id}-${hash}`;
    
    // Store the template in memory
    const templates = getMemoryData('templates') || {};
    templates[templateId] = {
      dataUrl,
      uploadedAt: new Date().toISOString(),
      mimeType,
      eventId: id
    };
    setMemoryData('templates', templates);

    // Use template ID as the path reference
    const templatePath = templateId;
    const updated = await setEventTemplate(id, templatePath);

    return NextResponse.json({ event: updated });
  } catch (e) {
    console.error('Template upload failed', e);
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}
