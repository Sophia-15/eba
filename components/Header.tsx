'use client';

import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, Library, Menu, PlayCircle, X } from 'lucide-react';

const TABS: { href: string; label: string; icon: ReactNode }[] = [
  { href: '/playlists', label: 'Library', icon: <Library size={20} /> },
  { href: '/play', label: 'Play', icon: <PlayCircle size={20} /> },
  { href: '/stats', label: 'Stats', icon: <BarChart3 size={20} /> },
];

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [isDesktop, setIsDesktop] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');

    function syncViewportState(event?: MediaQueryListEvent) {
      const matches = event?.matches ?? mediaQuery.matches;
      setIsDesktop(matches);

      if (matches) {
        setIsMobileMenuOpen(false);
      }
    }

    syncViewportState();
    mediaQuery.addEventListener('change', syncViewportState);

    return () => mediaQuery.removeEventListener('change', syncViewportState);
  }, []);

  function goTo(path: string) {
    setIsMobileMenuOpen(false);
    router.push(path);
  }

  return (
    <header className="app-header sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)] p-4 backdrop-blur-md">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎵</span>
          <button
            type="button"
            onClick={() => goTo('/playlists')}
            className="text-xl font-black tracking-tight text-[var(--color-accent)] no-underline hover:no-underline"
          >
            To be Named
          </button>
        </div>

        {isDesktop ? (
          <nav className="flex gap-1">
            {TABS.map((tab) => {
              const isActive = pathname === tab.href;

              return (
                <button
                  type="button"
                  key={tab.href}
                  onClick={() => goTo(tab.href)}
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
        ) : (
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-xl border border-[var(--color-border)] p-2 text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-2)]"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((open) => !open)}
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        )}
      </div>

      {!isDesktop && isMobileMenuOpen && (
        <nav className="mt-3 grid gap-2">
          {TABS.map((tab) => {
            const isActive = pathname === tab.href;

            return (
              <button
                type="button"
                key={tab.href}
                onClick={() => goTo(tab.href)}
                className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-left text-base font-semibold transition ${
                  isActive
                    ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                    : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2)]'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
}
