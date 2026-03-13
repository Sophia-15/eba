'use client';

import { useCallback, useMemo, useState } from 'react';
import { getStatistics, getGameHistory } from '@/lib/storage';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import type { StoredStatistics, StoredGameHistory } from '@/types/storage';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import GameDetailsModal from './modals/GameDetailsModal';
import { GuessResult } from '@/types/game';

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
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading stats..." />
      </div>
    );
  }

  if (!stats || stats.totalGames === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon="📊"
          title="No stats yet"
          description="Complete a game session to see your statistics here!"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4">
      <h2 className="text-2xl font-black">Statistics</h2>

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          Global (all games)
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
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

      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="mb-3 text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
          Last game
        </p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <h3 className="mb-3 text-lg font-semibold">Recent Games</h3>
          <div className="space-y-2">
            {history.map((game) => {
              const correct = game.rounds.filter((r) =>
                r.guesses.some((g) => g.result === GuessResult.CORRECT),
              ).length;
              return (
                <button
                  key={game.id}
                  className="flex w-full items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-left"
                  onClick={() => setSelectedGame(game)}
                  type="button"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">
                      {game.playlistName}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(game.startedAt)}
                    </span>
                  </span>
                  <span className="text-right">
                    <span className="block text-md font-semibold">
                      {correct}/{game.rounds.length}
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
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
        <GameDetailsModal
          game={selectedGame}
          onClose={() => setSelectedGame(null)}
        />
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
    <div
      className={`rounded-xl border p-3 ${
        highlight
          ? 'border-[var(--color-accent)]/40 bg-[var(--color-accent-subtle)]'
          : 'border-[var(--color-border)] bg-[var(--color-surface-2)]'
      }`}
    >
      <span className="mb-1 block text-lg">{icon}</span>
      <span className="block text-lg font-bold">{value}</span>
      <span className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
        {label}
      </span>
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
