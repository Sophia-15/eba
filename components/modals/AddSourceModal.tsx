'use client';

import { useEffect, useRef, useState } from 'react';
import { Disc3, ListMusic, Search, X } from 'lucide-react';
import { searchSpotify, getAlbum, getPlaylist } from '@/lib/spotifyService';

interface SearchResult {
  id: string;
  type: 'playlist' | 'album';
  name: string;
  ownerOrArtist: string;
  imageUrl: string;
  trackCount: number;
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreMatch(result: SearchResult, rawQuery: string): number {
  const query = normalizeText(rawQuery);
  if (!query) return 0;

  const target = normalizeText(`${result.name} ${result.ownerOrArtist}`);
  const name = normalizeText(result.name);

  let score = 0;

  if (name === query) score += 200;
  if (name.startsWith(query)) score += 120;
  if (name.includes(query)) score += 80;
  if (target.includes(query)) score += 40;

  const tokens = query.split(' ').filter(Boolean);
  const matchedTokens = tokens.filter((token) => target.includes(token)).length;
  score += matchedTokens * 15;

  if (tokens.length > 0 && matchedTokens === tokens.length) score += 30;

  return score;
}

interface AddSourceModalProps {
  onAdd: (id: string, type: 'playlist' | 'album') => void;
  onClose: () => void;
}

export default function AddSourceModal({
  onAdd,
  onClose,
}: AddSourceModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState<string | null>(null);
  const latestSearchIdRef = useRef(0);

  async function runSearch(rawQuery: string) {
    const trimmedQuery = rawQuery.trim();
    if (!trimmedQuery) {
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    const searchId = ++latestSearchIdRef.current;
    setIsSearching(true);
    setError(null);

    try {
      const urlMatch = trimmedQuery.match(
        /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(album|playlist)\/|spotify:(album|playlist):)([a-zA-Z0-9]+)/,
      );

      if (urlMatch) {
        const type = (urlMatch[1] || urlMatch[2]) as 'album' | 'playlist';
        const id = urlMatch[3];

        if (type === 'album') {
          const { meta } = await getAlbum(id);
          setResults([
            {
              id: meta.id as string,
              type: 'album',
              name: meta.name as string,
              ownerOrArtist:
                (meta.artists as Array<{ name: string }>)?.[0]?.name ??
                'Unknown',
              imageUrl: (meta.images as Array<{ url: string }>)?.[0]?.url ?? '',
              trackCount:
                (meta.total_tracks as number) ||
                (meta.totalTracks as number) ||
                0,
            },
          ]);
        } else {
          const { meta } = await getPlaylist(id);
          setResults([
            {
              id: meta.id as string,
              type: 'playlist',
              name: meta.name as string,
              ownerOrArtist:
                (meta.owner as { display_name?: string })?.display_name ??
                'Unknown',
              imageUrl: (meta.images as Array<{ url: string }>)?.[0]?.url ?? '',
              trackCount:
                (meta.tracks as { total?: number })?.total ||
                (meta.totalTracks as number) ||
                0,
            },
          ]);
        }
        return;
      }

      const data = await searchSpotify(trimmedQuery, 'playlist,album', 12);

      const playlists: SearchResult[] = (data.playlists?.items ?? [])
        .filter((p: unknown) => p)
        .map(
          (p: {
            id: string;
            name: string;
            owner: { display_name: string };
            images: Array<{ url: string }>;
            tracks: { total: number };
          }) => ({
            id: p.id,
            type: 'playlist' as const,
            name: p.name ?? 'Untitled Playlist',
            ownerOrArtist: p.owner?.display_name ?? 'Unknown',
            imageUrl: p.images?.[0]?.url ?? '',
            trackCount: p.tracks?.total ?? 0,
          }),
        );

      const albums: SearchResult[] = (data.albums?.items ?? [])
        .filter((a: unknown) => a)
        .map(
          (a: {
            id: string;
            name: string;
            artists: Array<{ name: string }>;
            images: Array<{ url: string }>;
            total_tracks: number;
          }) => ({
            id: a.id,
            type: 'album' as const,
            name: a.name ?? 'Untitled Album',
            ownerOrArtist: a.artists?.[0]?.name ?? 'Unknown',
            imageUrl: a.images?.[0]?.url ?? '',
            trackCount: a.total_tracks ?? 0,
          }),
        );

      const combined = [...playlists, ...albums];
      const ranked = combined
        .map((item) => ({ item, score: scoreMatch(item, trimmedQuery) }))
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);

      const strictMatches = ranked.filter(
        (item) => scoreMatch(item, trimmedQuery) > 0,
      );

      if (searchId !== latestSearchIdRef.current) return;

      setResults(
        (strictMatches.length > 0 ? strictMatches : ranked).slice(0, 12),
      );
    } catch (err) {
      if (searchId !== latestSearchIdRef.current) return;
      console.error('Search error:', err);
      setError('Search failed. Check console for details.');
    } finally {
      if (searchId === latestSearchIdRef.current) {
        setIsSearching(false);
      }
    }
  }

  useEffect(() => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      latestSearchIdRef.current += 1;
      setResults([]);
      setError(null);
      setIsSearching(false);
      return;
    }

    const timer = window.setTimeout(() => {
      void runSearch(query);
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  async function handleAdd(result: SearchResult) {
    setAdding(result.id);
    try {
      await onAdd(result.id, result.type);
      onClose();
    } finally {
      setAdding(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="max-h-[92vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label="Add music source"
      >
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-5">
          <h2 className="text-2xl font-semibold">Add Playlist or Album</h2>
          <button
            className="rounded-xl p-3 text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 pb-3 pt-5">
          <div className="relative">
            <Search
              size={20}
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
            />
            <input
              className="w-full rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] py-4 pl-14 pr-5 text-lg outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Spotify playlists or albums..."
              autoFocus
            />
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Results appear automatically as you type.
            {isSearching ? ' Searching…' : ''}
          </p>
        </div>

        {error && <p className="px-6 pb-2 text-base text-red-300">{error}</p>}

        <div className="max-h-[62vh] space-y-3 overflow-y-auto px-6 pb-6">
          {results.map((result) => (
            <div
              key={`${result.type}-${result.id}`}
              className="flex items-center gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4"
            >
              {result.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.imageUrl}
                  alt={result.name}
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-[var(--color-surface)] text-[var(--color-text-muted)]">
                  {result.type === 'playlist' ? (
                    <ListMusic size={30} />
                  ) : (
                    <Disc3 size={30} />
                  )}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">{result.name}</p>
                <p className="truncate text-sm text-[var(--color-text-muted)]">
                  <span className="uppercase">{result.type}</span>
                  {' · '}
                  {result.ownerOrArtist}
                  {' · '}
                  {result.trackCount} tracks
                </p>
              </div>
              <button
                className="rounded-xl bg-[var(--color-accent)] px-5 py-3 text-base font-semibold text-white disabled:opacity-50"
                onClick={() => handleAdd(result)}
                disabled={adding === result.id}
              >
                {adding === result.id ? '...' : '+ Add'}
              </button>
            </div>
          ))}

          {results.length === 0 && !query && (
            <p className="py-10 text-center text-base text-[var(--color-text-muted)]">
              Search for any playlist or album on Spotify to add it to your
              library.
            </p>
          )}

          {results.length === 0 && query.trim() && !isSearching && !error && (
            <p className="py-10 text-center text-base text-[var(--color-text-muted)]">
              No playlists or albums matched your search.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
