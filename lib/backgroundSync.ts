import { fetchLyricsForSong } from './lyricsService';
import { getPendingSongs, updateSongLyricsStatus } from './storage';

type ProgressCallback = (
  fetched: number,
  total: number,
  failed: number,
) => void;

const RATE_LIMIT_DELAY_MS = 1500; // 1.5s between requests

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function prefetchLyricsForSource(
  sourceId: string,
  onProgress?: ProgressCallback,
  signal?: AbortSignal,
): Promise<{ fetched: number; failed: number; total: number }> {
  const songs = await getPendingSongs(sourceId);
  const total = songs.length;
  let fetched = 0;
  let failed = 0;

  onProgress?.(0, total, 0);

  for (const song of songs) {
    if (signal?.aborted) break;

    // Mark as fetching
    await updateSongLyricsStatus(song.id, 'fetching');

    const result = await fetchLyricsForSong(
      song.id,
      song.title,
      song.artistName,
      song.albumName,
      song.durationMs,
    );

    if (result.success) {
      fetched++;
    } else {
      failed++;
    }

    onProgress?.(fetched, total, failed);

    // Respect Genius rate limits
    if (signal?.aborted) break;
    await sleep(RATE_LIMIT_DELAY_MS);
  }

  return { fetched, failed, total };
}
