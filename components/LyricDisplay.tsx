'use client';

import { useEffect, useState } from 'react';
import type { LyricSnippet } from '@/types/game';
import styles from './LyricDisplay.module.css';

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
  const visibleCount = Math.min(revealedCount + 1, snippets.length);
  const visibleSnippets = snippets.slice(0, visibleCount);

  if (snippets.length === 0) {
    return (
      <div className={styles.container}>
        <p className={styles.placeholder}>
          {lyricsStatus === 'loading' || lyricsStatus === 'pending'
            ? 'Loading lyrics for this song...'
            : 'No lyrics available for this song.'}
        </p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.hintLabel}>
          Hint {visibleCount} / {snippets.length}
        </span>
        <DifficultyBadge
          difficulty={visibleSnippets[visibleSnippets.length - 1]?.difficulty}
        />
      </div>

      <div className={styles.snippets}>
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
      className={`${styles.snippet} ${visible ? styles.visible : ''} ${isNew ? styles.newest : ''}`}
    >
      {snippet.lines.map((line, i) => (
        <p key={i} className={styles.line}>
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
    <span className={`${styles.badge} ${styles[difficulty]}`}>
      {difficulty === 'hard' ? '🔥' : difficulty === 'medium' ? '⚡' : '✨'}{' '}
      {difficulty}
    </span>
  );
}
