'use client';

import { useCallback, useMemo, useState } from 'react';
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
  const [selectedGame, setSelectedGame] = useState<StoredGameHistory | null>(
    null,
  );

  const lastGame = history?.[0] ?? null;
  const globalAccuracy =
    stats && stats.totalRounds > 0
      ? Math.round((stats.correctGuesses / stats.totalRounds) * 100)
      : 0;
  const lastGameSummary = useMemo(() => {
    if (!lastGame) return null;
    const correct = lastGame.rounds.filter((r) =>
      r.guesses.some((g) => g.result === GuessResult.CORRECT),
    ).length;
    return {
      correct,
      total: lastGame.rounds.length,
      accuracy:
        lastGame.rounds.length > 0
          ? Math.round((correct / lastGame.rounds.length) * 100)
          : 0,
      score: lastGame.totalScore,
    };
  }, [lastGame]);

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

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Global (all games)</p>
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
        </div>
      </section>

      <section className={styles.section}>
        <p className={styles.sectionLabel}>Last game</p>
        <div className={styles.statsGrid}>
          <StatCard
            label="Score"
            value={
              lastGameSummary ? lastGameSummary.score.toLocaleString() : '-'
            }
            icon="🏁"
            highlight
          />
          <StatCard
            label="Correct"
            value={
              lastGameSummary
                ? `${lastGameSummary.correct}/${lastGameSummary.total}`
                : '-'
            }
            icon="✅"
          />
          <StatCard
            label="Accuracy"
            value={lastGameSummary ? `${lastGameSummary.accuracy}%` : '-'}
            icon="🎯"
          />
          <StatCard
            label="Mode"
            value={(lastGame?.difficultyMode ?? 'hard').toUpperCase()}
            icon="🧭"
          />
        </div>
      </section>

      {history && history.length > 0 && (
        <div className={styles.history}>
          <h3 className={styles.subheading}>Recent Games</h3>
          <div className={styles.historyList}>
            {history.map((game) => {
              const correct = game.rounds.filter((r) =>
                r.guesses.some((g) => g.result === GuessResult.CORRECT),
              ).length;
              return (
                <button
                  key={game.id}
                  className={styles.historyRow}
                  onClick={() => setSelectedGame(game)}
                  type="button"
                >
                  <span className={styles.historyLeft}>
                    <span className={styles.historyPlaylist}>
                      {game.playlistName}
                    </span>
                    <span className={styles.historyDate}>
                      {formatDate(game.startedAt)}
                    </span>
                  </span>
                  <span className={styles.historyRight}>
                    <span className={styles.historyResult}>
                      {correct}/{game.rounds.length}
                    </span>
                    <span className={styles.historyScore}>
                      {game.totalScore.toLocaleString()} pts
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedGame && (
        <div
          className={styles.modalOverlay}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedGame(null);
          }}
        >
          <div className={styles.modal} role="dialog" aria-modal="true">
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>{selectedGame.playlistName}</h3>
              <button
                className={styles.modalClose}
                onClick={() => setSelectedGame(null)}
                type="button"
              >
                Close
              </button>
            </div>

            <div className={styles.modalStats}>
              <p>
                <strong>Date:</strong> {formatDate(selectedGame.startedAt)}
              </p>
              <p>
                <strong>Total score:</strong>{' '}
                {selectedGame.totalScore.toLocaleString()}
              </p>
              <p>
                <strong>Correct songs:</strong>{' '}
                {
                  selectedGame.rounds.filter((r) =>
                    r.guesses.some((g) => g.result === GuessResult.CORRECT),
                  ).length
                }
                /{selectedGame.rounds.length}
              </p>
              <p>
                <strong>Mode:</strong>{' '}
                {(selectedGame.difficultyMode ?? 'hard').toUpperCase()}
              </p>
            </div>

            <div className={styles.modalRounds}>
              {selectedGame.rounds.map((round, index) => {
                const won = round.guesses.some(
                  (g) => g.result === GuessResult.CORRECT,
                );
                return (
                  <div key={round.songId} className={styles.roundRow}>
                    <span className={styles.roundNumber}>#{index + 1}</span>
                    <span className={styles.roundTitle}>{round.songTitle}</span>
                    <span className={styles.roundState}>
                      {won ? '✅' : '❌'} {won ? `+${round.score}` : '0'}
                    </span>
                  </div>
                );
              })}
            </div>
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
