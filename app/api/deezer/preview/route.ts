import { findDeezerPreview } from '@/lib/deezerServer';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title')?.trim() ?? '';
  const artist = searchParams.get('artist')?.trim() ?? '';

  if (!title || !artist) {
    return NextResponse.json(
      { error: 'title and artist are required' },
      { status: 400 },
    );
  }

  try {
    const previewUrl = await findDeezerPreview(title, artist);
    return NextResponse.json({ previewUrl });
  } catch (error) {
    console.error('Deezer preview lookup failed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preview' },
      { status: 502 },
    );
  }
}
