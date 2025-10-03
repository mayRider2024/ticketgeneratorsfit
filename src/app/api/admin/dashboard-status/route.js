import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join(process.cwd(), 'dashboard-status.json');

// Initialize status file if it doesn't exist
function initializeStatusFile() {
  if (!fs.existsSync(STATUS_FILE)) {
    fs.writeFileSync(STATUS_FILE, JSON.stringify({ enabled: true }));
  }
}

export async function GET() {
  try {
    initializeStatusFile();
    const data = fs.readFileSync(STATUS_FILE, 'utf8');
    const status = JSON.parse(data);
    
    return NextResponse.json({
      success: true,
      enabled: status.enabled
    });
  } catch (error) {
    console.error('Error reading dashboard status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to read dashboard status'
    }, { status: 500 });
  }
}