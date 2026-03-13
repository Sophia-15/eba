'use client';

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import {
  getPreferences,
  setPreferences,
  type UserPreferences,
} from '@/lib/localStorage';

interface SettingsContextValue {
  preferences: UserPreferences;
  updatePreferences: (patch: Partial<UserPreferences>) => void;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [preferences, setPrefs] = useState<UserPreferences>(getPreferences);

  // Sync across tabs
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === 'lyricle-preferences') {
        setPrefs(getPreferences());
      }
    }
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const updatePreferences = useCallback((patch: Partial<UserPreferences>) => {
    const updated = setPreferences(patch);
    setPrefs(updated);
  }, []);

  return (
    <SettingsContext.Provider value={{ preferences, updatePreferences }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}
