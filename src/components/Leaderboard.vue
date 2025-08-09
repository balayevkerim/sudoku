<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue';
import type { Difficulty, Record } from '../types/sudoku';
import { DIFFICULTY_CONFIGS } from '../types/sudoku';

interface Props {
  records: Record[];
  isLoading: boolean;
  selectedDifficulty: Difficulty;
}

interface Emits {
  (e: 'difficultyChange', difficulty: Difficulty): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const difficultyConfigs = computed(() => Object.values(DIFFICULTY_CONFIGS) as Array<{
  name: Difficulty;
  label: string;
}>);

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getDifficultyLabel = (difficulty: Difficulty): string => {
  const config = difficultyConfigs.value.find(c => c.name === difficulty);
  return config?.label || 'Beginner';
};

const handleTabChange = (difficulty: Difficulty): void => {
  emit('difficultyChange', difficulty);
};
</script>

<template>
  <div class="leaderboard-sidebar">
    <div class="leaderboard-header">
      <span class="trophy-icon">🏆</span>
      <h3>Leaderboard</h3>
    </div>
    
    <div class="leaderboard-tabs">
      <button 
        v-for="config in difficultyConfigs"
        :key="config.name"
        @click="handleTabChange(config.name)"
        class="tab-btn"
        :class="{ active: selectedDifficulty === config.name }"
        :disabled="isLoading"
      >
        {{ config.label }}
      </button>
    </div>
    
    <div class="leaderboard-content">
      <div v-if="isLoading" class="loading-records">
        Loading records...
      </div>
      <div v-else-if="records.length === 0" class="no-records">
        No records yet for {{ getDifficultyLabel(selectedDifficulty) }}
      </div>
      <div 
        v-else
        v-for="(record, index) in records"
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
</template>

<style scoped>
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

/* Responsive design */
@media (max-width: 1200px) {
  .leaderboard-sidebar {
    width: 100%;
    max-width: 600px;
  }
}
</style>
