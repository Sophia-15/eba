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

export function normaliseForGuess(str: string): string {
  return str
    .toLowerCase()
    .replace(/[''"`]/g, "'")
    .replace(/[^a-z0-9\s']/g, '')
    .replace(/\b(a|an|the)\b/g, '') // remove articles
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitGuessParts(input: string): {
  titlePart: string;
  artistPart: string;
} {
  const candidates = enumerateGuessParts(input).filter(
    (candidate) => candidate.artistPart.length > 0,
  );

  if (candidates.length === 0) {
    return { titlePart: input, artistPart: '' };
  }

  // Prefer the candidate with the longest title part, so titles like
  // "Something - Something Else - Artist" keep internal hyphens in the title.
  return candidates.sort(
    (left, right) => right.titlePart.length - left.titlePart.length,
  )[0];
}

function enumerateGuessParts(input: string): Array<{
  titlePart: string;
  artistPart: string;
}> {
  const trimmed = input.trim();
  if (!trimmed) {
    return [{ titlePart: '', artistPart: '' }];
  }

  const candidates: Array<{ titlePart: string; artistPart: string }> = [
    { titlePart: trimmed, artistPart: '' },
  ];

  // Only consider separators with surrounding spaces so hyphenated words
  // like "Spider-Man" or "Jay-Z" are not split.
  const separatorRegex = /\s[-–—]\s/g;
  for (const match of trimmed.matchAll(separatorRegex)) {
    const separatorIndex = match.index;
    const separatorLength = match[0]?.length ?? 0;
    if (separatorIndex === undefined || separatorLength === 0) continue;

    const titlePart = trimmed.slice(0, separatorIndex).trim();
    const artistPart = trimmed.slice(separatorIndex + separatorLength).trim();
    if (!titlePart) continue;

    candidates.push({ titlePart, artistPart });
  }

  return candidates;
}

export function guessesReferToSameSong(left: string, right: string): boolean {
  const leftCandidates = enumerateGuessParts(left);
  const rightCandidates = enumerateGuessParts(right);

  for (const leftCandidate of leftCandidates) {
    const leftTitle = normaliseForGuess(leftCandidate.titlePart || left);
    const leftArtist = normaliseForGuess(leftCandidate.artistPart);
    if (!leftTitle) continue;

    for (const rightCandidate of rightCandidates) {
      const rightTitle = normaliseForGuess(rightCandidate.titlePart || right);
      if (!rightTitle || rightTitle !== leftTitle) continue;

      const rightArtist = normaliseForGuess(rightCandidate.artistPart);
      if (!leftArtist || !rightArtist || leftArtist === rightArtist) {
        return true;
      }
    }
  }

  return false;
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
  const guessCandidates = enumerateGuessParts(input);

  if (validateGuess(input, correctTitle)) {
    return GuessResult.CORRECT;
  }

  const titleMatched = guessCandidates.some((candidate) =>
    validateGuess(candidate.titlePart, correctTitle),
  );

  if (titleMatched) {
    return GuessResult.CORRECT;
  }

  const normInput = normaliseForGuess(input);
  const normArtist = normaliseForGuess(artistName);

  if (normInput && normArtist) {
    const artistMaxDistance =
      normArtist.length <= 6 ? 1 : Math.floor(normArtist.length * 0.15);

    const artistCandidates = [
      normInput,
      ...guessCandidates.map((candidate) =>
        normaliseForGuess(candidate.titlePart),
      ),
      ...guessCandidates.map((candidate) =>
        normaliseForGuess(candidate.artistPart),
      ),
    ].filter(Boolean);

    const artistMatched = artistCandidates.some((candidate) => {
      const candidateDistance = levenshtein(candidate, normArtist);
      return (
        candidate === normArtist ||
        normArtist.includes(candidate) ||
        candidate.includes(normArtist) ||
        candidateDistance <= artistMaxDistance
      );
    });

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
