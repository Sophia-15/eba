'use client';

import { useGame } from '@/contexts/GameContext';
import { useCallback, useState } from 'react';

interface UseGuessReturn {
  inputValue: string;
  setInputValue: (value: string) => void;
  submit: () => void;
  skip: () => void;
  isSubmitting: boolean;
  canSubmit: boolean;
  canSkip: boolean;
}

export function useGuess(): UseGuessReturn {
  const { gameState, currentRound, submitGuess, skipHint } = useGame();
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_GUESSES = 6;

  const canSubmit =
    inputValue.trim().length > 0 &&
    !!currentRound &&
    !currentRound.completed &&
    gameState?.status === 'playing';

  const canSkip =
    !!currentRound &&
    !currentRound.completed &&
    gameState?.status === 'playing' &&
    currentRound.guesses.length < MAX_GUESSES;

  const submit = useCallback(() => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    submitGuess(inputValue.trim());
    setInputValue('');
    setIsSubmitting(false);
  }, [canSubmit, submitGuess, inputValue]);

  const skip = useCallback(() => {
    if (!canSkip) return;
    skipHint();
  }, [canSkip, skipHint]);

  return {
    inputValue,
    setInputValue,
    submit,
    skip,
    isSubmitting,
    canSubmit,
    canSkip,
  };
}
