'use client';

import { useEffect, useState } from 'react';
import type { LyricSnippet } from '@/types/game';

interface LyricDisplayProps {
  snippets: LyricSnippet[];
  revealedCount: number;
  lyricsStatus?: 'pending' | 'loading' | 'ready' | 'unavailable';
}

export default function LyricDisplay({
  snippets,
  revealedCount,
  lyricsStatus = 'ready',
}: LyricDisplayProps) {
  const visibleCount = Math.min(Math.max(revealedCount, 1), snippets.length);
  const visibleSnippets = snippets.slice(0, visibleCount);

  if (snippets.length === 0) {
    return (
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-lg text-[var(--color-text-muted)]">
          {lyricsStatus === 'loading' || lyricsStatus === 'pending'
            ? 'Loading lyrics for this song...'
            : 'No lyrics available for this song.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Hint {visibleCount} / {snippets.length}
        </span>
        <DifficultyBadge
          difficulty={visibleSnippets[visibleSnippets.length - 1]?.difficulty}
        />
      </div>

      <div className="grid gap-2">
        {visibleSnippets.map((snippet, i) => (
          <SnippetCard
            key={snippet.id}
            snippet={snippet}
            isNew={i === visibleSnippets.length - 1}
          />
        ))}
      </div>
    </div>
  );
}

function SnippetCard({
  snippet,
  isNew,
}: {
  snippet: LyricSnippet;
  isNew: boolean;
}) {
  const [visible, setVisible] = useState(!isNew);

  useEffect(() => {
    if (isNew) {
      const t = setTimeout(() => setVisible(true), 50);
      return () => clearTimeout(t);
    }
  }, [isNew]);

  return (
    <div
      className={`rounded-lg border-l-4 border-[var(--color-accent)]/70 bg-[var(--color-surface-2)] p-3 transition ${
        visible ? 'translate-y-0 opacity-100' : 'translate-y-1 opacity-0'
      }`}
    >
      {snippet.lines.map((line, i) => (
        <p key={i} className="text-lg leading-6 text-[var(--color-text)]">
          {line}
        </p>
      ))}
    </div>
  );
}

function DifficultyBadge({
  difficulty,
}: {
  difficulty?: LyricSnippet['difficulty'];
}) {
  if (!difficulty) return null;
  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        difficulty === 'hard'
          ? 'bg-red-500/20 text-red-300'
          : difficulty === 'medium'
            ? 'bg-amber-500/20 text-amber-300'
            : 'bg-emerald-500/20 text-emerald-300'
      }`}
    >
      {difficulty === 'hard' ? '🔥' : difficulty === 'medium' ? '⚡' : '✨'}{' '}
      {difficulty}
    </span>
  );
}
