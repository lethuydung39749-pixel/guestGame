
export type BrandId = 'cola' | 'lime' | 'orange' | 'grape' | 'water' | 'energy' | 'peach' | 'coffee' | 'mint' | 'berry';

export interface SodaBrand {
  id: BrandId;
  name: string;
  color: string;
  accent: string;
  textColor: string;
  icon: string; // Brief text like "Co" or "Or"
}

export interface HistoryEntry {
  id: string;
  arrangement: (BrandId | null)[];
  correctCount: number;
  timestamp: number;
}

export interface GameRecord {
  id: string;
  timestamp: number;
  attempts: number;
  durationSeconds: number;
  difficulty: number; // Number of cans (Game Size)
  targetSequence?: BrandId[]; // The correct answer for this game
}

export type GameStatus = 'playing' | 'won' | 'lost'; // Lost technically not possible in this version, but good for type safety
