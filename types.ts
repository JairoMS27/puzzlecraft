export enum AppState {
  UPLOAD = 'UPLOAD',
  LIBRARY = 'LIBRARY',
  SHELF = 'SHELF',
  INSPECT = 'INSPECT',
  PLAY = 'PLAY',
  COMPLETED = 'COMPLETED'
}

export enum Difficulty {
  EASY = 9,   // 3x3
  MEDIUM = 25, // 5x5
  HARD = 64,   // 8x8
  EXPERT = 100 // 10x10
}

export interface PuzzleConfig {
  imageUrl: string;
  difficulty: Difficulty;
}

export interface SavedPuzzle {
  id: string;
  imageUrl: string;
  date: number;
}

export interface Piece {
  id: number;
  correctRow: number;
  correctCol: number;
  currentX: number;
  currentY: number;
  solved: boolean;
  groupId: number; // Pieces with the same groupId move together
  shape: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  width: number;
  height: number;
}