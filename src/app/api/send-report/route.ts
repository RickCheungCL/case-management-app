import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const reportData = await request.json();

    console.log('📊 Attempting to save to Google Sheets...');
    console.log('📦 Data being sent:', JSON.stringify(reportData, null, 2));

    const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;
    console.log('🔗 Google Script URL:', GOOGLE_SCRIPT_URL);
    
    if (GOOGLE_SCRIPT_URL) {
      const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData)
      });
      
      console.log('📨 Response status:', response.status);
      console.log('📨 Response ok:', response.ok);
      
      // Try to read the response
      const responseText = await response.text();
      console.log('📨 Response body:', responseText);
      
      console.log('✅ Request completed');
    } else {
      console.log('❌ GOOGLE_SCRIPT_URL is not defined!');
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Data saved to Google Sheets successfully' 
    });

  } catch (error) {
    console.error('❌ Error saving to Google Sheets:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to save data' 
      },
      { status: 500 }
    );
  }
}