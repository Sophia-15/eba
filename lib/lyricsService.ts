import {
  getLyricsBySongId,
  saveLyrics,
  updateSongLyricsStatus,
} from './storage';

export async function fetchLyrics(
  songId: string,
  title: string,
  artist: string,
  album: string,
  durationMs: number,
): Promise<string | null> {
  // 1. Check IndexedDB cache first
  const cached = await getLyricsBySongId(songId);
  if (cached) return cached.lyrics;

  // 2. Call LRCLIB API
  // Convert duration to seconds (LRCLIB expects seconds)
  const duration = Math.round(durationMs / 1000);

  const url = new URL('https://lrclib.net/api/get');
  url.searchParams.set('track_name', title);
  url.searchParams.set('artist_name', artist);
  url.searchParams.set('album_name', album);
  url.searchParams.set('duration', duration.toString());

  async function saveLyricsRecord(
    lyricsText: string,
    sourceId: string | number,
  ): Promise<string> {
    const lyricsId = `lyrics-${songId}-${Date.now()}`;
    await saveLyrics({
      id: lyricsId,
      songId,
      lyrics: lyricsText,
      source: `LRCLIB-${sourceId}`,
      fetchedAt: Date.now(),
    });
    await updateSongLyricsStatus(songId, 'ready', lyricsId);
    return lyricsText;
  }

  try {
    const res = await fetch(url.toString());

    if (!res.ok) {
      if (res.status === 404) {
        // Fallback: search with looser matching (title + artist).
        const searchUrl = new URL('https://lrclib.net/api/search');
        searchUrl.searchParams.set('track_name', title);
        searchUrl.searchParams.set('artist_name', artist);

        const searchRes = await fetch(searchUrl.toString());
        if (!searchRes.ok) return null;

        const searchData = (await searchRes.json()) as Array<{
          id: number;
          plainLyrics?: string;
        }>;

        const hit = searchData.find((item) => item.plainLyrics);
        if (!hit?.plainLyrics) return null;

        return saveLyricsRecord(hit.plainLyrics, hit.id);
      }
      // 500s or other errors might come from LRCLIB too
      console.warn(`LRCLIB error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();

    if (!data.plainLyrics) return null;

    return saveLyricsRecord(data.plainLyrics, data.id);
  } catch (error) {
    console.warn(`Failed to fetch lyrics for ${title} via LRCLIB:`, error);
    return null;
  }
}

export async function fetchLyricsForSong(
  songId: string,
  title: string,
  artist: string,
  album: string,
  durationMs: number,
): Promise<{ success: boolean; lyrics?: string }> {
  try {
    await updateSongLyricsStatus(songId, 'fetching');
    const lyrics = await fetchLyrics(songId, title, artist, album, durationMs);

    if (!lyrics) {
      await updateSongLyricsStatus(songId, 'unavailable');
      return { success: false };
    }

    return { success: true, lyrics };
  } catch (err) {
    console.error(`Failed to fetch lyrics for ${title} by ${artist}:`, err);
    await updateSongLyricsStatus(songId, 'failed');
    return { success: false };
  }
}
