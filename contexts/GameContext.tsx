'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { GameState, GameRound } from '@/types/game';
import type { StoredSong } from '@/types/storage';
import { GameMode, GuessResult } from '@/types/game';
import { getLyricsBySongId, getSong } from '@/lib/storage';
import { fetchLyricsForSong } from '@/lib/lyricsService';
import { selectLyricSnippets } from '@/lib/lyricProcessor';
import {
  evaluateGuess,
  calculateScore,
  shuffleSongs,
  buildGuess,
  isGameRoundComplete,
} from '@/lib/gameLogic';
import { saveGameHistory, updateStatistics } from '@/lib/storage';

const MAX_GUESSES = 6;

interface GameContextValue {
  gameState: GameState | null;
  currentRound: GameRound | null;
  isLoading: boolean;
  error: string | null;
  startGame: (
    sourceId: string,
    sourceName: string,
    songs: StoredSong[],
    mode?: GameMode,
    difficultyMode?: 'easy' | 'hard',
    trackCount?: number,
  ) => Promise<void>;
  submitGuess: (text: string) => void;
  skipHint: () => void;
  nextRound: () => void;
  endGame: () => void;
  clearError: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydrationRequestIdRef = useRef(0);
  const inFlightRoundKeyRef = useRef<string | null>(null);

  const currentRound = gameState
    ? (gameState.rounds[gameState.currentRoundIndex] ?? null)
    : null;

  const hydrateRoundLyrics = useCallback(
    async (round: GameRound): Promise<GameRound> => {
      if (round.snippets.length > 0 || round.lyrics) {
        return {
          ...round,
          lyricsStatus: 'ready',
          hintsRevealed:
            round.snippets.length > 0
              ? Math.max(round.hintsRevealed, 1)
              : round.hintsRevealed,
        };
      }

      let lyrics = (await getLyricsBySongId(round.songId))?.lyrics ?? '';

      if (!lyrics) {
        const result = await fetchLyricsForSong(
          round.songId,
          round.songTitle,
          round.artistName,
          round.albumName,
          round.durationMs,
        );
        lyrics = result.lyrics ?? '';

        if (!lyrics) {
          // If another sync flow is currently fetching this song, wait briefly and poll.
          const start = Date.now();
          const timeoutMs = 8000;
          while (!lyrics && Date.now() - start < timeoutMs) {
            const song = await getSong(round.songId);
            if (song?.lyricsStatus !== 'fetching') break;
            await sleep(500);
            lyrics = (await getLyricsBySongId(round.songId))?.lyrics ?? '';
          }

          // Last cache check before giving up.
          if (!lyrics) {
            lyrics = (await getLyricsBySongId(round.songId))?.lyrics ?? '';
          }
        }
      }

      return {
        ...round,
        lyrics,
        lyricsStatus: lyrics ? ('ready' as const) : ('unavailable' as const),
        snippets: selectLyricSnippets(lyrics, MAX_GUESSES),
        hintsRevealed: lyrics ? 1 : 0,
      };
    },
    [],
  );

