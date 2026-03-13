'use client';

import { useState, type FormEvent } from 'react';
import { Disc3, ListMusic, Search, X } from 'lucide-react';
import { searchSpotify, getAlbum, getPlaylist } from '@/lib/spotifyService';
import styles from './AddSourceModal.module.css';

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

  async function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setIsSearching(true);
    setError(null);
    setResults([]);

    try {
      // Handle Spotify URLs directly
      // Supports:
      // - https://open.spotify.com/album/ID
      // - https://open.spotify.com/playlist/ID
      // - open.spotify.com/album/ID
      // - spotify:album:ID
      const urlMatch = query.match(
        /(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(album|playlist)\/|spotify:(album|playlist):)([a-zA-Z0-9]+)/,
      );

      if (urlMatch) {
        // Group 1 or 2 is type, Group 3 is ID
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

      const data = await searchSpotify(query, 'playlist,album', 30);

      const playlists: SearchResult[] = (data.playlists?.items ?? [])
        .filter((p: unknown) => p) // Safety check
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
        .filter((a: unknown) => a) // Safety check
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
        .map((item) => ({ item, score: scoreMatch(item, query) }))
        .sort((a, b) => b.score - a.score)
        .map(({ item }) => item);

      const strictMatches = ranked.filter(
        (item) => scoreMatch(item, query) > 0,
      );

      setResults(
        (strictMatches.length > 0 ? strictMatches : ranked).slice(0, 12),
      );
    } catch (err) {
      console.error('Search error:', err);
      setError('Search failed. Check console for details.');
    } finally {
      setIsSearching(false);
    }
  }

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
      className={styles.overlay}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-label="Add music source"
      >
        <div className={styles.header}>
          <h2 className={styles.title}>Add Playlist or Album</h2>
          <button
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form className={styles.searchForm} onSubmit={onSearch}>
          <input
            className={styles.searchInput}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Spotify..."
            autoFocus
          />
          <button
            type="submit"
            className={styles.searchBtn}
            disabled={isSearching}
          >
            {isSearching ? '...' : <Search size={16} />}
          </button>
        </form>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.results}>
          {results.map((result) => (
            <div key={`${result.type}-${result.id}`} className={styles.result}>
              {result.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={result.imageUrl}
                  alt={result.name}
                  className={styles.resultImage}
                />
              ) : (
                <div className={styles.resultImagePlaceholder}>
                  {result.type === 'playlist' ? (
                    <ListMusic size={22} />
                  ) : (
                    <Disc3 size={22} />
                  )}
                </div>
              )}
              <div className={styles.resultInfo}>
                <p className={styles.resultName}>{result.name}</p>
                <p className={styles.resultMeta}>
                  <span className={styles.resultType}>{result.type}</span>
                  {' · '}
                  {result.ownerOrArtist}
                  {' · '}
                  {result.trackCount} tracks
                </p>
              </div>
              <button
                className={styles.addBtn}
                onClick={() => handleAdd(result)}
                disabled={adding === result.id}
              >
                {adding === result.id ? '...' : '+ Add'}
              </button>
            </div>
          ))}

          {results.length === 0 && !isSearching && query && !error && (
            <p className={styles.noResults}>
              No results found. Try a different search term.
            </p>
          )}

          {results.length === 0 && !query && (
            <p className={styles.hint}>
              Search for any playlist or album on Spotify to add it to your
              library.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
