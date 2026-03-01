import { useState, useEffect } from 'react';
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

// 카테고리별 아이콘 - 개별 path로 분리하여 애니메이션 가능하게
const CATEGORY_ICON_PATHS = {
  housing: [
    "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12",
    "M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75",
    "M8.25 21h8.25",
  ],
  food: [
    "M12 8.25v-1.5",
    "M9 8.25v-1.5",
    "M15 8.25v-1.5",
    "M12 8.25c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513",
    "M12 8.25c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513",
    "M21 16.5l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5",
    "M6 13.12a48.474 48.474 0 016-.37c2.032 0 4.034.125 6 .37",
    "M18 13.12c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174",
  ],
  fixed: [
    "M9 12h3.75",
    "M9 15h3.75",
    "M9 18h3.75",
    "M12 18.75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08",
    "M17.151 3.836c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664",
    "M8.25 8.25H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
    "M6.75 12h.008v.008H6.75V12z",
    "M6.75 15h.008v.008H6.75V15z",
    "M6.75 18h.008v.008H6.75V18z",
  ],
  transport: [
    "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6",
    "M18.75 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0",
    "M5.25 18.75H3.375a1.125 1.125 0 01-1.125-1.125V14.25",
    "M18.75 18.75h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25",
    "M14.25 7.573v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635",
    "M14.25 7.573v6.677m0 4.5v-4.5m0 0h-12",
  ],
  leisure: [
    "M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    "M15.182 15.182a4.5 4.5 0 01-6.364 0",
    "M9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75z",
    "M15 9.75c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75z",
  ],
  misc: [
    "M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5",
    "M19.606 8.507l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z",
    "M8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    "M16.125 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
  ],
  savings: [
    "M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75",
    "M3.75 4.5v.75A.75.75 0 013 6h-.75",
    "M2.25 6v-.375c0-.621.504-1.125 1.125-1.125H20.25",
    "M2.25 6v9",
    "M20.25 4.5v.75c0 .414.336.75.75.75h.75",
    "M19.5 4.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375",
    "M21 15H21a.75.75 0 00-.75.75v.75",
    "M20.25 16.5H3.75",
    "M3.75 16.5h-.375a1.125 1.125 0 01-1.125-1.125V15",
    "M2.25 16.5v-.75A.75.75 0 003 15h-.75",
    "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z",
  ],
};

// 애니메이션 아이콘 컴포넌트
function AnimatedIcon({ category, isAnimating, prevCategory }) {
  const paths = CATEGORY_ICON_PATHS[category] || [];
  const prevPaths = CATEGORY_ICON_PATHS[prevCategory] || [];

  return (
    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      {/* 이전 아이콘 (페이드아웃) */}
      {isAnimating && prevPaths.map((d, i) => (
        <path
          key={`prev-${i}`}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={d}
          className="animate-line-out"
          style={{ animationDelay: `${i * 30}ms` }}
        />
      ))}

      {/* 현재 아이콘 (선 그리기 효과) */}
      {paths.map((d, i) => (
        <path
          key={`curr-${i}`}
          strokeLinecap="round"
          strokeLinejoin="round"
          d={d}
          className={isAnimating ? 'animate-line-draw' : ''}
          style={{
            strokeDasharray: isAnimating ? 100 : 'none',
            strokeDashoffset: isAnimating ? 100 : 0,
            opacity: isAnimating ? 0 : 1,
            animationDelay: isAnimating ? `${250 + i * 60}ms` : '0ms',
          }}
        />
      ))}
    </svg>
  );
}

