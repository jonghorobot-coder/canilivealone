import { useState, useEffect } from 'react';

const STORAGE_KEY = 'canilivealone-data';

export function useLocalStorage(initialState) {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
    return initialState;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }, [state]);

  const clearStorage = () => {
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  return [state, setState, clearStorage];
}
