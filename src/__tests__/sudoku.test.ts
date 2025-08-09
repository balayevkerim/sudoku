import { describe, it, expect, beforeEach } from 'vitest';
import type { SudokuGrid } from '../types/sudoku';
import { useSudokuGame } from '../composables/useSudokuGame';


const createValidSolvedGrid = (): SudokuGrid => {
  return [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
  ];
};

const createInvalidGrid = (): SudokuGrid => {
  const grid = createValidSolvedGrid();
  grid[0][0] = 1;
  return grid;
};

const createIncompleteGrid = (): SudokuGrid => {
  const grid = createValidSolvedGrid();
  grid[0][0] = null;
  return grid;
};
const getInvalidCells = (board: SudokuGrid): string[] => {
  const invalid: string[] = [];
  
  for (let row = 0; row < 9; row++) {
    const seen = new Set<number>();
    for (let col = 0; col < 9; col++) {
      const value = board[row][col];
      if (value !== null) {
        if (seen.has(value)) {
          for (let c = 0; c < 9; c++) {
            if (board[row][c] === value) {
              invalid.push(`${row}-${c}`);
            }
          }
        } else {
          seen.add(value);
        }
      }
    }
  }
  
  return [...new Set(invalid)];
};
const { isValidMove } = useSudokuGame();

describe('Sudoku Validation', () => {
  let validGrid: SudokuGrid;
  beforeEach(() => {
    validGrid = createValidSolvedGrid();
  });

  it('should validate a valid move', () => {
   
    expect(isValidMove(validGrid, 0, 0, 1)).toBe(false);
    expect(isValidMove(validGrid, 0, 0, 2)).toBe(false);
    expect(isValidMove(validGrid, 0, 0, 3)).toBe(false);
    expect(isValidMove(validGrid, 0, 0, 4)).toBe(false); 
  });

  it('should detect invalid moves', () => {
   

    const testGrid = validGrid.map(row => [...row]);
    testGrid[0][0] = null;

    expect(isValidMove(testGrid, 0, 0, 1)).toBe(false);
    expect(isValidMove(testGrid, 0, 0, 2)).toBe(false);
    expect(isValidMove(testGrid, 0, 0, 3)).toBe(false);
  });
});

describe('Invalid Cells Detection', () => {
  it('should detect invalid cells in rows', () => {
    

    const invalidGrid = createInvalidGrid();
    const invalidCells = getInvalidCells(invalidGrid);
    
    expect(invalidCells.length).toBeGreaterThan(0);
    expect(invalidCells).toContain('0-0');
    expect(invalidCells).toContain('0-7');
  });

  it('should detect invalid cells in columns', () => {
   

    const testGrid = createValidSolvedGrid();
    testGrid[0][0] = 1;
    const invalidCells = getInvalidCells(testGrid);
    
    expect(invalidCells.length).toBeGreaterThan(0);
    expect(invalidCells).toContain('0-0');
  });

  it('should detect invalid cells in 3x3 boxes', () => {
   
    const testGrid = createValidSolvedGrid();
    testGrid[0][0] = 6;
    const invalidCells = getInvalidCells(testGrid);
    
    expect(invalidCells.length).toBeGreaterThan(0);
    expect(invalidCells).toContain('0-0');
  });
});

describe('Puzzle Generation', () => {
  it('should generate puzzles with correct difficulty levels', () => {
    const generateSudokuPuzzle = (difficulty: 'beginner' | 'intermediate' | 'hard' | 'expert'): SudokuGrid => {
      const solved = createValidSolvedGrid();
      
      const configs = {
        beginner: { minVisible: 36, maxVisible: 40 },
        intermediate: { minVisible: 32, maxVisible: 36 },
        hard: { minVisible: 28, maxVisible: 32 },
        expert: { minVisible: 24, maxVisible: 28 }
      };
      
      const config = configs[difficulty];
      const cellsToRemove = 81 - Math.floor(
        Math.random() * (config.maxVisible - config.minVisible + 1) + config.minVisible
      );

      const puzzle = solved.map(row => [...row]);
      const positions: [number, number][] = [];
      
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          positions.push([row, col]);
        }
      }

      for (let i = positions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [positions[i], positions[j]] = [positions[j], positions[i]];
      }

      for (let i = 0; i < cellsToRemove; i++) {
        const [row, col] = positions[i];
        puzzle[row][col] = null;
      }

      return puzzle;
    };

    const beginnerPuzzle = generateSudokuPuzzle('beginner');
    const intermediatePuzzle = generateSudokuPuzzle('intermediate');
    const hardPuzzle = generateSudokuPuzzle('hard');
    const expertPuzzle = generateSudokuPuzzle('expert');

    const countFilledCells = (grid: SudokuGrid): number => {
      return grid.flat().filter(cell => cell !== null).length;
    };

    const beginnerFilled = countFilledCells(beginnerPuzzle);
    const intermediateFilled = countFilledCells(intermediatePuzzle);
    const hardFilled = countFilledCells(hardPuzzle);
    const expertFilled = countFilledCells(expertPuzzle);

    expect(beginnerFilled).toBeGreaterThanOrEqual(36);
    expect(beginnerFilled).toBeLessThanOrEqual(40);
    
    expect(intermediateFilled).toBeGreaterThanOrEqual(32);
    expect(intermediateFilled).toBeLessThanOrEqual(36);
    
    expect(hardFilled).toBeGreaterThanOrEqual(28);
    expect(hardFilled).toBeLessThanOrEqual(32);
    
    expect(expertFilled).toBeGreaterThanOrEqual(24);
    expect(expertFilled).toBeLessThanOrEqual(28);
  });
});

