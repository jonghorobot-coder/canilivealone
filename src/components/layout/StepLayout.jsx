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

  return (
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-100 py-4 px-5">
        {showProgress && (
          isQuestionStep ? (
            <ProgressBar
              current={questionIndex + 1}
              total={questions.length}
              label={`질문 ${questionIndex + 1} / ${questions.length}`}
            />
          ) : (
            <ProgressBar current={currentStep} total={totalSteps} />
          )
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 py-5 px-5 pb-28 space-y-5">
        {/* 타이틀 영역 */}
        {(title || subtitle) && (
          <div className="mb-4">
            {title && (
              <h1 className="text-[17px] font-semibold text-neutral-800 tracking-tight leading-snug">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-[13px] text-neutral-400 mt-1.5 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        )}

        {/* 컨텐츠 */}
        <div className="space-y-6">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="sticky bottom-0 z-20 bg-white border-t border-neutral-100 py-3 px-5">
        <div className="flex gap-3">
          {showBackButton && currentStep > 0 && (
            <Button
              variant="secondary"
              onClick={handleBack}
              fullWidth={false}
              className="flex-shrink-0 px-5 h-12"
            >
              이전
            </Button>
          )}
          {showNextButton && (
            <Button
              variant="primary"
              onClick={onNext}
              disabled={nextDisabled}
              className="flex-1 h-12 text-[15px]"
            >
              {nextLabel}
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
}
