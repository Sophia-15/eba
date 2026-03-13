export enum GameMode {
  PLAYLIST = 'playlist',
  ALBUM = 'album',
  SHUFFLE = 'shuffle',
}

export enum GuessResult {
  CORRECT = 'correct',
  PARTIAL = 'partial',
  INCORRECT = 'incorrect',
  SKIPPED = 'skipped',
}

export interface LyricSnippet {
  id: string;
  lines: string[];
  difficulty: 'hard' | 'medium' | 'easy';
  lineStart: number;
}

export interface Guess {
  id: string;
  text: string;
  result: GuessResult;
  timestamp: number;
}

export interface GameRound {
  songId: string;
  spotifyId: string;
  songTitle: string;
  artistName: string;
  albumName: string;
  durationMs: number;
  previewUrl: string;
  albumArt: string;
  lyricsStatus: 'pending' | 'loading' | 'ready' | 'unavailable';
  lyrics: string;
  snippets: LyricSnippet[];
  guesses: Guess[];
  hintsRevealed: number;
  score: number;
  completed: boolean;
  startedAt: number;
  completedAt?: number;
}

export interface GameState {
  id: string;
  playlistId: string;
  playlistName: string;
  mode: GameMode;
  rounds: GameRound[];
  currentRoundIndex: number;
  totalScore: number;
  startedAt: number;
  completedAt?: number;
  status: 'idle' | 'playing' | 'round_over' | 'game_over';
}

export interface GameStats {
  totalGames: number;
  totalRounds: number;
  totalScore: number;
  averageScore: number;
  correctGuesses: number;
  incorrectGuesses: number;
  skippedRounds: number;
  bestStreak: number;
  currentStreak: number;
  favoritePlaylist?: string;
  lastPlayed?: number;
}
