import Header from '@/components/Header';
import StatsPanel from '@/components/StatsPanel';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function StatsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <ErrorBoundary>
          <StatsPanel />
        </ErrorBoundary>
      </main>
    </div>
  );
}
