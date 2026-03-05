import { ProgressBar } from '../common/ProgressBar';
import { Button } from '../common/Button';
import { useSurvey } from '../../hooks/useSurvey';

export function StepLayout({
  children,
  title,
  subtitle,
  showProgress = true,
  showBackButton = true,
  showNextButton = true,
  nextLabel = '다음',
  nextDisabled = false,
  onNext,
  onBack,
  animateIn = false,
}) {
  const { currentStep, totalSteps, prevStep, stepInfo, questions, answers } = useSurvey();
  const { isQuestionStep, questionIndex } = stepInfo;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      prevStep();
    }
  };

  // 첫 질문(주거 형태)에 답했는지 확인 - 답하기 전에는 총 질문 수가 확정되지 않음
  const isHousingTypeSelected = !!answers?.housing_q1;

  // 진행률 계산 - 전체 스텝 기준으로 통일 (인트로 제외)
  // totalSteps에서 인트로(0)를 제외한 실제 진행 단계 수
  const visibleTotalSteps = totalSteps; // 지출입력 + 질문들 + 결과
  const progressPercent = (currentStep / visibleTotalSteps) * 100;

  // 주거 유형 선택 전에는 총 수 표시하지 않음 (조건부 질문 수가 확정되지 않음)
  const progressLabel = isHousingTypeSelected
    ? `${currentStep}/${visibleTotalSteps}`
    : `${currentStep}`;

  return (
    <div className="min-h-dvh flex flex-col bg-[#0F3D2E] relative overflow-hidden">
      {/* 데스크톱: 사이드 장식 - 왼쪽 가장자리에서 잘린 원호 */}
      <div className="hidden lg:block fixed -left-64 xl:-left-48 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-[32rem] h-[32rem] rounded-full border-2 border-white/[0.15]" />
      </div>
      <div className="hidden lg:block fixed -left-80 xl:-left-64 top-[20%] pointer-events-none">
        <div className="w-[40rem] h-[40rem] rounded-full border border-white/[0.10]" />
      </div>

      {/* 데스크톱: 사이드 장식 - 오른쪽 가장자리에서 잘린 원호 */}
      <div className="hidden lg:block fixed -right-64 xl:-right-48 top-[35%] pointer-events-none">
        <div className="w-[32rem] h-[32rem] rounded-full border-2 border-white/[0.15]" />
      </div>
      <div className="hidden lg:block fixed -right-96 xl:-right-80 top-[55%] pointer-events-none">
        <div className="w-[48rem] h-[48rem] rounded-full border border-white/[0.10]" />
      </div>
      {/* 데스크톱: 상단 네비게이션 - 딥그린 테마 */}
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
        {showProgress && (
          <div className="flex items-center gap-4">
            <span className="text-[16px] text-white/60">진행률</span>
            <div className="w-56 h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[16px] font-semibold text-white tabular-nums">{progressLabel}</span>
          </div>
        )}
      </nav>

      {/* 모바일: Header - 그린 배경 */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0F3D2E]/95 backdrop-blur-sm py-3 px-4">
        {showProgress && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/[0.08] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 100 100">
                <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.85"/>
                <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.6"/>
                <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.4"/>
              </svg>
            </div>
            <div className="flex-1 h-[5px] bg-white/[0.12] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#6EE7B7] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[12px] text-white/50 font-medium flex-shrink-0 tabular-nums tracking-wide">
              {progressLabel}
            </span>
          </div>
        )}
      </header>

      {/* Main Content - 모바일/데스크톱 통일 */}
      <main className="flex-1 py-4 sm:py-5 px-4 pb-22 sm:pb-24 space-y-4 sm:space-y-5 lg:py-8 lg:pb-8 lg:flex lg:justify-center">
        <div className="w-full lg:max-w-2xl">
          {/* 타이틀 영역 */}
          {(title || subtitle) && (
            <div className={`mb-6 sm:mb-8 ${animateIn ? 'animate-stagger animate-stagger-1' : ''}`}>
              {title && (
                <h1 className="text-[24px] sm:text-[28px] lg:text-[32px] font-bold text-white tracking-[-0.02em] leading-[1.2]">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[14px] sm:text-[15px] lg:text-[16px] text-white/45 mt-2 sm:mt-2.5">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* 컨텐츠 */}
          <div className="space-y-3.5 sm:space-y-4">
            {children}
          </div>

          {/* 데스크톱: 인라인 버튼 - 모바일 스타일과 통일 */}
          <div className="hidden lg:flex gap-3 mt-10">
            {showBackButton && currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex-shrink-0 px-7 h-[54px] rounded-xl border border-white/15 bg-white/[0.08] text-white text-[16px] font-semibold hover:bg-white/[0.12] active:scale-[0.98] transition-all duration-150"
              >
                이전
              </button>
            )}
            {showNextButton && (
              <button
                onClick={onNext}
                disabled={nextDisabled}
                className={`flex-1 h-[54px] rounded-xl text-[17px] font-bold transition-all duration-150 ${
                  nextDisabled
                    ? 'bg-white/15 text-white/40 cursor-not-allowed'
                    : 'bg-white text-[#0F3D2E] hover:bg-[#f8f8f8] active:scale-[0.98] shadow-[0_4px_16px_rgba(255,255,255,0.12)]'
                }`}
              >
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 모바일: Footer - 버튼 스타일 변경 */}
      <footer className="lg:hidden sticky bottom-0 z-20 bg-[#0F3D2E]/95 backdrop-blur-sm border-t border-white/[0.08] py-3 px-4" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2.5">
          {showBackButton && currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-shrink-0 px-5 h-[48px] sm:h-[52px] rounded-xl border border-white/15 bg-white/[0.08] text-white text-[15px] font-semibold hover:bg-white/[0.12] active:scale-[0.98] transition-all duration-150"
            >
              이전
            </button>
          )}
          {showNextButton && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className={`flex-1 h-[48px] sm:h-[52px] rounded-xl text-[16px] font-bold transition-all duration-150 ${
                nextDisabled
                  ? 'bg-white/15 text-white/40 cursor-not-allowed'
                  : 'bg-white text-[#0F3D2E] hover:bg-[#f8f8f8] active:scale-[0.98] shadow-[0_4px_12px_rgba(255,255,255,0.15)]'
              }`}
            >
              {nextLabel}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}
