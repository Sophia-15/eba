'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import PlaylistManager from '@/components/PlaylistManager';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function PlaylistsPage() {
  const router = useRouter();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          <PlaylistManager onStartGame={() => router.push('/play')} />
        </ErrorBoundary>
      </main>
    </div>
  );
}
