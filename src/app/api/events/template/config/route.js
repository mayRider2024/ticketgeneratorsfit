import { NextResponse } from 'next/server';
import { updateTemplateConfig } from '@/lib/eventsStore';

export async function POST(req) {
  try {
    const body = await req.json();
    const { id, config } = body || {};
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
    const updated = await updateTemplateConfig(id, config);
    return NextResponse.json({ event: updated });
  } catch (e) {
    return NextResponse.json({ error: e.message || 'Failed to save config' }, { status: 400 });
  }
}
