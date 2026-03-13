'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import type { SpotifySource, Song } from '@/types/playlist';
import type { StoredSource, StoredSong } from '@/types/storage';
import {
  getSources,
  getSource,
  saveSource,
  deleteSource,
  getSongsBySource,
  saveSongs,
} from '@/lib/storage';
import { getPlaylistTracks, getAlbumTracks } from '@/lib/spotifyService';
import { prefetchLyricsForSource } from '@/lib/backgroundSync';

export interface SyncProgress {
  sourceId: string;
  fetched: number;
  total: number;
  failed: number;
}

interface PlaylistContextValue {
  sources: StoredSource[];
  isLoading: boolean;
  syncProgress: Map<string, SyncProgress>;
  addPlaylist: (spotifyId: string) => Promise<void>;
  addAlbum: (spotifyId: string) => Promise<void>;
  removeSource: (id: string) => Promise<void>;
  getSongsForSource: (sourceId: string) => Promise<StoredSong[]>;
  getAllSongs: () => Promise<StoredSong[]>;
  syncLyricsForSource: (sourceId: string) => Promise<void>;
  syncLyricsForAll: () => Promise<void>;
  refreshSources: () => Promise<void>;
}

const PlaylistContext = createContext<PlaylistContextValue | null>(null);

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const [sources, setSources] = useState<StoredSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncProgress, setSyncProgress] = useState<Map<string, SyncProgress>>(
    new Map(),
  );

  const refreshSources = useCallback(async () => {
    const all = await getSources();
    setSources(all.sort((a, b) => b.addedAt - a.addedAt));
  }, []);

  useEffect(() => {
    refreshSources().finally(() => setIsLoading(false));
  }, [refreshSources]);

  const startLyricsPrefetch = useCallback(
    async (sourceId: string, songs: Song[]) => {
      // Set initial progress
      setSyncProgress((prev) =>
        new Map(prev).set(sourceId, {
          sourceId,
          fetched: 0,
          total: songs.length,
          failed: 0,
        }),
      );

      const abortController = new AbortController();

      await prefetchLyricsForSource(
        sourceId,
        (fetched, total, failed) => {
          setSyncProgress((prev) =>
            new Map(prev).set(sourceId, { sourceId, fetched, total, failed }),
          );
        },
        abortController.signal,
      );

      // Clear progress after completion
      setTimeout(() => {
        setSyncProgress((prev) => {
          const next = new Map(prev);
          next.delete(sourceId);
          return next;
        });
      }, 3000);
    },
    [],
  );

  const addPlaylist = useCallback(
    async (spotifyId: string) => {
      setIsLoading(true);
      try {
        const { meta, songs } = await getPlaylistTracks(spotifyId);
        const sourceId = `playlist-${spotifyId}`;

        const source: StoredSource = {
          id: sourceId,
          type: 'playlist',
          spotifyId,
          name: (meta.name as string) ?? 'Unknown Playlist',
          ownerOrArtist:
            (meta.owner as { display_name?: string })?.display_name ??
            'Unknown',
          imageUrl: (meta.images as Array<{ url: string }>)?.[0]?.url ?? '',
          trackCount: songs.length,
          addedAt: Date.now(),
          syncedAt: Date.now(),
        };

        await saveSource(source);
        const storedSongs: StoredSong[] = songs.map((s) => ({
          ...s,
          updatedAt: Date.now(),
        }));
        await saveSongs(storedSongs);
        await refreshSources();
      } finally {
        setIsLoading(false);
      }
    },
    [refreshSources],
  );

  const addAlbum = useCallback(
    async (spotifyId: string) => {
      setIsLoading(true);
      try {
        const { meta, songs } = await getAlbumTracks(spotifyId);
        const sourceId = `album-${spotifyId}`;

        const source: StoredSource = {
          id: sourceId,
          type: 'album',
          spotifyId,
          name: (meta.name as string) ?? 'Unknown Album',
          ownerOrArtist:
            (meta.artists as Array<{ name: string }>)?.[0]?.name ?? 'Unknown',
          imageUrl: (meta.images as Array<{ url: string }>)?.[0]?.url ?? '',
          trackCount: songs.length,
          addedAt: Date.now(),
          syncedAt: Date.now(),
        };

        await saveSource(source);
        const storedSongs: StoredSong[] = songs.map((s) => ({
          ...s,
          updatedAt: Date.now(),
        }));
        await saveSongs(storedSongs);
        await refreshSources();
      } finally {
        setIsLoading(false);
      }
    },
    [refreshSources],
  );

  const removeSource = useCallback(
    async (id: string) => {
      await deleteSource(id);
      await refreshSources();
    },
    [refreshSources],
  );

  const refillSongsForSource = useCallback(async (source: StoredSource) => {
    const { songs } =
      source.type === 'playlist'
        ? await getPlaylistTracks(source.spotifyId)
        : await getAlbumTracks(source.spotifyId);

    const storedSongs: StoredSong[] = songs.map((song) => ({
      ...song,
      updatedAt: Date.now(),
    }));
    await saveSongs(storedSongs);
    return storedSongs;
  }, []);

  const getSongsForSource = useCallback(
    async (sourceId: string): Promise<StoredSong[]> => {
      const existing = await getSongsBySource(sourceId);
      if (existing.length > 0) return existing;

      // Auto-heal missing song data by refetching from Spotify.
      const source =
        sources.find((item) => item.id === sourceId) ??
        (await getSource(sourceId));
      if (!source) return [];

      return refillSongsForSource(source);
    },
    [sources, refillSongsForSource],
  );

  const getAllSongs = useCallback(async (): Promise<StoredSong[]> => {
    // Read sources from DB directly so Play All works even if React state is not fully hydrated yet.
    const persistedSources = await getSources();
    const sourceList = persistedSources.length > 0 ? persistedSources : sources;

    const allSongs = await Promise.all(
      sourceList.map(async (source) => getSongsForSource(source.id)),
    );
    return allSongs.flat();
  }, [sources, getSongsForSource]);

  const syncLyricsForSource = useCallback(
    async (sourceId: string): Promise<void> => {
      const songs = await getSongsForSource(sourceId);
      await startLyricsPrefetch(sourceId, songs);
    },
    [startLyricsPrefetch, getSongsForSource],
  );

  const syncLyricsForAll = useCallback(async (): Promise<void> => {
    const persistedSources = await getSources();
    const sourceList = persistedSources.length > 0 ? persistedSources : sources;

    // Sequential sync avoids flooding external APIs and is more reliable.
    for (const source of sourceList) {
      const songs = await getSongsForSource(source.id);
      await startLyricsPrefetch(source.id, songs);
    }
  }, [sources, startLyricsPrefetch, getSongsForSource]);

  return (
    <PlaylistContext.Provider
      value={{
        sources,
        isLoading,
        syncProgress,
        addPlaylist,
        addAlbum,
        removeSource,
        getSongsForSource,
        getAllSongs,
        syncLyricsForSource,
        syncLyricsForAll,
        refreshSources,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist(): PlaylistContextValue {
  const ctx = useContext(PlaylistContext);
  if (!ctx) throw new Error('usePlaylist must be used within PlaylistProvider');
  return ctx;
}
