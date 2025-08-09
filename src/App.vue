<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import SudokuGrid from './components/SudokuGrid.vue';
import Leaderboard from './components/Leaderboard.vue';
import ActionButtons from './components/ActionButtons.vue';
import AvailableDigits from './components/AvailableDigits.vue';
import GameCompleteModal from './components/GameCompleteModal.vue';
import { useSudokuGame } from './composables/useSudokuGame';
import type { Difficulty, Record } from './types/sudoku';
import { DIFFICULTY_CONFIGS, SCORING_CONFIG } from './types/sudoku';

const {
  gameState,
  elapsedTime,
  availableDigits,
  invalidCells,
  startNewGame,
  updateCell,
  getHint,
  applyHint,
  solveBoard,
  resetBoard,
  pauseGame,
  continueGame,
  getTopRecords,
  cleanup
} = useSudokuGame();

// Leaderboard state
const leaderboardRecords = ref<Record[]>([]);
const isLoadingLeaderboard = ref(false);

// Message state
const message = ref<string | null>(null);
const messageType = ref<'success' | 'error' | 'info'>('info');
const selectedDifficulty = ref<Difficulty>(gameState.value.difficulty);
const selectedLeaderboardDifficulty = ref<Difficulty>('beginner');

const maxHints = SCORING_CONFIG.maxHints;

const messageIcon = computed(() => {
  switch (messageType.value) {
    case 'success': return '✅';
    case 'error': return '❌';
    case 'info': return 'ℹ️';
    default: return 'ℹ️';
  }
});

const canUseHint = computed(() => {
  return gameState.value.hintsUsed < maxHints && !gameState.value.isComplete;
});

const getDifficultyLabel = (difficulty: Difficulty): string => {
  const config = Object.values(DIFFICULTY_CONFIGS).find(c => c.name === difficulty);
  return config?.label || 'Intermediate';
};

onMounted(async () => {
  if (!gameState.value.startTime) {
    startNewGame('beginner');
  }
  await loadLeaderboardData();
});

onUnmounted(() => {
  cleanup();
});

watch(selectedDifficulty, (newDifficulty) => {
  if (gameState.value.difficulty !== newDifficulty) {
    handleDifficultyChange();
  }
});

watch(() => gameState.value.difficulty, (newDifficulty) => {
  if (selectedDifficulty.value !== newDifficulty) {
    selectedDifficulty.value = newDifficulty;
  }
});

const handleDifficultyChange = (): void => {
  startNewGame(selectedDifficulty.value);
  showMessage(`New ${getDifficultyLabel(selectedDifficulty.value)} game started!`, 'info');
};

const handleUpdateCell = (row: number, col: number, value: string): void => {
  updateCell(row, col, value);
};





const handleSolve = (): void => {
  solveBoard();
  showMessage('Puzzle solved!', 'info');
};

const handleReset = (): void => {
  resetBoard();
  showMessage('Game reset!', 'info');
};

const handleHint = (): void => {
  const hint = getHint();
  if (hint) {
    applyHint(hint);
    showMessage(`Hint applied: ${hint.value} at position (${hint.row + 1}, ${hint.col + 1})`, 'info');
  } else {
    showMessage('No hints available or puzzle is complete!', 'error');
  }
};

const handleNewGame = (): void => {
  startNewGame(selectedDifficulty.value);
};


const showMessage = (text: string, type: 'success' | 'error' | 'info'): void => {
  message.value = text;
  messageType.value = type;
  
  setTimeout(() => {
    clearMessage();
  }, 2000);
};

const clearMessage = (): void => {
  message.value = null;
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};



const loadLeaderboardData = async (): Promise<void> => {
  try {
    isLoadingLeaderboard.value = true;
    const records = await getTopRecords(selectedLeaderboardDifficulty.value);
    leaderboardRecords.value = records;
  } catch (error) {
    console.error('Failed to load leaderboard data:', error);
    showMessage('Failed to load leaderboard data', 'error');
  } finally {
    isLoadingLeaderboard.value = false;
  }
};

const handleLeaderboardTabChange = async (difficulty: Difficulty): Promise<void> => {
  selectedLeaderboardDifficulty.value = difficulty;
  await loadLeaderboardData();
};

const handleActionButtonsEvents = {
  difficultyChange: handleDifficultyChange,
  newGame: handleNewGame,
  hint: handleHint,
  solve: handleSolve,
  reset: handleReset
};
</script>

