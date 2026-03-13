'use client';

import { AlertTriangle, ArrowLeft, Trophy } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import LyricDisplay from './LyricDisplay';
import GuessInput from './GuessInput';
import GuessHistory from './GuessHistory';
import RoundResult from './RoundResult';
import GameOver from './GameOver';
import LoadingSpinner from './LoadingSpinner';
import AudioPlayer from './AudioPlayer';

interface GameBoardProps {
  onExit: () => void;
}

export default function GameBoard({ onExit }: GameBoardProps) {
  const { gameState, currentRound, isLoading, error, nextRound, endGame } =
    useGame();

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" label="Loading game..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="w-full max-w-lg rounded-2xl border border-red-500/40 bg-red-500/10 p-6 text-center">
          <span className="mb-3 inline-flex text-red-300">
            <AlertTriangle size={40} />
          </span>
          <p className="mb-4 text-md text-[var(--color-text)]">{error}</p>
          <button
            className="mx-auto inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-md font-semibold text-white"
            onClick={onExit}
          >
            <ArrowLeft size={16} /> Back
          </button>
        </div>
      </div>
    );
  }

  if (!gameState || gameState.status === 'idle') return null;

  if (gameState.status === 'game_over') {
    return (
      <GameOver gameState={gameState} onPlayAgain={endGame} onExit={onExit} />
    );
  }

  if (!currentRound) return null;

  if (gameState.status === 'round_over') {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4">
        <RoundResult
          round={currentRound}
          roundNumber={gameState.currentRoundIndex + 1}
          totalRounds={gameState.rounds.length}
          onNext={nextRound}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-4 pb-80">
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <div className="mb-2 h-2 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
          <div
            className="h-full bg-[var(--color-accent)] transition-all"
            style={{
              width: `${(gameState.currentRoundIndex / gameState.rounds.length) * 100}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-md">
          <span className="text-[var(--color-text-muted)]">
            Song {gameState.currentRoundIndex + 1} of {gameState.rounds.length}
          </span>
          <span className="inline-flex items-center gap-1 font-semibold text-[var(--color-accent)]">
            <Trophy size={15} /> {gameState.totalScore.toLocaleString()}
          </span>
        </div>
      </div>

      {gameState.difficultyMode === 'easy' && (
        <AudioPlayer
          albumArt={currentRound.albumArt}
          attemptsUsed={currentRound.guesses.length}
          difficultyMode={gameState.difficultyMode}
        />
      )}

      <LyricDisplay
        snippets={currentRound.snippets}
        revealedCount={currentRound.hintsRevealed}
        lyricsStatus={currentRound.lyricsStatus}
      />
      <GuessHistory guesses={currentRound.guesses} />

      <GuessInput attemptsUsed={currentRound.guesses.length} />
    </div>
  );
}
