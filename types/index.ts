export interface SafeAreaInsets {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
}

// General types for Monazzle

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Tile {
  id: number | string;
  position: number; // Current position in the grid
  correctPosition: number; // Correct position for the solved state
  imageUrl?: string; // Part of the larger image
}

export interface Monazzle {
  id: string;
  difficulty: Difficulty;
  imageUrl: string;
  imageHash: string;
  tiles: Tile[];
  startTime?: number;
  timeSpent?: number;
  moves?: number;
  hintsUsed?: number;
  aiUsed?: boolean;
  isFinished?: boolean;
  playerAddress?: string;
}

export interface LeaderboardEntry {
  id: string;
  user: string; // Wallet address
  level: Difficulty;
  timeSpent: number; // milliseconds
  moves: number;
  hints: number;
  aiUsed: boolean;
  mintedLink?: string;
  timestamp: number;
}

// API Response Types
export interface GenerateResponse {
  imageUrl: string;
  imageHash: string;
  // Potentially a monazzleId if generation also creates a preliminary record
}

export interface BoardResponse extends Omit<Monazzle, 'imageHash' | 'playerAddress'> {}

// WebSocket Message Types
export interface HintResponse {
  monazzleId: string;
  tileToHighlight: number; // e.g., position or id of the tile
}

export interface AISolveStep {
  monazzleId: string;
  fromIndex: number;
  toIndex: number;
}

export interface MonazzleFinishedNotification {
  monazzleId: string;
  timeSpent: number;
  moves: number;
  hintsUsed: number;
  aiUsed: boolean;
}
