import { NextResponse } from 'next/server';
import { getMemoryData, setMemoryData } from '../../../../lib/storage.js';

export async function GET() {
  try {
    const status = getMemoryData('dashboardStatus') || { enabled: true };
    
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