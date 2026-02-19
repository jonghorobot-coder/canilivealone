import { createContext, useCallback, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { questions, getFilteredQuestions, getQuestionCategories } from '../data/questions';

// 질문 ID 기반으로 answers 초기값 동적 생성
const initialAnswers = questions.reduce((acc, q) => {
  acc[q.id] = null;
  return acc;
}, {});

const initialState = {
  currentStep: 0, // 인트로부터 시작
  income: '',
  expenses: {
    housing: '',
    food: '',
    fixed: '',
    transport: '',
    leisure: '',
    misc: '',
    savings: '',
  },
  answers: initialAnswers,
  result: null,
  // 카테고리 인트로 표시 여부 추적
  seenCategoryIntros: [],
  // 카테고리 모달 표시 플래그 (nextStep에서만 설정)
  pendingCategoryModal: null,
};

export const SurveyContext = createContext(null);

export function SurveyProvider({ children }) {
  const [state, setState, clearStorage] = useLocalStorage(initialState);

  // 현재 답변 상태에 따라 필터링된 질문 목록
  const filteredQuestions = useMemo(() => {
    return getFilteredQuestions(state.answers);
  }, [state.answers]);

  // 필터링된 질문 기반 카테고리
  const questionCategories = useMemo(() => {
    return getQuestionCategories(filteredQuestions);
  }, [filteredQuestions]);

  // 동적 총 스텝 수 계산
  // Step 0: 인트로, Step 1: 지출입력, Step 2~(n+1): 질문들, Step (n+2): 결과
  const totalSteps = filteredQuestions.length + 2;

  const setCurrentStep = useCallback((step) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  }, [setState]);

  const nextStep = useCallback(() => {
    setState((prev) => {
      const currentFilteredQuestions = getFilteredQuestions(prev.answers);
      const currentTotalSteps = currentFilteredQuestions.length + 2;
      const newStep = Math.min(prev.currentStep + 1, currentTotalSteps);
      const isQuestionStep = newStep >= 2 && newStep < currentTotalSteps;
      const questionIndex = isQuestionStep ? newStep - 2 : -1;

      // 다음 스텝이 카테고리의 첫 질문인지 확인
      let pendingCategoryModal = null;
      if (isQuestionStep && questionIndex >= 0) {
        const nextQuestion = currentFilteredQuestions[questionIndex];
        const categories = getQuestionCategories(currentFilteredQuestions);
        const categoryInfo = categories.find(c => c.id === nextQuestion?.category);
        if (categoryInfo && questionIndex === categoryInfo.startIndex) {
          pendingCategoryModal = nextQuestion.category;
        }
      }

      return {
        ...prev,
        currentStep: newStep,
        pendingCategoryModal,
      };
    });
  }, [setState]);

  const prevStep = useCallback(() => {
    setState((prev) => {
      const newStep = Math.max(prev.currentStep - 1, 0);
      const currentFilteredQuestions = getFilteredQuestions(prev.answers);

      // 지출 입력 단계에서 인트로로 돌아갈 때: 수입/지출 초기화
      if (prev.currentStep === 1 && newStep === 0) {
        return {
          ...prev,
          currentStep: newStep,
          income: '',
          expenses: {
            housing: '',
            food: '',
            fixed: '',
            transport: '',
            leisure: '',
            misc: '',
            savings: '',
          },
        };
      }

      // 질문 단계에서 이전으로 갈 때: 현재 질문의 답변만 초기화
      if (prev.currentStep >= 2) {
        const questionIndex = prev.currentStep - 2;
        const currentQuestion = currentFilteredQuestions[questionIndex];

        const newAnswers = { ...prev.answers };
        if (currentQuestion) {
          newAnswers[currentQuestion.id] = null;
        }

        return {
          ...prev,
          currentStep: newStep,
          answers: newAnswers,
        };
      }

      return {
        ...prev,
        currentStep: newStep,
      };
    });
  }, [setState]);

  const setIncome = useCallback((value) => {
    setState((prev) => ({ ...prev, income: value }));
  }, [setState]);

  const setExpense = useCallback((category, value) => {
    setState((prev) => ({
      ...prev,
      expenses: { ...prev.expenses, [category]: value },
    }));
  }, [setState]);

  const setAllExpenses = useCallback((expenses) => {
    setState((prev) => ({
      ...prev,
      expenses: { ...prev.expenses, ...expenses },
    }));
  }, [setState]);

  const setAnswer = useCallback((questionId, value) => {
    setState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value },
    }));
  }, [setState]);

  const setResult = useCallback((result) => {
    setState((prev) => ({ ...prev, result }));
  }, [setState]);

  const markCategoryIntroSeen = useCallback((categoryId) => {
    setState((prev) => ({
      ...prev,
      seenCategoryIntros: [...new Set([...prev.seenCategoryIntros, categoryId])],
    }));
  }, [setState]);

  const clearPendingCategoryModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      pendingCategoryModal: null,
    }));
  }, [setState]);

  const reset = useCallback(() => {
    clearStorage();
  }, [clearStorage]);

  // 현재 스텝이 어떤 단계인지 판별하는 헬퍼
  const stepInfo = useMemo(() => {
    const { currentStep, seenCategoryIntros = [] } = state;
    const isIntroStep = currentStep === 0;
    const isExpenseStep = currentStep === 1;
    const isResultStep = currentStep === totalSteps;
    const isQuestionStep = currentStep >= 2 && currentStep < totalSteps;
    const questionIndex = isQuestionStep ? currentStep - 2 : -1;
    const currentQuestion = isQuestionStep ? filteredQuestions[questionIndex] : null;

    // 현재 질문의 카테고리
    const currentCategory = currentQuestion?.category || null;

    // 카테고리의 첫 질문인지 확인
    const categoryInfo = questionCategories.find(c => c.id === currentCategory);
    const isFirstQuestionOfCategory = categoryInfo && questionIndex === categoryInfo.startIndex;

    // 카테고리 인트로를 보여줘야 하는지
    const shouldShowCategoryIntro = isFirstQuestionOfCategory &&
      !seenCategoryIntros.includes(currentCategory);

    // 진행률 계산 (질문 기준)
    const questionProgress = isQuestionStep
      ? ((questionIndex + 1) / filteredQuestions.length) * 100
      : isResultStep ? 100 : 0;

    // 50% 도달 여부
    const isHalfwayPoint = questionIndex === Math.floor(filteredQuestions.length / 2) - 1;

    return {
      isIntroStep,
      isExpenseStep,
      isQuestionStep,
      isResultStep,
      questionIndex,
      currentQuestion,
      currentCategory,
      categoryInfo: categoryInfo ? {
        ...categoryInfo,
        label: getCategoryLabel(currentCategory),
        description: getCategoryDescription(currentCategory),
      } : null,
      shouldShowCategoryIntro,
      questionProgress,
      isHalfwayPoint,
    };
  }, [state, totalSteps, filteredQuestions, questionCategories]);

  const value = {
    ...state,
    totalSteps,
    questions: filteredQuestions,
    questionCategories,
    stepInfo,
    setCurrentStep,
    nextStep,
    prevStep,
    setIncome,
    setExpense,
    setAllExpenses,
    setAnswer,
    setResult,
    markCategoryIntroSeen,
    clearPendingCategoryModal,
    reset,
  };

  return (
    <SurveyContext.Provider value={value}>
      {children}
    </SurveyContext.Provider>
  );
}

// 카테고리 라벨
function getCategoryLabel(categoryId) {
  const labels = {
    housing: '주거비',
    food: '식비',
    fixed: '고정지출',
    transport: '교통비',
    leisure: '여가비',
    misc: '생활 잡비',
    savings: '저축·비상금',
  };
  return labels[categoryId] || categoryId;
}

// 카테고리 설명
function getCategoryDescription(categoryId) {
  const descriptions = {
    housing: '주거 리스크를 분석합니다.',
    food: '식비 구조를 점검합니다.',
    fixed: '고정 지출 패턴을 확인합니다.',
    transport: '교통비 효율성을 진단합니다.',
    leisure: '여가 지출 습관을 분석합니다.',
    misc: '생활 잡비 관리 능력을 확인합니다.',
    savings: '저축과 비상금 준비 상태를 점검합니다.',
  };
  return descriptions[categoryId] || '';
}
