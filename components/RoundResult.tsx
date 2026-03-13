'use client';

import type { GameRound } from '@/types/game';
import { GuessResult } from '@/types/game';

interface RoundResultProps {
  round: GameRound;
  roundNumber: number;
  totalRounds: number;
  onNext: () => void;
}

export default function RoundResult({
  round,
  roundNumber,
  totalRounds,
  onNext,
}: RoundResultProps) {
  const won = round.guesses.some((g) => g.result === GuessResult.CORRECT);
  const isLast = roundNumber >= totalRounds;

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div
        className={`mb-4 rounded-xl border p-4 text-center ${won ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}
      >
        <span className="mb-1 block text-3xl">{won ? '🎉' : '😔'}</span>
        <h2 className="text-2xl font-bold">
          {won ? 'Correct!' : 'Not quite...'}
        </h2>
        {!won && (
          <p className="mt-2 text-md text-[var(--color-text-muted)]">
            The answer was: <strong>{round.songTitle}</strong>
          </p>
        )}
        {won && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-[var(--color-accent-subtle)] px-4 py-1">
            <span className="text-xs text-[var(--color-text-muted)]">
              Score
            </span>
            <span className="text-lg font-bold text-[var(--color-accent)]">
              +{round.score}
            </span>
          </div>
        )}
      </div>

      <div className="mb-4 flex items-center gap-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
        {round.albumArt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={round.albumArt}
            alt={round.albumName}
            className="h-16 w-16 rounded-lg object-cover"
          />
        )}
        <div>
          <p className="font-semibold text-[var(--color-text)]">
            {round.songTitle}
          </p>
          <p className="text-md text-[var(--color-text-muted)]">
            {round.artistName}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {round.albumName}
          </p>
        </div>
      </div>

      <button
        className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-2 text-md font-semibold text-white"
        onClick={onNext}
      >
        {isLast ? '🏁 See Results' : '⏭ Next Song'}
      </button>
    </div>
  );
}
