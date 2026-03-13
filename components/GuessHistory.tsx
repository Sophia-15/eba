'use client';

import type { Guess } from '@/types/game';
import { GuessResult } from '@/types/game';

interface GuessHistoryProps {
  guesses: Guess[];
}

export default function GuessHistory({ guesses }: GuessHistoryProps) {
  return (
    <div className="grid gap-2">
      {guesses.map((guess) => (
        <div
          key={guess.id}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-md ${
            guess.result === GuessResult.CORRECT
              ? 'border-emerald-500/40 bg-emerald-500/10'
              : guess.result === GuessResult.PARTIAL
                ? 'border-amber-500/40 bg-amber-500/10'
                : guess.result === GuessResult.SKIPPED
                  ? 'border-slate-500/40 bg-slate-500/10'
                  : 'border-red-500/40 bg-red-500/10'
          }`}
        >
          <span>
            {guess.result === GuessResult.CORRECT
              ? '✅'
              : guess.result === GuessResult.PARTIAL
                ? '🟡'
                : guess.result === GuessResult.SKIPPED
                  ? '⏭'
                  : '❌'}
          </span>
          <span className="text-[var(--color-text)]">
            {guess.result === GuessResult.SKIPPED
              ? 'Skipped'
              : guess.text || '—'}
          </span>
        </div>
      ))}
    </div>
  );
}
