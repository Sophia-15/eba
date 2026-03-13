import type {
  StoredGameHistory,
  StoredLyrics,
  StoredSong,
  StoredSource,
  StoredStatistics,
} from '@/types/storage';
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

export interface LyricleDB extends DBSchema {
  sources: {
    key: string;
    value: StoredSource;
    indexes: {
      'by-type': string;
      'by-added': number;
    };
  };
  songs: {
    key: string;
    value: StoredSong;
    indexes: {
      'by-source': string;
      'by-lyrics-status': string;
      'by-artist': string;
    };
  };
  lyrics: {
    key: string;
    value: StoredLyrics;
    indexes: {
      'by-song': string;
      'by-expires': number;
    };
  };
  'game-history': {
    key: string;
    value: StoredGameHistory;
    indexes: {
      'by-started': number;
      'by-playlist': string;
    };
  };
  statistics: {
    key: string;
    value: StoredStatistics;
  };
}

const DB_NAME = 'lyricle-db';
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<LyricleDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<LyricleDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LyricleDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Sources store
        if (!db.objectStoreNames.contains('sources')) {
          const sourcesStore = db.createObjectStore('sources', {
            keyPath: 'id',
          });
          sourcesStore.createIndex('by-type', 'type');
          sourcesStore.createIndex('by-added', 'addedAt');
        }

        // Songs store
        if (!db.objectStoreNames.contains('songs')) {
          const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
          songsStore.createIndex('by-source', 'sourceId');
          songsStore.createIndex('by-lyrics-status', 'lyricsStatus');
          songsStore.createIndex('by-artist', 'artistName');
        }

        // Lyrics store
        if (!db.objectStoreNames.contains('lyrics')) {
          const lyricsStore = db.createObjectStore('lyrics', { keyPath: 'id' });
          lyricsStore.createIndex('by-song', 'songId');
          lyricsStore.createIndex('by-expires', 'expiresAt');
        }

        // Game history store
        if (!db.objectStoreNames.contains('game-history')) {
          const historyStore = db.createObjectStore('game-history', {
            keyPath: 'id',
          });
          historyStore.createIndex('by-started', 'startedAt');
          historyStore.createIndex('by-playlist', 'playlistId');
        }

        // Statistics store
        if (!db.objectStoreNames.contains('statistics')) {
          db.createObjectStore('statistics', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}
