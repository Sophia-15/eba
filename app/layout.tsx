import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Toaster } from 'sonner';
import './globals.css';
import { SettingsProvider } from '@/contexts/SettingsContext';
import { PlaylistProvider } from '@/contexts/PlaylistContext';
import { GameProvider } from '@/contexts/GameContext';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'ToBeNamed — Guess the Song',
  description:
    'A single-player lyrics guessing game powered by Spotify previews',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable}`}
        suppressHydrationWarning
      >
        <SettingsProvider>
          <PlaylistProvider>
            <GameProvider>
              {children}
              <Toaster richColors position="top-right" />
            </GameProvider>
          </PlaylistProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
