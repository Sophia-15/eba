'use client';

import { useEffect } from 'react';
import { AlertTriangle, Pause, Play, Volume2 } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import styles from './AudioPlayer.module.css';

interface AudioPlayerProps {
  spotifyId: string;
  previewUrl: string;
  albumArt: string;
  songTitle: string;
  artistName: string;
  autoPlay?: boolean;
}

export default function AudioPlayer({
  spotifyId,
  previewUrl,
  albumArt,
  songTitle,
  artistName,
  autoPlay = false,
}: AudioPlayerProps) {
  const audio = useAudio(previewUrl);

  useEffect(() => {
    if (previewUrl) {
      audio.loadUrl(previewUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewUrl]);

  const progressPercent =
    audio.duration > 0 ? (audio.currentTime / audio.duration) * 100 : 0;
  const hasPreview = Boolean(previewUrl);

  return (
    <div className={styles.player}>
      <div className={styles.albumArt}>
        {albumArt ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={albumArt} alt="Album art" className={styles.albumImage} />
        ) : (
          <div className={styles.albumPlaceholder}>🎵</div>
        )}
        <div
          className={styles.blurredBg}
          style={{ backgroundImage: `url(${albumArt})` }}
        />
      </div>

      <div className={styles.controls}>
        <div className={styles.songInfo}>
          <span className={styles.songTitle}>
            {'?'.repeat(Math.min(songTitle.length, 15))}
          </span>
          <span className={styles.artistName}>
            {'?'.repeat(Math.min(artistName.length, 12))}
          </span>
        </div>

        <div className={styles.transport}>
          <button
            className={styles.playBtn}
            onClick={audio.toggle}
            disabled={!hasPreview || (!audio.isLoaded && !audio.isError)}
            aria-label={audio.isPlaying ? 'Pause' : 'Play'}
          >
            {audio.isError ? (
              <AlertTriangle size={16} />
            ) : audio.isPlaying ? (
              <Pause size={16} />
            ) : (
              <Play size={16} />
            )}
          </button>

          <div className={styles.progressWrapper}>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className={styles.timeInfo}>
              <span>{formatTime(audio.currentTime)}</span>
              <span>{formatTime(audio.duration)}</span>
            </div>
          </div>
        </div>

        <div className={styles.volume}>
          <span className={styles.volumeIcon}>
            <Volume2 size={14} />
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={audio.volume}
            onChange={(e) => audio.setVolume(parseFloat(e.target.value))}
            className={styles.volumeSlider}
            aria-label="Volume"
          />
        </div>

        {!hasPreview && (
          <div className={styles.sourceFallback}>
            <p className={styles.sourceNote}>
              No anonymous audio preview is available for this track.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  if (!isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}
