<template>
  <div class="sudoku-container">
    <div class="sudoku-grid">
      <div 
        v-for="row in 9" 
        :key="`row-${row}`" 
        class="sudoku-row"
        :class="{ 'row-complete': isRowComplete(row - 1) }"
      >
        <div 
          v-for="col in 9" 
          :key="`cell-${row}-${col}`" 
          class="sudoku-cell"
          :class="getCellClasses(row - 1, col - 1)"
        >
          <input
            :value="getCellDisplayValue(row - 1, col - 1)"
            @input="handleCellInput(row - 1, col - 1, ($event.target as HTMLInputElement).value)"
            @keydown="handleKeydown($event, row - 1, col - 1)"
            :readonly="isOriginalCell(row - 1, col - 1)"
            type="text"
            maxlength="1"
            class="cell-input"
            :disabled="isOriginalCell(row - 1, col - 1)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SudokuGrid } from '../types/sudoku';

interface Props {
  board: SudokuGrid;
  puzzle: SudokuGrid;
  invalidCells: string[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
  updateCell: [row: number, col: number, value: string];
}>();

const getCellDisplayValue = (row: number, col: number): string => {
  const value = props.board[row][col];
  return value !== null ? value.toString() : '';
};

const isOriginalCell = (row: number, col: number): boolean => {
  return props.puzzle[row][col] !== null;
};

const isCellInvalid = (row: number, col: number): boolean => {
  return props.invalidCells.includes(`${row}-${col}`);
};

const isRowComplete = (row: number): boolean => {
  for (let col = 0; col < 9; col++) {
    if (props.board[row][col] === null) return false;
  }
  return true;
};

const isColumnComplete = (col: number): boolean => {
  for (let row = 0; row < 9; row++) {
    if (props.board[row][col] === null) return false;
  }
  return true;
};

const isBoxComplete = (row: number, col: number): boolean => {
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (props.board[r][c] === null) return false;
    }
  }
  return true;
};

const getCellClasses = (row: number, col: number): string[] => {
  const classes: string[] = [];
  
  if (isOriginalCell(row, col)) {
    classes.push('original-cell');
  }
  
  if (isCellInvalid(row, col)) {
    classes.push('invalid-cell');
  }
  
  if (isRowComplete(row)) {
    classes.push('row-complete');
  }
  
  if (isColumnComplete(col)) {
    classes.push('column-complete');
  }
  
  if (isBoxComplete(row, col)) {
    classes.push('box-complete');
  }
  
  return classes;
};

const handleCellInput = (row: number, col: number, value: string): void => {
  emit('updateCell', row, col, value);
};


const handleKeydown = (event: KeyboardEvent, row: number, col: number): void => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    navigateToCell(event.key, row, col);
    return;
  }
  
  if (['Backspace', 'Delete','Tab'].includes(event.key)) {
    return;
  }
  
  // Only allow digits 1-9
  if (!/^[1-9]$/.test(event.key)) {
    event.preventDefault();
  }
};

const navigateToCell = (direction: string, currentRow: number, currentCol: number): void => {
  let newRow = currentRow;
  let newCol = currentCol;
  
  switch (direction) {
    case 'ArrowUp':
      newRow = Math.max(0, currentRow - 1);
      break;
    case 'ArrowDown':
      newRow = Math.min(8, currentRow + 1);
      break;
    case 'ArrowLeft':
      newCol = Math.max(0, currentCol - 1);
      break;
    case 'ArrowRight':
      newCol = Math.min(8, currentCol + 1);
      break;
  }
  
  // Focusing the target cell
  const targetInput = document.querySelector(
    `.sudoku-grid .sudoku-row:nth-child(${newRow + 1}) .sudoku-cell:nth-child(${newCol + 1}) input`
  ) as HTMLInputElement;
  
  if (targetInput) {
    targetInput.focus();
    targetInput.select();
  }
};
</script>

<style scoped>
.sudoku-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
}

.sudoku-grid {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  gap: 0;
  background-color: #333;
  border: 3px solid #333;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  max-height: 450px;
  width: 100%;
  height: 100%;
}

.sudoku-row {
  display: contents;
}

.sudoku-cell {
  position: relative;
  background-color: #fff;
  transition: all 0.3s ease;
  aspect-ratio: 1;
  min-width: 40px;
  min-height: 40px;
  border: 1px solid #ccc;
}

.sudoku-cell:nth-child(3n) {
  border-right: 2px solid #333 !important;
}

.sudoku-row:nth-child(3n) .sudoku-cell {
  border-bottom: 2px solid #333 !important;
}

.sudoku-row:last-child .sudoku-cell {
  border-bottom: 1px solid #ccc;
}

.sudoku-cell:last-child {
  border-right: 1px solid #ccc;
}



.cell-input {
  width: 100%;
  height: 100%;
  min-width: 40px;
  min-height: 40px;
  border: none;
  outline: none;
  text-align: center;
  font-size: 1.5rem;
  font-weight: bold;
  color: #333;
  background-color: transparent;
  transition: all 0.2s ease;
  cursor: pointer;
  box-sizing: border-box;
}

.cell-input:focus {
  background-color: #e3f2fd;
  box-shadow: inset 0 0 0 2px #2196f3;
}

.cell-input:disabled {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
  font-weight: 600;
}

.original-cell .cell-input {
  background-color: #e8f5e8;
  color: #2e7d32;
  font-weight: 700;
}

.invalid-cell .cell-input {
  background-color: #ffebee;
  color: #c62828;
  animation: shake 0.5s ease-in-out;
}

.row-complete {
  animation: completeRow 0.6s ease-out;
}

.column-complete {
  animation: completeColumn 0.6s ease-out;
}

.box-complete {
  animation: completeBox 0.6s ease-out;
}

/* Animations */
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-2px); }
  75% { transform: translateX(2px); }
}

@keyframes completeRow {
  0% { background-color: #fff; }
  50% { background-color: #c8e6c9; }
  100% { background-color: #fff; }
}

@keyframes completeColumn {
  0% { background-color: #fff; }
  50% { background-color: #c8e6c9; }
  100% { background-color: #fff; }
}

@keyframes completeBox {
  0% { background-color: #fff; }
  50% { background-color: #c8e6c9; }
  100% { background-color: #fff; }
}

/* Responsiveness */
@media (max-width: 768px) {
  .sudoku-container {
    padding: 1rem;
  }
  
  .cell-input {
    font-size: 1.2rem;
  }
}

@media (max-width: 480px) {
  .cell-input {
    font-size: 1rem;
  }
}

/* Hover */
.sudoku-cell:hover:not(.original-cell) .cell-input {
  background-color: #f0f8ff;
}

.cell-input:focus-visible {
  box-shadow: inset 0 0 0 3px #2196f3;
}
</style>
