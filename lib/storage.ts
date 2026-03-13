import type { GameStats } from '@/types/game';
import type {
  StoredGameHistory,
  StoredLyrics,
  StoredSong,
  StoredSource,
  StoredStatistics,
} from '@/types/storage';
import { getDB } from './db';

const LYRICS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ---- Sources ----

export async function getSources(): Promise<StoredSource[]> {
  const db = await getDB();
  return db.getAll('sources');
}

export async function getSource(id: string): Promise<StoredSource | undefined> {
  const db = await getDB();
  return db.get('sources', id);
}

export async function saveSource(source: StoredSource): Promise<void> {
  const db = await getDB();
  await db.put('sources', source);
}

export async function deleteSource(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('sources', id);
  // Delete associated songs
  const songs = await getSongsBySource(id);
  const tx = db.transaction(['songs', 'lyrics'], 'readwrite');
  for (const song of songs) {
    await tx.objectStore('songs').delete(song.id);
    if (song.lyricsId) {
      await tx.objectStore('lyrics').delete(song.lyricsId);
    }
  }
  await tx.done;
}

// ---- Songs ----

export async function getSongsBySource(
  sourceId: string,
): Promise<StoredSong[]> {
  const db = await getDB();
  return db.getAllFromIndex('songs', 'by-source', sourceId);
}

export async function getSong(id: string): Promise<StoredSong | undefined> {
  const db = await getDB();
  return db.get('songs', id);
}

export async function saveSong(song: StoredSong): Promise<void> {
  const db = await getDB();
  await db.put('songs', song);
}

export async function saveSongs(songs: StoredSong[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('songs', 'readwrite');
  await Promise.all(songs.map((s) => tx.store.put(s)));
  await tx.done;
}

export async function updateSongLyricsStatus(
  songId: string,
  status: StoredSong['lyricsStatus'],
  lyricsId?: string,
): Promise<void> {
  const db = await getDB();
  const song = await db.get('songs', songId);
  if (!song) return;
  song.lyricsStatus = status;
  if (lyricsId) song.lyricsId = lyricsId;
  song.updatedAt = Date.now();
  await db.put('songs', song);
}

export async function getSongsWithLyrics(
  sourceId: string,
): Promise<StoredSong[]> {
  const songs = await getSongsBySource(sourceId);
  return songs.filter((s) => s.lyricsStatus === 'ready');
}

export async function getPendingSongs(sourceId: string): Promise<StoredSong[]> {
  const songs = await getSongsBySource(sourceId);
  return songs.filter(
    (s) => s.lyricsStatus === 'pending' || s.lyricsStatus === 'failed',
  );
}

// ---- Lyrics ----

export async function getLyricsBySongId(
  songId: string,
): Promise<StoredLyrics | undefined> {
  const db = await getDB();
  const results = await db.getAllFromIndex('lyrics', 'by-song', songId);
  const now = Date.now();
  return results.find((l) => l.expiresAt > now);
}

export async function saveLyrics(
  lyrics: Omit<StoredLyrics, 'expiresAt'>,
): Promise<StoredLyrics> {
  const db = await getDB();
  const stored: StoredLyrics = {
    ...lyrics,
    expiresAt: Date.now() + LYRICS_TTL_MS,
  };
  await db.put('lyrics', stored);
  return stored;
}

export async function deleteExpiredLyrics(): Promise<number> {
  const db = await getDB();
  const now = Date.now();
  const tx = db.transaction('lyrics', 'readwrite');
  const index = tx.store.index('by-expires');
  const range = IDBKeyRange.upperBound(now);
  let count = 0;
  let cursor = await index.openCursor(range);
  while (cursor) {
    await cursor.delete();
    count++;
    cursor = await cursor.continue();
  }
  await tx.done;
  return count;
}

// ---- Game History ----

export async function saveGameHistory(game: StoredGameHistory): Promise<void> {
  const db = await getDB();
  await db.put('game-history', game);
}

export async function getGameHistory(limit = 20): Promise<StoredGameHistory[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('game-history', 'by-started');
  return all.reverse().slice(0, limit);
}

// ---- Statistics ----

const STATS_KEY = 'global';

export async function getStatistics(): Promise<StoredStatistics | undefined> {
  const db = await getDB();
  return db.get('statistics', STATS_KEY);
}

export async function updateStatistics(
  patch: Partial<GameStats>,
): Promise<StoredStatistics> {
  const db = await getDB();
  const existing: StoredStatistics = (await db.get(
    'statistics',
    STATS_KEY,
  )) ?? {
    id: STATS_KEY,
    totalGames: 0,
    totalRounds: 0,
    totalScore: 0,
    averageScore: 0,
    correctGuesses: 0,
    incorrectGuesses: 0,
    skippedRounds: 0,
    bestStreak: 0,
    currentStreak: 0,
    updatedAt: Date.now(),
  };
  const updated: StoredStatistics = {
    ...existing,
    ...patch,
    id: STATS_KEY,
    updatedAt: Date.now(),
  };
  if (updated.totalRounds > 0) {
    updated.averageScore = Math.round(updated.totalScore / updated.totalRounds);
  }
  await db.put('statistics', updated);
  return updated;
}
