export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export interface SpotifyImage {
  url: string;
  height: number | null;
  width: number | null;
}

export interface SpotifyArtist {
  id: string;
  name: string;
}

export interface SpotifyAlbum {
  id: string;
  name: string;
  images: SpotifyImage[];
  artists: SpotifyArtist[];
  release_date: string;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  album: SpotifyAlbum;
  preview_url: string | null;
  duration_ms: number;
}

export interface SpotifyPlaylistItem {
  track: SpotifyTrack | null;
  added_at: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description: string;
  owner: { display_name: string };
  images: SpotifyImage[];
  tracks: {
    items: SpotifyPlaylistItem[];
    total: number;
    next: string | null;
  };
}

export interface SpotifySimplifiedAlbum {
  id: string;
  name: string;
  artists: SpotifyArtist[];
  images: SpotifyImage[];
  release_date: string;
  tracks: {
    items: Array<{
      id: string;
      name: string;
      artists: SpotifyArtist[];
      preview_url: string | null;
      duration_ms: number;
    }>;
    total: number;
    next: string | null;
  };
}

export interface SpotifySearchResult {
  playlists?: {
    items: Array<{
      id: string;
      name: string;
      description: string;
      owner: { display_name: string };
      images: SpotifyImage[];
      tracks: { total: number };
    }>;
  };
  albums?: {
    items: Array<{
      id: string;
      name: string;
      artists: SpotifyArtist[];
      images: SpotifyImage[];
      release_date: string;
      total_tracks: number;
    }>;
  };
  tracks?: {
    items: SpotifyTrack[];
  };
}

export interface GeniusSearchHit {
  result: {
    id: number;
    title: string;
    primary_artist: { name: string };
    url: string;
    song_art_image_thumbnail_url: string;
  };
}

export interface GeniusSearchResponse {
  response: {
    hits: GeniusSearchHit[];
  };
}

export interface ApiSuccessResponse<T> {
  data: T;
  success: true;
}

export interface ApiErrorResponse {
  error: string;
  success: false;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
