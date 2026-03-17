import type { LyricSnippet } from '@/types/game';

const MIN_LINE_LENGTH = 8;

function normalizeLineKey(line: string): string {
  return line.toLowerCase().replace(/\s+/g, ' ').trim();
}

function cleanLine(line: string): string {
  return line
    .replace(/\[.*?\]/g, '') // Remove section headers like [Chorus]
    .trim();
}

function splitIntoLines(lyrics: string): string[] {
  return lyrics
    .split('\n')
    .map(cleanLine)
    .filter((line) => line.length >= MIN_LINE_LENGTH);
}

function lineRepetitionMap(lines: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const line of lines) {
    const key = normalizeLineKey(line);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const nextIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[nextIndex]] = [result[nextIndex], result[index]];
  }
  return result;
}

function scoreLine(
  line: string,
  repetition: number,
  index: number,
  total: number,
): number {
  let score = 0;

  // Repeated lines are typically chorus-like and easier.
  if (repetition > 1) score += 2;

  // Earlier lines are usually harder without context.
  if (index < total * 0.3) score -= 1;
  if (index > total * 0.7) score += 1;

  // Longer lines are a bit easier to identify.
  if (line.length > 40) score += 1;

  return score;
}

function determineDifficulty(score: number): LyricSnippet['difficulty'] {
  if (score <= 0) return 'hard';
  if (score <= 2) return 'medium';
  return 'easy';
}

export function selectLyricSnippets(lyrics: string, count = 5): LyricSnippet[] {
  const lines = splitIntoLines(lyrics);
  if (lines.length === 0) return [];

  const repetitions = lineRepetitionMap(lines);

  const scored = lines.map((line, i) => ({
    line,
    index: i,
    score: scoreLine(
      line,
      repetitions.get(normalizeLineKey(line)) ?? 1,
      i,
      lines.length,
    ),
  }));

  const deduped: typeof scored = [];
  const seen = new Set<string>();

  for (const item of scored) {
    const key = normalizeLineKey(item.line);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  deduped.sort((a, b) => a.score - b.score);

  const candidatePoolSize = Math.min(
    deduped.length,
    Math.max(count * 3, count),
  );
  const candidatePool = deduped.slice(0, candidatePoolSize);
  const randomizedCandidates = shuffleArray(candidatePool);

  const selected = randomizedCandidates.slice(0, count);
  if (selected.length < count) {
    selected.push(
      ...deduped.slice(
        candidatePoolSize,
        candidatePoolSize + (count - selected.length),
      ),
    );
  }

  selected.sort((a, b) => a.score - b.score || a.index - b.index);

  return selected.map(
    (item, snippetIndex): LyricSnippet => ({
      id: `snippet-${snippetIndex}`,
      lines: [item.line],
      difficulty: determineDifficulty(item.score),
      lineStart: item.index,
    }),
  );
}

export function getSnippetForReveal(
  snippets: LyricSnippet[],
  revealedCount: number,
): LyricSnippet | null {
  if (revealedCount >= snippets.length) return null;
  // Already sorted hardest-first, reveal in that order
  return snippets[revealedCount];
}
