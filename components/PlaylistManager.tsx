'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Music2, Plus, Play, RefreshCw } from 'lucide-react';
import type { StoredSource } from '@/types/storage';
import type { SyncProgress } from '@/contexts/PlaylistContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useGame } from '@/contexts/GameContext';
import { GameMode } from '@/types/game';
import PlaylistCard from './PlaylistCard';
import AddSourceModal from './AddSourceModal';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import styles from './PlaylistManager.module.css';

interface PlaylistManagerProps {
  onStartGame: () => void;
}

export default function PlaylistManager({ onStartGame }: PlaylistManagerProps) {
  const {
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
  } = usePlaylist();
  const { startGame } = useGame();
  const [showModal, setShowModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  async function handleAdd(id: string, type: 'playlist' | 'album') {
    if (type === 'playlist') {
      await addPlaylist(id);
    } else {
      await addAlbum(id);
    }
  }

  async function handlePlayAll() {
    setIsStarting(true);
    try {
      const allSongs = await getAllSongs();
      // Remove duplicates if any (though unlikely with unique IDs from Spotify)
      const uniqueSongs = Array.from(
        new Map(allSongs.map((s) => [s.id, s])).values(),
      );

      if (uniqueSongs.length === 0) {
        toast.error('Your library is empty. Add a playlist or album first.');
        return;
      }

      await startGame('library', 'My Library', uniqueSongs, GameMode.PLAYLIST);
      onStartGame();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start game');
    } finally {
      setIsStarting(false);
    }
  }

  async function handleSyncAllLyrics() {
    setIsSyncingAll(true);
    toast.info('Starting lyrics sync for all sources...');
    try {
      await syncLyricsForAll();
      toast.success('Lyrics sync completed for all sources.');
    } catch (err: any) {
      toast.error(err?.message || 'Lyrics sync failed');
    } finally {
      setIsSyncingAll(false);
    }
  }

  async function handlePlay(source: StoredSource) {
    try {
      const songs = await getSongsForSource(source.id);
      await startGame(source.id, source.name, songs, GameMode.PLAYLIST);
      onStartGame();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start game');
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Remove this from your library?')) {
      await removeSource(id);
    }
  }

  async function handleSyncLyricsForSource(sourceId: string) {
    toast.info('Starting lyrics sync...');
    try {
      await syncLyricsForSource(sourceId);
      toast.success('Lyrics sync completed for this source.');
    } catch (err: any) {
      toast.error(err?.message || 'Lyrics sync failed');
    }
  }

  const totalSync = Array.from(syncProgress.values()).reduce(
    (acc, item) => {
      acc.fetched += item.fetched;
      acc.failed += item.failed;
      acc.total += item.total;
      return acc;
    },
    { fetched: 0, failed: 0, total: 0 },
  );
  const hasSyncInProgress = totalSync.total > 0;

  if (isLoading && sources.length === 0) {
    return (
      <div className={styles.loadingWrapper}>
        <LoadingSpinner label="Loading library..." />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.toolbar}>
        <h2 className={styles.heading}>My Library</h2>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          {sources.length > 0 && (
            <button
              className={styles.addBtn}
              onClick={handleSyncAllLyrics}
              disabled={isSyncingAll}
              style={{ cursor: isSyncingAll ? 'wait' : 'pointer' }}
            >
              <RefreshCw size={16} />{' '}
              {isSyncingAll ? 'Syncing...' : 'Sync Lyrics'}
            </button>
          )}
          {sources.length > 0 && (
            <button
              className={styles.addBtn}
              onClick={handlePlayAll}
              disabled={isStarting}
              style={{
                backgroundColor: 'var(--color-primary)',
                cursor: isStarting ? 'wait' : 'pointer',
              }}
            >
              <Play size={16} /> {isStarting ? 'Starting...' : 'Play All'}
            </button>
          )}
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            <Plus size={16} /> Add Source
          </button>
        </div>
      </div>

      {hasSyncInProgress && (
        <p className={styles.syncSummary}>
          Syncing lyrics: {totalSync.fetched + totalSync.failed}/
          {totalSync.total}
        </p>
      )}

      {sources.length === 0 ? (
        <EmptyState
          icon={<Music2 size={42} />}
          title="No music sources yet"
          description="Add a Spotify playlist or album to start playing Lyricle!"
          action={{
            label: 'Add Playlist or Album',
            onClick: () => setShowModal(true),
          }}
        />
      ) : (
        <div className={styles.grid}>
          {sources.map((source) => (
            <PlaylistCard
              key={source.id}
              source={source}
              syncProgress={syncProgress.get(source.id)}
              onPlay={handlePlay}
              onDelete={handleDelete}
              onSyncLyrics={handleSyncLyricsForSource}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddSourceModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}
    </div>
  );
}
