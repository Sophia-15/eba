'use client';

import type { GameRound } from '@/types/game';
import { GuessResult } from '@/types/game';
import styles from './RoundResult.module.css';

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
    <div className={styles.container}>
      <div className={`${styles.result} ${won ? styles.won : styles.lost}`}>
        <span className={styles.emoji}>{won ? '🎉' : '😔'}</span>
        <h2 className={styles.resultTitle}>
          {won ? 'Correct!' : 'Not quite...'}
        </h2>
        {!won && (
          <p className={styles.correctAnswer}>
            The answer was: <strong>{round.songTitle}</strong>
          </p>
        )}
        {won && (
          <div className={styles.scoreDisplay}>
            <span className={styles.scoreLabel}>Score</span>
            <span className={styles.scoreValue}>+{round.score}</span>
          </div>
        )}
      </div>

      <div className={styles.songDetails}>
        {round.albumArt && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={round.albumArt}
            alt={round.albumName}
            className={styles.albumArt}
          />
        )}
        <div className={styles.songInfo}>
          <p className={styles.songTitle}>{round.songTitle}</p>
          <p className={styles.artistName}>{round.artistName}</p>
          <p className={styles.albumName}>{round.albumName}</p>
        </div>
      </div>

      <button className={styles.nextBtn} onClick={onNext}>
        {isLast ? '🏁 See Results' : '⏭ Next Song'}
      </button>
    </div>
  );
}
