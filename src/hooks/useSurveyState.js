import { useState, useCallback, useEffect } from 'react';

const LEGACY_STORAGE_KEY = 'canilivealone-data';
const DRAFT_STORAGE_KEY = 'canilivealone-draft';

/**
 * 설문 상태 관리 훅
 * - 진행 중인 데이터를 localStorage에 임시 저장
 * - 페이지 새로고침/재접속 시 복구 가능
 * - 결과 페이지 도달 또는 reset 시 초기화
 */
export function useSurveyState(initialState) {
  // 저장된 draft가 있으면 복구, 없으면 초기 상태
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 결과가 있으면 (완료된 진단) draft 무시
        if (parsed.result) {
          localStorage.removeItem(DRAFT_STORAGE_KEY);
          return initialState;
        }
        // 진행 중인 데이터가 있으면 복구
        if (parsed.currentStep > 0 || parsed.income) {
          return { ...initialState, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Draft restore failed:', e);
    }
    return initialState;
  });

  // 상태 변경 시 자동 저장 (결과 제외)
  useEffect(() => {
    if (state.currentStep > 0 && !state.result) {
      try {
        // 결과와 불필요한 데이터 제외하고 저장
        const draft = {
          currentStep: state.currentStep,
          income: state.income,
          expenses: state.expenses,
          answers: state.answers,
          seenCategoryIntros: state.seenCategoryIntros,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (e) {
        console.warn('Draft save failed:', e);
      }
    }
  }, [state]);

  const reset = useCallback(() => {
    // 모든 저장 데이터 정리
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(DRAFT_STORAGE_KEY);
    setState(initialState);
  }, [initialState]);

  return [state, setState, reset];
}
