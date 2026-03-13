export interface UserPreferences {
  volume: number; // 0-1
  theme: 'dark' | 'light' | 'system';
  autoPlay: boolean;
  difficulty: 'easy' | 'hard';
  maxGuesses: number; // default 6
}

const DEFAULT_PREFERENCES: UserPreferences = {
  volume: 0.7,
  theme: 'dark',
  autoPlay: true,
  difficulty: 'hard',
  maxGuesses: 6,
};

const PREFS_KEY = 'lyricle-preferences';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export function getPreferences(): UserPreferences {
  if (!isBrowser()) return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    const parsed = JSON.parse(raw) as Partial<UserPreferences> & {
      difficulty?: string;
    };
    const difficulty =
      parsed.difficulty === 'easy' || parsed.difficulty === 'hard'
        ? parsed.difficulty
        : DEFAULT_PREFERENCES.difficulty;
    return { ...DEFAULT_PREFERENCES, ...parsed, difficulty };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function setPreferences(
  prefs: Partial<UserPreferences>,
): UserPreferences {
  if (!isBrowser()) return DEFAULT_PREFERENCES;
  const current = getPreferences();
  const updated = { ...current, ...prefs };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
  } catch {
    // Storage might be full
  }
  return updated;
}

export function clearPreferences(): void {
  if (!isBrowser()) return;
  localStorage.removeItem(PREFS_KEY);
}

// Generic typed helpers
export function localGet<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function localSet<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage might be full
  }
}

export function localRemove(key: string): void {
  if (!isBrowser()) return;
  localStorage.removeItem(key);
}
