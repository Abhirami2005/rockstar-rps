import { Choice } from './logic/game';

export interface GameHistoryItem {
  id: string;
  player1: Choice;
  player2: Choice;
  result: 'win' | 'lose' | 'draw';
  timestamp: number;
}

export interface GameStats {
  totalGames: number;
  wins: number;
  losses: number;
  draws: number;
  coins: number;
}

export interface GameSettings {
  difficulty: 'easy' | 'medium' | 'hard';
  soundEnabled: boolean;
  theme: 'light' | 'dark';
  winLimit: number;
}

export interface PlayerState {
  uid: string;
  name: string;
  choice: Choice | null;
  score: number;
  photoURL?: string;
  isReady?: boolean;
  lastResult?: 'win' | 'lose' | 'draw' | null;
}

export interface RoomState {
  id: string;
  hostId: string;
  players: Record<string, PlayerState>;
  status: 'lobby' | 'counting' | 'result';
  round: number;
  lastMoveAt: any;
  winLimit: number;
}
