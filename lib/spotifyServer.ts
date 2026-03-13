// Server-side Spotify utilities

interface TokenCache {
  token: string;
  expiresAt: number;
}

let tokenCache: TokenCache | null = null;
let tokenPromise: Promise<string> | null = null;

export async function getSpotifyAccessToken(): Promise<string> {
  // Return cached token if still valid (with 5-minute buffer)
  if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
    return tokenCache.token;
  }

  // If a request is already in progress, return that promise to avoid multiple simultaneous requests
  if (tokenPromise) {
    return tokenPromise;
  }

  tokenPromise = (async () => {
    try {
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      if (!clientId || !clientSecret) {
        throw new Error(
          'Spotify credentials not configured in environment variables',
        );
      }

      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString(
        'base64',
      );

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${credentials}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        cache: 'no-store',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Spotify auth failed: ${response.status} ${errorText}`);
      }

      const data = await response.json();

      // Cache for 55 minutes (token is valid for 60)
      tokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + 55 * 60 * 1000,
      };

      return data.access_token;
    } finally {
      tokenPromise = null;
    }
  })();

  return tokenPromise;
}