<template>
  <div id="app">
    <header class="app-header">
      <h1>Sudoku Insider</h1>
    </header>

    <!-- Top Controls Bar -->
    <div class="top-controls">
      <div class="game-info">
        <div class="info-item">
          <span class="info-label">Level:</span>
          <span class="info-value">{{ getDifficultyLabel(gameState.difficulty) }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Score:</span>
          <span class="info-value">{{ gameState.score }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Time:</span>
          <span class="info-value">{{ formatTime(elapsedTime) }}</span>
          <button 
            v-if="!gameState.isPaused" 
            @click="pauseGame" 
            class="timer-btn"
            title="Pause Game"
          >
            ⏸️
          </button>
          <button 
            v-else 
            @click="continueGame" 
            class="timer-btn"
            title="Continue Game"
          >
            ▶️
          </button>
        </div>
        <div class="info-item">
          <span class="info-label">Hints:</span>
          <span class="info-value">💡 ({{ gameState.hintsUsed }}/{{ maxHints }})</span>
        </div>
      </div>

      <ActionButtons
        v-model:selectedDifficulty="selectedDifficulty"
        :canUseHint="canUseHint"
        :maxHints="maxHints"
        :hintsUsed="gameState.hintsUsed"
        @difficultyChange="handleActionButtonsEvents.difficultyChange"
        @newGame="handleActionButtonsEvents.newGame"
        @hint="handleActionButtonsEvents.hint"
        @solve="handleActionButtonsEvents.solve"
        @reset="handleActionButtonsEvents.reset"
      />
    </div>

    <main class="app-main">
      <div class="game-layout">
        <!-- Left Sidebar - Leaderboard -->
        <Leaderboard
          :records="leaderboardRecords"
          :isLoading="isLoadingLeaderboard"
          :selectedDifficulty="selectedLeaderboardDifficulty"
          @difficultyChange="handleLeaderboardTabChange"
        />
        
        <!-- Center - Game Board -->
        <div class="game-board">
          <div v-if="gameState.isPaused" class="paused-overlay">
            <div class="paused-message">
              <div class="paused-icon">⏸️</div>
              <h3>Game Paused</h3>
              <p>Timer stopped - click continue to resume playing</p>
              <button @click="continueGame" class="continue-btn">
                Continue Game
              </button>
            </div>
          </div>
          <SudokuGrid
            v-show="!gameState.isPaused"
            :board="gameState.board"
            :puzzle="gameState.puzzle"
            :invalid-cells="invalidCells"
            @update-cell="handleUpdateCell"
          />
          
          <!-- Available Digits -->
          <AvailableDigits
            v-show="!gameState.isPaused"
            :availableDigits="availableDigits"
          />
        </div>
      </div>
    </main>

    <!-- Messages -->
    <div v-if="message" class="message-overlay">
      <div class="message" :class="messageType">
        <span class="icon">{{ messageIcon }}</span>
        <span>{{ message }}</span>
        <button @click="clearMessage" class="close-message">×</button>
      </div>
    </div>

    <!-- Game Complete Modal -->
    <GameCompleteModal
      :isVisible="gameState.isComplete && gameState.isCorrect"
      :score="gameState.score"
      :elapsedTime="elapsedTime"
      :hintsUsed="gameState.hintsUsed"
      @newGame="handleNewGame"
    />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

body{
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-header {
  text-align: center;
  padding: 1rem;
}

.app-header h1 {
  font-size: 2.5rem;
  margin: 0 0 0.5rem 0;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.app-header p {
  font-size: 1rem;
  opacity: 0.9;
  max-width: 600px;
  margin: 0 auto;
}

/* Top Controls Bar */
.top-controls {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.game-info {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-label {
  font-weight: 600;
  opacity: 0.8;
}

.info-value {
  font-weight: bold;
  font-size: 1.1rem;
}

.timer-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  color: white;
}

.timer-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.1);
}



.app-main {
  flex: 1;
  padding: 2rem;
}

.game-layout {
  display: flex;
  gap: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  align-items: flex-start;
}



/* Center - Game Board */
.game-board {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}



.paused-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10;
  border-radius: 12px;
  backdrop-filter: blur(5px);
}

.paused-message {
  background: white;
  padding: 3rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 400px;
  animation: fadeIn 0.3s ease-out;
}

.paused-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.paused-message h3 {
  color: #333;
  margin: 0 0 1rem 0;
  font-size: 1.8rem;
  font-weight: 600;
}

.paused-message p {
  color: #666;
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
  line-height: 1.5;
}

.continue-btn {
  background: linear-gradient(135deg, #4CAF50, #45a049);
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.continue-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, #45a049, #4CAF50);
}

.continue-btn:active {
  transform: translateY(0);
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}



/* Message Overlay */
.message-overlay {
  position: fixed;
  top: 2rem;
  right: 2rem;
  z-index: 1000;
}

.message {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-radius: 12px;
  font-weight: 500;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  animation: slideInRight 0.3s ease-out;
  backdrop-filter: blur(10px);
  min-width: 300px;
  position: relative;
}

.message.success {
  background: linear-gradient(135deg, #4caf50, #388e3c);
  color: white;
}

.message.error {
  background: linear-gradient(135deg, #f44336, #d32f2f);
  color: white;
}

.message.info {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
}

.close-message {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  background: none;
  border: none;
  color: inherit;
  font-size: 1.2rem;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.close-message:hover {
  opacity: 1;
}



.app-footer {
  text-align: center;
  padding: 2rem;
  opacity: 0.8;
  font-size: 0.9rem;
}

/* Animations */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}



/* Responsive design */
@media (max-width: 1200px) {
  .game-layout {
    flex-direction: column;
    align-items: center;
  }
  
  .top-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .game-info {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .game-board {
    flex-direction: column;
  }
  .app-header h1 {
    font-size: 2rem;
  }
  
  .top-controls {
    padding: 1rem;
  }
  
  .game-info {
    flex-direction: column;
    gap: 0.5rem;
  }
  

  
  .app-main {
    padding: 1rem;
  }
  
  .message {
    min-width: 250px;
    padding: 0.75rem 1rem;
  }
  
  .complete-content {
    padding: 2rem;
  }
  

}

@media (max-width: 480px) {
  .app-header {
    padding: 0.5rem;
  }
  
  .app-header h1 {
    font-size: 1.5rem;
  }
  
  .app-header p {
    font-size: 0.9rem;
  }
  
  .message-overlay {
    top: 1rem;
    right: 1rem;
    left: 1rem;
  }
  
  .message {
    min-width: auto;
    width: 100%;
  }
}
</style>
