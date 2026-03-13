'use client';

import type { GameState } from '@/types/game';
import { GuessResult } from '@/types/game';
import styles from './GameOver.module.css';

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
    <div className={styles.container}>
      <div className={styles.hero}>
        <span className={styles.trophy}>🏆</span>
        <h2 className={styles.title}>Game Over!</h2>
        <p className={styles.source}>{gameState.playlistName}</p>
      </div>

      <div className={styles.stats}>
        <Stat
          label="Total Score"
          value={gameState.totalScore.toLocaleString()}
          highlight
        />
        <Stat label="Correct" value={`${correctRounds} / ${totalRounds}`} />
        <Stat label="Accuracy" value={`${accuracy}%`} />
      </div>

      <div className={styles.roundSummary}>
        {gameState.rounds.map((round, i) => {
          const won = round.guesses.some(
            (g) => g.result === GuessResult.CORRECT,
          );
          return (
            <div
              key={round.songId}
              className={`${styles.roundRow} ${won ? styles.roundWon : styles.roundLost}`}
            >
              <span className={styles.roundNum}>#{i + 1}</span>
              <span className={styles.roundIcon}>{won ? '✅' : '❌'}</span>
              <span className={styles.roundTitle}>{round.songTitle}</span>
              <span className={styles.roundScore}>
                {won ? `+${round.score}` : '0'}
              </span>
            </div>
          );
        })}
      </div>

      <div className={styles.actions}>
        <button className={styles.playAgainBtn} onClick={onPlayAgain}>
          🔄 Play Again
        </button>
        <button className={styles.exitBtn} onClick={onExit}>
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
    <div className={`${styles.stat} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
