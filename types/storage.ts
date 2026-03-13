import type { GameState, GameStats } from './game';
import type { Song, SpotifySource } from './playlist';

export interface StoredSource extends SpotifySource {
  syncedAt: number;
}

export interface StoredSong extends Song {
  updatedAt: number;
}

export interface StoredLyrics {
  id: string;
  songId: string;
  lyrics: string;
  source: string;
  fetchedAt: number;
  expiresAt: number;
}

export interface StoredGameHistory extends GameState {
  savedAt: number;
}

export interface StoredStatistics extends GameStats {
  id: string;
  updatedAt: number;
}
