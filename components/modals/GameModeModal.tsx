'use client';

import { useMemo } from 'react';
import { Dumbbell, Wind, X } from 'lucide-react';
import { z } from 'zod';

interface GameModeModalProps {
  isStarting: boolean;
  tracksToGuess: number;
  onTracksToGuessChange: (next: number) => void;
  onClose: () => void;
  onChooseMode: (difficultyMode: 'easy' | 'hard') => void | Promise<void>;
  maxSongs?: number;
}

export default function GameModeModal({
  isStarting,
  tracksToGuess,
  onTracksToGuessChange,
  onClose,
  onChooseMode,
  maxSongs,
}: GameModeModalProps) {
  const maxAllowedTracks = Math.max(1, maxSongs ?? 50);

  const trackCountSchema = useMemo(
    () =>
      z.object({
        tracksToGuess: z
          .number()
          .int('Track count must be a whole number')
          .min(1, 'Track count must be at least 1')
          .max(
            maxAllowedTracks,
            `Track count cannot exceed ${maxAllowedTracks}`,
          ),
      }),
    [maxAllowedTracks],
  );

  const parsedTrackCount = Number.isFinite(tracksToGuess)
    ? Math.floor(tracksToGuess)
    : Number.NaN;
  const isInputTemporarilyEmpty = !Number.isFinite(parsedTrackCount);
  const validation = trackCountSchema.safeParse({
    tracksToGuess: parsedTrackCount,
  });
  const trackCountError = isInputTemporarilyEmpty
    ? null
    : validation.success
      ? null
      : (validation.error.issues[0]?.message ?? 'Invalid track count');

  function handleChooseMode(difficultyMode: 'easy' | 'hard') {
    if (!validation.success || isStarting) return;
    void onChooseMode(difficultyMode);
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Choose your game mode</h3>
          <button
            type="button"
            className="rounded-md p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            onClick={onClose}
            aria-label="Close mode selection"
          >
            <X size={16} />
          </button>
        </div>

        <p className="mb-3 text-md text-[var(--color-text-muted)]">
          Your choice is locked until this game ends.
        </p>

        <label className="mb-4 block">
          <span className="mb-1 block text-xs tracking-wide text-[var(--color-text-muted)]">
            How many tracks?
          </span>
          <input
            type="number"
            min={1}
            max={maxAllowedTracks}
            value={tracksToGuess}
            onChange={(e) => {
              const next = Number.parseInt(e.target.value, 10);
              onTracksToGuessChange(next);
            }}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2"
          />
          {trackCountError && (
            <span className="mt-2 block text-sm font-semibold text-red-300">
              {trackCountError}
            </span>
          )}
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button
            type="button"
            className="flex flex-col items-start rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-left"
            onClick={() => handleChooseMode('easy')}
            disabled={isStarting || !validation.success}
          >
            <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#14532d]">
              <Wind className="text-[#22c55e]" />
            </span>
            <span className="mb-1 text-lg font-semibold">Easy</span>
            <span className="text-md text-[var(--color-text-muted)]">
              Cover is visible, gets clearer as guesses increase, and includes a
              3-second audio hint.
            </span>
          </button>
          <button
            type="button"
            className="flex flex-col items-start rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-left"
            onClick={() => handleChooseMode('hard')}
            disabled={isStarting || !validation.success}
          >
            <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#7f1d1d]">
              <Dumbbell className="text-[#ef4444]" />
            </span>
            <span className="mb-1 text-lg font-semibold text-red-200">
              Hard
            </span>
            <span className="text-md text-[var(--color-text-muted)]">
              Cover stays hidden during the whole round, but the 3-second audio
              hint is still available.
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