export function QuestionStep({ question }) {
  const {
    answers,
    setAnswer,
    nextStep,
    prevStep,
    currentStep,
    stepInfo,
    questionCategories,
    questions: filteredQuestions,
    pendingCategoryModal,
    clearPendingCategoryModal,
  } = useSurvey();

  const {
    categoryInfo,
    currentCategory,
    questionIndex,
  } = stepInfo;

  // 카테고리 정보 및 진행률 계산
  const currentCategoryInfo = questionCategories.find(c => c.id === currentCategory);
  const categoryQuestionCount = currentCategoryInfo
    ? currentCategoryInfo.endIndex - currentCategoryInfo.startIndex + 1
    : 1;
  const categoryCurrentIndex = currentCategoryInfo
    ? questionIndex - currentCategoryInfo.startIndex + 1
    : 1;
  const categoryProgress = (categoryCurrentIndex / categoryQuestionCount) * 100;

  // 진행바 표시 값 (애니메이션용) - 이전 값에서 시작
  const [displayProgress, setDisplayProgress] = useState(() => {
    const savedProgress = sessionStorage.getItem('surveyProgress');
    return savedProgress ? parseFloat(savedProgress) : 0;
  });

  // 카테고리 변경 및 방향 감지 - 마운트 시 즉시 체크
  const [animationState] = useState(() => {
    const lastCategory = sessionStorage.getItem('surveyLastCategory');
    const lastIndex = sessionStorage.getItem('surveyLastIndex');
    const isCategoryChanged = lastCategory && lastCategory !== currentCategory;

    // 방향 감지: 현재 인덱스가 이전보다 크면 forward, 작으면 backward
    const prevIndex = lastIndex ? parseInt(lastIndex, 10) : 0;
    const isForward = questionIndex >= prevIndex;

    // 현재 상태 저장
    sessionStorage.setItem('surveyLastCategory', currentCategory);
    sessionStorage.setItem('surveyLastIndex', questionIndex.toString());

    return {
      isAnimating: isCategoryChanged,
      prevCategory: lastCategory,
      isForward: isForward
    };
  });

  const [iconAnimating, setIconAnimating] = useState(animationState.isAnimating);
  const prevCategory = animationState.prevCategory;

  // 아이콘 애니메이션 타이머
  useEffect(() => {
    if (iconAnimating) {
      const timer = setTimeout(() => setIconAnimating(false), 900);
      return () => clearTimeout(timer);
    }
  }, [iconAnimating]);

  // 진행바 애니메이션 - 마운트 후 목표값으로 이동
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(categoryProgress);
      sessionStorage.setItem('surveyProgress', categoryProgress.toString());
    }, 50);
    return () => clearTimeout(timer);
  }, [categoryProgress]);

  // 모달 표시 여부 - 첫 질문(주거비 첫 질문)일 때만 표시
  const isFirstQuestion = questionIndex === 0;
  const showModal = isFirstQuestion && pendingCategoryModal === currentCategory && categoryInfo;

  useEffect(() => {
    if (question?.id) {
      AnalyticsEvents.viewQuestionStep(question.id);
    }
  }, [question?.id]);


  const handleCloseModal = () => {
    clearPendingCategoryModal();
  };

  if (!question || !question.options) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-[#0F3D2E]">
        <div className="text-center text-white/60">
          잠시 후 다시 시도해주세요.
        </div>
      </div>
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

  const handleBack = () => {
    prevStep();
  };


  return (
    <>
      {/* 설문 시작 안내 오버레이 - 첫 질문 진입 시에만 */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-overlay-bg px-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-[400px] bg-white rounded-2xl shadow-2xl p-7 text-center animate-overlay-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto bg-[#E8F3EF] border border-[#0F3D2E]/20 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" />
              </svg>
            </div>
            <h2 className="text-[20px] font-bold text-neutral-800 mt-4 tracking-tight">
              생활 습관 진단
            </h2>
            <p className="text-[16px] text-neutral-500 mt-2 leading-[1.6]">
              입력하신 금액을 바탕으로<br/>
              카테고리별 생활 습관을 진단합니다
            </p>
            <button
              onClick={handleCloseModal}
              className="btn-primary w-full h-[56px] text-[18px] font-bold rounded-xl mt-5"
            >
              시작하기
            </button>
          </div>
        </div>
      )}

      <div className="min-h-dvh flex flex-col bg-[#0F3D2E] relative overflow-hidden">
        {/* 데스크톱: 사이드 장식 - 왼쪽 */}
        <div className="hidden lg:block fixed -left-64 xl:-left-48 top-1/2 -translate-y-1/2 pointer-events-none">
          <div className="w-[32rem] h-[32rem] rounded-full border-2 border-white/[0.15]" />
        </div>
        <div className="hidden lg:block fixed -left-80 xl:-left-64 top-[20%] pointer-events-none">
          <div className="w-[40rem] h-[40rem] rounded-full border border-white/[0.10]" />
        </div>

        {/* 데스크톱: 사이드 장식 - 오른쪽 */}
        <div className="hidden lg:block fixed -right-64 xl:-right-48 top-[35%] pointer-events-none">
          <div className="w-[32rem] h-[32rem] rounded-full border-2 border-white/[0.15]" />
        </div>
        <div className="hidden lg:block fixed -right-96 xl:-right-80 top-[55%] pointer-events-none">
          <div className="w-[48rem] h-[48rem] rounded-full border border-white/[0.10]" />
        </div>

        {/* 배경 로고 - 하단 위치 (버튼 위) */}
        <div className="absolute bottom-[85px] left-1/2 -translate-x-1/2 w-[260px] h-[260px] opacity-[0.04] pointer-events-none lg:hidden">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <path d="M50 15L15 35L50 55L85 35L50 15Z" fill="white"/>
            <path d="M15 50L50 70L85 50" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
            <path d="M15 65L50 85L85 65" stroke="white" strokeWidth="5" fill="none" strokeLinecap="round"/>
          </svg>
        </div>

        {/* 데스크톱: 상단 네비게이션 */}
        <nav className="hidden lg:flex items-center justify-between px-8 xl:px-16 py-4 bg-[#0a2e22] border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/15 rounded-[8px] flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 100 100">
                <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
                <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
                <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>
            <span className="text-white font-bold text-[20px] tracking-tight">독립점수</span>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2.5 ${iconAnimating ? (animationState.isForward ? 'animate-category-next' : 'animate-category-prev') : ''}`}>
              <span className="text-[18px] font-bold text-white">
                {question.categoryLabel}
              </span>
              <span className="text-[15px] text-white/60 tabular-nums font-semibold">
                {categoryCurrentIndex}/{categoryQuestionCount}
              </span>
            </div>
            <div className="w-56 h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{
                  width: `${displayProgress}%`,
                  transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
            </div>
          </div>
        </nav>

        {/* 모바일: 상단 헤더 - 카테고리 + 진행바 */}
        <header className="lg:hidden sticky top-0 z-30 bg-[#0F3D2E] py-4 px-5 border-b border-white/10">
          <div className="flex items-center justify-end gap-4">
            {/* 카테고리 표시 */}
            <div className={`flex items-center gap-2.5 ${iconAnimating ? (animationState.isForward ? 'animate-category-next' : 'animate-category-prev') : ''}`}>
              <span className="text-[18px] font-bold text-white">
                {question.categoryLabel}
              </span>
              <span className="text-[15px] text-white/60 tabular-nums font-semibold">
                {categoryCurrentIndex}/{categoryQuestionCount}
              </span>
            </div>

            {/* 진행바 */}
            <div className="w-32 flex-shrink-0">
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#6EE7B7] rounded-full"
                  style={{
                    width: `${displayProgress}%`,
                    transition: 'width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />
              </div>
            </div>
          </div>
        </header>

        {/* 메인 컨텐츠 */}
        <main className="flex-1 flex flex-col px-5 py-6 pb-28 lg:py-8 lg:pb-8 relative z-10 lg:justify-center lg:items-center">
          <div className="w-full lg:max-w-2xl lg:mx-auto">
          {/* 질문 영역 - 아이콘과 함께 */}
          <div className="flex items-start gap-5 mb-10">
            {/* 질문 텍스트 */}
            <div className="flex-1">
              <h2 className="text-[15px] font-semibold text-white/60 mb-3 tracking-wide">
                {question.title}
              </h2>
              <h1 className="text-[26px] lg:text-[30px] font-bold text-white leading-snug tracking-tight">
                {question.question}
              </h1>
            </div>

            {/* 카테고리 아이콘 - 선 그리기 애니메이션 */}
            <div
              className="w-28 h-28 flex-shrink-0 text-white"
              style={{
                filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.3))'
              }}
            >
              <AnimatedIcon
                category={currentCategory}
                isAnimating={iconAnimating}
                prevCategory={prevCategory}
              />
            </div>
          </div>

          {/* 선택지 */}
          <div className="space-y-3.5 flex-1">
            {question.options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                style={{ animationDelay: `${index * 0.04}s` }}
                className={`
                  w-full p-5 rounded-2xl text-left transition-all duration-150
                  focus:outline-none animate-option-in
                  ${
                    selectedValue === option.value
                      ? 'bg-[#E8F3EF] border-2 border-[#0F3D2E] shadow-lg ring-2 ring-[#0F3D2E]/20'
                      : 'bg-white border-2 border-transparent shadow-md hover:shadow-lg hover:scale-[1.01]'
                  }
                `}
              >
                <div className="flex items-start gap-4">
                  <div className={`
                    w-7 h-7 mt-0.5 rounded-full border-[2.5px] flex items-center justify-center flex-shrink-0
                    transition-colors duration-150
                    ${
                      selectedValue === option.value
                        ? 'border-[#0F3D2E] bg-[#0F3D2E]'
                        : 'border-neutral-300'
                    }
                  `}>
                    {selectedValue === option.value && (
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1">
                    <span className={`text-[18px] font-bold block tracking-tight ${
                      selectedValue === option.value
                        ? 'text-[#0F3D2E]'
                        : 'text-neutral-800'
                    }`}>
                      {option.label}
                    </span>
                    {option.description && (
                      <span className="text-[15px] text-neutral-500 mt-1.5 block leading-relaxed">
                        {option.description}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* 데스크톱: 인라인 버튼 */}
          <div className="hidden lg:flex gap-3 mt-8">
            <button
              onClick={handleBack}
              className="flex-shrink-0 px-6 h-14 rounded-[12px] border border-white/20 bg-white/10 text-white text-[17px] font-bold hover:bg-white/15 transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={!isSelected}
              className={`flex-1 h-14 rounded-[12px] text-[18px] font-bold transition-colors ${
                !isSelected
                  ? 'bg-white/20 text-white/40 cursor-not-allowed'
                  : 'bg-white text-[#0F3D2E] hover:bg-white/90'
              }`}
            >
              다음
            </button>
          </div>
          </div>
        </main>

        {/* 모바일: 하단 버튼 */}
        <footer className="lg:hidden sticky bottom-0 z-20 bg-[#0F3D2E] border-t border-white/10 py-3 px-5" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="flex-shrink-0 px-6 h-14 rounded-xl border-2 border-white/30 bg-white/10 text-white text-[17px] font-bold hover:bg-white/20 transition-colors"
            >
              이전
            </button>
            <button
              onClick={handleNext}
              disabled={!isSelected}
              className={`flex-1 h-14 rounded-xl text-[18px] font-bold transition-all duration-200 ${
                !isSelected
                  ? 'bg-white/20 text-white/50 cursor-not-allowed'
                  : 'bg-white text-[#0F3D2E] hover:bg-white/90 shadow-xl'
              }`}
            >
              다음
            </button>
          </div>
        </footer>
      </div>
    </>
  );
}
