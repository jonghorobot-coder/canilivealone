import { useState, useEffect } from 'react';

const STORAGE_KEY = 'can-i-live-alone-data';

export function useLocalStorage(initialState) {
  const [state, setState] = useState(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load from sessionStorage:', error);
    }
    return initialState;
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error);
    }
  }, [state]);

  const clearStorage = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  };

  return [state, setState, clearStorage];
}
