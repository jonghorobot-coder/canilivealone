import { useState, useCallback } from 'react';

const LEGACY_STORAGE_KEY = 'canilivealone-data';

/**
 * 설문 상태 관리 훅
 * - 페이지 로드 시 항상 초기 상태로 시작 (저장 없음)
 * - 인앱 브라우저 재접속 시 확실하게 처음부터 시작됨
 */
export function useSurveyState(initialState) {
  const [state, setState] = useState(initialState);

  const reset = useCallback(() => {
    // 이전 버전 사용자의 localStorage 데이터 정리
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setState(initialState);
  }, [initialState]);

  return [state, setState, reset];
}
