'use client';

import { Disc3, ListMusic, Play, RefreshCw, Trash2 } from 'lucide-react';
import type { StoredSource } from '@/types/storage';
import type { SyncProgress } from '@/contexts/PlaylistContext';
import styles from './PlaylistCard.module.css';

interface PlaylistCardProps {
  source: StoredSource;
  syncProgress?: SyncProgress;
  onPlay: (source: StoredSource) => void;
  onDelete: (id: string) => void;
  onSyncLyrics: (sourceId: string) => void;
}

export default function PlaylistCard({
  source,
  syncProgress,
  onPlay,
  onDelete,
  onSyncLyrics,
}: PlaylistCardProps) {
  const isSyncing = !!syncProgress && syncProgress.total > 0;
  const syncPercent = isSyncing
    ? Math.round(
        ((syncProgress.fetched + syncProgress.failed) / syncProgress.total) *
          100,
      )
    : 0;

  return (
    <div className={styles.card}>
      <div className={styles.imageWrapper}>
        {source.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={source.imageUrl}
            alt={source.name}
            className={styles.image}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            {source.type === 'playlist' ? (
              <ListMusic size={40} />
            ) : (
              <Disc3 size={40} />
            )}
          </div>
        )}
        <span className={styles.typeBadge}>
          {source.type === 'playlist' ? 'Playlist' : 'Album'}
        </span>
      </div>

      <div className={styles.info}>
        <h3 className={styles.name} title={source.name}>
          {source.name}
        </h3>
        <p className={styles.owner}>{source.ownerOrArtist}</p>
        <p className={styles.meta}>
          {source.trackCount} track{source.trackCount !== 1 ? 's' : ''}
        </p>

        {isSyncing && (
          <div className={styles.syncWrapper}>
            <div className={styles.syncBar}>
              <div
                className={styles.syncFill}
                style={{ width: `${syncPercent}%` }}
              />
            </div>
            <p className={styles.syncLabel}>
              Fetching lyrics... {syncProgress.fetched + syncProgress.failed}/
              {syncProgress.total}
            </p>
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.syncBtn}
          onClick={() => onSyncLyrics(source.id)}
          disabled={isSyncing}
        >
          <RefreshCw size={16} /> {isSyncing ? 'Syncing' : 'Sync'}
        </button>
        <button
          className={styles.playBtn}
          onClick={() => onPlay(source)}
          disabled={isSyncing && syncProgress.fetched === 0}
        >
          <Play size={16} /> Play
        </button>
        <button
          className={styles.deleteBtn}
          onClick={() => onDelete(source.id)}
          aria-label={`Delete ${source.name}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
