import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage, once re run the server, the leaderboard data will be reset
let leaderboardRecords = [];

app.get('/api/leaderboard', (req, res) => {
  try {
    const { difficulty } = req.query;
    
    let records = [...leaderboardRecords];
    
    if (difficulty) {
      records = records.filter(record => record.difficulty === difficulty);
    }
    
    records.sort((a, b) => b.score - a.score);
    
    res.json({
      success: true,
      data: records
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch leaderboard'
    });
  }
});

app.post('/api/leaderboard', (req, res) => {
  try {
    const { difficulty, score, time, hintsUsed } = req.body;
    
    // Validate required fields
    if (!difficulty || score === undefined || time === undefined || hintsUsed === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: difficulty, score, time, hintsUsed'
      });
    }
    
    // Validate difficulty incase sent by postman
    const validDifficulties = ['beginner', 'intermediate', 'hard', 'expert'];
    if (!validDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid difficulty level'
      });
    }
    
    const newRecord = {
      id: Date.now().toString(),
      difficulty,
      score: parseInt(score),
      time: parseInt(time),
      date: new Date().toISOString(),
      hintsUsed: parseInt(hintsUsed)
    };
    
    leaderboardRecords.push(newRecord);
    
    
    const difficultyRecords = leaderboardRecords.filter(r => r.difficulty === difficulty);
    difficultyRecords.sort((a, b) => b.score - a.score);
    
    // fetch top 3 per difficulty
    if (difficultyRecords.length > 3) {
      const recordsToRemove = difficultyRecords.slice(3);
      leaderboardRecords = leaderboardRecords.filter(r => !recordsToRemove.includes(r));
    }
    
    res.status(201).json({
      success: true,
      data: newRecord
    });
  } catch (error) {
    console.error('Error adding record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add record'
    });
  }
});

app.get('/api/leaderboard/top', (req, res) => {
  try {
    const { difficulty } = req.query;
    
    if (!difficulty) {
      return res.status(400).json({
        success: false,
        error: 'Difficulty parameter is required'
      });
    }
    
    const difficultyRecords = leaderboardRecords
      .filter(record => record.difficulty === difficulty)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
    
    res.json({
      success: true,
      data: difficultyRecords
    });
  } catch (error) {
    console.error('Error fetching top records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch top records'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Sudoku backend server running on port ${PORT}`);
});
