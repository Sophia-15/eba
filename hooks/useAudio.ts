'use client';

import { useSettings } from '@/contexts/SettingsContext';
import { useCallback, useEffect, useRef, useState } from 'react';

interface AudioState {
  isPlaying: boolean;
  isLoaded: boolean;
  isError: boolean;
  currentTime: number;
  duration: number;
  volume: number;
}

interface UseAudioReturn extends AudioState {
  play: () => void;
  pause: () => void;
  toggle: () => void;
  setVolume: (v: number) => void;
  seek: (time: number) => void;
  loadUrl: (url: string) => void;
}

export function useAudio(initialUrl?: string): UseAudioReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { preferences, updatePreferences } = useSettings();

  const [state, setState] = useState<AudioState>({
    isPlaying: false,
    isLoaded: false,
    isError: false,
    currentTime: 0,
    duration: 0,
    volume: preferences.volume,
  });

  const getOrCreateAudio = useCallback(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = preferences.volume;
    }
    return audioRef.current;
  }, [preferences.volume]);

  useEffect(() => {
    const audio = getOrCreateAudio();

    const onCanPlay = () =>
      setState((s) => ({ ...s, isLoaded: true, duration: audio.duration }));
    const onPlay = () => setState((s) => ({ ...s, isPlaying: true }));
    const onPause = () => setState((s) => ({ ...s, isPlaying: false }));
    const onEnded = () =>
      setState((s) => ({ ...s, isPlaying: false, currentTime: 0 }));
    const onError = () =>
      setState((s) => ({
        ...s,
        isError: true,
        isLoaded: false,
        isPlaying: false,
      }));
    const onTimeUpdate = () =>
      setState((s) => ({ ...s, currentTime: audio.currentTime }));

    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);
    audio.addEventListener('timeupdate', onTimeUpdate);

    if (initialUrl) {
      audio.src = initialUrl;
      audio.load();
    }

    return () => {
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('timeupdate', onTimeUpdate);
    };
  }, [getOrCreateAudio, initialUrl]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play().catch(console.error);
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const toggle = useCallback(() => {
    if (state.isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(console.error);
    }
  }, [state.isPlaying]);

  const setVolume = useCallback(
    (v: number) => {
      const clamped = Math.max(0, Math.min(1, v));
      if (audioRef.current) audioRef.current.volume = clamped;
      setState((s) => ({ ...s, volume: clamped }));
      updatePreferences({ volume: clamped });
    },
    [updatePreferences],
  );

  const seek = useCallback((time: number) => {
    if (audioRef.current) audioRef.current.currentTime = time;
  }, []);

  const loadUrl = useCallback(
    (url: string) => {
      const audio = getOrCreateAudio();
      audio.pause();
      audio.src = url;
      audio.load();
      setState((s) => ({
        ...s,
        isLoaded: false,
        isError: false,
        isPlaying: false,
        currentTime: 0,
      }));
      if (preferences.autoPlay) {
        audio.play().catch(console.error);
      }
    },
    [getOrCreateAudio, preferences.autoPlay],
  );

  return { ...state, play, pause, toggle, setVolume, seek, loadUrl };
}
