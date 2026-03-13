import type { LyricSnippet } from '@/types/game';
import { type Guess, GuessResult } from '@/types/game';

// ---- Levenshtein Distance ----
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] === b[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
  }

  return dp[m][n];
}

function normaliseForGuess(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''"`]/g, "'")
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\b(a|an|the)\b/g, '') // remove articles
    .replace(/\s+/g, ' ')
    .trim();
}

export function validateGuess(input: string, correctAnswer: string): boolean {
  const normInput = normaliseForGuess(input);
  const normAnswer = normaliseForGuess(correctAnswer);

  if (normInput === normAnswer) return true;

  // Allow up to 2 character typos for short titles, proportional for longer ones
  const maxDistance =
    normAnswer.length <= 6 ? 1 : Math.floor(normAnswer.length * 0.15);
  const distance = levenshtein(normInput, normAnswer);
  return distance <= maxDistance;
}

export function evaluateGuess(
  input: string,
  correctTitle: string,
  artistName: string,
): GuessResult {
  if (validateGuess(input, correctTitle)) {
    return GuessResult.CORRECT;
  }

  const normInput = normaliseForGuess(input);
  const normArtist = normaliseForGuess(artistName);

  if (normInput && normArtist) {
    const artistDistance = levenshtein(normInput, normArtist);
    const artistMaxDistance =
      normArtist.length <= 6 ? 1 : Math.floor(normArtist.length * 0.15);

    const artistMatched =
      normInput === normArtist ||
      normArtist.includes(normInput) ||
      normInput.includes(normArtist) ||
      artistDistance <= artistMaxDistance;

    if (artistMatched) {
      return GuessResult.PARTIAL;
    }
  }

  return GuessResult.INCORRECT;
}

// ---- Scoring ----

const MAX_SCORE_PER_ROUND = 1000;
const MIN_SCORE_PER_ROUND = 100;

export function calculateScore(
  guessNumber: number, // 1-indexed, how many guesses it took
  hintsRevealed: number,
  maxGuesses = 6,
): number {
  if (guessNumber > maxGuesses) return 0; // skipped/failed

  const guessPenalty = ((guessNumber - 1) / (maxGuesses - 1)) * 0.5;
  const hintPenalty = (hintsRevealed / 5) * 0.3;
  const multiplier = 1 - guessPenalty - hintPenalty;
  const score = Math.round(
    MIN_SCORE_PER_ROUND +
      (MAX_SCORE_PER_ROUND - MIN_SCORE_PER_ROUND) * Math.max(0, multiplier),
  );

  return score;
}

// ---- Hint selection ----

export function selectNextHint(
  snippets: LyricSnippet[],
  revealedCount: number,
): LyricSnippet | null {
  if (revealedCount >= snippets.length) return null;
  return snippets[revealedCount];
}

// ---- Shuffle ----

export function shuffleSongs<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ---- Guess helpers ----

export function buildGuess(text: string, result: GuessResult): Guess {
  return {
    id: `guess-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    text,
    result,
    timestamp: Date.now(),
  };
}

export function isGameRoundComplete(guesses: Guess[], maxGuesses = 6): boolean {
  if (guesses.some((g) => g.result === 'correct')) return true;
  if (guesses.length >= maxGuesses) return true;
  return false;
}
