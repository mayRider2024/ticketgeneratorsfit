import { NextResponse } from 'next/server';
import { setMemoryData } from '../../../../lib/storage.js';

export async function POST(request) {
  try {
    const { enabled } = await request.json();
    
    // Write new status to memory storage
    const statusData = { enabled };
    setMemoryData('dashboardStatus', statusData);
    
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