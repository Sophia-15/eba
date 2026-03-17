'use client';

import { useEffect, useMemo, useState } from 'react';
import { type FormEvent, type KeyboardEvent } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import { usePlaylist } from '@/contexts/PlaylistContext';
import { useGuess } from '@/hooks/useGuess';
import { guessesReferToSameSong } from '@/lib/gameLogic';
import { GuessResult } from '@/types/game';
import GuessHistory from './GuessHistory';

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
  const [showHistory, setShowHistory] = useState(false);

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
    <div className="fixed inset-x-0 bottom-0 z-[140] px-2 pb-2 sm:px-4 sm:pb-4">
      <div className="relative mx-auto w-full max-w-3xl rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3 pt-6 shadow-[0_-8px_30px_rgba(0,0,0,0.18),0_18px_40px_rgba(0,0,0,0.22)] backdrop-blur-md sm:rounded-3xl sm:p-5 sm:pt-8">
        <button
          type="button"
          onClick={() => setShowHistory((value) => !value)}
          className="absolute left-1/2 top-0 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm font-semibold text-[var(--color-text-muted)] shadow-lg transition hover:bg-[var(--color-surface)]"
          aria-expanded={showHistory}
          aria-controls="guess-history-panel"
        >
          <span>Guesses ({currentRound?.guesses.length ?? 0})</span>
          {showHistory ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <div
          className={`grid overflow-hidden transition-all duration-300 ease-out ${
            showHistory
              ? 'mb-3 grid-rows-[1fr] opacity-100'
              : 'mb-0 grid-rows-[0fr] opacity-0'
          }`}
        >
          <div className="min-h-0">
            <div
              id="guess-history-panel"
              className="max-h-40 overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2"
            >
              {currentRound?.guesses.length ? (
                <GuessHistory guesses={currentRound.guesses} />
              ) : (
                <p className="px-2 py-1 text-sm text-[var(--color-text-muted)]">
                  No guesses yet.
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="mb-1 flex items-center gap-2 sm:gap-3">
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
                    className={`h-2.5 w-2.5 rounded-full sm:h-3.5 sm:w-3.5 ${dotClass}`}
                    aria-label={guessResult ? guessResult : 'remaining'}
                  />
                );
              })(),
            )}
            <span className="ml-1 text-xs font-medium text-[var(--color-text-muted)] sm:ml-2 sm:text-sm">
              {MAX_GUESSES - attemptsUsed} attempt
              {MAX_GUESSES - attemptsUsed !== 1 ? 's' : ''} left
            </span>
          </div>

          <button
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2.5 sm:text-sm"
            onClick={skip}
            disabled={!canSkip}
          >
            ⏭ Skip (uses attempt)
          </button>
        </div>

        <form
          className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-3"
          onSubmit={onSubmit}
        >
          <div className="relative flex-1">
            <input
              className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-base outline-none ring-[var(--color-accent)]/40 focus:ring-2 sm:rounded-2xl"
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
              <div className="absolute bottom-full z-[150] mb-2 max-h-60 w-full overflow-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-2xl sm:mb-3 sm:rounded-2xl sm:max-h-72">
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
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition sm:px-4 sm:py-3 sm:text-base ${
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
            className="rounded-xl bg-[var(--color-accent)] px-5 py-3 text-base font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 sm:rounded-2xl sm:px-6 sm:py-4 sm:text-lg"
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
