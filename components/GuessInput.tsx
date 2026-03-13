'use client';

import { useEffect, useMemo, useState } from 'react';
import { type FormEvent, type KeyboardEvent } from 'react';
import { useGame } from '@/contexts/GameContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useGuess } from '@/hooks/useGuess';
import styles from './GuessInput.module.css';

const MAX_GUESSES = 6;

interface GuessInputProps {
  attemptsUsed: number;
}

export default function GuessInput({ attemptsUsed }: GuessInputProps) {
  const { inputValue, setInputValue, submit, skip, canSubmit, canSkip } =
    useGuess();
  const { gameState } = useGame();
  const { getAllSongs, getSongsForSource } = usePlaylist();
  const [suggestionPool, setSuggestionPool] = useState<
    Array<{ title: string; artist: string }>
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  type Suggestion = {
    key: string;
    title: string;
    artist: string;
    score: number;
  };

  useEffect(() => {
    let cancelled = false;

    async function loadSuggestionPool() {
      if (!gameState) {
        setSuggestionPool([]);
        return;
      }

      try {
        const songs =
          gameState.playlistId === 'library'
            ? await getAllSongs()
            : await getSongsForSource(gameState.playlistId);

        if (cancelled) return;

        const unique = new Map<string, { title: string; artist: string }>();
        for (const song of songs) {
          const title = song.title?.trim();
          const artist = song.artistName?.trim();
          if (!title || !artist) continue;
          const key = `${title.toLowerCase()}::${artist.toLowerCase()}`;
          if (!unique.has(key)) {
            unique.set(key, { title, artist });
          }
        }

        setSuggestionPool(Array.from(unique.values()));
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load suggestion pool:', err);
          setSuggestionPool([]);
        }
      }
    }

    void loadSuggestionPool();

    return () => {
      cancelled = true;
    };
  }, [gameState, getAllSongs, getSongsForSource]);

  const suggestions = useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q || suggestionPool.length === 0) return [];

    const uniqueMap = new Map<string, Suggestion>();

    for (const song of suggestionPool) {
      const key = `${song.title}::${song.artist}`;
      if (uniqueMap.has(key)) continue;

      const title = song.title;
      const artist = song.artist;
      const titleLower = title.toLowerCase();
      const artistLower = artist.toLowerCase();
      const combined = `${titleLower} ${artistLower}`;

      if (!combined.includes(q)) continue;

      let score = 0;
      if (titleLower === q) score += 120;
      if (titleLower.startsWith(q)) score += 80;
      if (titleLower.includes(q)) score += 45;
      if (artistLower.startsWith(q)) score += 40;
      if (artistLower.includes(q)) score += 25;
      if (combined.includes(q)) score += 10;

      uniqueMap.set(key, { key, title, artist, score });
    }

    return Array.from(uniqueMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }, [inputValue, suggestionPool]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setShowSuggestions(false);
    submit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      setShowSuggestions(false);
      submit();
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }

  function handleSuggestionSelect(suggestion: Suggestion) {
    setInputValue(`${suggestion.title} - ${suggestion.artist}`);
    setShowSuggestions(false);
  }

  return (
    <div className={styles.container}>
      <div className={styles.attempts}>
        {Array.from({ length: MAX_GUESSES }).map((_, i) => (
          <div
            key={i}
            className={`${styles.dot} ${i < attemptsUsed ? styles.used : ''}`}
            aria-label={i < attemptsUsed ? 'used' : 'remaining'}
          />
        ))}
        <span className={styles.attemptsLabel}>
          {MAX_GUESSES - attemptsUsed} attempt
          {MAX_GUESSES - attemptsUsed !== 1 ? 's' : ''} left
        </span>
      </div>

      <form className={styles.form} onSubmit={onSubmit}>
        <div className={styles.inputWrap}>
          <input
            className={styles.input}
            type="text"
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={onKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay so click handlers in suggestion buttons can run first.
              setTimeout(() => setShowSuggestions(false), 120);
            }}
            placeholder="Guess the song title..."
            autoComplete="off"
            spellCheck={false}
            aria-label="Song title guess"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div className={styles.suggestions}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.key}
                  type="button"
                  className={styles.suggestionBtn}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  {suggestion.title} - {suggestion.artist}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!canSubmit}
        >
          Guess
        </button>
      </form>

      <button className={styles.skipBtn} onClick={skip} disabled={!canSkip}>
        ⏭ Skip (uses attempt)
      </button>
    </div>
  );
}
