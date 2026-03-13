import { getSpotifyAccessToken } from '@/lib/spotifyServer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const type = searchParams.get('type') ?? 'playlist,album';
  const limit = searchParams.get('limit') ?? '10';

  if (!query) {
    return NextResponse.json(
      { error: 'Missing query parameter' },
      { status: 400 },
    );
  }

  try {
    const token = await getSpotifyAccessToken();

    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: `Spotify search failed: ${response.statusText}` },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('Spotify search error:', err);
    return NextResponse.json(
      { error: 'Failed to search Spotify' },
      { status: 500 },
    );
  }
}
