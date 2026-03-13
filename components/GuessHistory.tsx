'use client';

import type { Guess } from '@/types/game';
import { GuessResult } from '@/types/game';
import styles from './GuessHistory.module.css';

interface GuessHistoryProps {
  guesses: Guess[];
  maxGuesses?: number;
}

export default function GuessHistory({
  guesses,
  maxGuesses = 6,
}: GuessHistoryProps) {
  const emptySlots = Array.from({
    length: Math.max(0, maxGuesses - guesses.length),
  });

  return (
    <div className={styles.container}>
      {guesses.map((guess) => (
        <div
          key={guess.id}
          className={`${styles.slot} ${styles[guess.result]}`}
        >
          <span className={styles.icon}>
            {guess.result === GuessResult.CORRECT
              ? '✅'
              : guess.result === GuessResult.PARTIAL
                ? '🟡'
                : guess.result === GuessResult.SKIPPED
                  ? '⏭'
                  : '❌'}
          </span>
          <span className={styles.text}>
            {guess.result === GuessResult.SKIPPED
              ? 'Skipped'
              : guess.text || '—'}
          </span>
        </div>
      ))}
      {emptySlots.map((_, i) => (
        <div key={`empty-${i}`} className={`${styles.slot} ${styles.empty}`}>
          <span className={styles.icon}>○</span>
        </div>
      ))}
    </div>
  );
}
