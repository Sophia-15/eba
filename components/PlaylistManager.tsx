'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Music2, Plus, Play } from 'lucide-react';
import type { StoredSource } from '@/types/storage';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useGame } from '@/contexts/GameContext';
import { useSettings } from '@/contexts/SettingsContext';
import { GameMode } from '@/types/game';
import { shuffleSongs } from '@/lib/gameLogic';
import PlaylistCard from './PlaylistCard';
import AddSourceModal from './modals/AddSourceModal';
import GameModeModal from './modals/GameModeModal';
import RemoveSourceModal from './modals/RemoveSourceModal';
import EmptyState from './EmptyState';
import LoadingSpinner from './LoadingSpinner';

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
  const [maxSongs, setMaxSongs] = useState(0);

  async function handleAdd(id: string, type: 'playlist' | 'album') {
    if (type === 'playlist') {
      await addPlaylist(id);
    } else {
      await addAlbum(id);
    }
  }

  async function handlePlayAll() {
    const allSongs = await getAllSongs();
    setMaxSongs(allSongs.length);
    setTracksToGuess(allSongs.length);
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
    setMaxSongs(Math.max(1, source.trackCount || 1));
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
    const upperBound = Math.max(1, maxSongs || 1);
    const normalizedInput = Number.isFinite(tracksToGuess)
      ? Math.floor(tracksToGuess)
      : 1;
    const selectedTrackCount = Math.max(
      1,
      Math.min(upperBound, normalizedInput),
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
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading library..." />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-3xl font-black">My Library</h2>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex h-12 items-center gap-2 rounded-2xl border border-[var(--color-border)] bg-transparent px-5 text-base font-semibold text-[var(--color-text)] transition hover:bg-[var(--color-surface-2)]"
            onClick={() => setShowModal(true)}
          >
            <Plus size={18} /> Add Source
          </button>
          {sources.length > 0 && (
            <button
              className="inline-flex h-12 items-center gap-2 rounded-2xl bg-[var(--color-accent)] px-6 text-base font-semibold text-white shadow-[0_14px_34px_color-mix(in_srbg,var(--color-accent)_30%,transparent)] transition hover:brightness-110 disabled:cursor-wait disabled:opacity-70"
              onClick={handlePlayAll}
              disabled={isStarting}
            >
              <Play size={18} /> {isStarting ? 'Starting...' : 'Play All'}
            </button>
          )}
        </div>
      </div>

      {sources.length === 0 ? (
        <EmptyState
          icon={<Music2 size={42} />}
          title="No music sources yet"
          description="Add a Spotify playlist or album to start playing ToBeNamed!"
          action={{
            label: 'Add Playlist or Album',
            onClick: () => setShowModal(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,260px))] justify-start gap-5">
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
        <GameModeModal
          isStarting={isStarting}
          tracksToGuess={tracksToGuess}
          onTracksToGuessChange={setTracksToGuess}
          onClose={() => setPendingStart(null)}
          onChooseMode={handleModeChoice}
          maxSongs={maxSongs}
        />
      )}

      {pendingDelete && (
        <RemoveSourceModal
          source={pendingDelete}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
        />
      )}
    </div>
  );
}
