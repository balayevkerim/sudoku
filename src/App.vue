<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import SudokuGrid from './components/SudokuGrid.vue';
import { useSudokuGame } from './composables/useSudokuGame';
import type { Difficulty, Record } from './types/sudoku';
import { DIFFICULTY_CONFIGS, SCORING_CONFIG } from './types/sudoku';

const {
  gameState,
  records,
  isComplete,
  isCorrect,
  elapsedTime,
  availableDigits,
  invalidCells,
  startNewGame,
  updateCell,
  getHint,
  applyHint,
  validateBoard,
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
const selectedLeaderboardDifficulty = ref<Difficulty>('intermediate');

const difficultyConfigs = computed(() => Object.values(DIFFICULTY_CONFIGS) as Array<{
  name: Difficulty;
  label: string;
}>);
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

const handleCellFocus = (row: number, col: number): void => {
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

const getDifficultyLabel = (difficulty: Difficulty): string => {
  const config = difficultyConfigs.value.find(c => c.name === difficulty);
  return config?.label || 'Intermediate';
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

      <div class="game-actions">
        <select v-model="selectedDifficulty" @change="handleDifficultyChange" class="difficulty-select">
          <option v-for="config in difficultyConfigs" :key="config.name" :value="config.name">
            {{ config.label }}
          </option>
        </select>
        
        <button @click="handleNewGame" class="action-btn new-game-btn">
          <span class="btn-icon">🎯</span>
          New Game
        </button>
        
        <button @click="handleHint" class="action-btn hint-btn" :disabled="!canUseHint">
          <span class="btn-icon">💡</span>
          Hint
        </button>
        
       
        
        <button @click="handleSolve" class="action-btn solve-btn">
          <span class="btn-icon">🔍</span>
          Solve
        </button>
        
        <button @click="handleReset" class="action-btn reset-btn">
          <span class="btn-icon">🔄</span>
          Reset
        </button>
      </div>
    </div>

    <main class="app-main">
      <div class="game-layout">
        <!-- Left Sidebar - Leaderboard -->
        <div class="leaderboard-sidebar">
          <div class="leaderboard-header">
            <span class="trophy-icon">🏆</span>
            <h3>Leaderboard</h3>
          </div>
          
          <div class="leaderboard-tabs">
            <button 
              v-for="config in difficultyConfigs"
              :key="config.name"
              @click="handleLeaderboardTabChange(config.name)"
              class="tab-btn"
              :class="{ active: selectedLeaderboardDifficulty === config.name }"
              :disabled="isLoadingLeaderboard"
            >
              {{ config.label }}
            </button>
          </div>
          
          <div class="leaderboard-content">
            <div v-if="isLoadingLeaderboard" class="loading-records">
              Loading records...
            </div>
            <div v-else-if="leaderboardRecords.length === 0" class="no-records">
              No records yet for {{ getDifficultyLabel(selectedLeaderboardDifficulty) }}
            </div>
            <div 
              v-else
              v-for="(record, index) in leaderboardRecords"
              :key="record.id"
              class="record-item"
            >
              <div class="record-rank">#{{ index + 1 }}</div>
              <div class="record-details">
                <div class="record-score">{{ record.score }}</div>
                <div class="record-time">{{ formatTime(record.time) }}</div>
                <div class="record-hints">{{ record.hintsUsed }} hints</div>
              </div>
            </div>
          </div>
        </div>
        
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
            @cell-focus="handleCellFocus"
          />
          
          <!-- Available Digits -->
          <div v-show="!gameState.isPaused" class="available-digits">
            <h4>Available Digits:</h4>
            <div class="digits-grid">
              <div 
                v-for="digit in 9" 
                :key="digit"
                class="digit-button"
                :class="{ 'digit-complete': availableDigits.get(digit) === 9 }"
              >
                {{ digit }}
              </div>
            </div>
          </div>
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
    <div v-if="gameState.isComplete && gameState.isCorrect" class="game-complete-modal">
      <div class="complete-content">
        <div class="complete-icon">🎉</div>
        <h2>Congratulations!</h2>
        <p>You've completed the puzzle!</p>
        
        <div class="final-stats">
          <div class="stat">
            <span class="stat-label">Final Score:</span>
            <span class="stat-value">{{ gameState.score }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Time:</span>
            <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Hints Used:</span>
            <span class="stat-value">{{ gameState.hintsUsed }}</span>
          </div>
        </div>
        
        <div class="complete-actions">
          <button @click="handleNewGame" class="btn btn-primary">New Game</button>
        </div>
      </div>
    </div>
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

.game-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.difficulty-select {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-weight: 600;
  cursor: pointer;
  backdrop-filter: blur(10px);
}

.difficulty-select option {
  background: #333;
  color: white;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  color: white;
}

.action-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.new-game-btn {
  background: linear-gradient(135deg, #9c27b0, #7b1fa2);
}

.hint-btn {
  background: linear-gradient(135deg, #ff9800, #f57c00);
}

.solve-btn {
  background: linear-gradient(135deg, #2196f3, #1976d2);
}

.reset-btn {
  background: linear-gradient(135deg, #ff5722, #d84315);
}

.btn-icon {
  font-size: 1rem;
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

/* Left Sidebar - Leaderboard */
.leaderboard-sidebar {
  width: 300px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  flex-shrink: 0;
}

.leaderboard-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.trophy-icon {
  font-size: 1.5rem;
}

.leaderboard-header h3 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
}

.leaderboard-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.5rem;
  border: none;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.8rem;
  font-weight: 500;
}

.tab-btn.active {
  background: rgba(255, 255, 255, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.leaderboard-content {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.no-records {
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-style: italic;
  padding: 1rem;
}

.loading-records {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  padding: 1rem;
  font-weight: 500;
}

.record-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  border-left: 3px solid #ffc107;
}

.record-rank {
  font-size: 1.2rem;
  font-weight: bold;
  color: #ffc107;
  min-width: 30px;
}

.record-details {
  flex: 1;
}

.record-score {
  font-size: 1.1rem;
  font-weight: bold;
  color: white;
}

.record-player {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.8);
}

.record-time {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.record-hints {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
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

/* Available Digits */
.available-digits {
  margin-top: 1rem;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.available-digits h4 {
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: white;
}

.digits-grid {
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.digit-button {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  font-size: 1rem;
  font-weight: bold;
  color: #333;
  cursor: default;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.digit-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.digit-button.digit-complete {
  background: rgba(128, 128, 128, 0.6);
  color: rgba(255, 255, 255, 0.7);
  border-color: rgba(128, 128, 128, 0.4);
  text-decoration: line-through;
  opacity: 0.7;
}

.digit-button.digit-complete:hover {
  transform: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
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

/* Game Complete Modal */
.game-complete-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.complete-content {
  background: white;
  border-radius: 20px;
  padding: 3rem;
  text-align: center;
  color: #333;
  max-width: 500px;
  width: 90%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: scaleIn 0.5s ease-out;
}

.complete-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
  animation: bounce 1s ease-in-out;
}

.complete-content h2 {
  font-size: 2rem;
  margin: 0 0 1rem 0;
  color: #333;
}

.complete-content p {
  font-size: 1.1rem;
  color: #666;
  margin-bottom: 2rem;
}

.final-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-label {
  font-size: 0.9rem;
  color: #666;
  font-weight: 500;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
}

.complete-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.btn {
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background: linear-gradient(135deg, #4caf50, #388e3c);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
}

.btn-secondary {
  background: linear-gradient(135deg, #2196f3, #1976d2);
  color: white;
}

.btn-secondary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
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

@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

/* Responsive design */
@media (max-width: 1200px) {
  .game-layout {
    flex-direction: column;
    align-items: center;
  }
  
  .leaderboard-sidebar {
    width: 100%;
    max-width: 600px;
  }
  
  .top-controls {
    flex-direction: column;
    gap: 1rem;
  }
  
  .game-info {
    justify-content: center;
  }
  
  .game-actions {
    justify-content: center;
    flex-wrap: wrap;
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
  
  .game-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
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
  
  .final-stats {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .complete-actions {
    flex-direction: column;
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
