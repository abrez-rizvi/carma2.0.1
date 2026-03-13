import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/src/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${API_BASE_URL}/api/emission/forecast/days`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ days: body?.days ?? 30 }),
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({
      status: 'error',
      message: 'Invalid backend response'
    }));

    if (!response.ok) {
      return NextResponse.json(
        {
          status: 'error',
          message: data?.message || `Backend error: ${response.status}`
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Emission forecast proxy error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Unable to fetch emission forecast'
      },
      { status: 502 }
    );
  }
}
