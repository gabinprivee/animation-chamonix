export type ThemeType = 'neon' | 'gold' | 'festival' | 'stadium';

export interface AnimatorProfile {
  id: string;
  name: string;
  avatar: string;
  pin: string;
}

export const ANIMATORS_LIST: AnimatorProfile[] = [
  { id: '1', name: 'mickey', avatar: '🐭', pin: '849271' },
  { id: '2', name: 'iris', avatar: '🌸', pin: '731904' },
  { id: '3', name: 'midas', avatar: '👑', pin: '950482' },
  { id: '4', name: 'seamko', avatar: '⚡', pin: '618239' },
  { id: '5', name: 'axel', avatar: '🔥', pin: '492751' },
  { id: '6', name: 'le_c', avatar: '🎭', pin: '385160' },
  { id: '7', name: 'nath', avatar: '⭐', pin: '274693' },
  { id: '8', name: 'jeremy', avatar: '🚀', pin: '518294' },
];

export interface Player {
  id: string;
  name: string;
  avatar: string;
  color: string;
  score: number;
  streak: number; // consecutive positive points added
  team?: string;
  recentChange?: number; // last point change for animation (+10, -5, etc.)
  lastUpdated?: number; // timestamp
}

export interface Team {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export interface HistoryLog {
  id: string;
  timestamp: string;
  playerId: string;
  playerName: string;
  playerAvatar: string;
  points: number;
  reason: string;
  round: string;
  animator?: string;
}

export interface AnimationState {
  title: string;
  subtitle: string;
  round: string;
  theme: ThemeType;
  status: 'idle' | 'active' | 'paused' | 'finished';
  multiplier: number; // 1, 2, or 3 for bonus rounds!
  announcement?: string;
  soundEnabled: boolean;
}

export interface LeaderboardData {
  players: Player[];
  teams: Team[];
  state: AnimationState;
  history: HistoryLog[];
}

export type AdminTab = 'live' | 'players' | 'settings' | 'history';

