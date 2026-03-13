'use client';

import { AlertTriangle, ArrowLeft, Trophy } from 'lucide-react';
import { useGame } from '@/contexts/GameContext';
import AudioPlayer from './AudioPlayer';
import LyricDisplay from './LyricDisplay';
import GuessInput from './GuessInput';
import GuessHistory from './GuessHistory';
import RoundResult from './RoundResult';
import GameOver from './GameOver';
import LoadingSpinner from './LoadingSpinner';
import styles from './GameBoard.module.css';

interface GameBoardProps {
  onExit: () => void;
}

export default function GameBoard({ onExit }: GameBoardProps) {
  const { gameState, currentRound, isLoading, error, nextRound, endGame } =
    useGame();

  if (isLoading) {
    return (
      <div className={styles.centered}>
        <LoadingSpinner size="lg" label="Loading game..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.centered}>
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>
            <AlertTriangle size={40} />
          </span>
          <p className={styles.errorMessage}>{error}</p>
          <button className={styles.backBtn} onClick={onExit}>
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
      <div className={styles.board}>
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
    <div className={styles.board}>
      <div className={styles.progress}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              width: `${(gameState.currentRoundIndex / gameState.rounds.length) * 100}%`,
            }}
          />
        </div>
        <span className={styles.progressLabel}>
          Song {gameState.currentRoundIndex + 1} of {gameState.rounds.length}
        </span>
        <span className={styles.totalScore}>
          <Trophy size={15} /> {gameState.totalScore.toLocaleString()}
        </span>
      </div>

      {/* <AudioPlayer
        previewUrl={currentRound.previewUrl}
        albumArt={currentRound.albumArt}
        songTitle={currentRound.songTitle}
        artistName={currentRound.artistName}
        attemptsUsed={currentRound.guesses.length}
        difficultyMode={gameState.difficultyMode}
      /> */}

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
