'use client';

import type { ReactNode } from 'react';
import { BarChart3, Library, PlayCircle } from 'lucide-react';
import styles from './Header.module.css';

type Tab = 'playlists' | 'play' | 'stats';

interface HeaderProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'playlists', label: 'Library', icon: <Library size={18} /> },
  { id: 'play', label: 'Play', icon: <PlayCircle size={18} /> },
  { id: 'stats', label: 'Stats', icon: <BarChart3 size={18} /> },
];

export default function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        <span className={styles.logo}>🎵</span>
        <span className={styles.title}>Lyricle</span>
      </div>
      <nav className={styles.nav}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
            onClick={() => onTabChange(tab.id)}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </button>
        ))}
      </nav>
    </header>
  );
}
