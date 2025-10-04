// Memory storage for Vercel-compatible data persistence
// Note: Data will reset when serverless functions restart

let memoryStore = {
  events: [],
  dashboardStatus: { enabled: true },
  featureToggles: {
    addEventSection: true,
    removeEventButton: true,
    designTicketButton: true,
    generateTicketButton: true,
    scanTicketsButton: true,
    ticketsButton: true
  },
  templates: {},
  scans: [],
  tickets: {}
};

// Events storage
export function getMemoryData(key) {
  return memoryStore[key] || (key === 'events' ? [] : {});
}

export function setMemoryData(key, data) {
  memoryStore[key] = data;
  return data;
}

export function updateMemoryData(key, updateFn) {
  const currentData = getMemoryData(key);
  const updatedData = updateFn(currentData);
  return setMemoryData(key, updatedData);
}

// Initialize with default data if needed
export function initializeMemoryStore() {
  if (!memoryStore.events || memoryStore.events.length === 0) {
    memoryStore.events = [
      {
        id: 'default-event-1',
        name: 'Sample Event',
        date: new Date().toISOString().split('T')[0],
        description: 'This is a sample event for demonstration',
        createdAt: new Date().toISOString()
      }
    ];
  }
  return memoryStore;
}

// Reset all data (for testing purposes)
export function resetMemoryStore() {
  memoryStore = {
    events: [],
    dashboardStatus: { enabled: true },
    featureToggles: {
      addEventSection: true,
      removeEventButton: true,
      designTicketButton: true,
      generateTicketButton: true,
      scanTicketsButton: true,
      ticketsButton: true
    },
    templates: {},
    scans: [],
    tickets: {}
  };
  return memoryStore;
}