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
    <div className="min-h-dvh flex flex-col bg-[#FAFAFA] lg:bg-gradient-to-br lg:from-[#f8faf9] lg:to-[#f0f4f2]">
      {/* 데스크톱: 상단 네비게이션 */}
      <nav className="hidden lg:flex items-center justify-between px-8 xl:px-16 py-4 bg-white border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#0F3D2E] rounded-[8px] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 100 100">
              <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
              <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>
          <span className="text-[#0F3D2E] font-bold text-[17px] tracking-tight">독립점수</span>
        </div>
        {showProgress && (
          <div className="flex items-center gap-4">
            <span className="text-[13px] text-neutral-500">진행률</span>
            <div className="w-48 h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#0F3D2E] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[13px] font-medium text-[#0F3D2E] tabular-nums">{progressLabel}</span>
          </div>
        )}
      </nav>

      {/* 모바일: Header - 그린 배경 */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0F3D2E] py-3 px-4">
        {showProgress && (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/12 rounded-[7px] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 100 100">
                <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
                <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
                <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-white/60 flex-shrink-0 tabular-nums">
              {progressLabel}
            </span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 py-4 px-4 pb-24 space-y-4 lg:py-8 lg:px-8 lg:pb-8 lg:flex lg:justify-center">
        <div className="lg:w-full lg:max-w-2xl lg:bg-white lg:rounded-2xl lg:shadow-sm lg:border lg:border-neutral-200 lg:p-8">
          {/* 타이틀 영역 */}
          {(title || subtitle) && (
            <div className="mb-3 lg:mb-6">
              {title && (
                <h1 className="text-[16px] lg:text-[20px] font-semibold text-neutral-800 tracking-tight leading-snug">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="text-[12px] lg:text-[14px] text-neutral-500 mt-1 lg:mt-2 leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>
          )}

          {/* 컨텐츠 */}
          <div className="space-y-4">
            {children}
          </div>

          {/* 데스크톱: 인라인 버튼 */}
          <div className="hidden lg:flex gap-3 mt-8 pt-6 border-t border-neutral-200">
            {showBackButton && currentStep > 0 && (
              <button
                onClick={handleBack}
                className="flex-shrink-0 px-6 h-12 rounded-[10px] border border-neutral-200 bg-white text-neutral-600 text-[14px] font-medium hover:bg-neutral-50 transition-colors"
              >
                이전
              </button>
            )}
            {showNextButton && (
              <button
                onClick={onNext}
                disabled={nextDisabled}
                className={`flex-1 h-12 rounded-[10px] text-[15px] font-semibold transition-colors ${
                  nextDisabled
                    ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                    : 'bg-[#0F3D2E] text-white hover:bg-[#0a2e22]'
                }`}
              >
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* 모바일: Footer */}
      <footer className="lg:hidden sticky bottom-0 z-20 bg-white border-t border-neutral-200 py-2.5 px-4" style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}>
        <div className="flex gap-2">
          {showBackButton && currentStep > 0 && (
            <button
              onClick={handleBack}
              className="flex-shrink-0 px-4 h-11 rounded-[10px] border border-neutral-200 bg-white text-neutral-600 text-[13px] font-medium hover:bg-neutral-50 transition-colors"
            >
              이전
            </button>
          )}
          {showNextButton && (
            <button
              onClick={onNext}
              disabled={nextDisabled}
              className={`flex-1 h-11 rounded-[10px] text-[14px] font-semibold transition-colors ${
                nextDisabled
                  ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                  : 'bg-[#0F3D2E] text-white hover:bg-[#0a2e22]'
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
