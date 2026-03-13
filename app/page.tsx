'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import PlaylistManager from '@/components/PlaylistManager';
import GameBoard from '@/components/GameBoard';
import StatsPanel from '@/components/StatsPanel';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useGame } from '@/contexts/GameContext';

type Tab = 'playlists' | 'play' | 'stats';

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>('playlists');
  const { gameState, endGame } = useGame();

  function handleStartGame() {
    setActiveTab('play');
  }

  function handleExitGame() {
    endGame();
    setActiveTab('playlists');
  }

  return (
    <div className="app-shell">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="main-content">
        <ErrorBoundary>
          {activeTab === 'playlists' && (
            <PlaylistManager onStartGame={handleStartGame} />
          )}
          {activeTab === 'play' &&
            (gameState ? (
              <GameBoard onExit={handleExitGame} />
            ) : (
              <div className="play-empty">
                <p>
                  No active game. Go to <strong>Library</strong> and press{' '}
                  <strong>Play All</strong> (or Play on any source).
                </p>
              </div>
            ))}
          {activeTab === 'stats' && <StatsPanel />}
        </ErrorBoundary>
      </main>
    </div>
  );
}
