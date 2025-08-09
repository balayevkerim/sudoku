<script setup lang="ts">
import { defineProps } from 'vue';

interface Props {
  availableDigits: Map<number, number>;
}

const props = defineProps<Props>();
</script>

<template>
  <div class="available-digits">
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
</template>

<style scoped>
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
</style>
