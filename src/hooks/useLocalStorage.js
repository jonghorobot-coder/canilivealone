import { useState, useCallback } from 'react';

const STORAGE_KEY = 'canilivealone-data';

/**
 * 상태 관리 훅 (저장 없음)
 * - 페이지 로드/새로고침 시 항상 초기 상태로 시작
 * - 링크 접속 시 확실하게 처음부터 시작됨
 */
export function useLocalStorage(initialState) {
  const [state, setState] = useState(initialState);

  const clearStorage = useCallback(() => {
    // 기존 localStorage 데이터 정리 (이전 버전 호환)
    localStorage.removeItem(STORAGE_KEY);
    setState(initialState);
  }, [initialState]);

  return [state, setState, clearStorage];
}
