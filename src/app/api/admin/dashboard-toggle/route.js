import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const STATUS_FILE = path.join(process.cwd(), 'dashboard-status.json');

export async function POST(request) {
  try {
    const { enabled } = await request.json();
    
    // Write new status to file
    const statusData = { enabled };
    fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData));
    
    return NextResponse.json({
      success: true,
      enabled
    });
  } catch (error) {
    console.error('Error updating dashboard status:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to update dashboard status'
    }, { status: 500 });
  }
}