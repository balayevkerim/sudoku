import axios from 'axios';
import type { Record } from '../types/sudoku';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 5000,
});

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export const leaderboardApi = {
  async getRecords(difficulty?: string): Promise<Record[]> {
    try {
      const params = difficulty ? { difficulty } : {};
      const response = await api.get<ApiResponse<Record[]>>('/leaderboard', { params });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch leaderboard records:', error);
      throw new Error('Failed to fetch leaderboard records');
    }
  },

  async getTopRecords(difficulty: string): Promise<Record[]> {
    try {
      const response = await api.get<ApiResponse<Record[]>>('/leaderboard/top', {
        params: { difficulty }
      });
      return response.data.data;
    } catch (error) {
      console.error('Failed to fetch top records:', error);
      throw new Error('Failed to fetch top records');
    }
  },

  async addRecord(record: Omit<Record, 'id' | 'date'>): Promise<Record> {
    try {
      const response = await api.post<ApiResponse<Record>>('/leaderboard', record);
      return response.data.data;
    } catch (error) {
      console.error('Failed to add record:', error);
      throw new Error('Failed to add record');
    }
  }
};
