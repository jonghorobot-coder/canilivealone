import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSurvey } from '../../hooks/useSurvey';
import { AnalyticsEvents } from '../../utils/analytics';

export function IntroStep() {
  const { nextStep } = useSurvey();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  useEffect(() => {
    AnalyticsEvents.viewIntro();
  }, []);

  const handleStartClick = () => {
    setShowConsentModal(true);
  };

  const handleCloseModal = () => {
    setShowConsentModal(false);
  };

  const handleConfirm = () => {
    if (agreedPrivacy && agreedTerms) {
      setShowConsentModal(false);
      AnalyticsEvents.startDiagnosis();
      nextStep();
    }
  };

  const canProceed = agreedPrivacy && agreedTerms;

  return (
    <>
      {/* 동의 모달 */}
      {showConsentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-overlay-bg px-4"
          onClick={handleCloseModal}
        >
          <div
            className="w-full max-w-[400px] bg-white rounded-[14px] shadow-[0_12px_32px_rgba(0,0,0,0.15)] animate-overlay-content overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="bg-[#0F3D2E] px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-white tracking-tight">
                    서비스 이용 동의
                  </h2>
                  <p className="text-[13px] text-white/70 mt-0.5">
                    진단을 시작하기 전에 확인해주세요
                  </p>
                </div>
              </div>
            </div>

            {/* 모달 본문 */}
            <div className="px-6 py-5 space-y-4">
              {/* 개인정보 처리방침 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedPrivacy}
                    onChange={(e) => setAgreedPrivacy(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    agreedPrivacy
                      ? 'bg-[#0F3D2E] border-[#0F3D2E]'
                      : 'border-neutral-300 group-hover:border-neutral-400'
                  }`}>
                    {agreedPrivacy && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-neutral-800">[필수] 개인정보 처리방침 동의</span>
                  </div>
                  <p className="text-[12px] text-neutral-500 mt-1 leading-relaxed">
                    진단에 입력하신 수입·지출 정보가 결과 분석에 활용됩니다.
                  </p>
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[12px] text-[#0F3D2E] font-medium mt-1 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    전문 보기
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </label>

              {/* 구분선 */}
              <div className="border-t border-neutral-100" />

              {/* 서비스 이용약관 */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative flex-shrink-0 mt-0.5">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    agreedTerms
                      ? 'bg-[#0F3D2E] border-[#0F3D2E]'
                      : 'border-neutral-300 group-hover:border-neutral-400'
                  }`}>
                    {agreedTerms && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-neutral-800">[필수] 서비스 이용약관 동의</span>
                  </div>
                  <p className="text-[12px] text-neutral-500 mt-1 leading-relaxed">
                    진단 결과는 참고용이며, 전문 재무 상담을 대체하지 않습니다.
                  </p>
                  <Link
                    to="/terms"
                    target="_blank"
                    className="inline-flex items-center gap-1 text-[12px] text-[#0F3D2E] font-medium mt-1 hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    전문 보기
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                </div>
              </label>
            </div>

            {/* 모달 푸터 */}
            <div className="px-6 pb-6 space-y-3">
              <button
                onClick={handleConfirm}
                disabled={!canProceed}
                className={`w-full h-[52px] rounded-[10px] text-[15px] font-semibold transition-colors tracking-tight ${
                  canProceed
                    ? 'bg-[#0F3D2E] hover:bg-[#0a2e22] text-white'
                    : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                }`}
                aria-label="동의하고 진단 시작"
              >
                동의하고 시작하기
              </button>
              <button
                onClick={handleCloseModal}
                className="w-full h-[44px] rounded-[10px] text-[14px] font-medium text-neutral-500 hover:bg-neutral-100 transition-colors"
                aria-label="취소하고 돌아가기"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-dvh flex flex-col" style={{ background: 'linear-gradient(165deg, #0a2e1f 0%, #0F3D2E 40%, #1a5c45 70%, #0F3D2E 100%)' }}>
        <div className="w-full max-w-md mx-auto px-6 flex-1 flex flex-col pt-14 pb-8">

          {/* 콘텐츠 - 상단에서 자연스럽게 시작 */}
          <div className="text-center">
            {/* 로고 */}
            <div className="flex justify-center mb-5">
              <div className="w-[44px] h-[44px] bg-white/10 rounded-[10px] flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 100 100">
                  <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
                  <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
                  <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
            </div>

            {/* 타이틀 */}
            <p className="text-[10px] tracking-[0.12em] text-white/40 uppercase font-medium mb-2">
              Financial Independence Score
            </p>
            <h1 className="text-[24px] font-bold text-white leading-tight tracking-tight mb-3">
              독립 점수 진단
            </h1>
            <p className="text-[13px] text-white/50 leading-relaxed">
              월 수입·지출 구조 기반<br />
              재무 자립 가능성 분석
            </p>
          </div>

          {/* 여백 - 남은 공간 차지 */}
          <div className="flex-1 min-h-[60px]" />

          {/* 하단 액션 */}
          <div>
            <button
              onClick={handleStartClick}
              className="w-full h-[48px] rounded-[10px] bg-white hover:bg-neutral-100 text-[#0F3D2E] text-[14px] font-semibold shadow-sm transition-colors tracking-tight"
              aria-label="독립점수 진단 시작하기"
            >
              진단 시작
            </button>
            <p className="mt-2 text-[10px] text-white/25 text-center">
              모든 정보는 익명으로 안전하게 저장됩니다
            </p>

            {/* 통계 */}
            <div className="mt-6 pt-4 border-t border-white/8">
              <div className="flex items-center">
                <div className="text-center flex-1 pr-3 border-r border-white/8">
                  <span className="text-[15px] font-semibold text-white block tabular-nums">2분</span>
                  <span className="text-[9px] text-white/35 block">소요 시간</span>
                </div>
                <div className="text-center flex-1 px-3 border-r border-white/8">
                  <span className="text-[15px] font-semibold text-white block tabular-nums">25개</span>
                  <span className="text-[9px] text-white/35 block">분석 항목</span>
                </div>
                <div className="text-center flex-1 pl-3">
                  <span className="text-[15px] font-semibold text-white block tabular-nums">7개</span>
                  <span className="text-[9px] text-white/35 block">카테고리</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
