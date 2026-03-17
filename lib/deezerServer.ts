interface DeezerArtist {
  name: string;
}

interface DeezerTrack {
  id: number;
  title: string;
  preview: string;
  artist: DeezerArtist;
}

interface DeezerSearchResponse {
  data?: DeezerTrack[];
}

interface PreviewCacheEntry {
  previewUrl: string;
  expiresAt: number;
}

const DEEZER_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const previewCache = new Map<string, PreviewCacheEntry>();

function normalizeTerm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\([^)]*\)|\[[^\]]*\]|\{[^}]*\}/g, ' ')
    .replace(
      /\b(feat|ft|with|remaster(?:ed)?|version|live|mono|stereo)\b/g,
      ' ',
    )
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCacheKey(title: string, artist: string): string {
  return `${normalizeTerm(title)}::${normalizeTerm(artist)}`;
}

function pickBestPreview(
  tracks: DeezerTrack[],
  title: string,
  artist: string,
): string {
  const normalizedTitle = normalizeTerm(title);
  const normalizedArtist = normalizeTerm(artist);

  const ranked = tracks
    .filter((track) => typeof track.preview === 'string' && track.preview)
    .map((track) => {
      const trackTitle = normalizeTerm(track.title);
      const trackArtist = normalizeTerm(track.artist?.name ?? '');
      const titleExact = trackTitle === normalizedTitle;
      const titleIncludes =
        trackTitle.includes(normalizedTitle) ||
        normalizedTitle.includes(trackTitle);
      const artistExact = trackArtist === normalizedArtist;
      const artistIncludes =
        trackArtist.includes(normalizedArtist) ||
        normalizedArtist.includes(trackArtist);

      let score = 0;
      if (titleExact) score += 6;
      else if (titleIncludes) score += 3;
      if (artistExact) score += 4;
      else if (artistIncludes) score += 2;

      return { track, score };
    })
    .sort((left, right) => right.score - left.score);

  return ranked[0]?.track.preview ?? '';
}

export async function findDeezerPreview(
  title: string,
  artist: string,
): Promise<string> {
  const cacheKey = buildCacheKey(title, artist);
  const cached = previewCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.previewUrl;
  }

  const query = `track:"${title}" artist:"${artist}"`;
  const response = await fetch(
    `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`,
    {
      next: { revalidate: 86400 },
      cache: 'force-cache',
    },
  );

  if (!response.ok) {
    throw new Error(`Deezer search failed with status ${response.status}`);
  }

  const data = (await response.json()) as DeezerSearchResponse;
  const previewUrl = pickBestPreview(data.data ?? [], title, artist);

  previewCache.set(cacheKey, {
    previewUrl,
    expiresAt: Date.now() + DEEZER_CACHE_TTL_MS,
  });

  return previewUrl;
}
