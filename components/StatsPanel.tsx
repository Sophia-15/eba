'use client';

import { useCallback } from 'react';
import { getStatistics, getGameHistory } from '@/lib/storage';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import type { StoredStatistics, StoredGameHistory } from '@/types/storage';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import { GuessResult } from '@/types/game';
import styles from './StatsPanel.module.css';

export default function StatsPanel() {
  const fetchStats = useCallback(() => getStatistics(), []);
  const fetchHistory = useCallback(() => getGameHistory(20), []);

  const { data: stats, isLoading: statsLoading } = useIndexedDB<
    StoredStatistics | undefined
  >(fetchStats);
  const { data: history, isLoading: historyLoading } =
    useIndexedDB<StoredGameHistory[]>(fetchHistory);

  if (statsLoading || historyLoading) {
    return (
      <div className={styles.centered}>
        <LoadingSpinner label="Loading stats..." />
      </div>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <EmptyState
        icon="📊"
        title="No stats yet"
        description="Complete a game session to see your statistics here!"
      />
    );
  }

  return (
    <div className={styles.container}>
      <h2 className={styles.heading}>Statistics</h2>

      <div className={styles.statsGrid}>
        <StatCard
          label="Games Played"
          value={stats.totalGames.toString()}
          icon="🎮"
        />
        <StatCard
          label="Avg Score"
          value={stats.averageScore.toLocaleString()}
          icon="⭐"
        />
        <StatCard
          label="Best Streak"
          value={stats.bestStreak.toString()}
          icon="🔥"
        />
        <StatCard
          label="Total Score"
          value={stats.totalScore.toLocaleString()}
          icon="🏆"
          highlight
        />
        <StatCard
          label="Accuracy"
          value={
            stats.totalRounds > 0
              ? `${Math.round((stats.correctGuesses / stats.totalRounds) * 100)}%`
              : '0%'
          }
          icon="🎯"
        />
        <StatCard
          label="Songs Guessed"
          value={stats.correctGuesses.toString()}
          icon="✅"
        />
      </div>

      {history && history.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.subheading}>Recent Games</h3>
          <div className={styles.historyList}>
            {history.map((game) => {
              const correct = game.rounds.filter((r) =>
                r.guesses.some((g) => g.result === GuessResult.CORRECT),
              ).length;
              return (
                <div key={game.id} className={styles.historyRow}>
                  <div className={styles.historyLeft}>
                    <p className={styles.historyPlaylist}>
                      {game.playlistName}
                    </p>
                    <p className={styles.historyDate}>
                      {formatDate(game.startedAt)}
                    </p>
                  </div>
                  <div className={styles.historyRight}>
                    <span className={styles.historyResult}>
                      {correct}/{game.rounds.length}
                    </span>
                    <span className={styles.historyScore}>
                      {game.totalScore.toLocaleString()} pts
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className={`${styles.statCard} ${highlight ? styles.highlight : ''}`}>
      <span className={styles.statIcon}>{icon}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
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
