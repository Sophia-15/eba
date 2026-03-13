'use client';

import { useGame } from '@/contexts/GameContext';
import { guessesReferToSameSong } from '@/lib/gameLogic';
import { useCallback, useState } from 'react';

interface UseGuessReturn {
  inputValue: string;
  setInputValue: (value: string) => void;
  submit: () => void;
  skip: () => void;
  isSubmitting: boolean;
  isDuplicateGuess: boolean;
  canSubmit: boolean;
  canSkip: boolean;
}

export function useGuess(): UseGuessReturn {
  const { gameState, currentRound, submitGuess, skipHint } = useGame();
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const MAX_GUESSES = 6;
  const trimmedValue = inputValue.trim();

  const isDuplicateGuess =
    trimmedValue.length > 0 &&
    !!currentRound &&
    currentRound.guesses.some(
      (guess) => guess.text && guessesReferToSameSong(guess.text, trimmedValue),
    );

  const canSubmit =
    trimmedValue.length > 0 &&
    !!currentRound &&
    !currentRound.completed &&
    gameState?.status === 'playing' &&
    !isDuplicateGuess;

  const canSkip =
    !!currentRound &&
    !currentRound.completed &&
    gameState?.status === 'playing' &&
    currentRound.guesses.length < MAX_GUESSES;

  const submit = useCallback(() => {
    if (!canSubmit || isDuplicateGuess) return;
    setIsSubmitting(true);
    submitGuess(trimmedValue);
    setInputValue('');
    setIsSubmitting(false);
  }, [canSubmit, isDuplicateGuess, submitGuess, trimmedValue]);

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
    isDuplicateGuess,
    canSubmit,
    canSkip,
  };
}
