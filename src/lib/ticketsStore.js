import { promises as fs } from 'fs';
import path from 'path';
import { prisma } from './prismaClient';

// Simple JSON file persistence for issued tickets
// Each ticket record: {
//   eventId, ticketId, name, date, other,
//   issuedAt, hasEntered (bool), enteredAt (iso|null), lastUpdatedAt
// }

const ticketsPath = path.join(process.cwd(), 'tickets.json');

async function ensureFile() {
  try { await fs.access(ticketsPath); } catch { await fs.writeFile(ticketsPath, '[]', 'utf8'); }
}

async function readAll() {
  await ensureFile();
  try {
    const raw = await fs.readFile(ticketsPath, 'utf8');
    const data = JSON.parse(raw || '[]');
    if (Array.isArray(data)) return data;
  } catch {/* ignore */}
  return [];
}

async function writeAll(list) {
  await fs.writeFile(ticketsPath, JSON.stringify(list, null, 2), 'utf8');
}

export async function issueTicket({ eventId, ticketId, name, date, other, email }) {
  if (!eventId || !ticketId) throw new Error('eventId and ticketId required');
  if (!name || !name.trim()) throw new Error('name required');
  if (prisma) {
    // Upsert by composite (eventId, ticketCode)
  const data = { eventId, ticketCode: ticketId, name: name.trim(), date: date || '', other: other || '', email: email ? email.trim() : null };
    // Find existing
    const existing = await prisma.ticket.findFirst({ where: { eventId, ticketCode: ticketId } });
    if (existing && !existing.hasEntered) {
      const updated = await prisma.ticket.update({ where: { id: existing.id }, data });
      return { created: false, ticket: mapDbTicket(updated) };
    }
    if (existing) return { created: false, ticket: mapDbTicket(existing) };
    const created = await prisma.ticket.create({ data: { ...data } });
    return { created: true, ticket: mapDbTicket(created) };
  }
  const all = await readAll();
  const existing = all.find(t => t.eventId === eventId && t.ticketId === ticketId);
  const now = new Date().toISOString();
  if (existing) {
    if (!existing.hasEntered) {
      existing.name = name.trim();
      existing.date = date || '';
      existing.other = other || '';
      existing.lastUpdatedAt = now;
      await writeAll(all);
    }
    return { created: false, ticket: existing };
  }
  const ticket = { eventId, ticketId, name: name.trim(), date: date || '', other: other || '', email: email ? email.trim() : '', issuedAt: now, hasEntered: false, enteredAt: null, lastUpdatedAt: now };
  all.push(ticket);
  await writeAll(all);
  return { created: true, ticket };
}

export async function getTicket(eventId, ticketId) {
  if (prisma) {
    const t = await prisma.ticket.findFirst({ where: { eventId, ticketCode: ticketId } });
    return t ? mapDbTicket(t) : null;
  }
  const all = await readAll();
  return all.find(t => t.eventId === eventId && t.ticketId === ticketId) || null;
}

export async function markEntry(eventId, ticketId) {
  if (prisma) {
    const existing = await prisma.ticket.findFirst({ where: { eventId, ticketCode: ticketId } });
    if (!existing) return null;
    if (existing.hasEntered) return { updated: false, ticket: mapDbTicket(existing) };
    const updated = await prisma.ticket.update({ where: { id: existing.id }, data: { hasEntered: true, enteredAt: new Date() } });
    return { updated: true, ticket: mapDbTicket(updated) };
  }
  const all = await readAll();
  const t = all.find(r => r.eventId === eventId && r.ticketId === ticketId);
  if (!t) return null;
  if (!t.hasEntered) {
    t.hasEntered = true;
    t.enteredAt = new Date().toISOString();
    t.lastUpdatedAt = t.enteredAt;
    await writeAll(all);
    return { updated: true, ticket: t };
  }
  return { updated: false, ticket: t };
}

export async function listTicketsByEvent(eventId) {
  if (prisma) {
    const list = await prisma.ticket.findMany({ where: { eventId } });
    return list.map(mapDbTicket);
  }
  const all = await readAll();
  return all.filter(t => t.eventId === eventId);
}

export async function deleteTicket(eventId, ticketId) {
  if (!eventId || !ticketId) {
    throw new Error('eventId and ticketId are required');
  }

  if (prisma) {
    try {
      const existing = await prisma.ticket.findFirst({ 
        where: { eventId, ticketCode: ticketId } 
      });
      
      if (!existing) {
        return false; // Ticket not found
      }
      
      await prisma.ticket.delete({ where: { id: existing.id } });
      return true;
    } catch (error) {
      console.error('Error deleting ticket from database:', error);
      throw error;
    }
  }

  // File-based storage fallback
  const all = await readAll();
  const ticketIndex = all.findIndex(t => t.eventId === eventId && t.ticketId === ticketId);
  
  if (ticketIndex === -1) {
    return false; // Ticket not found
  }
  
  all.splice(ticketIndex, 1);
  await writeAll(all);
  return true;
}

export async function deleteAllTickets(eventId) {
  if (!eventId) throw new Error('eventId is required');

  if (prisma) {
    try {
      const result = await prisma.ticket.deleteMany({ where: { eventId } });
      return result.count;
    } catch (error) {
      console.error('Error deleting all tickets from database:', error);
      throw error;
    }
  }

  // File-based storage fallback
  const all = await readAll();
  const remaining = all.filter(t => t.eventId !== eventId);
  const deletedCount = all.length - remaining.length;
  await writeAll(remaining);
  return deletedCount;
}

function mapDbTicket(t) {
  return {
    eventId: t.eventId,
    ticketId: t.ticketCode,
    name: t.name,
    date: t.date || '',
    other: t.other || '',
    issuedAt: t.issuedAt?.toISOString?.() || t.issuedAt,
    hasEntered: t.hasEntered,
    enteredAt: t.enteredAt ? (t.enteredAt.toISOString ? t.enteredAt.toISOString() : t.enteredAt) : null,
    email: t.email || ''
  };
}
