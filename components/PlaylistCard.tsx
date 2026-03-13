'use client';

import { Disc3, ListMusic, Play, Trash2 } from 'lucide-react';
import type { StoredSource } from '@/types/storage';

interface PlaylistCardProps {
  source: StoredSource;
  onPlay: (source: StoredSource) => void;
  onDelete: (id: string) => void;
}

export default function PlaylistCard({
  source,
  onPlay,
  onDelete,
}: PlaylistCardProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
      <div className="relative aspect-square overflow-hidden bg-[var(--color-surface-2)]">
        {source.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={source.imageUrl}
            alt={source.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[var(--color-text-muted)]">
            {source.type === 'playlist' ? (
              <ListMusic size={40} />
            ) : (
              <Disc3 size={40} />
            )}
          </div>
        )}
        <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
          {source.type === 'playlist' ? 'Playlist' : 'Album'}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 px-4 py-4">
        <h3 className="truncate text-[1.15rem] font-bold" title={source.name}>
          {source.name}
        </h3>
        <p className="truncate text-base font-medium text-[var(--color-accent)]">
          {source.ownerOrArtist}
        </p>
        <p className="text-sm text-[var(--color-text-muted)]">
          {source.trackCount} track{source.trackCount !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="flex gap-3 border-t border-[var(--color-border)] px-4 pb-4 pt-3">
        <button
          className="inline-flex items-center justify-center rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-400 transition hover:bg-red-500/20"
          onClick={() => onDelete(source.id)}
          aria-label={`Delete ${source.name}`}
        >
          <Trash2 size={18} />
        </button>
        <button
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--color-accent)] px-4 py-3 text-base font-bold text-white transition hover:opacity-90"
          onClick={() => onPlay(source)}
        >
          <Play size={18} /> Play
        </button>
      </div>
    </div>
  );
}
