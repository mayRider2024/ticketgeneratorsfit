import { NextResponse } from 'next/server';
import { getMemoryData } from '../../../../lib/storage.js';

export async function GET(request, { params }) {
  try {
    const { templateId } = params;
    
    if (!templateId) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 });
    }

    const templates = getMemoryData('templates') || {};
    const template = templates[templateId];

    if (!template || !template.dataUrl) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Extract base64 data from data URL
    const base64Data = template.dataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');

    // Return the image with appropriate headers
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': template.mimeType,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Content-Length': buffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Error serving template:', error);
    return NextResponse.json({ error: 'Failed to serve template' }, { status: 500 });
  }
}