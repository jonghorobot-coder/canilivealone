import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSurvey } from '../../hooks/useSurvey';
import { AnalyticsEvents } from '../../utils/analytics';

export function IntroStep() {
  const { nextStep } = useSurvey();
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [agreedAll, setAgreedAll] = useState(false);

  useEffect(() => {
    AnalyticsEvents.viewIntro();
  }, []);

  const handleStartClick = () => {
    setShowConsentModal(true);
    AnalyticsEvents.consentModalOpen();
  };

  const handleCloseModal = () => {
    AnalyticsEvents.consentModalClose();
    setShowConsentModal(false);
    setAgreedAll(false);
  };

  const handleConfirm = () => {
    if (agreedAll) {
      setShowConsentModal(false);
      AnalyticsEvents.startDiagnosis();
      nextStep();
    }
  };

  const canProceed = agreedAll;

  return (
    <>
      {/* 동의 모달 */}
      {showConsentModal && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-[2px] animate-overlay-bg px-0 sm:px-4"
          onClick={handleCloseModal}
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-modal-title"
        >
          <div
            className="w-full sm:max-w-[400px] bg-white rounded-t-2xl sm:rounded-2xl shadow-[0_-4px_30px_rgba(0,0,0,0.15)] sm:shadow-[0_20px_50px_rgba(0,0,0,0.2)] animate-overlay-content overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 모달 헤더 */}
            <div className="bg-[#0F3D2E] px-5 sm:px-6 py-5 sm:py-6">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/[0.12] flex items-center justify-center">
                  <svg className="w-5 h-5 sm:w-5.5 sm:h-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <h2 id="consent-modal-title" className="text-[18px] sm:text-[19px] font-bold text-white tracking-[-0.01em]">
                    서비스 이용 동의
                  </h2>
                  <p className="text-[13px] sm:text-[14px] text-white/50 mt-0.5">
                    진단을 시작하기 전에 확인해주세요
                  </p>
                </div>
              </div>
            </div>

            {/* 모달 본문 */}
            <div className="px-5 sm:px-6 py-5 sm:py-6">
              {/* 전체 동의 체크박스 */}
              <label className="flex items-center gap-3.5 cursor-pointer group p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100/80 transition-all duration-150 border border-neutral-100 hover:border-neutral-200">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={agreedAll}
                    onChange={(e) => setAgreedAll(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center transition-all duration-150 ${
                    agreedAll
                      ? 'bg-[#0F3D2E] border-[#0F3D2E]'
                      : 'border-neutral-300 bg-white group-hover:border-neutral-400'
                  }`}>
                    {agreedAll && (
                      <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[15px] sm:text-[16px] font-semibold text-neutral-800">약관 전체 동의</span>
              </label>

              {/* 약관 상세 */}
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[14px] text-neutral-500">개인정보 처리방침</span>
                  <Link
                    to="/privacy"
                    target="_blank"
                    className="text-[13px] text-[#0F3D2E] font-semibold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    보기
                  </Link>
                </div>
                <div className="flex items-center justify-between px-1">
                  <span className="text-[14px] text-neutral-500">서비스 이용약관</span>
                  <Link
                    to="/terms"
                    target="_blank"
                    className="text-[13px] text-[#0F3D2E] font-semibold hover:underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    보기
                  </Link>
                </div>
              </div>

              <p className="text-[13px] text-neutral-400 mt-5 leading-relaxed">
                입력하신 정보는 결과 분석에만 활용되며, 진단 결과는 참고용입니다.
              </p>
            </div>

            {/* 모달 푸터 */}
            <div className="px-5 sm:px-6 pb-6 sm:pb-6 space-y-2.5" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
              <button
                onClick={handleConfirm}
                disabled={!canProceed}
                className={`w-full h-[52px] sm:h-[54px] rounded-xl text-[16px] font-bold transition-all duration-150 tracking-[-0.01em] ${
                  canProceed
                    ? 'bg-[#0F3D2E] hover:bg-[#0a2e22] text-white shadow-[0_4px_12px_rgba(15,61,46,0.2)] active:scale-[0.98]'
                    : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                }`}
                aria-label="동의하고 진단 시작"
              >
                동의하고 시작하기
              </button>
              <button
                onClick={handleCloseModal}
                className="w-full h-[46px] sm:h-[48px] rounded-xl text-[15px] font-semibold text-neutral-500 hover:bg-neutral-100 active:bg-neutral-150 transition-colors"
                aria-label="취소하고 돌아가기"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-dvh flex flex-col relative overflow-hidden" style={{ background: 'linear-gradient(165deg, #0a2e1f 0%, #0F3D2E 40%, #1a5c45 70%, #0F3D2E 100%)' }}>

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

        {/* 데스크톱: 상단 네비게이션 */}
        <nav className="hidden lg:flex items-center justify-between px-8 xl:px-16 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/12 rounded-[10px] flex items-center justify-center">
              <svg width="22" height="22" viewBox="0 0 100 100">
                <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
                <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
                <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
              </svg>
            </div>
            <span className="text-white font-bold text-[20px] tracking-tight">독립점수</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-white/60 text-[16px]">재무 자립 가능성 분석 서비스</span>
          </div>
        </nav>

        {/* Hero 영역 */}
        <div className="flex-1 flex items-center justify-center px-6 lg:px-16">
          <div className="w-full max-w-6xl flex flex-col lg:flex-row lg:items-center lg:gap-16 xl:gap-24">

            {/* 왼쪽: 메인 콘텐츠 */}
            <div className="w-full lg:w-1/2 text-center lg:text-left -translate-y-8 sm:-translate-y-10 lg:translate-y-0">
              {/* 모바일 로고 */}
              <div className="flex justify-center lg:hidden mb-4 sm:mb-5">
                <div className="w-12 h-12 sm:w-[52px] sm:h-[52px] bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <svg width="24" height="24" viewBox="0 0 100 100" className="sm:w-7 sm:h-7">
                    <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
                    <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
                    <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
                  </svg>
                </div>
              </div>

              {/* 타이틀 */}
              <p className="text-[11px] sm:text-[12px] lg:text-[13px] tracking-[0.2em] text-white/35 uppercase font-semibold mb-3 lg:mb-4">
                Financial Independence Score
              </p>
              <h1 className="text-[28px] sm:text-[32px] lg:text-[48px] xl:text-[54px] font-bold text-white leading-[1.1] tracking-[-0.02em] mb-4 sm:mb-5 lg:mb-6">
                독립 점수 진단
              </h1>
              <p className="text-[15px] sm:text-[16px] lg:text-[18px] text-white/50 leading-[1.6] mb-8 sm:mb-10 lg:mb-12 font-normal">
                <span className="lg:hidden">월 수입·지출 구조 기반<br />재무 자립 가능성 분석</span>
                <span className="hidden lg:inline">월 수입과 지출 구조를 분석하여<br />재무적 독립 가능성을 진단합니다</span>
              </p>

              {/* CTA 버튼 */}
              <button
                onClick={handleStartClick}
                className="group relative w-full lg:w-auto lg:px-16 h-[52px] sm:h-14 lg:h-[60px] rounded-[14px] bg-white text-[#0F3D2E] text-[16px] sm:text-[17px] lg:text-[18px] font-bold shadow-[0_4px_20px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.3)] hover:bg-[#f8f8f8] active:scale-[0.98] active:shadow-[0_2px_10px_rgba(255,255,255,0.15)] transition-all duration-150 ease-out tracking-[-0.01em]"
                aria-label="독립점수 진단 시작하기"
              >
                <span className="relative z-10">무료 진단 시작하기</span>
              </button>

              {/* 신뢰 문구 */}
              <p className="mt-4 sm:mt-5 flex items-center justify-center lg:justify-start gap-1.5 text-[13px] sm:text-[14px] text-white/40">
                <svg className="w-3.5 h-3.5 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>모든 정보는 익명으로 안전하게 처리됩니다</span>
              </p>

              {/* 데스크톱: 통계 인라인 */}
              <div className="hidden lg:flex items-center gap-12 mt-14 pt-10 border-t border-white/10">
                <div>
                  <span className="text-[32px] font-bold text-white block tabular-nums tracking-tight">2분</span>
                  <span className="text-[13px] text-white/40 mt-1 block tracking-wide uppercase">소요 시간</span>
                </div>
                <div className="h-10 border-l border-white/15" />
                <div>
                  <span className="text-[32px] font-bold text-white block tabular-nums tracking-tight">25개</span>
                  <span className="text-[13px] text-white/40 mt-1 block tracking-wide uppercase">분석 항목</span>
                </div>
                <div className="h-10 border-l border-white/15" />
                <div>
                  <span className="text-[32px] font-bold text-white block tabular-nums tracking-tight">7개</span>
                  <span className="text-[13px] text-white/40 mt-1 block tracking-wide uppercase">카테고리</span>
                </div>
              </div>
            </div>

            {/* 오른쪽: 데스크톱 일러스트/카드 */}
            <div className="hidden lg:flex lg:w-1/2 justify-center">
              <div className="relative w-full max-w-[400px]">
                {/* 메인 프리뷰 카드 */}
                <div className="bg-white rounded-[20px] shadow-[0_20px_60px_rgba(0,0,0,0.3)] p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-[#E8F3EF] rounded-full flex items-center justify-center">
                      <svg width="24" height="24" viewBox="0 0 100 100">
                        <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="#0F3D2E" opacity="0.9"/>
                        <path d="M20 50L50 65L80 50" stroke="#0F3D2E" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
                        <path d="M20 65L50 80L80 65" stroke="#0F3D2E" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-[15px] font-semibold text-neutral-800">독립 점수</p>
                      <p className="text-[14px] text-neutral-500">재무 자립도 분석</p>
                    </div>
                  </div>

                  {/* 점수 미리보기 */}
                  <div className="text-center py-6">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <svg className="w-full h-full" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#E5E7EB" strokeWidth="8"/>
                        <circle cx="60" cy="60" r="52" fill="none" stroke="#0F3D2E" strokeWidth="8"
                          strokeDasharray="327" strokeDashoffset="82" strokeLinecap="round"
                          style={{ transform: 'rotate(-90deg)', transformOrigin: 'center' }}/>
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[36px] font-bold text-neutral-800">75</span>
                      </div>
                    </div>
                    <span className="inline-block px-4 py-1.5 bg-[#E8F3EF] text-[#0F3D2E] rounded-full text-[14px] font-semibold">
                      안정
                    </span>
                  </div>

                  {/* 카테고리 미리보기 */}
                  <div className="space-y-3 pt-4 border-t border-neutral-200">
                    {[
                      { label: '주거비', value: 82 },
                      { label: '식비', value: 68 },
                      { label: '저축', value: 75 },
                    ].map((item) => (
                      <div key={item.label} className="flex items-center gap-3">
                        <span className="text-[14px] text-neutral-500 w-12">{item.label}</span>
                        <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#0F3D2E] rounded-full"
                            style={{ width: `${item.value}%` }}
                          />
                        </div>
                        <span className="text-[14px] font-semibold text-neutral-700 w-8">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 장식 요소 */}
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-2xl -z-10" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-3xl -z-10" />
              </div>
            </div>
          </div>
        </div>

        {/* 모바일: 하단 통계 */}
        <div className="lg:hidden w-full max-w-[360px] mx-auto px-6 pb-6" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
          <div className="pt-5 border-t border-white/[0.08]">
            <div className="flex items-center justify-between">
              <div className="text-center flex-1">
                <span className="text-[22px] sm:text-[24px] font-bold text-white block tabular-nums tracking-tight">2분</span>
                <span className="text-[10px] sm:text-[11px] text-white/35 mt-1 block uppercase tracking-wider">소요 시간</span>
              </div>
              <div className="h-8 border-l border-white/[0.08]" />
              <div className="text-center flex-1">
                <span className="text-[22px] sm:text-[24px] font-bold text-white block tabular-nums tracking-tight">25개</span>
                <span className="text-[10px] sm:text-[11px] text-white/35 mt-1 block uppercase tracking-wider">분석 항목</span>
              </div>
              <div className="h-8 border-l border-white/[0.08]" />
              <div className="text-center flex-1">
                <span className="text-[22px] sm:text-[24px] font-bold text-white block tabular-nums tracking-tight">7개</span>
                <span className="text-[10px] sm:text-[11px] text-white/35 mt-1 block uppercase tracking-wider">카테고리</span>
              </div>
            </div>
          </div>
        </div>

        {/* 데스크톱: 하단 푸터 */}
        <footer className="hidden lg:block px-8 xl:px-16 py-6 border-t border-white/10">
          <div className="flex items-center justify-between text-white/40 text-[14px]">
            <p>© 2026 독립점수 ver2. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="mailto:canilivealone.help@gmail.com" className="hover:text-white/70 transition-colors">canilivealone.help@gmail.com</a>
              <Link to="/privacy" className="hover:text-white/70 transition-colors">개인정보처리방침</Link>
              <Link to="/terms" className="hover:text-white/70 transition-colors">이용약관</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
