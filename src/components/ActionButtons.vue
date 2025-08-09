<script setup lang="ts">
import { computed, defineProps, defineEmits } from 'vue';
import type { Difficulty } from '../types/sudoku';
import { DIFFICULTY_CONFIGS } from '../types/sudoku';

interface Props {
  selectedDifficulty: Difficulty;
  canUseHint: boolean;
  maxHints: number;
  hintsUsed: number;
}

interface Emits {
  (e: 'difficultyChange'): void;
  (e: 'newGame'): void;
  (e: 'hint'): void;
  (e: 'solve'): void;
  (e: 'reset'): void;
  (e: 'update:selectedDifficulty', difficulty: Difficulty): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const difficultyConfigs = computed(() => Object.values(DIFFICULTY_CONFIGS) as Array<{
  name: Difficulty;
  label: string;
}>);

const handleDifficultyChange = (): void => {
  emit('difficultyChange');
};

const handleNewGame = (): void => {
  emit('newGame');
};

const handleHint = (): void => {
  emit('hint');
};

const handleSolve = (): void => {
  emit('solve');
};

const handleReset = (): void => {
  emit('reset');
};

const updateSelectedDifficulty = (difficulty: Difficulty): void => {
  emit('update:selectedDifficulty', difficulty);
};
</script>

<template>
  <div class="game-actions">
    <select 
      :value="selectedDifficulty" 
      @change="(e) => updateSelectedDifficulty((e.target as HTMLSelectElement).value as Difficulty)"
      class="difficulty-select"
    >
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
</template>

<style scoped>
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

/* Responsiveness */
@media (max-width: 1200px) {
  .game-actions {
    justify-content: center;
    flex-wrap: wrap;
  }
}

@media (max-width: 768px) {
  .game-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
