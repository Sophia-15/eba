'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Music2, Plus, Play, X } from 'lucide-react';
import type { StoredSource } from '@/types/storage';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { GameMode } from '@/types/game';
import { shuffleSongs } from '@/lib/gameLogic';
import PlaylistCard from './PlaylistCard';
import AddSourceModal from './AddSourceModal';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';
import styles from './PlaylistManager.module.css';

interface PlaylistManagerProps {
  onStartGame: () => void;
}

type PendingStart =
  | { kind: 'all' }
  | { kind: 'source'; source: StoredSource }
  | null;

export default function PlaylistManager({ onStartGame }: PlaylistManagerProps) {
  const {
    sources,
    isLoading,
    addPlaylist,
    addAlbum,
    removeSource,
    getSongsForSource,
    getAllSongs,
  } = usePlaylist();
  const { startGame } = useGame();
  const { updatePreferences } = useSettings();
  const [showModal, setShowModal] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [pendingStart, setPendingStart] = useState<PendingStart>(null);
  const [pendingDelete, setPendingDelete] = useState<StoredSource | null>(null);
  const [tracksToGuess, setTracksToGuess] = useState(10);

  async function handleAdd(id: string, type: 'playlist' | 'album') {
    if (type === 'playlist') {
      await addPlaylist(id);
    } else {
      await addAlbum(id);
    }
  }

  function handlePlayAll() {
    setPendingStart({ kind: 'all' });
  }

  async function runPlayAll(
    difficultyMode: 'easy' | 'hard',
    trackCount: number,
  ) {
    setIsStarting(true);
    try {
      const allSongs = await getAllSongs();
      // Remove duplicates if any (though unlikely with unique IDs from Spotify)
      const uniqueSongs = Array.from(
        new Map(allSongs.map((s) => [s.id, s])).values(),
      );
      const shuffledSongs = shuffleSongs(uniqueSongs);

      if (shuffledSongs.length === 0) {
        toast.error('Your library is empty. Add a playlist or album first.');
        return;
      }

      await startGame(
        'library',
        'My Library',
        shuffledSongs,
        GameMode.PLAYLIST,
        difficultyMode,
        trackCount,
      );
      onStartGame();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to start game';
      toast.error(message);
    } finally {
      setIsStarting(false);
    }
  }

  function handlePlay(source: StoredSource) {
    setPendingStart({ kind: 'source', source });
  }

  async function runPlaySource(
    source: StoredSource,
    difficultyMode: 'easy' | 'hard',
    trackCount: number,
  ) {
    try {
      const songs = await getSongsForSource(source.id);
      await startGame(
        source.id,
        source.name,
        songs,
        GameMode.PLAYLIST,
        difficultyMode,
        trackCount,
      );
      onStartGame();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Failed to start game';
      toast.error(message);
    }
  }

  async function handleModeChoice(difficultyMode: 'easy' | 'hard') {
    if (!pendingStart) return;

    updatePreferences({ difficulty: difficultyMode });

    const startIntent = pendingStart;
    setPendingStart(null);
    const selectedTrackCount = Math.max(
      1,
      Math.min(50, Math.floor(tracksToGuess)),
    );

    if (startIntent.kind === 'all') {
      await runPlayAll(difficultyMode, selectedTrackCount);
      return;
    }

    await runPlaySource(startIntent.source, difficultyMode, selectedTrackCount);
  }

  function handleDelete(id: string) {
    const source = sources.find((item) => item.id === id);
    if (!source) return;
    setPendingDelete(source);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await removeSource(pendingDelete.id);
    setPendingDelete(null);
  }

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
              onPlay={handlePlay}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddSourceModal onAdd={handleAdd} onClose={() => setShowModal(false)} />
      )}

      {pendingStart && (
        <div
          className={styles.modeOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingStart(null);
          }}
        >
          <div className={styles.modeModal} role="dialog" aria-modal="true">
            <div className={styles.modeHeader}>
              <h3 className={styles.modeTitle}>Choose your game mode</h3>
              <button
                type="button"
                className={styles.modeCloseBtn}
                onClick={() => setPendingStart(null)}
                aria-label="Close mode selection"
              >
                <X size={16} />
              </button>
            </div>

            <p className={styles.modeFootnote}>
              Your choice is locked until this game ends.
            </p>

            <label className={styles.trackCountField}>
              <span className={styles.trackCountLabel}>How many tracks?</span>
              <input
                type="number"
                min={1}
                max={50}
                value={tracksToGuess}
                onChange={(e) => {
                  const raw = Number(e.target.value);
                  if (!Number.isFinite(raw)) return;
                  setTracksToGuess(Math.max(1, Math.min(50, Math.floor(raw))));
                }}
                className={styles.trackCountInput}
              />
            </label>

            <div className={styles.modeCards}>
              <button
                type="button"
                className={`${styles.modeCard} ${styles.modeCardEasy}`}
                onClick={() => void handleModeChoice('easy')}
                disabled={isStarting}
              >
                <span className={styles.modeEmojiWrap}>
                  <span className={styles.modeEmojiEasy}>🌬️</span>
                </span>
                <span className={styles.modeCardTitle}>Easy</span>
                <span className={styles.modeCardDesc}>
                  Cover is visible and gets clearer as guesses increase.
                </span>
              </button>
              <button
                type="button"
                className={`${styles.modeCard} ${styles.modeCardHard}`}
                onClick={() => void handleModeChoice('hard')}
                disabled={isStarting}
              >
                <span
                  className={`${styles.modeEmojiWrap} ${styles.modeEmojiWrapHard}`}
                >
                  <span className={styles.modeEmojiHard}>🌬️</span>
                </span>
                <span className={styles.modeCardTitle}>Hard</span>
                <span
                  className={`${styles.modeCardDesc} ${styles.modeCardDescHard}`}
                >
                  Cover stays hidden during the whole round.
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingDelete && (
        <div
          className={styles.deleteOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setPendingDelete(null);
          }}
        >
          <div className={styles.deleteModal} role="dialog" aria-modal="true">
            <h3 className={styles.deleteTitle}>Remove source?</h3>
            <p className={styles.deleteText}>
              This will remove <strong>{pendingDelete.name}</strong> from your
              library.
            </p>
            <div className={styles.deleteActions}>
              <button
                type="button"
                className={styles.deleteCancelBtn}
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteConfirmBtn}
                onClick={() => void confirmDelete()}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
