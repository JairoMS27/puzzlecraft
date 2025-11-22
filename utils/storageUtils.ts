import { SavedPuzzle } from '../types';

const STORAGE_KEY = 'puzzlecraft_history';

export const savePuzzleToHistory = (imageUrl: string) => {
  try {
    const currentHistory = getPuzzleHistory();
    
    // Avoid duplicates based on image URL (simplified check)
    const exists = currentHistory.some(p => p.imageUrl === imageUrl);
    if (exists) return;

    const newPuzzle: SavedPuzzle = {
      id: Date.now().toString(),
      imageUrl,
      date: Date.now(),
    };

    const updatedHistory = [newPuzzle, ...currentHistory];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (e) {
    console.error("Failed to save puzzle history", e);
  }
};

export const getPuzzleHistory = (): SavedPuzzle[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (e) {
    console.error("Failed to load puzzle history", e);
    return [];
  }
};