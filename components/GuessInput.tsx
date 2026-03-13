'use client';

import { useEffect, useMemo, useState } from 'react';
import { type FormEvent, type KeyboardEvent } from 'react';
import { useGame } from '@/contexts/GameContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useGuess } from '@/hooks/useGuess';
import { guessesReferToSameSong } from '@/lib/gameLogic';
import { GuessResult } from '@/types/game';

const MAX_GUESSES = 6;

interface GuessInputProps {
  attemptsUsed: number;
}

export default function GuessInput({ attemptsUsed }: GuessInputProps) {
  const {
    inputValue,
    setInputValue,
    submit,
    skip,
    canSubmit,
    canSkip,
    isDuplicateGuess,
  } = useGuess();
  const { gameState, currentRound } = useGame();
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

  const previousGuesses = useMemo(
    () =>
      (currentRound?.guesses ?? [])
        .map((guess) => guess.text)
        .filter((text): text is string => text.trim().length > 0),
    [currentRound],
  );

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (isDuplicateGuess) return;
    setShowSuggestions(false);
    submit();
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      if (isDuplicateGuess) {
        e.preventDefault();
        return;
      }
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
    <div className="fixed inset-x-0 bottom-0 z-[140] px-4 pb-4 sm:px-6">
      <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_-8px_40px_rgba(0,0,0,0.18),0_18px_50px_rgba(0,0,0,0.24)] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="mb-4 flex items-center gap-3">
            {Array.from({ length: MAX_GUESSES }).map((_, i) =>
              (() => {
                const guessResult = currentRound?.guesses[i]?.result;
                const dotClass =
                  guessResult === GuessResult.CORRECT
                    ? 'bg-emerald-400'
                    : guessResult === GuessResult.PARTIAL
                      ? 'bg-amber-400'
                      : guessResult === GuessResult.INCORRECT
                        ? 'bg-red-400'
                        : guessResult === GuessResult.SKIPPED
                          ? 'bg-slate-400'
                          : 'bg-[var(--color-surface-2)]';

                return (
                  <div
                    key={i}
                    className={`h-3.5 w-3.5 rounded-full ${dotClass}`}
                    aria-label={guessResult ? guessResult : 'remaining'}
                  />
                );
              })(),
            )}
            <span className="ml-2 text-sm font-medium text-[var(--color-text-muted)]">
              {MAX_GUESSES - attemptsUsed} attempt
              {MAX_GUESSES - attemptsUsed !== 1 ? 's' : ''} left
            </span>
          </div>

          <button
            className="mb-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
            onClick={skip}
            disabled={!canSkip}
          >
            ⏭ Skip (uses attempt)
          </button>
        </div>

        <form className="flex gap-3" onSubmit={onSubmit}>
          <div className="relative flex-1">
            <input
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-5 py-4 text-lg outline-none ring-[var(--color-accent)]/40 focus:ring-2"
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
              <div className="absolute bottom-full z-[150] mb-3 max-h-72 w-full overflow-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl">
                {suggestions.map((suggestion) => {
                  const alreadyGuessed = previousGuesses.some((guess) =>
                    guessesReferToSameSong(
                      guess,
                      `${suggestion.title} - ${suggestion.artist}`,
                    ),
                  );

                  return (
                    <button
                      key={suggestion.key}
                      type="button"
                      className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-base transition ${
                        alreadyGuessed
                          ? 'cursor-not-allowed bg-red-500/10 text-red-300 line-through'
                          : 'hover:bg-[var(--color-surface-2)]'
                      }`}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (!alreadyGuessed) {
                          handleSuggestionSelect(suggestion);
                        }
                      }}
                      disabled={alreadyGuessed}
                    >
                      <span>
                        {suggestion.title} - {suggestion.artist}
                      </span>
                      {alreadyGuessed && (
                        <span className="ml-4 rounded-full border border-red-400/40 bg-red-500/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide no-underline">
                          Tried
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <button
            type="submit"
            className="rounded-2xl bg-[var(--color-accent)] px-6 py-4 text-lg font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canSubmit}
          >
            Guess
          </button>
        </form>

        {isDuplicateGuess && (
          <p className="mt-3 text-sm font-semibold text-red-300">
            You already tried that song in this round.
          </p>
        )}
      </div>
    </div>
  );
}
