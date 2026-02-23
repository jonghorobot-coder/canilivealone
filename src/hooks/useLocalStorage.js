import { useState, useEffect } from 'react';

const STORAGE_KEY = 'canilivealone-data';
const SESSION_KEY = 'canilivealone-session';

export function useLocalStorage(initialState) {
  const [state, setState] = useState(() => {
    try {
      // 새 세션인지 확인 (탭/창을 닫았다가 다시 열면 sessionStorage가 초기화됨)
      const isNewSession = !sessionStorage.getItem(SESSION_KEY);

      if (isNewSession) {
        // 새 세션이면 localStorage 데이터 무시하고 초기 상태로 시작
        sessionStorage.setItem(SESSION_KEY, 'active');
        localStorage.removeItem(STORAGE_KEY);
        return initialState;
      }

      // 기존 세션이면 localStorage에서 복원
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
