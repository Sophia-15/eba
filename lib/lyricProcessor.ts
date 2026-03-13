import type { LyricSnippet } from '@/types/game';

const MIN_LINE_LENGTH = 8;

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
    const key = line.toLowerCase().replace(/\s+/g, ' ').trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
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
      repetitions.get(line.toLowerCase().replace(/\s+/g, ' ').trim()) ?? 1,
      i,
      lines.length,
    ),
  }));

  // Sort by score ascending (hardest first)
  scored.sort((a, b) => a.score - b.score);

  // Select up to `count` lines, deduplicating exact repeats.
  const selected: typeof scored = [];
  const seen = new Set<string>();

  for (const item of scored) {
    if (selected.length >= count) break;
    const key = item.line.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!seen.has(key)) {
      seen.add(key);
      selected.push(item);
    }
  }

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
