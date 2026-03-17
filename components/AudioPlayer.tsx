'use client';

import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, Pause, Play } from 'lucide-react';
import { getDeezerPreview } from '@/lib/deezerService';
import { useAudio } from '@/hooks/useAudio';

const BLUR_STEPS = [14, 10, 8, 6, 3, 1, 0];
const HINT_DURATION_SECONDS = 3;

function formatTime(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

interface AudioPlayerProps {
  albumArt: string;
  previewUrl: string;
  songTitle: string;
  artistName: string;
  attemptsUsed?: number;
  difficultyMode: 'easy' | 'hard';
}

export default function AudioPlayer({
  albumArt,
  previewUrl,
  songTitle,
  artistName,
  attemptsUsed = 0,
  difficultyMode,
}: AudioPlayerProps) {
  const isEasyMode = difficultyMode === 'easy';
  const blurPx = BLUR_STEPS[Math.min(attemptsUsed, BLUR_STEPS.length - 1)];
  const [resolvedPreviewUrl, setResolvedPreviewUrl] = useState(previewUrl);
  const [isFetchingPreview, setIsFetchingPreview] = useState(false);
  const [previewUnavailable, setPreviewUnavailable] = useState(false);
  const { isPlaying, isLoaded, isError, play, pause, seek, getTime } =
    useAudio(resolvedPreviewUrl);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const timeCurrentRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setResolvedPreviewUrl(previewUrl);
    setPreviewUnavailable(false);
    if (progressBarRef.current) {
      progressBarRef.current.style.width = '0%';
    }
    if (timeCurrentRef.current) {
      timeCurrentRef.current.textContent = '0:00';
    }
  }, [previewUrl, songTitle, artistName]);

  useEffect(() => {
    if (previewUrl) {
      setPreviewUnavailable(false);
      setIsFetchingPreview(false);
      return;
    }

    let cancelled = false;

    async function loadPreview() {
      setIsFetchingPreview(true);

      try {
        const url = await getDeezerPreview(songTitle, artistName);

        if (cancelled) return;

        setResolvedPreviewUrl(url);
        setPreviewUnavailable(!url);
      } catch (error) {
        if (cancelled) return;
        console.error('Failed to load fallback preview:', error);
        setPreviewUnavailable(true);
      } finally {
        if (!cancelled) {
          setIsFetchingPreview(false);
        }
      }
    }

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [previewUrl, songTitle, artistName]);

  const canPlayPreview = Boolean(resolvedPreviewUrl) && !previewUnavailable;

  // Smooth progress via requestAnimationFrame — direct DOM writes, no React re-renders.
  useEffect(() => {
    if (!isPlaying || !canPlayPreview) return;

    let rafId: number;

    function tick() {
      const time = getTime();

      if (time >= HINT_DURATION_SECONDS) {
        if (progressBarRef.current) progressBarRef.current.style.width = '100%';
        if (timeCurrentRef.current)
          timeCurrentRef.current.textContent = formatTime(
            HINT_DURATION_SECONDS,
          );
        pause();
        seek(HINT_DURATION_SECONDS);
        return;
      }

      const percent = Math.min(100, (time / HINT_DURATION_SECONDS) * 100);
      if (progressBarRef.current)
        progressBarRef.current.style.width = `${percent}%`;
      if (timeCurrentRef.current)
        timeCurrentRef.current.textContent = formatTime(time);

      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, canPlayPreview, getTime, pause, seek]);

  function handleToggle() {
    if (isPlaying) {
      pause();
    } else {
      if (getTime() >= HINT_DURATION_SECONDS) seek(0);
      play();
    }
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {isEasyMode ? 'Album Cover + Audio Hint' : 'Audio Hint'}
        </span>
        <span
          className={`rounded-full px-2.5 py-1 text-sm font-semibold ${
            isEasyMode
              ? 'bg-emerald-500/20 text-emerald-300'
              : 'bg-red-500/15 text-red-200'
          }`}
        >
          {isEasyMode ? 'Easy Mode' : 'Hard Mode'}
        </span>
      </div>

      {isEasyMode && (
        <div className="mx-auto flex w-full max-w-sm flex-col items-center gap-3">
          <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-xl bg-[var(--color-surface-2)] shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
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
        </div>
      )}

      <div className="mt-4 flex item-center gap-4 w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)] shadow-lg">
        <div className="w-full">
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--color-border)]">
            <div
              ref={progressBarRef}
              className="h-full rounded-full bg-[var(--color-accent)]"
              style={{ width: '0%' }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-medium text-[var(--color-text-muted)]">
            <span ref={timeCurrentRef}>0:00</span>
            <span>{formatTime(HINT_DURATION_SECONDS)}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 ">
          <button
            type="button"
            onClick={handleToggle}
            disabled={!canPlayPreview || isFetchingPreview}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={isPlaying ? 'Pause audio hint' : 'Play audio hint'}
          >
            {isFetchingPreview ? (
              <LoaderCircle size={16} className="animate-spin" />
            ) : isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
