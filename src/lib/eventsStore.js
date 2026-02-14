import { randomUUID } from 'crypto';
import { prisma } from './prismaClient';
import { getMemoryData, setMemoryData } from './storage.js';
import { promises as fs } from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'events.json');

// Initialize memory storage with data from file system (for migration)
async function initializeEventsFromFile() {
  try {
    // Check if data already exists in memory
    const existingData = getMemoryData('events');
    if (existingData && existingData.length > 0) {
      return existingData; // Already initialized
    }

    // Try to read from file system
    try {
      await fs.access(filePath);
      const raw = await fs.readFile(filePath, 'utf8');
      const fileData = JSON.parse(raw || '[]');
      if (Array.isArray(fileData) && fileData.length > 0) {
        // Load file data into memory
        setMemoryData('events', fileData);
        console.log(`Loaded ${fileData.length} events from file system into memory`);
        return fileData;
      }
    } catch (fileError) {
      // File doesn't exist or is invalid, that's okay
      console.log('No existing events file found, starting with empty events');
    }

    // Set empty array if no data found
    setMemoryData('events', []);
    return [];
  } catch (error) {
    console.error('Error initializing events from file:', error);
    setMemoryData('events', []);
    return [];
  }
}

export async function getEvents() {
  // Always try database first if available
  if (prisma) {
    try {
      const events = await prisma.event.findMany({ 
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { tickets: true }
          }
        }
      });
      console.log(`Loaded ${events.length} events from database`);
      return events;
    } catch (error) {
      console.error('Database error, falling back to memory storage:', error);
    }
  }
  
  try {
    // Initialize from file if needed
    await initializeEventsFromFile();
    
    const data = getMemoryData('events') || [];
    if (!Array.isArray(data)) return [];
    return data.sort((a,b)=> new Date(b.createdAt) - new Date(a.createdAt));
  } catch (e) {
    console.error('Failed to read events from memory storage', e);
    return [];
  }
}

export async function addEvent({ name, dates, description }) {
  if (!name || !name.trim()) throw new Error('Event name required');
  if (!Array.isArray(dates) || dates.length === 0) throw new Error('At least one date required');
  const trimmedDates = dates.map(d => d.trim()).filter(Boolean);
  if (trimmedDates.length === 0) throw new Error('At least one valid date required');
  
  if (prisma) {
    return prisma.event.create({ data: { name: name.trim(), dates: trimmedDates, description: (description||'').trim() } });
  }
  
  const events = await getEvents();
  const event = { id: randomUUID(), name: name.trim(), dates: trimmedDates, description: (description || '').trim(), createdAt: new Date().toISOString() };
  events.push(event);
  setMemoryData('events', events);
  return event;
}

export async function removeEvent(id) {
  if (!id) throw new Error('Event id required');
  if (prisma) {
    try { return await prisma.event.delete({ where: { id } }); } catch { throw new Error('Event not found'); }
  }
  const events = await getEvents();
  const index = events.findIndex(e => e.id === id);
  if (index === -1) throw new Error('Event not found');
  const [removed] = events.splice(index, 1);
  setMemoryData('events', events);
  return removed;
}

export async function setEventTemplate(id, templatePath) {
  if (!id) throw new Error('Event id required');
  if (prisma) {
    try {
      return await prisma.event.update({ where: { id }, data: { templateImage: templatePath } });
    } catch { throw new Error('Event not found'); }
  }
  const events = await getEvents();
  const event = events.find(e => e.id === id);
  if (!event) throw new Error('Event not found');
  event.templateImage = templatePath; // template ID for memory storage
  event.templateUpdatedAt = new Date().toISOString();
  setMemoryData('events', events);
  return event;
}

export async function updateTemplateConfig(id, config) {
  if (!id) throw new Error('Event id required');
  const buildConfig = () => {
    const safeAlign = (a) => ['left','center','right'].includes(a) ? a : 'left';
    const safeBaseline = (b) => ['top','middle','bottom'].includes(b) ? b : 'top';
    const dateEnabled = config?.dateEnabled !== false && !!config?.date;
    const otherEnabled = !!config?.otherEnabled && !!config?.other;
    const newConfig = {
      name: { x: Number(config?.name?.x) || 0, y: Number(config?.name?.y) || 0, fontSize: Number(config?.name?.fontSize) || 48, color: config?.name?.color || '#ffffff', align: safeAlign(config?.name?.align), baseline: safeBaseline(config?.name?.baseline), rotation: Number(config?.name?.rotation) || 0, fontFamily: config?.name?.fontFamily || 'Arial' },
      outline: Boolean(config?.outline),
      dateEnabled,
      otherEnabled
    };
    if (dateEnabled) newConfig.date = { x: Number(config?.date?.x) || 0, y: Number(config?.date?.y) || 0, fontSize: Number(config?.date?.fontSize) || 28, color: config?.date?.color || '#ffeb3b', align: safeAlign(config?.date?.align), baseline: safeBaseline(config?.date?.baseline), rotation: Number(config?.date?.rotation) || 0, fontFamily: config?.date?.fontFamily || 'Arial' };
    if (otherEnabled) newConfig.other = { x: Number(config?.other?.x) || 0, y: Number(config?.other?.y) || 0, fontSize: Number(config?.other?.fontSize) || 24, color: config?.other?.color || '#ffffff', align: safeAlign(config?.other?.align), baseline: safeBaseline(config?.other?.baseline), rotation: Number(config?.other?.rotation) || 0, fontFamily: config?.other?.fontFamily || 'Arial', text: config?.other?.text || '' };
    if (config?.qr) {
      newConfig.qr = {
        x: Number(config.qr.x) || 0,
        y: typeof config.qr.y === 'number' ? config.qr.y : 1100,
        size: Number(config.qr.size) || 400
      };
    }
    return newConfig;
  };
  if (prisma) {
    try {
      return await prisma.event.update({ where: { id }, data: { templateConfig: buildConfig() } });
    } catch { throw new Error('Event not found'); }
  }
  const events = await getEvents();
  const event = events.find(e => e.id === id);
  if (!event) throw new Error('Event not found');
  if (config && typeof config === 'object') {
    event.templateConfig = buildConfig();
    event.templateLayoutUpdatedAt = new Date().toISOString();
  }
  setMemoryData('events', events);
  return event;
}