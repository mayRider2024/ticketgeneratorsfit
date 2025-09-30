import { NextResponse } from 'next/server';
import { setEventTemplate } from '@/lib/eventsStore';
import { promises as fs } from 'fs';
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

    const hash = crypto.createHash('sha1').update(buffer).digest('hex').slice(0,12);
    const fileName = `${id}-${hash}${ext}`;
    const dir = path.join(process.cwd(), 'public', 'templates');
    await fs.mkdir(dir, { recursive: true });
    const outPath = path.join(dir, fileName);
    await fs.writeFile(outPath, buffer);

    const relativePublicPath = `/templates/${fileName}`;
    const updated = await setEventTemplate(id, relativePublicPath);

    return NextResponse.json({ event: updated });
  } catch (e) {
    console.error('Template upload failed', e);
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}
