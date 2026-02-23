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
  const { currentStep, totalSteps, prevStep, stepInfo, questions } = useSurvey();
  const { isQuestionStep, questionIndex } = stepInfo;

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      prevStep();
    }
  };

  // 진행률 계산
  const progressPercent = isQuestionStep
    ? ((questionIndex + 1) / questions.length) * 100
    : (currentStep / totalSteps) * 100;
  const progressLabel = isQuestionStep
    ? `${questionIndex + 1}/${questions.length}`
    : `${currentStep}/${totalSteps}`;

  return (
    <div className="min-h-dvh flex flex-col bg-[#FAFAFA]">
      {/* Header - 그린 배경 */}
      <header className="sticky top-0 z-30 bg-[#0F3D2E] py-3 px-4">
        {showProgress && (
          <div className="flex items-center gap-3">
            {/* 미니 로고 */}
            <div className="w-7 h-7 bg-white/12 rounded-[7px] flex items-center justify-center flex-shrink-0">
              <svg width="14" height="14" viewBox="0 0 100 100">
                <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
                <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
                <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>
            {/* 프로그레스 바 */}
            <div className="flex-1 h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            {/* 진행률 텍스트 */}
            <span className="text-[11px] text-white/60 flex-shrink-0 tabular-nums">
              {progressLabel}
            </span>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 py-4 px-4 pb-24 space-y-4">
        {/* 타이틀 영역 */}
        {(title || subtitle) && (
          <div className="mb-3">
            {title && (
              <h1 className="text-[16px] font-semibold text-neutral-800 tracking-tight leading-snug">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[12px] text-neutral-400 mt-1 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="space-y-4">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-20 bg-white border-t border-neutral-100 py-2.5 px-4">
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
                  ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
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
