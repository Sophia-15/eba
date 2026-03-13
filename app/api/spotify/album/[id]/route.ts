import { getSpotifyAccessToken } from '@/lib/spotifyServer';
import { NextResponse } from 'next/server';

async function fetchAllAlbumTracks(
  albumId: string,
  token: string,
  albumMeta: {
    name: string;
    artists: Array<{ id: string; name: string }>;
    images: Array<{ url: string }>;
  },
) {
  const tracks: Array<{
    id: string;
    name: string;
    artists: Array<{ id: string; name: string }>;
    album: typeof albumMeta & { id: string };
    preview_url: string | null;
    duration_ms: number;
  }> = [];

  let url: string | null =
    `https://api.spotify.com/v1/albums/${albumId}/tracks?limit=50`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) break;
    const data = await res.json();
    for (const track of data.items ?? []) {
      tracks.push({
        ...track,
        album: { ...albumMeta, id: albumId },
      });
    }
    url = data.next ?? null;
  }

  return tracks;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const token = await getSpotifyAccessToken();

    const metaRes = await fetch(`https://api.spotify.com/v1/albums/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!metaRes.ok) {
      return NextResponse.json(
        { error: `Album not found: ${metaRes.statusText}` },
        { status: metaRes.status },
      );
    }

    const meta = await metaRes.json();
    const albumMeta = {
      name: meta.name,
      artists: meta.artists,
      images: meta.images,
      release_date: meta.release_date,
    };

    const allTracks = await fetchAllAlbumTracks(id, token, albumMeta);

    // Keep all tracks. Preview URLs are often null in Spotify's API.
    const validTracks = allTracks;

    return NextResponse.json({
      id: meta.id,
      name: meta.name,
      artists: meta.artists,
      images: meta.images,
      release_date: meta.release_date,
      totalTracks: meta.total_tracks,
      tracks: validTracks,
    });
  } catch (err) {
    console.error('Album fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch album' },
      { status: 500 },
    );
  }
}
