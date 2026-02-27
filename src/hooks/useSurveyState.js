import { useState, useCallback, useEffect } from 'react';

const LEGACY_STORAGE_KEY = 'canilivealone-data';
const DRAFT_STORAGE_KEY = 'canilivealone-draft';

/**
 * 설문 상태 관리 훅
 * - 진행 중인 데이터를 sessionStorage에 임시 저장
 * - 페이지 새로고침 시 복구 가능
 * - 탭/브라우저 닫으면 자동 초기화
 * - 결과 페이지 도달 또는 reset 시 초기화
 */
export function useSurveyState(initialState) {
  // 저장된 draft가 있으면 복구, 없으면 초기 상태
  const [state, setState] = useState(() => {
    // 기존 localStorage 데이터 정리 (마이그레이션)
    try {
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
    } catch (e) {
      // ignore
    }

    try {
      const saved = sessionStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // 결과가 있으면 (완료된 진단) draft 무시
        if (parsed.result) {
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
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
    // 결과 도달 시 draft 삭제
    if (state.result) {
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      return;
    }

    if (state.currentStep > 0) {
      try {
        // 결과와 불필요한 데이터 제외하고 저장
        const draft = {
          currentStep: state.currentStep,
          income: state.income,
          expenses: state.expenses,
          answers: state.answers,
          seenCategoryIntros: state.seenCategoryIntros,
        };
        sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
      } catch (e) {
        console.warn('Draft save failed:', e);
      }
    }
  }, [state]);

  const reset = useCallback(() => {
    // 모든 저장 데이터 정리
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    setState(initialState);
  }, [initialState]);

  return [state, setState, reset];
}
