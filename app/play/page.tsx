'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import GameBoard from '@/components/GameBoard';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useGame } from '@/contexts/GameContext';

export default function PlayPage() {
  const router = useRouter();
  const { gameState, endGame } = useGame();

  function handleExitGame() {
    endGame();
    router.push('/playlists');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ErrorBoundary>
          {gameState ? (
            <GameBoard onExit={handleExitGame} />
          ) : (
            <div className="flex min-h-[60vh] items-center justify-center p-8 text-center text-xl text-[var(--color-text-muted)]">
              <p>
                No active game. Go to{' '}
                <button
                  type="button"
                  onClick={() => router.push('/playlists')}
                  className="font-semibold text-[var(--color-accent)]"
                >
                  Library
                </button>{' '}
                and press{' '}
                <span className="font-semibold text-[var(--color-accent)]">
                  Play All
                </span>{' '}
                (or Play on any source).
              </p>
            </div>
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
