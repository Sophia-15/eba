import { getSpotifyAccessToken } from '@/lib/spotifyServer';
import type { SpotifyPlaylistItem } from '@/types/api';
import { NextResponse } from 'next/server';

async function fetchAllPlaylistTracks(
  playlistId: string,
  token: string,
): Promise<SpotifyPlaylistItem[]> {
  const items: SpotifyPlaylistItem[] = [];
  let url: string | null =
    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100&fields=items(track(id,name,artists,album,preview_url,duration_ms)),next`;

  while (url) {
    const res: Response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) break;
    const data = await res.json();
    items.push(...(data.items ?? []));
    url = data.next ?? null;
  }
  return items;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const token = await getSpotifyAccessToken();

    // Fetch playlist metadata
    const metaRes = await fetch(
      `https://api.spotify.com/v1/playlists/${id}?fields=id,name,description,owner,images,tracks.total`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!metaRes.ok) {
      return NextResponse.json(
        { error: `Playlist not found: ${metaRes.statusText}` },
        { status: metaRes.status },
      );
    }

    const meta = await metaRes.json();
    const allItems = await fetchAllPlaylistTracks(id, token);

    // Keep all non-null tracks. Preview URLs are often null in Spotify's API.
    const validItems = allItems
      .filter((item) => item.track)
      .map((item) => item.track);

    return NextResponse.json({
      id: meta.id,
      name: meta.name,
      description: meta.description,
      owner: meta.owner,
      images: meta.images,
      totalTracks: meta.tracks.total,
      tracks: validItems,
    });
  } catch (err) {
    console.error('Playlist fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 },
    );
  }
}
