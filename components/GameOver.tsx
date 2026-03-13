'use client';

import type { GameState } from '@/types/game';
import { GuessResult } from '@/types/game';

interface GameOverProps {
  gameState: GameState;
  onPlayAgain: () => void;
  onExit: () => void;
}

export default function GameOver({
  gameState,
  onPlayAgain,
  onExit,
}: GameOverProps) {
  const totalRounds = gameState.rounds.length;
  const correctRounds = gameState.rounds.filter((r) =>
    r.guesses.some((g) => g.result === GuessResult.CORRECT),
  ).length;
  const accuracy =
    totalRounds > 0 ? Math.round((correctRounds / totalRounds) * 100) : 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <span className="mb-2 block text-4xl">🏆</span>
        <h2 className="text-2xl font-black">Game Over!</h2>
        <p className="text-md text-[var(--color-text-muted)]">
          {gameState.playlistName}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Stat
          label="Total Score"
          value={gameState.totalScore.toLocaleString()}
          highlight
        />
        <Stat label="Correct" value={`${correctRounds} / ${totalRounds}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
      </div>

      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        {gameState.rounds.map((round, i) => {
          const won = round.guesses.some(
            (g) => g.result === GuessResult.CORRECT,
          );
          return (
            <div
              key={round.songId}
              className={`mb-2 grid grid-cols-[auto_auto_1fr_auto] items-center gap-2 rounded-lg border px-3 py-2 text-md ${won ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}
            >
              <span>#{i + 1}</span>
              <span>{won ? '✅' : '❌'}</span>
              <span className="truncate">{round.songTitle}</span>
              <span className="font-semibold">
                {won ? `+${round.score}` : '0'}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <button
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-md font-semibold text-white"
          onClick={onPlayAgain}
        >
          🔄 Play Again
        </button>
        <button
          className="rounded-lg border border-[var(--color-border)] bg-transparent px-4 py-2 text-md font-semibold"
          onClick={onExit}
        >
          ← Back to Library
        </button>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 text-center ${
        highlight
          ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-subtle)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface)]'
      }`}
    >
      <span className="block text-xl font-bold">{value}</span>
      <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>
    </div>
  );
}
