
import { ChatSession } from '../types';

const HISTORY_KEY = 'socraticBibleStudyHistory';

export const loadSessions = (): ChatSession[] => {
  try {
    const storedHistory = localStorage.getItem(HISTORY_KEY);
    if (storedHistory) {
      return JSON.parse(storedHistory);
    }
  } catch (error) {
    console.error('Failed to load session history:', error);
  }
  return [];
};

export const saveSessions = (sessions: ChatSession[]): void => {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save session history:', error);
  }
};

export const clearSessions = (): void => {
    try {
        localStorage.removeItem(HISTORY_KEY);
    } catch (error) {
        console.error('Failed to clear session history:', error);
    }
}
