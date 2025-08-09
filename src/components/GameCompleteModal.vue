<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Props {
  isVisible: boolean;
  score: number;
  elapsedTime: number;
  hintsUsed: number;
}

interface Emits {
  (e: 'newGame'): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const handleNewGame = (): void => {
  emit('newGame');
};
</script>

<template>
  <div v-if="isVisible" class="game-complete-modal">
    <div class="complete-content">
      <div class="complete-icon">🎉</div>
      <h2>Congratulations!</h2>
      <p>You've completed the puzzle!</p>
      
      <div class="final-stats">
        <div class="stat">
          <span class="stat-label">Final Score:</span>
          <span class="stat-value">{{ score }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Time:</span>
          <span class="stat-value">{{ formatTime(elapsedTime) }}</span>
        </div>
        <div class="stat">
          <span class="stat-label">Hints Used:</span>
          <span class="stat-value">{{ hintsUsed }}</span>
        </div>
      </div>
      
      <div class="complete-actions">
        <button @click="handleNewGame" class="btn btn-primary">New Game</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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

/* Animations */
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
@media (max-width: 768px) {
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
</style>
