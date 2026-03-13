'use client';

import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Library, PlayCircle } from 'lucide-react';

const TABS: { href: string; label: string; icon: ReactNode }[] = [
  { href: '/playlists', label: 'Library', icon: <Library size={20} /> },
  { href: '/play', label: 'Play', icon: <PlayCircle size={20} /> },
  { href: '/stats', label: 'Stats', icon: <BarChart3 size={20} /> },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="app-header flex align-center justify-between sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] backdrop-blur-md p-4">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🎵</span>
        <button
          type="button"
          onClick={() => router.push('/playlists')}
          className="text-xl font-black tracking-tight text-[var(--color-accent)] no-underline hover:no-underline"
        >
          To be Named
        </button>
      </div>

      <nav className="flex gap-1">
        {TABS.map((tab) => {
          const isActive = pathname === tab.href;

          return (
            <button
              type="button"
              key={tab.href}
              onClick={() => router.push(tab.href)}
              className={`flex min-w-10 flex-col items-center gap-0.5 rounded-xl border px-4 py-2 text-md no-underline transition hover:no-underline ${
                isActive
                  ? 'bg-[var(--color-accent-subtle)] font-semibold'
                  : 'hover:bg-[var(--color-surface-2)]'
              }`}
              style={{
                color: isActive
                  ? 'var(--color-accent)'
                  : 'var(--color-text-muted)',
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-pressed={isActive}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
