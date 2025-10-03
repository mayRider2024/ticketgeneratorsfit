import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for storing feature toggle settings
const TOGGLES_FILE = path.join(process.cwd(), 'feature-toggles.json');

// Default feature toggles
const DEFAULT_TOGGLES = {
  addEventSection: true,
  removeEventButton: true,
  designTicketButton: true,
  generateTicketButton: true,
  scanTicketsButton: true,
  ticketsButton: true
};

// Read feature toggles from file
function readToggles() {
  try {
    if (fs.existsSync(TOGGLES_FILE)) {
      const data = fs.readFileSync(TOGGLES_FILE, 'utf8');
      return { ...DEFAULT_TOGGLES, ...JSON.parse(data) };
    }
    return DEFAULT_TOGGLES;
  } catch (error) {
    console.error('Error reading feature toggles:', error);
    return DEFAULT_TOGGLES;
  }
}

// Write feature toggles to file
function writeToggles(toggles) {
  try {
    fs.writeFileSync(TOGGLES_FILE, JSON.stringify(toggles, null, 2));
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