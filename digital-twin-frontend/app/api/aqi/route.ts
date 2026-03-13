import { NextRequest, NextResponse } from 'next/server';
import { API_BASE_URL } from '@/src/config';
export async function GET(request: NextRequest) {
  try {
    const lat = request.nextUrl.searchParams.get('lat') || '40.7128';
    const lon = request.nextUrl.searchParams.get('lon') || '-74.0060';

    const response = await fetch(
      `${API_BASE_URL}/api/aqi?lat=${lat}&lon=${lon}`,
      { cache: 'no-store' }
    );

    if (!response.ok) {
      // Return mock data if backend is not available
      return NextResponse.json({
        aqi_index: 2,
        pm2_5: 12.5,
        pm10: 25.0,
        o3: 45.2,
        no2: 28.5,
        so2: 8.1,
        co: 0.5
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('AQI API error:', error);
    // Return mock data on error for development
    return NextResponse.json({
      aqi_index: 2,
      pm2_5: 12.5,
      pm10: 25.0,
      o3: 45.2,
      no2: 28.5,
      so2: 8.1,
      co: 0.5
    });
  }
}
