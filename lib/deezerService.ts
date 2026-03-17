const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '/api';

interface PreviewResponse {
  previewUrl?: string;
}

export async function getDeezerPreview(
  title: string,
  artist: string,
): Promise<string> {
  const params = new URLSearchParams({ title, artist });
  const response = await fetch(
    `${API_BASE}/deezer/preview?${params.toString()}`,
  );

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? 'Failed to fetch preview');
  }

  const data = (await response.json()) as PreviewResponse;
  return data.previewUrl ?? '';
}
