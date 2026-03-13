'use client';

import type { StoredGameHistory } from '@/types/storage';
import { GuessResult } from '@/types/game';

interface GameDetailsModalProps {
  game: StoredGameHistory;
  onClose: () => void;
}

export default function GameDetailsModal({
  game,
  onClose,
}: GameDetailsModalProps) {
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{game.playlistName}</h3>
          <button
            className="rounded-lg border border-[var(--color-border)] px-3 py-1 text-md"
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="mb-4 space-y-1 text-md">
          <p>
            <strong>Date:</strong> {formatDate(game.startedAt)}
          </p>
          <p>
            <strong>Total score:</strong> {game.totalScore.toLocaleString()}
          </p>
          <p>
            <strong>Correct songs:</strong>{' '}
            {
              game.rounds.filter((r) =>
                r.guesses.some((g) => g.result === GuessResult.CORRECT),
              ).length
            }
            /{game.rounds.length}
          </p>
          <p>
            <strong>Mode:</strong>{' '}
            {(game.difficultyMode ?? 'hard').toUpperCase()}
          </p>
        </div>

        <div className="space-y-2">
          {game.rounds.map((round, index) => {
            const won = round.guesses.some(
              (g) => g.result === GuessResult.CORRECT,
            );
            return (
              <div
                key={round.songId}
                className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-md"
              >
                <span>#{index + 1}</span>
                <span className="truncate">{round.songTitle}</span>
                <span className={won ? 'text-emerald-300' : 'text-red-300'}>
                  {won ? '✅' : '❌'} {won ? `+${round.score}` : '0'}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDate(ts: number): string {
  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(ts));
}
