'use client';

interface AudioPlayerProps {
  albumArt: string;
  attemptsUsed?: number;
  difficultyMode: 'easy' | 'hard';
}

export default function AudioPlayer({
  albumArt,
  attemptsUsed = 0,
  difficultyMode,
}: AudioPlayerProps) {
  const isEasyMode = difficultyMode === 'easy';
  if (!isEasyMode) return null;

  const revealProgress = Math.min(1, Math.max(0, attemptsUsed / 6));
  const blurPx = Math.max(0, 30 - revealProgress * 26);

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          Album Cover
        </span>
        <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-sm font-semibold text-emerald-300">
          Easy Mode
        </span>
      </div>

      <div className="relative mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-surface-2)]">
        {albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={albumArt}
            alt="Album cover hint"
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            className="h-full w-full object-cover"
            style={{ filter: `blur(${blurPx}px)` }}
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-3 text-[var(--color-text-muted)]">
            <p className="text-sm font-medium">
              No album cover available for this track.
            </p>
          </div>
        )}
      </div>

      {albumArt && (
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          Cover reveals more after each guess or skip.
        </p>
      )}
    </div>
  );
}
