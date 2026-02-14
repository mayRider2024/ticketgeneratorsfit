import { NextResponse } from 'next/server';
import { getMemoryData, setMemoryData } from '../../../../lib/storage.js';

// Default feature toggles
const DEFAULT_TOGGLES = {
  addEventSection: true,
  removeEventButton: true,
  designTicketButton: true,
  generateTicketButton: true,
  scanTicketsButton: true,
  ticketsButton: true,
  removeTicketButton: true,
  removeAllTicketsButton: true
};

// Read feature toggles from memory storage
function readToggles() {
  try {
    const toggles = getMemoryData('featureToggles');
    return { ...DEFAULT_TOGGLES, ...toggles };
  } catch (error) {
    console.error('Error reading feature toggles:', error);
    return DEFAULT_TOGGLES;
  }
}

// Write feature toggles to memory storage
function writeToggles(toggles) {
  try {
    setMemoryData('featureToggles', toggles);
    return true;
  } catch (error) {
    console.error('Error writing feature toggles:', error);
    return false;
  }
}

// GET - Get current feature toggles
export async function GET() {
  try {
    const toggles = readToggles();
    return NextResponse.json({ success: true, toggles });
  } catch (error) {
    console.error('Error getting feature toggles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get feature toggles' },
      { status: 500 }
    );
  }
}

// POST - Update feature toggles
export async function POST(request) {
  try {
    const body = await request.json();
    const { toggles } = body;

    if (!toggles || typeof toggles !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid toggles data' },
        { status: 400 }
      );
    }

    // Merge with existing toggles
    const currentToggles = readToggles();
    const updatedToggles = { ...currentToggles, ...toggles };

    const success = writeToggles(updatedToggles);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Feature toggles updated successfully',
        toggles: updatedToggles 
      });
    } else {
      return NextResponse.json(
        { success: false, error: 'Failed to save feature toggles' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating feature toggles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update feature toggles' },
      { status: 500 }
    );
  }
}