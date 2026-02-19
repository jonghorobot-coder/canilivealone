import { useSurvey } from '../../hooks/useSurvey';
import { AnalyticsEvents } from '../../utils/analytics';

export function IntroStep() {
  const { nextStep } = useSurvey();

  const handleStart = () => {
    AnalyticsEvents.startDiagnosis();
    nextStep();
  };

  return (
    <div className="min-h-dvh flex flex-col bg-white">
      <div className="w-full max-w-md mx-auto px-5 flex-1 flex flex-col py-12">

      {/* MAIN */}
      <main className="text-center mt-16 space-y-6">

        <p className="text-xs tracking-widest text-neutral-400 uppercase">
          Financial Independence Score
        </p>

        <h1 className="text-4xl font-bold text-neutral-900 leading-tight">
          독립 점수 진단
        </h1>

        <p className="text-base text-neutral-600 leading-relaxed">
          월 수입·지출 구조 기반<br />
          재무 자립 가능성 분석
        </p>

      </main>

      {/* CTA */}
      <section className="mt-16">
        <button
          onClick={handleStart}
          className="w-full h-14 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-base font-semibold shadow-sm transition-colors"
        >
          진단 시작
        </button>

        <p className="mt-4 text-sm text-neutral-500 text-center">
          입력 정보는 저장되지 않습니다
        </p>
      </section>

      {/* 하단 통계 */}
      <footer className="mt-auto pt-8 pb-4 border-t border-neutral-200">
        <div className="flex items-center">
          <div className="text-center flex-1 pr-4 border-r border-neutral-200">
            <span className="text-2xl font-semibold text-neutral-800 block tabular-nums">2분</span>
            <span className="text-xs text-neutral-500 mt-1 block">소요 시간</span>
          </div>
          <div className="text-center flex-1 px-4 border-r border-neutral-200">
            <span className="text-2xl font-semibold text-neutral-800 block tabular-nums">27개</span>
            <span className="text-xs text-neutral-500 mt-1 block">분석 항목</span>
          </div>
          <div className="text-center flex-1 pl-4">
            <span className="text-2xl font-semibold text-neutral-800 block tabular-nums">7개</span>
            <span className="text-xs text-neutral-500 mt-1 block">카테고리</span>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}
