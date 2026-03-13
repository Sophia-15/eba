import { getSpotifyAccessToken } from '@/lib/spotifyServer';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const token = await getSpotifyAccessToken();
    return NextResponse.json({ access_token: token });
  } catch (error: any) {
    console.error('Spotify token error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch Spotify token' },
      { status: 500 },
    );
  }
}