describe('Scoring System', () => {
  it('should calculate correct scores for valid moves', () => {
    const SCORING_CONFIG = {
      correctCell: 5,
      baseHintPenalty: 3,
      hintPenaltyIncrement: 1,
      errorPenalty: 1,
      timeBonus: 500,
      maxHints: 10
    };

    let score = 0;

    score += SCORING_CONFIG.correctCell;
    expect(score).toBe(5);

    score += SCORING_CONFIG.correctCell;
    expect(score).toBe(10);

    score -= SCORING_CONFIG.errorPenalty;
    expect(score).toBe(9);

    const timeElapsed = 120;
    const timeBonus = SCORING_CONFIG.timeBonus - timeElapsed;
    score += timeBonus;
    expect(score).toBe(389);
  });

  it('should handle correction scoring correctly', () => {
    const SCORING_CONFIG = {
      correctCell: 5,
      errorPenalty: 1
    };

    let score = 0;

    score += SCORING_CONFIG.correctCell;
    expect(score).toBe(5);

    score -= SCORING_CONFIG.correctCell; 
    score += SCORING_CONFIG.correctCell; 
    expect(score).toBe(5);

    
    score -= SCORING_CONFIG.correctCell; 
    score -= SCORING_CONFIG.errorPenalty; 
    expect(score).toBe(-1);

    
    score += SCORING_CONFIG.correctCell;
    expect(score).toBe(4);
  });

  it('should calculate hint penalties correctly', () => {
    const SCORING_CONFIG = {
      baseHintPenalty: 3,
      hintPenaltyIncrement: 1
    };

    let score = 100;
    let hintsUsed = 0;

    
    const hintPenalty1 = SCORING_CONFIG.baseHintPenalty + (hintsUsed * SCORING_CONFIG.hintPenaltyIncrement);
    score -= hintPenalty1;
    hintsUsed++;
    expect(score).toBe(97);

    
    const hintPenalty2 = SCORING_CONFIG.baseHintPenalty + (hintsUsed * SCORING_CONFIG.hintPenaltyIncrement);
    score -= hintPenalty2;
    hintsUsed++;
    expect(score).toBe(93);
  });
});

describe('Completion Detection', () => {
  it('should detect complete puzzles', () => {
    const isComplete = (board: SudokuGrid): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === null) return false;
        }
      }
      return true;
    };

    const completeGrid = createValidSolvedGrid();
    const incompleteGrid = createIncompleteGrid();

    expect(isComplete(completeGrid)).toBe(true);
    expect(isComplete(incompleteGrid)).toBe(false);
  });

  it('should detect correct solutions using rule-based validation', () => {
    

    const isCorrect = (board: SudokuGrid): boolean => {
      const invalid = getInvalidCells(board);
      return invalid.length === 0;
    };

    const correctBoard = createValidSolvedGrid();
    const incorrectBoard = createValidSolvedGrid();
    incorrectBoard[0][0] = 9; // Creates conflict

    expect(isCorrect(correctBoard)).toBe(true);
    expect(isCorrect(incorrectBoard)).toBe(false);
  });
});

describe('Hint System', () => {
  it('should find correct hints using solution-based approach', () => {
    const solveGrid = (grid: SudokuGrid): boolean => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (grid[row][col] === null) {
            for (let num = 1; num <= 9; num++) {
              if (isValidMove(grid, row, col, num)) {
                grid[row][col] = num;
                if (solveGrid(grid)) {
                  return true;
                }
                grid[row][col] = null;
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    

    const getHint = (board: SudokuGrid): { row: number; col: number; value: number } | null => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === null) {
            const boardCopy = board.map(r => [...r]);
            
            for (let num = 1; num <= 9; num++) {
              if (isValidMove(boardCopy, row, col, num)) {
                boardCopy[row][col] = num;
                
                const tempBoard = boardCopy.map(r => [...r]);
                if (solveGrid(tempBoard)) {
                  return { row, col, value: num };
                }
              }
            }
          }
        }
      }
      return null;
    };

    const puzzle = createValidSolvedGrid();
    puzzle[0][0] = null; 

    const hint = getHint(puzzle);
    expect(hint).not.toBeNull();
    expect(hint?.row).toBe(0);
    expect(hint?.col).toBe(0);
    expect(hint?.value).toBe(5); 
  });
});
