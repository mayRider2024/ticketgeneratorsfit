import { promises as fs } from 'fs';
import path from 'path';

const scansPath = path.join(process.cwd(), 'scans.json');
// Grace period (ms) within which repeated scans of the same ticket
// are treated as the original scan (helps avoid rapid duplicate detection
// caused by multiple frames decoding the same QR consecutively).
const GRACE_MS = 15000; // 15 seconds

async function ensureFile() {
  try { await fs.access(scansPath); } catch { await fs.writeFile(scansPath, '[]', 'utf8'); }
}

export async function recordScan(payload) {
  await ensureFile();
  const raw = await fs.readFile(scansPath, 'utf8');
  let data = [];
  try { data = JSON.parse(raw || '[]'); } catch { data = []; }
  if (!Array.isArray(data)) data = [];
  const { eventId, ticketId } = payload;
  if (!eventId || !ticketId) throw new Error('eventId and ticketId required');
  const existing = data.find(r => r.eventId === eventId && r.ticketId === ticketId);
  const nowDate = new Date();
  const nowIso = nowDate.toISOString();
  if (existing) {
    // Determine if within grace window.
    const firstTs = existing.firstScannedAt ? new Date(existing.firstScannedAt).getTime() : 0;
    const withinGrace = (nowDate.getTime() - firstTs) < GRACE_MS;
    if (withinGrace) {
      // Do not increment count yet; treat as initial scan.
      return { duplicate: false, record: existing, withinGrace: true };
    }
    existing.count = (existing.count || 1) + 1;
    existing.lastScannedAt = nowIso;
    await fs.writeFile(scansPath, JSON.stringify(data, null, 2), 'utf8');
    return { duplicate: true, record: existing, withinGrace: false };
  }
  const record = {
    eventId,
    ticketId,
    name: payload.name || '',
    date: payload.date || '',
    other: payload.other || '',
    createdAt: nowIso,
    firstScannedAt: nowIso,
    lastScannedAt: nowIso,
    count: 1
  };
  data.push(record);
  await fs.writeFile(scansPath, JSON.stringify(data, null, 2), 'utf8');
  return { duplicate: false, record, withinGrace: true };
}

export async function getScan(eventId, ticketId) {
  await ensureFile();
  const raw = await fs.readFile(scansPath, 'utf8');
  let data = [];
  try { data = JSON.parse(raw || '[]'); } catch { data = []; }
  return data.find(r => r.eventId === eventId && r.ticketId === ticketId) || null;
}
