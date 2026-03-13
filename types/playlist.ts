export type SpotifySourceType = 'playlist' | 'album';

export interface SpotifySource {
  id: string;
  type: SpotifySourceType;
  spotifyId: string;
  name: string;
  ownerOrArtist: string;
  imageUrl: string;
  trackCount: number;
  addedAt: number;
}

export interface Playlist extends SpotifySource {
  type: 'playlist';
  description?: string;
}

export interface Album extends SpotifySource {
  type: 'album';
  releaseDate?: string;
}

export interface Song {
  id: string;
  spotifyId: string;
  title: string;
  artistName: string;
  artistId: string;
  albumName: string;
  albumId: string;
  albumArt: string;
  previewUrl: string;
  durationMs: number;
  sourceId: string;
  addedAt: number;
  lyricsStatus: 'pending' | 'fetching' | 'ready' | 'failed' | 'unavailable';
  lyricsId?: string;
}