  const startGame = useCallback(
    async (
      sourceId: string,
      sourceName: string,
      songs: StoredSong[],
      mode = GameMode.PLAYLIST,
      difficultyMode: 'easy' | 'hard' = 'hard',
      trackCount = 10,
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        if (!songs || songs.length === 0) {
          const msg =
            'No songs were found for this source. Try syncing or re-adding it.';
          setError(msg);
          throw new Error(msg);
        }

        const normalizedTrackCount = Math.max(
          1,
          Math.min(50, Math.floor(trackCount)),
        );
        const shuffled = shuffleSongs(songs).slice(0, normalizedTrackCount);

        const rounds: GameRound[] = shuffled.map(
          (song): GameRound => ({
            songId: song.id,
            spotifyId: song.spotifyId,
            songTitle: song.title,
            artistName: song.artistName,
            albumName: song.albumName,
            previewUrl: song.previewUrl,
            albumArt: song.albumArt,
            durationMs: song.durationMs,
            lyricsStatus: 'pending',
            lyrics: '',
            snippets: [],
            guesses: [],
            hintsRevealed: 0,
            score: 0,
            completed: false,
            startedAt: Date.now(),
          }),
        );

        if (rounds.length > 0) {
          rounds[0] = await hydrateRoundLyrics(rounds[0]);
        }

        const newGame: GameState = {
          id: generateId(),
          playlistId: sourceId,
          playlistName: sourceName,
          mode,
          difficultyMode,
          rounds,
          currentRoundIndex: 0,
          totalScore: 0,
          startedAt: Date.now(),
          status: 'playing',
        };

        setGameState(newGame);
      } catch (err) {
        console.error('Failed to start game:', err);
        const message =
          err instanceof Error
            ? err.message
            : 'Failed to start game. Please try again.';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [hydrateRoundLyrics],
  );

  const submitGuess = useCallback((text: string) => {
    setGameState((prev) => {
      if (!prev || prev.status !== 'playing') return prev;
      const round = prev.rounds[prev.currentRoundIndex];
      if (!round || round.completed) return prev;

      const result = evaluateGuess(text, round.songTitle, round.artistName);
      const guess = buildGuess(text, result);
      const updatedGuesses = [...round.guesses, guess];
      const completed = isGameRoundComplete(updatedGuesses, MAX_GUESSES);
      const nextHints = Math.min(
        updatedGuesses.length + 1,
        round.snippets.length,
      );

      const score =
        result === GuessResult.CORRECT
          ? calculateScore(
              updatedGuesses.length,
              Math.max(0, round.hintsRevealed - 1),
            )
          : 0;

      const updatedRound: GameRound = {
        ...round,
        guesses: updatedGuesses,
        hintsRevealed: nextHints,
        completed,
        score,
        completedAt: completed ? Date.now() : undefined,
      };

      const updatedRounds = [...prev.rounds];
      updatedRounds[prev.currentRoundIndex] = updatedRound;

      const newState: GameState = {
        ...prev,
        rounds: updatedRounds,
        totalScore: prev.totalScore + score,
        status: completed ? 'round_over' : 'playing',
      };

      return newState;
    });
  }, []);

  const skipHint = useCallback(() => {
    setGameState((prev) => {
      if (!prev || prev.status !== 'playing') return prev;
      const round = prev.rounds[prev.currentRoundIndex];
      if (!round || round.completed) return prev;

      const updatedGuesses = [
        ...round.guesses,
        {
          id: generateId(),
          text: '',
          result: GuessResult.SKIPPED,
          timestamp: Date.now(),
        },
      ];
      const nextHints = Math.min(
        updatedGuesses.length + 1,
        round.snippets.length,
      );

      // Skipping consumes an attempt; round ends only when attempts are exhausted.
      const completed = updatedGuesses.length >= MAX_GUESSES;

      const updatedRound: GameRound = {
        ...round,
        hintsRevealed: nextHints,
        guesses: updatedGuesses,
        completed,
        completedAt: completed ? Date.now() : undefined,
      };

      const updatedRounds = [...prev.rounds];
      updatedRounds[prev.currentRoundIndex] = updatedRound;

      return {
        ...prev,
        rounds: updatedRounds,
        status: completed ? 'round_over' : 'playing',
      };
    });
  }, []);

  const nextRound = useCallback(async () => {
    if (!gameState) return;

    const currentRoundIndex = gameState.currentRoundIndex;
    const nextIndex = currentRoundIndex + 1;

    if (nextIndex >= gameState.rounds.length) {
      setGameState((prev) => {
        if (!prev || prev.currentRoundIndex !== currentRoundIndex) return prev;

        const completedGame: GameState = {
          ...prev,
          status: 'game_over',
          completedAt: Date.now(),
        };

        // Save to history asynchronously
        saveGameHistory({ ...completedGame, savedAt: Date.now() }).catch(
          console.error,
        );
        updateStatistics({
          totalGames: 1,
          totalRounds: prev.rounds.length,
          totalScore: prev.totalScore,
          correctGuesses: prev.rounds.filter((r) =>
            r.guesses.some((g) => g.result === GuessResult.CORRECT),
          ).length,
          incorrectGuesses: prev.rounds.filter(
            (r) => r.completed && r.score === 0,
          ).length,
        }).catch(console.error);

        return completedGame;
      });
      return;
    }

    const roundToHydrate = gameState.rounds[nextIndex];
    if (!roundToHydrate) return;

    setIsLoading(true);

    try {
      const hydratedRound = await hydrateRoundLyrics({
        ...roundToHydrate,
        lyricsStatus: 'loading',
      });

      setGameState((prev) => {
        if (!prev || prev.currentRoundIndex !== currentRoundIndex) return prev;

        const updatedRounds = [...prev.rounds];
        updatedRounds[nextIndex] = hydratedRound;

        return {
          ...prev,
          currentRoundIndex: nextIndex,
          status: 'playing',
          rounds: updatedRounds,
        };
      });
    } finally {
      setIsLoading(false);
    }
  }, [gameState, hydrateRoundLyrics]);

  useEffect(() => {
    if (!gameState || !currentRound) return;

    const shouldHydrate =
      currentRound.lyricsStatus === 'pending' ||
      currentRound.lyricsStatus === 'loading';
    if (!shouldHydrate) return;

    const roundIndex = gameState.currentRoundIndex;
    const roundKey = `${gameState.id}:${roundIndex}:${currentRound.songId}`;
    if (inFlightRoundKeyRef.current === roundKey) return;

    inFlightRoundKeyRef.current = roundKey;
    hydrationRequestIdRef.current += 1;
    const requestId = hydrationRequestIdRef.current;
    let cancelled = false;

    setIsLoading(true);

    void hydrateRoundLyrics({ ...currentRound, lyricsStatus: 'loading' })
      .then((hydratedRound) => {
        if (cancelled) return;

        setGameState((prev) => {
          if (!prev || prev.id !== gameState.id) return prev;
          if (prev.currentRoundIndex !== roundIndex) return prev;

          const latestRound = prev.rounds[roundIndex];
          if (!latestRound) return prev;
          if (
            latestRound.lyricsStatus === 'ready' ||
            latestRound.lyricsStatus === 'unavailable'
          ) {
            return prev;
          }

          const updatedRounds = [...prev.rounds];
          updatedRounds[roundIndex] = hydratedRound;
          return { ...prev, rounds: updatedRounds };
        });
      })
      .catch((err) => {
        console.error('Failed to hydrate active round lyrics:', err);
      })
      .finally(() => {
        if (hydrationRequestIdRef.current !== requestId) return;
        inFlightRoundKeyRef.current = null;
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentRound, gameState, hydrateRoundLyrics]);

  const endGame = useCallback(() => {
    setGameState(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        currentRound,
        isLoading,
        error,
        startGame,
        submitGuess,
        skipHint,
        nextRound,
        endGame,
        clearError,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
}
