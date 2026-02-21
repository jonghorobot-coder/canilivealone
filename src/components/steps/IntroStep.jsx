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
      <main className="text-center mt-16 space-y-5">

        <p className="text-[11px] tracking-[0.15em] text-neutral-400 uppercase font-medium">
          Financial Independence Score
        </p>

        <h1 className="text-[32px] font-bold text-neutral-900 leading-tight tracking-tight">
          독립 점수 진단
        </h1>

        <p className="text-[15px] text-neutral-500 leading-relaxed">
          월 수입·지출 구조 기반<br />
          재무 자립 가능성 분석
        </p>

      </main>

      {/* CTA */}
      <section className="mt-auto">
        <button
          onClick={handleStart}
          className="w-full h-[52px] rounded-[10px] bg-[#0F3D2E] hover:bg-[#0a2e22] text-white text-[15px] font-semibold shadow-sm transition-colors tracking-tight"
        >
          진단 시작
        </button>

        <p className="mt-4 text-[13px] text-neutral-400 text-center">
          입력 정보는 저장되지 않습니다
        </p>
      </section>

      {/* 하단 통계 */}
      <footer className="mt-8 pt-8 pb-4 border-t border-neutral-100">
        <div className="flex items-center">
          <div className="text-center flex-1 pr-4 border-r border-neutral-100">
            <span className="text-[22px] font-semibold text-neutral-800 block tabular-nums tracking-tight">2분</span>
            <span className="text-[11px] text-neutral-400 mt-1 block tracking-wide">소요 시간</span>
          </div>
          <div className="text-center flex-1 px-4 border-r border-neutral-100">
            <span className="text-[22px] font-semibold text-neutral-800 block tabular-nums tracking-tight">25개</span>
            <span className="text-[11px] text-neutral-400 mt-1 block tracking-wide">분석 항목</span>
          </div>
          <div className="text-center flex-1 pl-4">
            <span className="text-[22px] font-semibold text-neutral-800 block tabular-nums tracking-tight">7개</span>
            <span className="text-[11px] text-neutral-400 mt-1 block tracking-wide">카테고리</span>
          </div>
        </div>
      </footer>

      </div>
    </div>
  );
}
