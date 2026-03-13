import type { SpotifyTrack } from '@/types/api';
import type { Song } from '@/types/playlist';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

function spotifyTrackToSong(track: SpotifyTrack, sourceId: string): Song {
  return {
    // Include sourceId in the key so the same Spotify track can exist in multiple sources.
    id: `spotify-${sourceId}-${track.id}`,
    spotifyId: track.id,
    title: track.name,
    artistName: track.artists[0]?.name ?? 'Unknown Artist',
    artistId: track.artists[0]?.id ?? '',
    albumName: track.album.name,
    albumId: track.album.id,
    albumArt: track.album.images[0]?.url ?? '',
    previewUrl: track.preview_url ?? '',
    durationMs: track.duration_ms,
    sourceId,
    addedAt: Date.now(),
    lyricsStatus: 'pending',
  };
}

export async function searchSpotify(
  query: string,
  type: 'playlist,album' | 'track' = 'playlist,album',
  limit = 30,
) {
  const res = await fetch(
    `${API_BASE}/spotify/search?q=${encodeURIComponent(query)}&type=${type}&limit=${limit}`,
  );
  if (!res.ok) throw new Error(`Search failed: ${res.statusText}`);
  return res.json();
}

export async function getPlaylist(
  playlistId: string,
): Promise<{ meta: Record<string, unknown>; songs: Song[] }> {
  return getPlaylistTracks(playlistId);
}

export async function getAlbum(
  albumId: string,
): Promise<{ meta: Record<string, unknown>; songs: Song[] }> {
  const res = await fetch(`${API_BASE}/spotify/album/${albumId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Failed to fetch album: ${res.statusText}`);
  }

  const data = await res.json();
  const sourceId = `album-${albumId}`;
  const songs = (data.tracks ?? [])
    .filter((t: SpotifyTrack) => t)
    .map((t: SpotifyTrack) =>
      spotifyTrackToSong(
        {
          ...t,
          album: {
            id: albumId,
            name: data.name,
            images: data.images,
            artists: data.artists,
            release_date: data.release_date,
          },
        },
        sourceId,
      ),
    );

  return { meta: data, songs };
}

export async function getPlaylistTracks(
  playlistId: string,
): Promise<{ meta: Record<string, unknown>; songs: Song[] }> {
  const res = await fetch(`${API_BASE}/spotify/playlist/${playlistId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Failed to fetch playlist: ${res.statusText}`);
  }

  const data = await res.json();
  const sourceId = `playlist-${playlistId}`;
  const songs = (data.tracks ?? [])
    .filter((t: SpotifyTrack) => t)
    .map((t: SpotifyTrack) => spotifyTrackToSong(t, sourceId));

  return { meta: data, songs };
}

export async function getAlbumTracks(
  albumId: string,
): Promise<{ meta: Record<string, unknown>; songs: Song[] }> {
  const res = await fetch(`${API_BASE}/spotify/album/${albumId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? `Failed to fetch album: ${res.statusText}`);
  }

  const data = await res.json();
  const sourceId = `album-${albumId}`;
  const songs = (data.tracks ?? [])
    .filter((t: SpotifyTrack) => t)
    .map((t: SpotifyTrack) =>
      spotifyTrackToSong(
        {
          ...t,
          album: {
            id: albumId,
            name: data.name,
            images: data.images,
            artists: data.artists,
            release_date: data.release_date,
          },
        },
        sourceId,
      ),
    );

  return { meta: data, songs };
}
