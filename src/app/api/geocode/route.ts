import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { location } = await request.json();
    console.log('Geocode API called with location:', location);

    if (!location) {
      return NextResponse.json(
        { error: 'Location is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.WEATHER_API_KEY;
    console.log('API Key available:', !!apiKey);

    if (!apiKey) {
      return NextResponse.json(
        { error: 'WeatherAPI key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `http://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(location)}`
    );

    if (!response.ok) {
      console.error(`WeatherAPI geocoding error: ${response.status} for location: ${location}`);
      return NextResponse.json(
        { error: `WeatherAPI returned ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log(`Geocoding result for "${location}":`, data);

    if (!data.location) {
      return NextResponse.json(
        { error: `Location "${location}" not found. Try a different location format.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      lat: data.location.lat,
      lon: data.location.lon,
    });
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return NextResponse.json(
      { error: 'Failed to get coordinates for location' },
      { status: 500 }
    );
  }
}