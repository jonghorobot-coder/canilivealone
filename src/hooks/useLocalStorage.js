import { useState, useEffect } from 'react';

const STORAGE_KEY = 'canilivealone-data';

// 페이지 로드 시 한 번만 실행되는 초기화 플래그
// SPA 내부 네비게이션에서는 이미 true이므로 초기화되지 않음
let isAppInitialized = false;

export function useLocalStorage(initialState) {
  const [state, setState] = useState(() => {
    try {
      // 페이지가 처음 로드될 때 (링크 클릭, URL 직접 입력, 새로고침 등)
      // 루트 경로('/')면 항상 초기 상태로 시작
      if (!isAppInitialized) {
        isAppInitialized = true;

        const isRootPath = window.location.pathname === '/';
        if (isRootPath) {
          localStorage.removeItem(STORAGE_KEY);
          return initialState;
        }
      }

      // 루트가 아니거나 SPA 내비게이션이면 localStorage에서 복원
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
