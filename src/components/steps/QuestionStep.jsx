import { useState, useEffect } from 'react';
import { StepLayout } from '../layout/StepLayout';
import { useSurvey } from '../../hooks/useSurvey';
import { AnalyticsEvents } from '../../utils/analytics';

const categoryOrder = {
  housing: 1,
  food: 2,
  fixed: 3,
  transport: 4,
  leisure: 5,
  misc: 6,
  savings: 7,
};

export function QuestionStep({ question }) {
  const {
    answers,
    setAnswer,
    nextStep,
    currentStep,
    stepInfo,
    pendingCategoryModal,
    clearPendingCategoryModal,
  } = useSurvey();

  const {
    categoryInfo,
    currentCategory,
    isHalfwayPoint,
  } = stepInfo;

  const [showHalfwayToast, setShowHalfwayToast] = useState(false);

  // 모달 표시 여부: nextStep에서 설정된 pendingCategoryModal 확인
  const showModal = pendingCategoryModal === currentCategory && categoryInfo;

  useEffect(() => {
    if (question?.id) {
      AnalyticsEvents.viewQuestionStep(question.id);
    }
  }, [question?.id]);

  useEffect(() => {
    if (isHalfwayPoint) {
      setShowHalfwayToast(true);
      const timer = setTimeout(() => setShowHalfwayToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isHalfwayPoint]);

  const handleCloseModal = () => {
    clearPendingCategoryModal();
  };

  if (!question || !question.options) {
    return (
      <StepLayout title="오류" subtitle="질문을 불러올 수 없습니다.">
        <div className="text-center py-12 text-gray-500">
          잠시 후 다시 시도해주세요.
        </div>
      </StepLayout>
    );
  }

  const selectedValue = answers?.[question.id] ?? null;
  const isSelected = selectedValue !== null && selectedValue !== undefined;

  const handleSelect = (value) => {
    setAnswer(question.id, value);
  };

  const handleNext = () => {
    if (isSelected) {
      AnalyticsEvents.stepProgress(currentStep);
      nextStep();
    }
  };

  return (
    <>
      {/* 카테고리 인트로 오버레이 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 animate-overlay-bg px-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-[400px] bg-white rounded-[14px] shadow-[0_12px_32px_rgba(0,0,0,0.1)] p-7 text-center animate-overlay-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto bg-[#F3F4F6] border border-[#E5E7EB] rounded-[12px] flex items-center justify-center">
              <span className="text-[20px] font-bold text-[#0F3D2E] tabular-nums">
                {categoryOrder[currentCategory] || 1}
              </span>
            </div>
            <h2 className="text-[20px] font-bold text-neutral-800 mt-4 tracking-tight">
              {categoryInfo.label}
            </h2>
            <p className="text-[14px] text-neutral-500 mt-2 leading-[1.6]">
              {categoryInfo.description}
            </p>
            <button
              onClick={handleCloseModal}
              className="btn-primary w-full h-[48px] text-[15px] font-semibold rounded-[10px] mt-5"
            >
              진단 시작
            </button>
          </div>
        </div>
      )}

      {/* 절반 진행 토스트 */}
      {showHalfwayToast && (
        <div className="fixed top-20 left-1/2 z-40 -translate-x-1/2 animate-halfway-pop">
          <div className="bg-white text-neutral-600 px-4 py-2.5 rounded-[10px] border border-neutral-100 shadow-sm">
            <span className="text-[13px] font-medium tracking-tight">절반 이상 진행되었습니다</span>
          </div>
        </div>
      )}

      <StepLayout
        title={question.title}
        subtitle={question.question}
        nextDisabled={!isSelected}
        onNext={handleNext}
      >
        {/* 카테고리 배지 */}
        {question.categoryLabel && (
          <div className="mb-2">
            <span className="badge">
              {question.categoryLabel}
            </span>
          </div>
        )}

        {/* 선택지 */}
        <div className="space-y-2">
          {question.options.map((option, index) => (
            <button
              key={option.value}
              onClick={() => handleSelect(option.value)}
              style={{ animationDelay: `${index * 0.04}s` }}
              className={`
                w-full p-3.5 rounded-[10px] text-left transition-colors duration-150
                focus:outline-none animate-option-in
                ${
                  selectedValue === option.value
                    ? 'bg-[#F0FDF4] border-2 border-[#0F3D2E]'
                    : 'bg-white border border-neutral-200 hover:border-neutral-300'
                }
              `}
            >
              <div className="flex items-start gap-2.5">
                <div className={`
                  w-[18px] h-[18px] mt-0.5 rounded-full border-2 flex items-center justify-center flex-shrink-0
                  transition-colors duration-150
                  ${
                    selectedValue === option.value
                      ? 'border-[#0F3D2E] bg-[#0F3D2E]'
                      : 'border-neutral-300'
                  }
                `}>
                  {selectedValue === option.value && (
                    <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div className="flex-1">
                  <span className={`text-[13px] font-medium block tracking-tight ${
                    selectedValue === option.value
                      ? 'text-[#0F3D2E]'
                      : 'text-neutral-700'
                  }`}>
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="text-[11px] text-neutral-400 mt-0.5 block">
                      {option.description}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 선택 안내 */}
        {!isSelected && (
          <p className="text-center text-[13px] text-neutral-400 mt-4">
            하나를 선택해주세요
          </p>
        )}
      </StepLayout>
    </>
  );
}
