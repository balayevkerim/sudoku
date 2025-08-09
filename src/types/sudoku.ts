export type Difficulty = 'beginner' | 'intermediate' | 'hard' | 'expert';

export type CellValue = number | null;

export type SudokuGrid = CellValue[][];

export interface GameState {
  puzzle: SudokuGrid;
  board: SudokuGrid;
  difficulty: Difficulty;
  score: number;
  hintsUsed: number;
  startTime: number | null;
  endTime: number | null;
  isComplete: boolean;
  isCorrect: boolean;
  isLoading: boolean;
  error: string | null;
  isPaused: boolean;
  pauseStartTime: number | null;
}

export interface Record {
  id: string;
  difficulty: Difficulty;
  score: number;
  time: number;
  date: string;
  hintsUsed: number;
}

export interface Hint {
  row: number;
  col: number;
  value: number;
}

export interface ValidationResult {
  valid: boolean;
  message: string;
  invalidCells: string[];
}

export interface DifficultyConfig {
  name: Difficulty;
  minVisible: number;
  maxVisible: number;
  label: string;
}

export const DIFFICULTY_CONFIGS: { [K in Difficulty]: DifficultyConfig } = {
  beginner: {
    name: 'beginner',
    minVisible: 36,
    maxVisible: 40,
    label: 'Beginner'
  },
  intermediate: {
    name: 'intermediate',
    minVisible: 32,
    maxVisible: 36,
    label: 'Intermediate'
  },
  hard: {
    name: 'hard',
    minVisible: 28,
    maxVisible: 32,
    label: 'Hard'
  },
  expert: {
    name: 'expert',
    minVisible: 24,
    maxVisible: 28,
    label: 'Expert'
  }
};

export interface ScoringConfig {
  correctCell: number;
  baseHintPenalty: number;
  hintPenaltyIncrement: number;
  errorPenalty: number;
  timeBonus: number;
  maxHints: number;
}

export const SCORING_CONFIG: ScoringConfig = {
  correctCell: 5,
  baseHintPenalty: 3,
  hintPenaltyIncrement: 1,
  errorPenalty: 1,
  timeBonus: 500,
  maxHints: 10
};
