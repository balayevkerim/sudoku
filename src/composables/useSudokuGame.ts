import { ref, computed, watch } from 'vue';
import type { 
  GameState, 
  Difficulty, 
  SudokuGrid, 
  Record, 
  ValidationResult, 
  Hint,
} from '../types/sudoku';
import { DIFFICULTY_CONFIGS, SCORING_CONFIG } from '../types/sudoku';
import { leaderboardApi } from '../services/api';

const CURRENT_GAME_KEY = 'sudoku_current_game';

export function useSudokuGame() {
  const gameState = ref<GameState>({
    puzzle: Array(9).fill(null).map(() => Array(9).fill(null)),
    board: Array(9).fill(null).map(() => Array(9).fill(null)),
    difficulty: 'beginner',
    score: 0,
    hintsUsed: 0,
    startTime: null,
    endTime: null,
    isComplete: false,
    isCorrect: false,
    isLoading: false,
    error: null,
    isPaused: false,
    pauseStartTime: null
  });

  // leaderboard records
  const records = ref<Record[]>([]);

  const isComplete = computed(() => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.value.board[row][col] === null) return false;
      }
    }
    return true;
  });

  const isCorrect = computed(() => {
    if (!isComplete.value) return false;
    
    const invalid = getInvalidCells();
    return invalid.length === 0;
  });

  const elapsedTime = computed(() => {
    if (!gameState.value.startTime) return 0;
    const end = gameState.value.endTime || Date.now();
    return Math.floor((end - gameState.value.startTime) / 1000);
  });

  const currentTime = ref(Date.now());
  
  const isTabVisible = ref(true);
  
  const handleVisibilityChange = (): void => {
    if (document.hidden) {
      if (!gameState.value.isPaused && gameState.value.startTime && !gameState.value.endTime) {
        gameState.value.isPaused = true;
        gameState.value.pauseStartTime = Date.now();
        saveGameState();
      }
    }
    
    isTabVisible.value = !document.hidden;
  };
  
  document.addEventListener('visibilitychange', handleVisibilityChange);
  
  const cleanup = (): void => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };
  
  setInterval(() => {
    if (gameState.value.startTime && !gameState.value.endTime && !gameState.value.isPaused && isTabVisible.value) {
      currentTime.value = Date.now();
    }
  }, 1000);

  const liveElapsedTime = computed(() => {
    if (!gameState.value.startTime) return 0;
    const end = gameState.value.endTime || currentTime.value;
    return Math.floor((end - gameState.value.startTime) / 1000);
  });

  const pauseGame = (): void => {
    if (!gameState.value.isPaused && gameState.value.startTime && !gameState.value.endTime) {
      gameState.value.isPaused = true;
      gameState.value.pauseStartTime = Date.now();
      saveGameState();
    }
  };

  const continueGame = (): void => {
    if (gameState.value.isPaused) {
      if (gameState.value.pauseStartTime) {
        const pauseDuration = Date.now() - gameState.value.pauseStartTime;
        gameState.value.startTime = (gameState.value.startTime ?? 0) + pauseDuration; 
      }
      gameState.value.isPaused = false;
      gameState.value.pauseStartTime = null;
      saveGameState();
    }
  };


  const availableDigits = computed(() => {
    const counts = new Map<number, number>();
    for (let i = 1; i <= 9; i++) {
      counts.set(i, 0);
    }

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        const value = gameState.value.board[row][col];
        if (value !== null) {
          counts.set(value, counts.get(value)! + 1);
        }
      }
    }

    return counts;
  });

  const invalidCells = computed(() => getInvalidCells());

  const loadRecords = async (): Promise<void> => {
    try {
      const fetchedRecords = await leaderboardApi.getRecords();
      records.value = fetchedRecords;
    } catch (error) {
      console.error('Failed to load records:', error);
      records.value = [];
    }
  };

  const addRecord = async (record: Omit<Record, 'id' | 'date'>): Promise<void> => {
    try {
      const newRecord = await leaderboardApi.addRecord(record);
      await loadRecords();
    } catch (error) {
      console.error('Failed to add record:', error);
      throw error;
    }
  };

  const getTopRecords = async (difficulty?: Difficulty): Promise<Record[]> => {
    try {
      if (difficulty) {
        return await leaderboardApi.getTopRecords(difficulty);
      }
      return await leaderboardApi.getRecords();
    } catch (error) {
      console.error('Failed to get top records:', error);
      return [];
    }
  };

  const generateSudokuPuzzle = (difficulty: Difficulty): SudokuGrid => {
    
    // solved grid so we can remove cells to create puzzle
    const solvedGrid = generateSolvedGrid();
    
    const config = DIFFICULTY_CONFIGS[difficulty];
    const cellsToRemove = 81 - Math.floor(
      Math.random() * (config.maxVisible - config.minVisible + 1) + config.minVisible
    );

    const puzzle = solvedGrid.map(row => [...row]);
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


  const generateSolvedGrid = (): SudokuGrid => {
    const grid: SudokuGrid = Array(9).fill(null).map(() => Array(9).fill(null));
    
    for (let i = 0; i < 9; i += 4) {
      fillBox(grid, Math.floor(i / 3), i % 3);
    }
    
    solveGrid(grid);
    
    return grid;
  };

  const fillBox = (grid: SudokuGrid, startRow: number, startCol: number): void => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const randomIndex = Math.floor(Math.random() * numbers.length);
        grid[startRow * 3 + i][startCol * 3 + j] = numbers[randomIndex];
        numbers.splice(randomIndex, 1);
      }
    }
  };

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

  const isValidMove = (grid: SudokuGrid, row: number, col: number, num: number): boolean => {
    for (let x = 0; x < 9; x++) {
      if (grid[row][x] === num) return false;
    }

    for (let x = 0; x < 9; x++) {
      if (grid[x][col] === num) return false;
    }

    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        if (grid[startRow + i][startCol + j] === num) return false;
      }
    }

    return true;
  };

  const getInvalidCells = (): string[] => {
    const invalid: string[] = [];
    const board = gameState.value.board;
    
    for (let row = 0; row < 9; row++) {
      const seen = new Set<number>();
      for (let col = 0; col < 9; col++) {
        const value = board[row][col];
        if (value !== null) {
          if (seen.has(value)) {
            // Mark all cells with this value in this row as invalid
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
    
    for (let col = 0; col < 9; col++) {
      const seen = new Set<number>();
      for (let row = 0; row < 9; row++) {
        const value = board[row][col];
        if (value !== null) {
          if (seen.has(value)) {
            // Mark all cells with this value in this column as invalid
            for (let r = 0; r < 9; r++) {
              if (board[r][col] === value) {
                invalid.push(`${r}-${col}`);
              }
            }
          } else {
            seen.add(value);
          }
        }
      }
    }
    
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const seen = new Set<number>();
        for (let row = boxRow * 3; row < boxRow * 3 + 3; row++) {
          for (let col = boxCol * 3; col < boxCol * 3 + 3; col++) {
            const value = board[row][col];
            if (value !== null) {
              if (seen.has(value)) {
                // Mark all cells with this value in this box as invalid
                for (let r = boxRow * 3; r < boxRow * 3 + 3; r++) {
                  for (let c = boxCol * 3; c < boxCol * 3 + 3; c++) {
                    if (board[r][c] === value) {
                      invalid.push(`${r}-${c}`);
                    }
                  }
                }
              } else {
                seen.add(value);
              }
            }
          }
        }
      }
    }
    
    return Array.from(new Set(invalid));
  };

  const startNewGame = (difficulty: Difficulty = 'beginner'): void => {
    gameState.value.difficulty = difficulty;
    gameState.value.score = 0;
    gameState.value.hintsUsed = 0;
    gameState.value.startTime = Date.now();
    gameState.value.endTime = null;
    gameState.value.isComplete = false;
    gameState.value.isCorrect = false;
    gameState.value.error = null;
    gameState.value.isPaused = false;
    gameState.value.pauseStartTime = null;

    const puzzle = generateSudokuPuzzle(difficulty);

    gameState.value.puzzle = puzzle.map((row: (number | null)[]) => [...row]);
    gameState.value.board = puzzle.map((row: (number | null)[]) => [...row]);

    saveGameState();
  };

  const updateCell = (row: number, col: number, value: string): void => {
    if (isOriginalCell(row, col)) return;

    const numValue = value === '' ? null : parseInt(value);
    
    if (numValue !== null && (numValue < 1 || numValue > 9)) {
      return;
    }

    const oldValue = gameState.value.board[row][col];
    
    let wasOldValid = false;
    if (oldValue !== null) {
      const tempBoard = gameState.value.board.map(r => [...r]);
      tempBoard[row][col] = null; // Temporarily remove the old value
      wasOldValid = isValidMove(tempBoard, row, col, oldValue);
    }
    
    const isNowValid = numValue === null || isValidMove(gameState.value.board, row, col, numValue);
    
    gameState.value.board[row][col] = numValue;

    if (oldValue !== null && wasOldValid && numValue !== oldValue) {
      gameState.value.score -= SCORING_CONFIG.correctCell;
    }

    if (numValue !== null) {
      if (isNowValid) {
        gameState.value.score += SCORING_CONFIG.correctCell;
      } else {
        gameState.value.score -= SCORING_CONFIG.errorPenalty;
      }
    }

    if (isComplete.value && isCorrect.value) {
      completeGame();
    }

    saveGameState();
  };

  const getHint = (): Hint | null => {
    if (gameState.value.hintsUsed >= SCORING_CONFIG.maxHints) {
      return null;
    }

    // finding the first empty cell to place a hint
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (gameState.value.board[row][col] === null) {
          const boardCopy = gameState.value.board.map(r => [...r]);
          
          for (let num = 1; num <= 9; num++) {
            if (isValidMove(boardCopy, row, col, num)) {
              boardCopy[row][col] = num;
              
              const tempBoard = boardCopy.map(r => [...r]);
              if (solveGrid(tempBoard)) {
                const penalty = SCORING_CONFIG.baseHintPenalty + 
                               (gameState.value.hintsUsed * SCORING_CONFIG.hintPenaltyIncrement);
                gameState.value.score -= penalty;
                gameState.value.hintsUsed++;

                saveGameState();
                return { row, col, value: num };
              }
            }
          }
        }
      }
    }

    return null;
  };

  const applyHint = (hint: Hint): void => {
    gameState.value.board[hint.row][hint.col] = hint.value;
    
    if (isComplete.value && isCorrect.value) {
      completeGame();
    }

    saveGameState();
  };

  const isOriginalCell = (row: number, col: number): boolean => {
    return gameState.value.puzzle[row][col] !== null;
  };

  const validateBoard = (): ValidationResult => {
    const invalid = getInvalidCells();
    
    if (invalid.length > 0) {
      return {
        valid: false,
        message: 'There are errors in the puzzle',
        invalidCells: invalid
      };
    }

    if (!isComplete.value) {
      return {
        valid: false,
        message: 'Puzzle is not complete',
        invalidCells: []
      };
    }

    return {
      valid: true,
      message: 'Puzzle solved correctly!',
      invalidCells: []
    };
  };

  const solveBoard = (): void => {
    const boardCopy = gameState.value.board.map(row => [...row]);
    
    if (solveGrid(boardCopy)) {
      gameState.value.board = boardCopy;
      saveGameState();
    } else {
      console.error('Failed to solve the puzzle');
    }
  };

  const resetBoard = (): void => {
    gameState.value.board = gameState.value.puzzle.map(row => [...row]);
    gameState.value.score = 0;
    gameState.value.hintsUsed = 0;
    gameState.value.startTime = Date.now();
    gameState.value.endTime = null;
    gameState.value.isComplete = false;
    gameState.value.isCorrect = false;
    gameState.value.isPaused = false;
    gameState.value.pauseStartTime = null;
    saveGameState();
  };

  const completeGame = async (): Promise<void> => {
    gameState.value.endTime = Date.now();
    gameState.value.isComplete = true;
    gameState.value.isCorrect = true;

    
    // Adding time bonus
    const timeBonus = SCORING_CONFIG.timeBonus - elapsedTime.value;
    gameState.value.score += timeBonus;

    try {
      const topRecords = await getTopRecords(gameState.value.difficulty);
      if (topRecords.length < 3 || gameState.value.score > topRecords[topRecords.length - 1].score) {
        await addRecord({
          difficulty: gameState.value.difficulty,
          score: gameState.value.score,
          time: elapsedTime.value,
          hintsUsed: gameState.value.hintsUsed
        });
      }
    } catch (error) {
      console.error('Failed to save record to leaderboard:', error);
    }

    saveGameState();
  };

  const saveGameState = (): void => {
    try {
      localStorage.setItem(CURRENT_GAME_KEY, JSON.stringify(gameState.value));
    } catch (error) {
      console.error('Failed to save game state:', error);
    }
  };

  const loadGameState = (): void => {
    try {
      const stored = localStorage.getItem(CURRENT_GAME_KEY);
      if (stored) {
        gameState.value = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load game state:', error);
    }
  };

  // Initialize records and game state
  loadRecords().catch(console.error);
  loadGameState();

  watch(gameState, saveGameState, { deep: true });

  return {
    gameState,
    records,
    isComplete,
    isCorrect,
    elapsedTime: liveElapsedTime,
    availableDigits,
    invalidCells,
    startNewGame,
    updateCell,
    getHint,
    applyHint,
    isOriginalCell,
    validateBoard,
    solveBoard,
    resetBoard,
    pauseGame,
    continueGame,
    getTopRecords,
    loadRecords,
    cleanup,
    isValidMove
  };
}
