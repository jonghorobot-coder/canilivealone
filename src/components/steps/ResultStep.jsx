import { useEffect, useState, useRef, forwardRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { domToPng } from 'modern-screenshot';
import { useSurvey } from '../../hooks/useSurvey';
import { calculateResult } from '../../utils/calculate';
import { AnalyticsEvents } from '../../utils/analytics';
import { saveResultToServer, fetchResultById } from '../../utils/saveResult';
import { supabase } from '../../lib/supabase';
import { getAllCategoryAdvice } from '../../data/categoryAdvice';
import {
  addToHistory,
  getHistory,
  compareWithPrevious,
  saveFriendScore,
  getFriendScore,
  clearFriendScore,
  deleteFromHistory,
} from '../../utils/historyStorage';
import { generatePremiumPreview } from '../../utils/scoreSimulation';

const LOADING_DURATION = 2500;

const LOADING_MESSAGES = [
  '주거 안정성 분석 중...',
  '소비 구조 점검 중...',
  '비상 자금 안정성 평가 중...',
  '독립 가능성 종합 분석 중...',
];

const GRADE_STYLES = {
  '매우 안정': { bg: 'bg-[#E8F3EF]', border: 'border-[#0F3D2E]', text: 'text-[#0F3D2E]' },
  '안정': { bg: 'bg-[#E8F3EF]', border: 'border-[#0F3D2E]', text: 'text-[#0F3D2E]' },
  '주의': { bg: 'bg-[#FFF7E5]', border: 'border-[#C58A00]', text: 'text-[#9A6B00]' },
  '위험': { bg: 'bg-[#FDECEC]', border: 'border-[#B42318]', text: 'text-[#912018]' },
  '매우 위험': { bg: 'bg-[#FDECEC]', border: 'border-[#B42318]', text: 'text-[#912018]' },
};

const GRADE_DETAILS = {
  '매우 안정': {
    summary: '현재 재정 구조로 매우 안정적인 독립 생활이 가능합니다.',
    details: '수입 대비 지출 비율이 적정하며, 비상 상황에 대한 대비가 충분히 갖춰져 있습니다.',
  },
  '안정': {
    summary: '독립 생활이 가능하며, 기본적인 재정 안전망이 갖춰져 있습니다.',
    details: '안정적인 독립 조건을 갖추고 있으나, 지속적인 관리가 권장됩니다.',
  },
  '주의': {
    summary: '독립은 가능하지만, 일부 리스크 요인에 주의가 필요합니다.',
    details: '현재 상태로 독립을 시작할 경우, 예상치 못한 지출이나 수입 변동에 취약할 수 있습니다.',
  },
  '위험': {
    summary: '현재 상태로는 독립 생활 유지에 어려움이 예상됩니다.',
    details: '재정 안정성이 부족한 상태입니다. 독립을 서두르기보다는 안정적인 수입 확보와 지출 구조 개선을 우선적으로 진행하시기 바랍니다.',
  },
  '매우 위험': {
    summary: '독립을 권장하지 않습니다. 재정 안정화가 우선입니다.',
    details: '현재 재정 상태로는 독립 생활 유지가 어려울 것으로 분석됩니다.',
  },
};

// 카테고리 순서 (입력 순서와 동일하게 통일)
const CATEGORY_ORDER = ['housing', 'food', 'fixed', 'transport', 'leisure', 'misc', 'savings'];

const CATEGORY_LABELS = {
  housing: '주거비',
  food: '식비',
  fixed: '고정지출',
  transport: '교통비',
  leisure: '여가비',
  misc: '생활 잡비',
  savings: '저축·비상금',
};

// ShareCard 전용 스타일
const SHARE_GRADE_STYLES = {
  '매우 안정': { bg: '#E8F3EF', border: '#0F3D2E', text: '#0F3D2E' },
  '안정': { bg: '#E8F3EF', border: '#0F3D2E', text: '#0F3D2E' },
  '주의': { bg: '#FFF7E5', border: '#C58A00', text: '#9A6B00' },
  '위험': { bg: '#FDECEC', border: '#B42318', text: '#912018' },
  '매우 위험': { bg: '#FDECEC', border: '#B42318', text: '#912018' },
};

const GRADE_VERDICT = {
  '매우 안정': '"당장 독립해도 걱정 없어요"',
  '안정': '"조금만 다듬으면 독립 가능해요"',
  '주의': '"지금은 조금 불안해요"',
  '위험': '"독립하면 힘들 수 있어요"',
  '매우 위험': '"지금은 독립을 미루세요"',
};

// 주요 리스크 요인 추출 (상위 2개)
const getTopRiskFactors = (result) => {
  const risks = [];

  if (!result?.categoryScores || !result?.income) return risks;

  const income = result.income;
  const expenses = result.originalExpenses || 0;

  // 주거비 비율
  const housingRatio = result.details?.housingRatio;
  if (housingRatio && housingRatio > 30) {
    risks.push({
      label: '주거비 비율',
      value: `${Math.round(housingRatio)}%`,
      severity: housingRatio > 40 ? 'critical' : 'warning',
    });
  }

  // 저축률
  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;
  if (savingsRate < 20) {
    risks.push({
      label: '월 저축률',
      value: `${savingsRate}%`,
      severity: savingsRate < 10 ? 'critical' : 'warning',
    });
  }

  // 카테고리별 낮은 점수
  const categoryScores = result.categoryScores;
  const lowCategories = CATEGORY_ORDER
    .map(key => ({ key, score: categoryScores[key], label: CATEGORY_LABELS[key] }))
    .filter(c => c.score < 50)
    .sort((a, b) => a.score - b.score);

  lowCategories.forEach(cat => {
    if (risks.length < 2) {
      risks.push({
        label: `${cat.label} 점수`,
        value: `${cat.score}점`,
        severity: cat.score < 30 ? 'critical' : 'warning',
      });
    }
  });

  return risks.slice(0, 2);
};


const CATEGORY_RISK_LABELS = {
  housing: '주거',
  food: '식비',
  fixed: '고정',
  transport: '교통',
  leisure: '여가',
  misc: '잡비',
  savings: '저축',
};

function useAnimatedCount(targetValue, duration = 1000, enabled = true) {
  const [count, setCount] = useState(0);
  const startTimeRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!enabled || targetValue === null || targetValue === undefined) return;

    const animate = (timestamp) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(targetValue * easeOut));
      if (progress < 1) animationRef.current = requestAnimationFrame(animate);
    };

    startTimeRef.current = null;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [targetValue, duration, enabled]);

  return count;
}

// 점수 상승 애니메이션 훅 (start → end로 애니메이션)
function useScoreRiseAnimation(startValue, endValue, duration = 2000, enabled = true, delay = 500) {
  const [count, setCount] = useState(startValue);
  const [hasAnimated, setHasAnimated] = useState(false);
  const startTimeRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!enabled || hasAnimated) return;

    const startAnimation = () => {
      const animate = (timestamp) => {
        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo for dramatic effect
        const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const currentValue = Math.round(startValue + (endValue - startValue) * easeOut);
        setCount(currentValue);
        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        } else {
          setHasAnimated(true);
        }
      };

      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    };

    const delayTimer = setTimeout(startAnimation, delay);

    return () => {
      clearTimeout(delayTimer);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [startValue, endValue, duration, enabled, delay, hasAnimated]);

  return { count, hasAnimated };
}

// 리포트 미리보기 & 구매 통합 모달 컴포넌트
function ReportPreviewModal({ isOpen, onClose, result, preview, onSubmit }) {
  const [step, setStep] = useState('preview'); // 'preview' | 'payment' | 'complete'
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetScore = preview?.targetScore || Math.min(result.score + 20, 100);
  const scoreDiff = targetScore - result.score;

  // 모달 열릴 때 배경 스크롤 막기
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // 모달 닫을 때 상태 초기화
  const handleClose = () => {
    setStep('preview');
    setEmail('');
    setEmailError('');
    onClose();
  };

  // 이메일 유효성 검사 및 결제 단계로 이동
  const handleProceedToPayment = async () => {
    if (!email.trim()) {
      setEmailError('이메일을 입력해주세요');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('올바른 이메일 형식이 아니에요');
      return;
    }
    setEmailError('');

    // Supabase에 저장
    if (onSubmit) {
      setIsSubmitting(true);
      const success = await onSubmit(email);
      setIsSubmitting(false);
      if (!success) return;
    }

    setStep('payment');
  };

  // 결제 처리
  const handlePayment = () => {
    if (isMobileDevice()) {
      window.open(KAKAOPAY_LINK, '_blank');
    }
    setStep('complete');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-overlay-bg"
        onClick={handleClose}
      />

      {/* 모달 콘텐츠 */}
      <div className="relative bg-white rounded-2xl sm:rounded-3xl w-full max-w-lg max-h-[88vh] overflow-hidden animate-overlay-content shadow-[0_25px_60px_-12px_rgba(0,0,0,0.4)]">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-[#0F3D2E] to-[#14493a] text-white px-4 sm:px-5 py-3.5 sm:py-4 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-white/15 rounded-lg flex items-center justify-center">
                {step === 'preview' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
                {step === 'payment' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                )}
                {step === 'complete' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <h2 className="text-responsive-lg sm:text-[18px] font-bold">
                {step === 'preview' && '리포트 미리보기'}
                {step === 'payment' && '결제하기'}
                {step === 'complete' && '결제 완료'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Step 1: 미리보기 */}
        {step === 'preview' && (
          <>
            <div className="overflow-y-auto max-h-[calc(88vh-200px)]">
              {/* 점수 변화 요약 */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-[#0F3D2E] via-[#14493a] to-[#1a5c45] text-white">
                <div className="flex items-center justify-between">
                  <div className="text-center flex-1">
                    <p className="text-white/60 text-[11px] sm:text-[12px] font-medium mb-1">현재 점수</p>
                    <p className="text-[30px] sm:text-[36px] font-bold tabular-nums leading-none">{result.score}</p>
                    <p className="text-white/50 text-[11px] sm:text-[12px] mt-1">점</p>
                  </div>
                  <div className="flex flex-col items-center px-3 sm:px-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-400/20 rounded-full flex items-center justify-center mb-1">
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </div>
                    <span className="text-emerald-300 font-bold text-[13px] sm:text-[15px]">+{scoreDiff}점</span>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-emerald-300/70 text-[11px] sm:text-[12px] font-medium mb-1">목표 점수</p>
                    <p className="text-[30px] sm:text-[36px] font-bold tabular-nums text-emerald-300 leading-none">{targetScore}</p>
                    <p className="text-emerald-300/50 text-[11px] sm:text-[12px] mt-1">점</p>
                  </div>
                </div>
              </div>

              {/* 섹션 1: 카테고리별 상세 분석 */}
              <div className="p-4 sm:p-5 border-b border-neutral-100">
                <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                  <span className="bg-[#0F3D2E] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md">섹션 1</span>
                  <span className="text-responsive-md sm:text-[16px] font-bold text-neutral-800">카테고리별 상세 분석</span>
                </div>

                {/* 실제 카테고리 점수 기반 분석 */}
                {result.categoryScores && (
                  <div className="space-y-3">
                    {Object.entries(result.categoryScores)
                      .filter(([_, score]) => score < 70)
                      .slice(0, 2)
                      .map(([key, score]) => (
                        <div key={key} className="bg-neutral-50 rounded-xl sm:rounded-2xl p-3 sm:p-4">
                          <div className="flex items-center justify-between mb-2 sm:mb-2.5">
                            <span className="text-responsive-sm sm:text-[15px] font-semibold text-neutral-800">
                              {CATEGORY_LABELS[key] || key}
                            </span>
                            <span className={`text-responsive-sm sm:text-[15px] font-bold ${score < 50 ? 'text-red-500' : 'text-amber-600'}`}>
                              {score}점
                            </span>
                          </div>
                          <div className="h-2 sm:h-2.5 bg-neutral-200 rounded-full overflow-hidden mb-2 sm:mb-2.5">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${score < 50 ? 'bg-red-500' : 'bg-amber-500'}`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <p className="text-responsive-xs sm:text-[14px] text-neutral-600 leading-relaxed">
                            {key === 'housing' && '주거비가 수입 대비 높아요. 리포트에서 최적 주거비 비율과 대안을 안내해드려요.'}
                            {key === 'savings' && '저축률이 목표 대비 낮아요. 자동저축 시스템 구축 방법을 알려드려요.'}
                            {key === 'food' && '식비 지출이 평균보다 높아요. 식비 절약 실전 팁을 제공해요.'}
                            {key === 'fixed' && '고정비 비중이 커요. 통신비·구독료 최적화 방법을 안내해요.'}
                            {key === 'transport' && '교통비 절감 여지가 있어요. 대중교통·자차 비용 비교 분석을 해드려요.'}
                            {key === 'leisure' && '여가비 조절이 필요해요. 가성비 높은 여가 활동을 추천해요.'}
                            {key === 'misc' && '잡비 관리가 필요해요. 소소한 지출 줄이는 방법을 알려드려요.'}
                          </p>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* 섹션 2: 맞춤 개선 전략 */}
              <div className="p-4 sm:p-5 border-b border-neutral-100">
                <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                  <span className="bg-[#0F3D2E] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md">섹션 2</span>
                  <span className="text-responsive-md sm:text-[16px] font-bold text-neutral-800">맞춤 개선 전략</span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  {preview?.adjustments?.slice(0, 3).map((adj, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-4 bg-emerald-50/80 rounded-xl sm:rounded-2xl border border-emerald-100">
                      <span className="w-6 h-6 sm:w-7 sm:h-7 bg-[#0F3D2E] text-white rounded-lg flex items-center justify-center text-[11px] sm:text-[12px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-responsive-sm sm:text-[15px] font-semibold text-neutral-800">{adj.description}</p>
                        <p className="text-responsive-xs sm:text-[14px] text-neutral-600 mt-1 leading-relaxed">
                          {idx === 0 && '구체적인 실행 방법과 예상 절약 금액을 리포트에서 확인하세요.'}
                          {idx === 1 && '단계별 실행 가이드와 체크리스트를 제공해요.'}
                          {idx === 2 && '비슷한 상황의 성공 사례를 함께 안내해요.'}
                        </p>
                      </div>
                      <span className="text-emerald-600 font-bold text-responsive-sm sm:text-[15px] flex-shrink-0 bg-white px-2 py-0.5 rounded-md">+{adj.scoreDiff}점</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 섹션 3: 4주 실행 계획 (일부 블러) */}
              <div className="p-4 sm:p-5 border-b border-neutral-100">
                <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                  <span className="bg-[#0F3D2E] text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md">섹션 3</span>
                  <span className="text-responsive-md sm:text-[16px] font-bold text-neutral-800">4주 실행 계획</span>
                </div>

                <div className="space-y-2.5 sm:space-y-3">
                  <div className="p-3 sm:p-4 border-l-4 border-[#0F3D2E] bg-neutral-50 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <span className="text-responsive-sm sm:text-[14px] font-bold text-[#0F3D2E]">1주차</span>
                      <span className="text-responsive-xs sm:text-[13px] text-neutral-500">현황 분석 & 목표 설정</span>
                    </div>
                    <ul className="text-responsive-xs sm:text-[14px] text-neutral-600 space-y-1">
                      <li>• 지출 카테고리별 상세 분석</li>
                      <li>• 개선 우선순위 선정</li>
                    </ul>
                  </div>

                  <div className="p-3 sm:p-4 border-l-4 border-emerald-400 bg-neutral-50 rounded-r-xl">
                    <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                      <span className="text-responsive-sm sm:text-[14px] font-bold text-emerald-600">2주차</span>
                      <span className="text-responsive-xs sm:text-[13px] text-neutral-500">첫 번째 개선 실행</span>
                    </div>
                    <ul className="text-responsive-xs sm:text-[14px] text-neutral-600 space-y-1">
                      <li>• 고정비 최적화 적용</li>
                      <li>• 자동저축 시스템 구축</li>
                    </ul>
                  </div>

                  {/* 블러 처리 */}
                  <div className="relative">
                    <div className="space-y-2.5 blur-[6px] select-none pointer-events-none">
                      <div className="p-3 sm:p-4 border-l-4 border-amber-400 bg-neutral-50 rounded-r-xl">
                        <span className="text-responsive-xs sm:text-[14px] text-neutral-400">3주차: 습관 형성 & 모니터링...</span>
                      </div>
                      <div className="p-3 sm:p-4 border-l-4 border-blue-400 bg-neutral-50 rounded-r-xl">
                        <span className="text-responsive-xs sm:text-[14px] text-neutral-400">4주차: 점검 & 장기 전략...</span>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/70 to-white flex items-end justify-center pb-3">
                      <span className="text-responsive-xs sm:text-[13px] text-neutral-500 font-medium">+ 상세 체크리스트 포함</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 섹션 4: 추가 제공 내용 (블러) */}
              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-2 sm:gap-2.5 mb-3 sm:mb-4">
                  <span className="bg-neutral-300 text-white text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md">섹션 4-6</span>
                  <span className="text-responsive-md sm:text-[16px] font-bold text-neutral-400">추가 제공 내용</span>
                </div>

                <div className="relative">
                  <div className="space-y-2 sm:space-y-2.5 blur-[6px] select-none pointer-events-none">
                    <div className="p-3 sm:p-4 bg-neutral-100 rounded-xl">
                      <span className="text-neutral-400 text-responsive-sm sm:text-[14px]">비상금 계획 & 안전망 구축</span>
                    </div>
                    <div className="p-3 sm:p-4 bg-neutral-100 rounded-xl">
                      <span className="text-neutral-400 text-responsive-sm sm:text-[14px]">독립 후 예상 생활비 시뮬레이션</span>
                    </div>
                    <div className="p-3 sm:p-4 bg-neutral-100 rounded-xl">
                      <span className="text-neutral-400 text-responsive-sm sm:text-[14px]">장기 재무 목표 로드맵</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-white flex items-center justify-center">
                    <div className="bg-[#0F3D2E] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-responsive-xs sm:text-[14px] font-semibold shadow-lg">
                      결제 후 전체 내용 확인
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 하단: 이메일 입력 & 구매 버튼 */}
            <div className="sticky bottom-0 bg-white border-t border-neutral-200 p-4 sm:p-5 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
              <div className="mb-3 sm:mb-4">
                <label className="text-responsive-xs sm:text-[14px] text-neutral-600 font-medium mb-1.5 sm:mb-2 block">리포트 받을 이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className={`w-full h-11 sm:h-12 px-3.5 sm:px-4 rounded-xl border-2 ${emailError ? 'border-red-400 bg-red-50' : 'border-neutral-200 bg-neutral-50 focus:bg-white'} text-responsive-md sm:text-[15px] focus:outline-none focus:border-[#0F3D2E] transition-colors`}
                />
                {emailError && <p className="text-responsive-xs sm:text-[13px] text-red-500 mt-1.5 font-medium">{emailError}</p>}
              </div>
              <button
                onClick={handleProceedToPayment}
                disabled={isSubmitting}
                className="w-full h-12 sm:h-14 rounded-xl bg-[#0F3D2E] text-white text-responsive-md sm:text-[16px] font-bold hover:bg-[#0a2e22] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
              >
                <span>{isSubmitting ? '처리 중...' : '4,900원 결제하기'}</span>
              </button>
            </div>
          </>
        )}

        {/* Step 2: 결제 */}
        {step === 'payment' && (
          <div className="p-4 sm:p-6">
            <div className="text-center mb-5 sm:mb-6">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FEE500] rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg">
                <svg className="w-7 h-7 sm:w-8 sm:h-8" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
              </div>
              <p className="text-[24px] sm:text-[28px] font-bold text-neutral-800 mb-1">4,900원</p>
              <p className="text-responsive-sm sm:text-[15px] text-neutral-500 truncate max-w-[250px] mx-auto">{email}</p>
            </div>

            {/* 모바일: 버튼 / 데스크톱: QR */}
            {isMobileDevice() ? (
              <button
                onClick={handlePayment}
                className="w-full h-12 sm:h-14 rounded-xl bg-[#FEE500] text-[#191919] text-responsive-md sm:text-[16px] font-bold hover:bg-[#F5DC00] transition-all duration-200 flex items-center justify-center gap-2 shadow-md"
              >
                <svg className="w-5 h-5 sm:w-6 sm:h-6" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
                카카오페이로 결제
              </button>
            ) : (
              <div className="text-center">
                <p className="text-responsive-sm sm:text-[15px] text-neutral-600 mb-3 sm:mb-4">휴대폰으로 QR 스캔</p>
                <div className="bg-white p-3 sm:p-4 rounded-2xl inline-block shadow-lg border border-neutral-200 mb-4 sm:mb-5">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(KAKAOPAY_LINK)}`}
                    alt="카카오페이 QR"
                    className="w-[140px] h-[140px] sm:w-[160px] sm:h-[160px]"
                  />
                </div>
                <button
                  onClick={() => setStep('complete')}
                  className="w-full h-12 sm:h-14 rounded-xl bg-[#0F3D2E] text-white text-responsive-md sm:text-[16px] font-bold hover:bg-[#0a2e22] transition-all duration-200 shadow-lg"
                >
                  결제 완료했어요
                </button>
              </div>
            )}

            <button
              onClick={() => setStep('preview')}
              className="w-full text-neutral-400 text-responsive-sm sm:text-[15px] mt-3 sm:mt-4 py-2 hover:text-neutral-600 transition-colors font-medium"
            >
              이전으로
            </button>
          </div>
        )}

        {/* Step 3: 완료 */}
        {step === 'complete' && (
          <div className="p-5 sm:p-6 text-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5 shadow-lg">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-[22px] sm:text-[24px] font-bold text-neutral-800 mb-2 sm:mb-3">감사합니다!</h3>
            <p className="text-responsive-md sm:text-[16px] text-neutral-600 leading-relaxed mb-2">
              결제 확인 후 24시간 내<br />
              <strong className="text-neutral-800">{email}</strong>로<br />
              맞춤 리포트를 보내드릴게요.
            </p>
            <p className="text-responsive-xs sm:text-[14px] text-neutral-400 mb-5 sm:mb-6">
              문의: canilivealone.help@gmail.com
            </p>
            <button
              onClick={handleClose}
              className="w-full h-12 sm:h-14 rounded-xl bg-[#0F3D2E] text-white text-responsive-md sm:text-[16px] font-bold hover:bg-[#0a2e22] transition-all duration-200 shadow-lg"
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// 프리미엄 카드 컴포넌트 (점수 상승 애니메이션)
function PremiumScoreCard({ result, preview, onPreviewClick, isVisible }) {
  const targetScore = preview?.targetScore || Math.min(result.score + 20, 100);
  const { count: animatedScore, hasAnimated } = useScoreRiseAnimation(
    result.score,
    targetScore,
    2000,
    isVisible,
    800
  );

  const scoreDiff = targetScore - result.score;
  const displayScore = isVisible ? animatedScore : result.score;

  // 애니메이션 진행률 계산 (0~1)
  const progress = isVisible ? (animatedScore - result.score) / scoreDiff : 0;
  const isAnimating = isVisible && !hasAnimated && animatedScore > result.score;

  return (
    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/[0.06]">
      {/* 상단 그라데이션 영역 - 점수 애니메이션 */}
      <div className="bg-gradient-to-br from-[#0F3D2E] via-[#14493a] to-[#1a5c45] p-5 sm:p-6 relative overflow-hidden">
        {/* 배경 장식 */}
        <div className="absolute top-0 right-0 w-28 sm:w-36 h-28 sm:h-36 bg-white/[0.08] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-20 sm:w-28 h-20 sm:h-28 bg-white/[0.06] rounded-full translate-y-1/2 -translate-x-1/2" />

        {/* 애니메이션 중 파티클 효과 */}
        {isAnimating && (
          <>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 animate-ping opacity-20 bg-emerald-400 rounded-full" />
            <div className="absolute top-[30%] left-[20%] w-2 h-2 bg-emerald-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="absolute top-[40%] right-[25%] w-1.5 h-1.5 bg-amber-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="absolute bottom-[35%] left-[30%] w-2 h-2 bg-white/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
            <div className="absolute top-[50%] right-[20%] w-1 h-1 bg-emerald-200 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          </>
        )}

        {/* 완료 시 축하 파티클 */}
        {hasAnimated && (
          <>
            <div className="absolute top-[20%] left-[15%] text-[20px] animate-bounce" style={{ animationDelay: '0s' }}>✨</div>
            <div className="absolute top-[25%] right-[18%] text-[16px] animate-bounce" style={{ animationDelay: '0.15s' }}>🎉</div>
            <div className="absolute bottom-[30%] left-[22%] text-[14px] animate-bounce" style={{ animationDelay: '0.3s' }}>⭐</div>
            <div className="absolute bottom-[35%] right-[15%] text-[18px] animate-bounce" style={{ animationDelay: '0.2s' }}>🚀</div>
          </>
        )}

        {/* 프리미엄 배지 */}
        <div className="flex items-center justify-between mb-4 sm:mb-5 relative">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/15 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-white font-bold text-responsive-md sm:text-[17px]">점수 상승 리포트</span>
          </div>
          <span className="bg-amber-400 text-amber-900 text-[11px] sm:text-[12px] font-bold px-2.5 py-1 rounded-full shadow-sm">PRO</span>
        </div>

        {/* 점수 애니메이션 */}
        <div className="text-center py-5 sm:py-6 relative">
          <p className="text-white/70 text-responsive-sm sm:text-[15px] mb-2">
            {hasAnimated ? '목표 점수' : '현재 점수에서'}
          </p>
          <div className={`relative inline-block transition-transform duration-300 ${hasAnimated ? 'animate-bounce-once' : ''}`}>
            {/* 글로우 효과 */}
            {isAnimating && (
              <div
                className="absolute inset-0 blur-2xl bg-emerald-400/40 rounded-full transition-opacity"
                style={{ opacity: progress * 0.8 }}
              />
            )}
            <p className={`text-[72px] sm:text-[88px] font-bold tabular-nums leading-none relative ${
              isAnimating ? 'text-emerald-300' : hasAnimated ? 'text-emerald-300' : 'text-white'
            } ${isAnimating ? 'scale-105' : ''} transition-all duration-200`}>
              {displayScore}
            </p>
            {/* 상승 표시 배지 - 숫자 바깥 오른쪽 위 */}
            {hasAnimated && (
              <div className="absolute -top-3 -right-8 sm:-right-10 bg-emerald-400 text-[#0F3D2E] px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[13px] sm:text-[15px] font-bold shadow-lg animate-bounce-once">
                +{scoreDiff}
              </div>
            )}
          </div>
          <p className={`text-responsive-md sm:text-[17px] mt-2 font-medium transition-all duration-300 ${
            hasAnimated ? 'text-emerald-300' : 'text-white'
          }`}>
            {hasAnimated
              ? '점까지 올릴 수 있어요!'
              : isAnimating
                ? '점수가 올라가는 중...'
                : '점수를 높여보세요'}
          </p>
        </div>
      </div>

      {/* 하단 흰색 영역 - 혜택 & CTA */}
      <div className="p-4 sm:p-5">
        {/* 핵심 혜택 */}
        <div className="space-y-2.5 sm:space-y-3 mb-4 sm:mb-5">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-responsive-sm sm:text-[15px] text-neutral-700">카테고리별 맞춤 개선 전략</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-responsive-sm sm:text-[15px] text-neutral-700">4주 실행 계획 제공</span>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="w-6 h-6 sm:w-7 sm:h-7 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <span className="text-responsive-sm sm:text-[15px] text-neutral-700">이메일로 PDF 리포트 발송</span>
          </div>
        </div>

        {/* 가격 & 미리보기 버튼 */}
        <div className="flex items-center justify-between mb-4 p-3 sm:p-4 bg-neutral-50 rounded-xl sm:rounded-2xl">
          <div>
            <p className="text-responsive-xs sm:text-[13px] text-neutral-400 mb-0.5">리포트 가격</p>
            <p className="text-[22px] sm:text-[26px] font-bold text-[#0F3D2E] leading-tight">4,900원</p>
          </div>
          <div className="text-right">
            <p className="text-responsive-xs sm:text-[13px] text-neutral-400 mb-0.5">예상 점수 상승</p>
            <p className="text-[18px] sm:text-[22px] font-bold text-emerald-600 leading-tight">+{scoreDiff}점</p>
          </div>
        </div>

        <button
          onClick={onPreviewClick}
          className="w-full h-12 sm:h-14 rounded-xl bg-[#0F3D2E] text-white text-responsive-md sm:text-[16px] font-bold hover:bg-[#0a2e22] transition-all duration-200 flex items-center justify-center gap-2 shadow-lg"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          리포트 미리보기
        </button>
      </div>
    </div>
  );
}

function useToast() {
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message, duration = 2000) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), duration);
  };

  return { toast, showToast };
}

function AnalysisLoading({ onRetry }) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [showTimeout, setShowTimeout] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // 8초 후 타임아웃 표시
  useEffect(() => {
    const timeout = setTimeout(() => {
      setShowTimeout(true);
    }, 8000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center p-4 result-gradient-bg">
      <div className="text-center max-w-sm w-full">
        {!showTimeout ? (
          <>
            <div className="relative w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-5 sm:mb-6">
              <div className="absolute inset-0 border-2 border-white/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-responsive-xl sm:text-[22px] font-bold text-white mb-2.5 sm:mb-3 animate-fade-in" key={messageIndex}>
              {LOADING_MESSAGES[messageIndex]}
            </p>
            <p className="text-responsive-md sm:text-[16px] text-white/60">
              입력하신 정보를 분석하고 있습니다
            </p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 sm:w-8 sm:h-8 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-responsive-xl sm:text-[20px] font-bold text-white mb-2">
              분석이 오래 걸리고 있어요
            </p>
            <p className="text-responsive-md sm:text-[16px] text-white/70 mb-5 sm:mb-6 leading-relaxed">
              네트워크 상태를 확인하시고<br />
              아래 버튼을 눌러 다시 시도해주세요.
            </p>
            <button
              onClick={onRetry}
              className="w-full h-11 sm:h-12 rounded-xl bg-white text-[#0F3D2E] text-responsive-md sm:text-[16px] font-bold hover:bg-white/95 transition-all duration-200 mb-3 shadow-lg"
            >
              다시 시도하기
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full text-white/60 text-responsive-sm hover:text-white/80 transition-colors font-medium"
            >
              처음으로 돌아가기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function ScoreGauge({ score, showScore }) {
  // 숫자와 원주 애니메이션을 동일한 JS 애니메이션으로 동기화
  const animatedScore = useAnimatedCount(score, 1200, showScore);
  const displayScore = showScore ? animatedScore : 0;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const offset = circumference - progress;

  const getScoreColor = (s) => {
    if (s >= 70) return 'emerald';
    if (s >= 50) return 'amber';
    return 'rose';
  };

  const colorClass = getScoreColor(score); // 최종 점수 기준으로 색상 결정

  return (
    <div className="relative w-[144px] h-[144px] sm:w-[176px] sm:h-[176px] mx-auto">
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} className="score-ring-bg" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          className={`score-ring-progress ${colorClass}`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-[44px] sm:text-[54px] font-bold tabular-nums text-neutral-800 leading-none ${showScore ? '' : 'opacity-0'}`}>
          {displayScore}
        </span>
      </div>
    </div>
  );
}

function ShareCard({ result, cardRef }) {
  const gradeStyle = SHARE_GRADE_STYLES[result?.grade] || { bg: '#F3F4F6', border: '#9CA3AF', text: '#6B7280' };
  const score = result?.score ?? 0;

  // 점수에 따른 색상
  const getScoreColor = (s) => {
    if (s >= 70) return '#0F3D2E';
    if (s >= 50) return '#F59E0B';
    return '#EF4444';
  };

  // 카테고리별 점수 (낮은 점수 우선 4개 - 개선 필요 영역 강조)
  const categoryData = result?.categoryScores
    ? CATEGORY_ORDER
        .map((key) => ({
          key,
          label: CATEGORY_RISK_LABELS[key],
          score: result.categoryScores[key],
        }))
        .sort((a, b) => a.score - b.score)
        .slice(0, 4)
    : [];

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '1080px',
        height: '1080px',
        background: 'linear-gradient(145deg, #0a2e1f 0%, #0F3D2E 30%, #1a5c45 60%, #0F3D2E 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        padding: '55px 65px',
        boxSizing: 'border-box',
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* 상단 로고 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        marginBottom: '35px',
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          backgroundColor: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="28" height="28" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
            <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </div>
        <span style={{
          fontSize: '26px',
          fontWeight: '700',
          color: 'white',
        }}>
          독립점수
        </span>
      </div>

      {/* 메인 흰색 카드 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '36px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'center',
        boxShadow: '0 30px 80px rgba(0,0,0,0.4)',
        padding: '50px 60px',
      }}>
        {/* 점수 영역 */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          paddingTop: '60px',
        }}>
          {/* 점수 */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
            paddingLeft: '80px',
          }}>
            <span style={{
              fontSize: '200px',
              fontWeight: '800',
              color: '#0F3D2E',
              lineHeight: 1,
              letterSpacing: '-10px',
            }}>
              {score}
            </span>
            <span style={{
              fontSize: '54px',
              color: '#9CA3AF',
            }}>
              /100
            </span>
          </div>

          {/* 등급 배지 */}
          <div style={{
            display: 'inline-block',
            backgroundColor: gradeStyle.bg,
            border: `2px solid ${gradeStyle.border}`,
            padding: '20px 28px',
            borderRadius: '9999px',
            marginBottom: '20px',
          }}>
            <span style={{
              fontSize: '28px',
              fontWeight: '700',
              color: gradeStyle.text,
            }}>
              {result?.grade}
            </span>
          </div>

          {/* 결과 문구 */}
          <div style={{
            fontSize: '28px',
            color: '#374151',
            marginBottom: '30px',
          }}>
            {GRADE_VERDICT[result?.grade] || ''}
          </div>
        </div>

        {/* 하단 카테고리 영역 */}
        <div style={{ flexShrink: 0 }}>
          {/* 구분선 */}
          <div style={{
            height: '1px',
            backgroundColor: '#9CA3AF',
            marginBottom: '24px',
          }} />

          {/* FOCUS AREAS 타이틀 */}
          <div style={{
            fontSize: '14px',
            color: '#9CA3AF',
            letterSpacing: '2px',
            marginBottom: '18px',
          }}>
            FOCUS AREAS
          </div>

          {/* 카테고리 그리드 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '14px',
          }}>
            {categoryData.map((cat) => (
              <div key={cat.key} style={{
                backgroundColor: '#F3F4F6',
                borderRadius: '16px',
                padding: '24px 16px',
                textAlign: 'center',
              }}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: '700',
                  color: getScoreColor(cat.score),
                  marginBottom: '8px',
                }}>
                  {cat.score}
                </div>
                <div style={{
                  fontSize: '20px',
                  color: '#6B7280',
                }}>
                  {cat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 URL */}
      <div style={{
        marginTop: '40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
      }}>
        <span style={{
          fontSize: '22px',
          color: 'rgba(255,255,255,0.5)',
        }}>
          무료로 진단받기
        </span>
        <strong style={{
          fontSize: '22px',
          color: 'rgba(255,255,255,0.8)',
          fontWeight: '600',
        }}>
          canilivealone.com
        </strong>
      </div>
    </div>
  );
}

// 다시하기 확인 모달
function RestartConfirmModal({ isOpen, onConfirm, onCancel, isSharedResult = false, friendScore = null }) {
  if (!isOpen) return null;

  // 공유 링크 방문자용 모달
  if (isSharedResult) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-overlay-bg"
          onClick={onCancel}
        />
        <div className="relative bg-gradient-to-br from-[#0F3D2E] via-[#14493a] to-[#1a5c45] rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.4)] animate-overlay-content text-center overflow-hidden">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* 점수 비교 시각화 */}
          <div className="mb-4 sm:mb-5 relative">
            <div className="inline-flex items-center gap-2.5 sm:gap-3 bg-white/10 rounded-full px-4 sm:px-5 py-2 sm:py-2.5 border border-white/10">
              <span className="text-white/60 text-responsive-xs sm:text-[14px]">친구</span>
              <span className="text-white font-bold text-responsive-lg sm:text-[20px] tabular-nums">{friendScore}점</span>
              <span className="text-white/40 text-responsive-sm">vs</span>
              <span className="text-amber-300 font-bold text-responsive-lg sm:text-[20px]">?점</span>
              <span className="text-white/60 text-responsive-xs sm:text-[14px]">나</span>
            </div>
          </div>

          <h3 className="text-responsive-xl sm:text-[20px] font-bold text-white mb-2 relative">
            나는 몇 점일까?
          </h3>
          <p className="text-responsive-sm sm:text-[15px] text-white/70 mb-5 sm:mb-6 leading-relaxed relative">
            수입과 지출만 입력하면 끝!<br />
            <span className="text-white/50 text-responsive-xs sm:text-[14px]">2분 · 무료 · 회원가입 없음</span>
          </p>

          <button
            onClick={onConfirm}
            className="w-full h-11 sm:h-12 rounded-xl bg-white text-[#0F3D2E] text-responsive-md sm:text-[16px] font-bold hover:bg-white/95 transition-all duration-200 shadow-lg mb-3 relative"
          >
            나도 진단받기
          </button>
          <button
            onClick={onCancel}
            className="w-full text-white/50 text-responsive-sm sm:text-[15px] py-2 hover:text-white/70 transition-colors font-medium relative"
          >
            나중에 할게요
          </button>
        </div>
      </div>
    );
  }

  // 본인 재시작용 모달
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-overlay-bg"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 max-w-sm w-full shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] animate-overlay-content">
        <h3 className="text-responsive-lg sm:text-[18px] font-bold text-neutral-800 mb-2">
          다시 진단받으시겠어요?
        </h3>
        <p className="text-responsive-sm sm:text-[15px] text-neutral-500 mb-2 leading-relaxed">
          수입이나 지출이 바뀌었다면<br />
          새로운 점수를 확인해보세요.
        </p>
        <p className="text-responsive-sm sm:text-[15px] text-neutral-500 mb-5">
          현재 결과는 링크로 저장되어 있어요.
        </p>
        <div className="flex gap-2.5 sm:gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-11 sm:h-12 rounded-xl border border-neutral-200 text-neutral-600 text-responsive-sm sm:text-[15px] font-semibold hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-11 sm:h-12 rounded-xl bg-[#0F3D2E] text-white text-responsive-sm sm:text-[15px] font-bold hover:bg-[#0a2e22] transition-all duration-200 shadow-lg"
          >
            다시 진단받기
          </button>
        </div>
      </div>
    </div>
  );
}

// 모바일 디바이스 감지
const isMobileDevice = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const KAKAOPAY_LINK = 'https://qr.kakaopay.com/FC3Bnn1CY99202888';

// 프리미엄 리포트 이메일 입력 모달
function PremiumEmailModal({ isOpen, onClose, onSubmit, isLoading, score, grade }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'payment' | 'complete'
  const [savedEmail, setSavedEmail] = useState('');

  // 모달 열릴 때 이벤트
  useEffect(() => {
    if (isOpen) {
      AnalyticsEvents.premiumModalOpen(score, grade);
    }
  }, [isOpen, score, grade]);

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('이메일을 입력해주세요');
      return;
    }
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식이 아닙니다');
      return;
    }
    setError('');

    // 이메일 저장
    const success = await onSubmit(email);
    if (!success) return;

    setSavedEmail(email);
    setStep('payment');
  };

  const handlePayment = () => {
    if (isMobileDevice()) {
      // 모바일: 새 탭에서 열어서 돌아올 수 있게
      window.open(KAKAOPAY_LINK, '_blank');
    } else {
      // 데스크톱: 새 탭에서 열기 (QR 대신 직접 결제)
      window.open(KAKAOPAY_LINK, '_blank');
    }
    setStep('complete');
  };

  const handleClose = () => {
    // 완료 단계가 아닐 때만 이탈 이벤트 추적
    if (step !== 'complete') {
      AnalyticsEvents.premiumModalClose(score, grade, step);
    }
    setStep('email');
    setEmail('');
    setSavedEmail('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-overlay-bg"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-overlay-content">

        {/* Step 1: 이메일 입력 */}
        {step === 'email' && (
          <>
            <h3 className="text-[17px] font-bold text-neutral-800 mb-2">
              리포트 받을 이메일
            </h3>
            <p className="text-[14px] text-neutral-500 mb-4 leading-relaxed">
              결제 확인 후 입력하신 이메일로<br />
              맞춤 리포트를 발송해드립니다.
            </p>

            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError('');
              }}
              placeholder="example@email.com"
              className={`w-full h-12 px-4 rounded-[10px] border ${error ? 'border-red-400' : 'border-neutral-200'} text-[15px] focus:outline-none focus:border-[#0F3D2E] transition-colors`}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            {error && (
              <p className="text-[14px] text-red-500 mt-1">{error}</p>
            )}

            <div className="flex gap-3 mt-4">
              <button
                onClick={handleClose}
                className="flex-1 h-12 rounded-[10px] border border-neutral-200 text-neutral-600 text-[14px] font-semibold hover:bg-neutral-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 h-12 rounded-[10px] bg-[#0F3D2E] text-white text-[14px] font-semibold hover:bg-[#0a2e22] transition-colors disabled:opacity-50"
              >
                {isLoading ? '저장 중...' : '다음'}
              </button>
            </div>

            <p className="text-[13px] text-neutral-500 text-center mt-3">
              결제 금액: 4,900원 (카카오페이)
            </p>
          </>
        )}

        {/* Step 2: 결제 진행 */}
        {step === 'payment' && (
          <>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-[#FEE500] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
              </div>
              <h3 className="text-[17px] font-bold text-neutral-800 mb-1">
                카카오페이로 결제
              </h3>
              <p className="text-[20px] font-bold text-[#0F3D2E]">4,900원</p>
            </div>

            <div className="bg-neutral-50 rounded-xl p-4 mb-4">
              <p className="text-[13px] text-neutral-500 mb-1">리포트 발송 이메일</p>
              <p className="text-[15px] font-semibold text-neutral-800">{savedEmail}</p>
            </div>

            {/* 모바일: 버튼 / 데스크톱: QR 코드 */}
            {isMobileDevice() ? (
              <button
                onClick={handlePayment}
                className="w-full h-12 rounded-[10px] bg-[#FEE500] text-[#191919] text-[15px] font-bold hover:bg-[#F5DC00] transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
                카카오페이 결제하기
              </button>
            ) : (
              <div className="text-center mb-4">
                <p className="text-[14px] text-neutral-600 mb-3">휴대폰으로 QR 코드를 스캔하세요</p>
                <div className="bg-white p-3 rounded-xl inline-block shadow-md border border-neutral-200">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(KAKAOPAY_LINK)}`}
                    alt="카카오페이 결제 QR"
                    className="w-[180px] h-[180px]"
                  />
                </div>
                <p className="text-[13px] text-neutral-400 mt-3">카카오톡 &gt; 스캔 또는 카메라 앱 사용</p>
                <button
                  onClick={() => setStep('complete')}
                  className="w-full h-12 rounded-[10px] bg-[#0F3D2E] text-white text-[15px] font-bold hover:bg-[#0a2e22] transition-colors mt-4"
                >
                  결제 완료했어요
                </button>
              </div>
            )}

            <button
              onClick={() => setStep('email')}
              className="w-full text-neutral-500 text-[14px] hover:text-neutral-600 transition-colors"
            >
              이메일 수정하기
            </button>
          </>
        )}

        {/* Step 3: 결제 완료 안내 */}
        {step === 'complete' && (
          <>
            <div className="text-center mb-4">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-[18px] font-bold text-neutral-800 mb-2">
                결제 요청 완료
              </h3>
              <p className="text-[14px] text-neutral-500 leading-relaxed">
                결제가 정상적으로 완료되면<br />
                아래 이메일로 리포트를 보내드려요.
              </p>
            </div>

            <div className="bg-[#0F3D2E]/5 rounded-xl p-4 mb-4">
              <p className="text-[13px] text-[#0F3D2E]/60 mb-1">발송 예정 이메일</p>
              <p className="text-[16px] font-bold text-[#0F3D2E]">{savedEmail}</p>
            </div>

            <div className="bg-neutral-50 rounded-lg p-3 mb-4">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-neutral-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
            <p className="text-[13px] text-neutral-500 leading-relaxed">
                  결제 확인 후 <strong>24시간 내</strong> 발송됩니다.<br />
                  스팸함도 확인해주세요.
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full h-12 rounded-[10px] bg-[#0F3D2E] text-white text-[14px] font-semibold hover:bg-[#0a2e22] transition-colors"
            >
              확인
            </button>

            <button
              onClick={handlePayment}
              className="w-full text-neutral-500 text-[14px] mt-3 hover:text-neutral-600 transition-colors"
            >
              결제창 다시 열기
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 점수 산정 방식 데이터 (실제 코드 가중치 기준)
const SCORE_METHODOLOGY = {
  categories: [
    { id: 'housing', label: '주거비', weight: 25, description: '수입 대비 주거비 비율 및 주거 안정성' },
    { id: 'savings', label: '저축·비상금', weight: 20, description: '저축률 및 비상자금 보유 수준' },
    { id: 'food', label: '식비', weight: 15, description: '수입 대비 식비 비율 및 지출 통제력' },
    { id: 'fixed', label: '고정지출', weight: 10, description: '구독/통신비 등 고정비 관리 능력' },
    { id: 'transport', label: '교통비', weight: 10, description: '수입 대비 교통비 비율 및 효율성' },
    { id: 'leisure', label: '여가비', weight: 10, description: '선택적 지출 통제력' },
    { id: 'misc', label: '생활잡비', weight: 10, description: '소액 지출 인식 및 관리' },
  ],
  principles: [
    '단순 소득이 아닌 "지속 가능한 독립 유지"를 기준으로 평가합니다.',
    '수입 대비 지출 비율과 재정 관리 능력을 종합 분석합니다.',
    '비상 상황 대응력(비상금)에 높은 가중치를 부여합니다.',
  ],
  disclaimer: '이 점수는 참고용 지표이며, 개인의 소비 습관과 지역 환경에 따라 실제 독립 가능성은 달라질 수 있습니다.',
};

// 점수 산정 방식 설명 컴포넌트
const ScoreMethodology = forwardRef(function ScoreMethodology(props, ref) {
  return (
    <details ref={ref} className="bg-white rounded-2xl shadow-md group">
      <summary className="p-4 sm:p-5 cursor-pointer flex items-center justify-between list-none">
        <div className="flex-1">
          <span className="text-responsive-lg font-bold text-neutral-800">점수 산정 방식</span>
          <p className="text-responsive-base text-neutral-500 mt-1">7개 카테고리 가중 평균</p>
        </div>
        <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-neutral-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-4 border-t border-neutral-100 pt-4">
        {/* 카테고리별 가중치 */}
        <div className="space-y-3">
          <p className="text-responsive-sm sm:text-[15px] text-neutral-700 font-semibold">카테고리별 가중치</p>
          <div className="space-y-2.5 sm:space-y-3">
            {SCORE_METHODOLOGY.categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-responsive-sm sm:text-[15px] font-medium text-neutral-700">{cat.label}</span>
                    <span className="text-responsive-sm sm:text-[15px] font-bold text-[#0F3D2E] tabular-nums">{cat.weight}%</span>
                  </div>
                  <div className="h-2 sm:h-2.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F3D2E] rounded-full transition-all duration-500"
                      style={{ width: `${cat.weight * 4}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 평가 원칙 */}
        <div className="space-y-3 pt-3 sm:pt-4 border-t border-neutral-100">
          <p className="text-responsive-sm sm:text-[15px] text-neutral-700 font-semibold">평가 원칙</p>
          <ul className="space-y-2 sm:space-y-2.5">
            {SCORE_METHODOLOGY.principles.map((principle, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#0F3D2E] mt-2 flex-shrink-0" />
                <span className="text-responsive-sm sm:text-[15px] text-neutral-600 leading-relaxed">{principle}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 한계 안내 */}
        <div className="p-3.5 sm:p-4 bg-neutral-50 rounded-xl sm:rounded-2xl">
          <p className="text-responsive-xs sm:text-[14px] text-neutral-500 leading-relaxed">
            {SCORE_METHODOLOGY.disclaimer}
          </p>
        </div>
      </div>
    </details>
  );
});

export function ResultStep() {
  const [, setSearchParams] = useSearchParams();
  const { income, expenses, answers, result, setResult, reset, setCurrentStep } = useSurvey();
  const { toast, showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showScore, setShowScore] = useState(false);
  const [showGrade, setShowGrade] = useState(false);
  const [isImageSaving, setIsImageSaving] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [isSharedResult, setIsSharedResult] = useState(false);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [previousComparison, setPreviousComparison] = useState(null);
  const [friendComparison, setFriendComparison] = useState(null);
  const [history, setHistory] = useState([]);
  const [showGradeRange, setShowGradeRange] = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [isPremiumCardVisible, setIsPremiumCardVisible] = useState(false);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const shareCardRef = useRef(null);
  const premiumCardRef = useRef(null);
  const scrollMilestonesRef = useRef(new Set());
  const detailsRefs = useRef([]);  // 상세 분석 details 요소들

  // 스크롤 깊이 추적 (25%, 50%, 75%, 100%)
  useEffect(() => {
    if (isLoading || !result) return;

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const scrollPercent = Math.round((window.scrollY / scrollHeight) * 100);
      const milestones = [25, 50, 75, 100];

      milestones.forEach(milestone => {
        if (scrollPercent >= milestone && !scrollMilestonesRef.current.has(milestone)) {
          scrollMilestonesRef.current.add(milestone);
          AnalyticsEvents.resultScrollDepth(milestone);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isLoading, result]);

  // 컴포넌트 마운트 시점에 URL에 id가 있었는지 (본인 결과 저장 후 id 추가와 구분)
  const [initialSharedId] = useState(() => new URLSearchParams(window.location.search).get('id'));

  // 총 진단 수 조회 (1회)
  useEffect(() => {
    async function fetchCount() {
      try {
        const { count } = await supabase
          .from('results')
          .select('*', { count: 'exact', head: true });
        if (count !== null) setTotalCount(count);
      } catch {
        // 실패해도 무시
      }
    }
    fetchCount();
  }, []);

  // 프리미엄 카드 가시성 감지 (점수 애니메이션 트리거)
  useEffect(() => {
    // 이미 visible이면 스킵
    if (isPremiumCardVisible) return;
    if (!result || isSharedResult || isLoading) return;

    // DOM이 준비될 때까지 약간 대기
    const timer = setTimeout(() => {
      if (!premiumCardRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsPremiumCardVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.3 }
      );

      observer.observe(premiumCardRef.current);
    }, 100);

    return () => clearTimeout(timer);
  }, [result, isSharedResult, isLoading, isPremiumCardVisible]);

  // 공유된 결과 조회 (처음 마운트 시 URL에 id가 있었던 경우만)
  useEffect(() => {
    if (!initialSharedId) return;

    // 본인이 저장한 결과 ID와 비교 - 같으면 본인 결과
    const myResultId = localStorage.getItem('result_saved_id');
    const isMyOwnResult = myResultId === initialSharedId;

    async function loadSharedResult() {
      // 본인 결과면 공유 결과로 취급하지 않음
      setIsSharedResult(!isMyOwnResult);

      const sharedResult = await fetchResultById(initialSharedId);

      if (sharedResult) {
        setResult(sharedResult);
        setResultId(initialSharedId);

        // 친구 점수 저장 (나중에 비교용) - 본인 결과가 아닌 경우만
        if (!isMyOwnResult) {
          saveFriendScore(sharedResult.score, sharedResult.grade);
          // 공유된 결과 조회 이벤트
          AnalyticsEvents.sharedResultView(sharedResult.score, sharedResult.grade);
        }
      }

      // 히스토리 로드 (본인 결과인 경우에도 표시)
      setHistory(getHistory());

      // 로딩 해제 후 애니메이션 시작
      setIsLoading(false);
      setTimeout(() => setShowScore(true), 300);
      setTimeout(() => setShowGrade(true), 1500);

      AnalyticsEvents.viewResultPage();
    }

    loadSharedResult();
  }, [initialSharedId, setResult]);

  // 새 결과 계산 (처음 마운트 시 URL에 id가 없었던 경우)
  useEffect(() => {
    if (initialSharedId) return; // 공유 링크인 경우 스킵

    setIsLoading(true);

    const safeIncome = income || '0';
    const safeExpenses = { ...expenses };
    Object.keys(safeExpenses).forEach((key) => {
      if (!safeExpenses[key]) safeExpenses[key] = '0';
    });

    const expensesWithIncome = { ...safeExpenses, income: safeIncome };
    const calculatedResult = calculateResult(expensesWithIncome, answers || {});
    setResult(calculatedResult);

    const timer = setTimeout(async () => {
      setIsLoading(false);
      setTimeout(() => setShowScore(true), 300);
      setTimeout(() => setShowGrade(true), 1500);

      AnalyticsEvents.viewResultPage();

      if (calculatedResult) {
        AnalyticsEvents.reachResult(calculatedResult.score, calculatedResult.grade);

        // 히스토리에 저장
        addToHistory(calculatedResult);
        setHistory(getHistory());

        // 이전 결과와 비교
        const comparison = compareWithPrevious(calculatedResult.score);
        setPreviousComparison(comparison);

        // 친구 점수와 비교 (공유 링크로 들어온 적 있으면)
        const friendScore = getFriendScore();
        if (friendScore) {
          setFriendComparison({
            ...friendScore,
            diff: calculatedResult.score - friendScore.score,
          });
          clearFriendScore(); // 비교 후 삭제
        }

        // Supabase에 저장하고 ID 받아오기
        const savedId = await saveResultToServer(calculatedResult);
        if (savedId) {
          setResultId(savedId);
          // URL에 id 추가 (히스토리 교체)
          setSearchParams({ id: savedId }, { replace: true });
        } else {
          // 저장 실패 시 명확한 안내
          showToast('일시적인 오류로 링크 공유가 제한됩니다. 이미지 저장은 가능합니다.');
        }
      }
    }, LOADING_DURATION);

    return () => clearTimeout(timer);
  }, [income, expenses, answers, setResult, initialSharedId, setSearchParams]);

  const handleRestartClick = () => {
    // 공유 링크 방문자는 바로 시작 페이지로 이동 (이미 CTA에서 충분히 안내함)
    if (isSharedResult) {
      AnalyticsEvents.sharedResultToStart(result?.score, result?.grade);
      AnalyticsEvents.restartDiagnosis();
      window.location.href = '/';
      return;
    }
    // 본인 재시작은 모달로 확인
    setShowRestartModal(true);
  };

  const handleRestartConfirm = () => {
    AnalyticsEvents.restartDiagnosis();
    localStorage.removeItem('result_saved_id');
    reset();
    setCurrentStep(0);
    window.location.href = '/';
  };

  const handleRestartCancel = () => {
    setShowRestartModal(false);
  };

  // 상세 분석 섹션으로 스크롤 + 웨이브 애니메이션
  const handleScrollToDetails = () => {
    const firstDetails = detailsRefs.current[0];
    if (firstDetails) {
      firstDetails.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // 스크롤 완료 후 웨이브 애니메이션
      setTimeout(() => {
        detailsRefs.current.forEach((el, index) => {
          if (el) {
            setTimeout(() => {
              el.classList.add('animate-details-pulse');
              setTimeout(() => {
                el.classList.remove('animate-details-pulse');
              }, 1400);
            }, index * 250);
          }
        });
      }, 300);
    }
  };

  const handleShare = async () => {
    const shareUrl = resultId
      ? `${window.location.origin}/result?id=${resultId}`
      : window.location.href;

    const shareData = {
      title: '독립점수 진단 결과',
      text: '독립 준비 상태를 분석해보세요.',
      url: shareUrl,
    };

    // Web Share API 지원 시 네이티브 공유
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        AnalyticsEvents.share('link', result?.score, result?.grade);
      } catch (err) {
        // 사용자가 공유 취소한 경우 무시
        if (err.name !== 'AbortError') {
          console.warn('Share failed:', err);
        }
      }
    } else {
      // 미지원 시 URL만 복사
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('링크가 복사되었습니다');
        AnalyticsEvents.share('link', result?.score, result?.grade);
      } catch {
        showToast('공유하기에 실패했습니다');
        AnalyticsEvents.shareFail('link', 'clipboard_error');
      }
    }
  };

  const handleKakaoShare = async () => {
    const shareUrl = resultId
      ? `${window.location.origin}/result?id=${resultId}`
      : window.location.href;

    // Kakao SDK 로드 확인
    if (!window.Kakao) {
      console.error('Kakao SDK not loaded');
      // 링크 복사로 대체하고 사용자에게 알림
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('카카오톡을 사용할 수 없어 링크가 복사되었습니다');
      } catch {
        showToast('공유 링크를 복사할 수 없습니다');
      }
      return;
    }

    try {
      if (!window.Kakao.isInitialized()) {
        const kakaoKey = import.meta.env.VITE_KAKAO_KEY;
        if (!kakaoKey) {
          console.error('VITE_KAKAO_KEY is missing');
          await navigator.clipboard.writeText(shareUrl);
          showToast('카카오톡을 사용할 수 없어 링크가 복사되었습니다');
          return;
        }
        window.Kakao.init(kakaoKey);
      }

      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: '독립점수 진단 결과',
          description: `${result?.score}점 · ${result?.grade} 등급 - 재무 자립 가능성 분석 리포트`,
          imageUrl: 'https://canilivealone.com/og-image.png',
          link: {
            mobileWebUrl: shareUrl,
            webUrl: shareUrl,
          },
        },
        buttons: [
          {
            title: '결과 확인하기',
            link: {
              mobileWebUrl: shareUrl,
              webUrl: shareUrl,
            },
          },
          {
            title: '무료 진단받기',
            link: {
              mobileWebUrl: window.location.origin,
              webUrl: window.location.origin,
            },
          },
        ],
      });

      AnalyticsEvents.share('kakao', result?.score, result?.grade);
      AnalyticsEvents.shareKakao(result?.score, result?.grade);
    } catch (error) {
      console.error('Kakao share error:', error);
      AnalyticsEvents.shareFail('kakao', 'sdk_error');
      // 에러 시 링크 복사로 대체
      try {
        await navigator.clipboard.writeText(shareUrl);
        showToast('카카오톡 공유 실패 - 링크가 복사되었습니다');
      } catch {
        showToast('공유에 실패했습니다');
      }
    }
  };

  // 프리미엄 리포트 이메일 제출
  const handlePremiumSubmit = async (email) => {
    setIsPremiumLoading(true);
    try {
      // Supabase에 저장
      const { error } = await supabase
        .from('premium_requests')
        .insert({
          email: email,
          result_id: resultId,
          score: result?.score,
          grade: result?.grade,
          status: 'pending',
        });

      if (error) {
        console.error('Premium request save error:', error);
        alert('저장에 실패했습니다. 다시 시도해주세요.');
        setIsPremiumLoading(false);
        return false;
      }

      // GA 이벤트
      const topRisks = getTopRiskFactors(result);
      const riskLevel = topRisks.length > 0 && topRisks.some(r => r.severity === 'critical') ? 'high' : topRisks.length > 0 ? 'medium' : 'low';
      AnalyticsEvents.premiumPurchaseClick(result?.score, result?.grade, riskLevel);

      setIsPremiumLoading(false);
      return true;
    } catch (err) {
      console.error('Premium request error:', err);
      alert('오류가 발생했습니다. 다시 시도해주세요.');
      setIsPremiumLoading(false);
      return false;
    }
  };

  const handleSaveImage = async () => {
    if (!shareCardRef.current || isImageSaving) return;

    setIsImageSaving(true);
    showToast('이미지를 생성하고 있습니다...');

    const el = shareCardRef.current;

    try {
      el.style.visibility = 'visible';

      await new Promise((resolve) => requestAnimationFrame(resolve));

      const dataUrl = await domToPng(el, {
        width: 1080,
        height: 1080,
        scale: 1,
        quality: 1,
      });

      el.style.visibility = 'hidden';

      const link = document.createElement('a');
      link.download = 'independent-score.png';
      link.href = dataUrl;
      link.click();

      showToast('이미지가 저장되었습니다');
      AnalyticsEvents.share('image', result?.score, result?.grade);
      AnalyticsEvents.saveImage();
    } catch (err) {
      console.error('Image save error:', err);
      el.style.visibility = 'hidden';
      showToast('이미지 저장에 실패했습니다');
      AnalyticsEvents.shareFail('image', 'generation_error');
    } finally {
      setIsImageSaving(false);
    }
  };

  // 재시도 핸들러
  const handleRetry = () => {
    window.location.reload();
  };

  if (isLoading) return <AnalysisLoading onRetry={handleRetry} />;

  if (!result) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center px-6">
          <p className="text-neutral-500 mb-2 text-[15px]">결과를 불러올 수 없습니다.</p>
          <p className="text-neutral-500 mb-6 text-[13px]">링크가 만료되었거나 일시적인 오류입니다.</p>
          <button
            onClick={() => window.location.href = '/'}
            className="btn-primary w-full py-4"
            aria-label="새로운 진단 시작하기"
          >
            새로운 진단 시작하기
          </button>
        </div>
      </div>
    );
  }

  const gradeStyle = GRADE_STYLES[result.grade] || {};

  return (
    <div className="min-h-dvh result-gradient-bg print:bg-white relative overflow-hidden">
      {/* 데스크톱: 사이드 장식 - 왼쪽 */}
      <div className="hidden lg:block fixed -left-64 xl:-left-48 top-1/2 -translate-y-1/2 pointer-events-none">
        <div className="w-[32rem] h-[32rem] rounded-full border-2 border-white/[0.12]" />
      </div>
      <div className="hidden lg:block fixed -left-80 xl:-left-64 top-[20%] pointer-events-none">
        <div className="w-[40rem] h-[40rem] rounded-full border border-white/[0.08]" />
      </div>

      {/* 데스크톱: 사이드 장식 - 오른쪽 */}
      <div className="hidden lg:block fixed -right-64 xl:-right-48 top-[35%] pointer-events-none">
        <div className="w-[32rem] h-[32rem] rounded-full border-2 border-white/[0.12]" />
      </div>
      <div className="hidden lg:block fixed -right-96 xl:-right-80 top-[55%] pointer-events-none">
        <div className="w-[48rem] h-[48rem] rounded-full border border-white/[0.08]" />
      </div>

      <ShareCard result={result} cardRef={shareCardRef} />

      {/* 다시하기 확인 모달 */}
      <RestartConfirmModal
        isOpen={showRestartModal}
        onConfirm={handleRestartConfirm}
        onCancel={handleRestartCancel}
        isSharedResult={isSharedResult}
        friendScore={result?.score}
      />

      {/* 프리미엄 리포트 이메일 모달 */}
      <PremiumEmailModal
        isOpen={showPremiumModal}
        onClose={() => setShowPremiumModal(false)}
        onSubmit={handlePremiumSubmit}
        isLoading={isPremiumLoading}
        score={result?.score}
        grade={result?.grade}
      />

      {/* 토스트 */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white text-[14px] rounded-full shadow-lg animate-fade-in print:hidden" role="alert">
          {toast.message}
        </div>
      )}

      {/* 데스크톱: 상단 네비게이션 */}
      <nav className="hidden lg:flex items-center justify-between px-8 xl:px-16 py-4 bg-[#0a2e22]/80 backdrop-blur-sm border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/15 rounded-[8px] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 100 100">
              <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
              <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
              <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
            </svg>
          </div>
          <span className="text-white font-bold text-[17px] tracking-tight">독립점수</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[14px] text-white/60">분석 완료</span>
          <span className="w-2 h-2 bg-[#6EE7B7] rounded-full" />
        </div>
      </nav>

      {/* 모바일: 그린 헤더 영역 */}
      <div
        className="lg:hidden text-center pt-5 pb-14 px-4"
      >
        <div className="w-7 h-7 bg-white/15 rounded-[7px] flex items-center justify-center mx-auto mb-2">
          <svg width="14" height="14" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
            <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </div>
        <p className="text-[12px] text-white/50 tracking-[0.1em] uppercase">Analysis Complete</p>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-4 -mt-10 lg:mt-0 lg:px-8 xl:px-16 lg:py-8 pb-6">
        <div className="lg:max-w-5xl lg:mx-auto lg:grid lg:grid-cols-3 lg:gap-8">

          {/* 왼쪽: 점수 카드 (데스크톱 전용 사이드바) */}
          <div className="hidden lg:block lg:col-span-1 lg:sticky lg:top-8 space-y-5">
            {/* 점수 카드 */}
            <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
              <ScoreGauge score={result.score} showScore={showScore} />

              <div className="mt-5">
                <div className={`inline-flex items-center px-5 py-2 rounded-full ${gradeStyle.bg} ${showGrade ? 'animate-grade-reveal' : 'opacity-0'}`}>
                  <span className={`${gradeStyle.text} font-bold text-[15px]`}>{result.grade}</span>
                </div>
                <p className="text-[20px] text-neutral-700 mt-3 font-semibold leading-snug">
                  {GRADE_VERDICT[result.grade]}
                </p>
              </div>

              {/* 적자 경고 */}
              {result.details?.riskFlags?.some(flag => flag.type === 'income_insufficient') && (
                <div className="bg-red-50 rounded-xl p-4 mt-6 text-left">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[16px] font-bold text-red-700">
                        매달 {Math.abs((result.income || 0) - (result.originalExpenses || 0)).toLocaleString()}만원 적자
                      </p>
                      <p className="text-[13px] text-red-500 mt-0.5">독립 전 지출 조정이 필요해요</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 상세 분석 버튼 */}
              <button
                onClick={handleScrollToDetails}
                className="w-full h-14 mt-6 rounded-xl bg-[#0F3D2E] text-white font-bold text-[16px] flex items-center justify-center gap-2 hover:bg-[#0a2e22] transition-colors active:scale-[0.98]"
              >
                <span>상세 분석 보기</span>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>
            </div>

            {/* 부가 정보 바 */}
            <div className="flex items-center justify-between px-2 print:hidden">
              <span className="text-[13px] text-neutral-400">
                <span className="font-semibold tabular-nums">{totalCount !== null ? totalCount.toLocaleString() : '...'}</span>명이 진단했어요
              </span>
              {isSharedResult ? (
                <button
                  onClick={handleRestartClick}
                  className="text-[13px] text-white font-semibold hover:underline"
                >
                  나도 진단받기 →
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleKakaoShare}
                    className="flex items-center gap-1.5 text-[13px] text-neutral-500 font-medium hover:text-neutral-700 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                    </svg>
                    공유
                  </button>
                  <button
                    onClick={handleSaveImage}
                    disabled={isImageSaving}
                    className="flex items-center gap-1.5 text-[13px] text-neutral-500 font-medium hover:text-neutral-700 transition-colors disabled:opacity-50"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    저장
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽: 상세 분석 */}
          <div className="lg:col-span-2 space-y-5 mt-4 lg:mt-0">

        {/* ========== 모바일 히어로 섹션 ========== */}
        <div className="lg:hidden bg-white rounded-3xl shadow-xl p-5 sm:p-7 text-center">
          {/* 점수 게이지 - 히어로 */}
          <ScoreGauge score={result.score} showScore={showScore} />

          {/* 등급 + 평가 */}
          <div className="mt-4 sm:mt-5">
            <div className={`inline-flex items-center px-4 py-1.5 rounded-full ${gradeStyle.bg} ${showGrade ? 'animate-grade-reveal' : 'opacity-0'}`}>
              <span className={`${gradeStyle.text} font-bold text-[14px]`}>{result.grade}</span>
            </div>
            <p className="text-[17px] sm:text-[19px] text-neutral-700 mt-2.5 font-semibold leading-snug">
              {GRADE_VERDICT[result.grade]}
            </p>
          </div>

          {/* 적자 경고 */}
          {result.details?.riskFlags?.some(flag => flag.type === 'income_insufficient') && (
            <div className="bg-red-50 rounded-xl p-3.5 mt-5 text-left">
              <div className="flex items-center gap-3">
                <div className="flex-shrink-0 w-9 h-9 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4.5 h-4.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-[14px] font-bold text-red-700">
                    매달 {Math.abs((result.income || 0) - (result.originalExpenses || 0)).toLocaleString()}만원 적자
                  </p>
                  <p className="text-[12px] text-red-500 mt-0.5">독립 전 지출 조정이 필요해요</p>
                </div>
              </div>
            </div>
          )}

          {/* 상세 분석 버튼 - 프라이머리 */}
          <button
            onClick={handleScrollToDetails}
            className="w-full h-12 mt-5 rounded-xl bg-[#0F3D2E] text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-[#0a2e22] transition-colors active:scale-[0.98]"
          >
            <span>상세 분석 보기</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>

        {/* 부가 정보 바 - 모바일 */}
        <div className="lg:hidden flex items-center justify-between px-2 print:hidden">
          <span className="text-responsive-xs text-white/50">
            <span className="font-semibold tabular-nums">{totalCount !== null ? totalCount.toLocaleString() : '...'}</span>명이 진단했어요
          </span>
          {isSharedResult ? (
            <button
              onClick={handleRestartClick}
              className="text-responsive-xs text-white font-semibold hover:underline"
            >
              나도 진단받기 →
            </button>
          ) : (
            <div className="flex items-center gap-3 sm:gap-4">
              <button
                onClick={handleKakaoShare}
                className="flex items-center gap-1.5 text-responsive-xs text-white/70 font-medium hover:text-white transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
                공유
              </button>
              <button
                onClick={handleSaveImage}
                disabled={isImageSaving}
                className="flex items-center gap-1.5 text-responsive-xs text-white/70 font-medium hover:text-white transition-colors disabled:opacity-50"
              >
                <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                저장
              </button>
            </div>
          )}
        </div>

      {/* 재정 요약 - 간소화 */}
      <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5">
        <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
          <div>
            <p className="text-responsive-xs sm:text-[13px] text-neutral-500 font-medium">월 수입</p>
            <p className="text-responsive-xl sm:text-[22px] font-bold text-neutral-800 tabular-nums mt-1">
              {(result.income || 0).toLocaleString()}<span className="text-responsive-sm sm:text-[14px] font-normal text-neutral-400 ml-0.5">만</span>
            </p>
          </div>
          <div>
            <p className="text-responsive-xs sm:text-[13px] text-neutral-500 font-medium">월 지출</p>
            <p className="text-responsive-xl sm:text-[22px] font-bold text-neutral-800 tabular-nums mt-1">
              {(result.originalExpenses || 0).toLocaleString()}<span className="text-responsive-sm sm:text-[14px] font-normal text-neutral-400 ml-0.5">만</span>
            </p>
          </div>
          <div>
            <p className="text-responsive-xs sm:text-[13px] text-neutral-500 font-medium">잔액</p>
            <p className={`text-responsive-xl sm:text-[22px] font-bold tabular-nums mt-1 ${
              (result.income || 0) - (result.originalExpenses || 0) >= 0 ? 'text-[#0F3D2E]' : 'text-red-500'
            }`}>
              {((result.income || 0) - (result.originalExpenses || 0)).toLocaleString()}<span className="text-responsive-sm sm:text-[14px] font-normal text-neutral-400 ml-0.5">만</span>
            </p>
          </div>
        </div>
      </div>

      {/* 카테고리별 점수 */}
      <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5">
        <p className="text-responsive-md text-neutral-800 font-bold mb-3.5 sm:mb-4">카테고리별 점수</p>
        <div className="space-y-2.5 sm:space-y-3">
          {result.categoryScores && CATEGORY_ORDER.map((key, index) => {
            const score = result.categoryScores[key];
            return (
              <div key={key} className="flex items-center gap-2.5 sm:gap-3">
                <span className="text-responsive-base text-neutral-600 w-14 sm:w-16 flex-shrink-0 font-medium">
                  {CATEGORY_LABELS[key]}
                </span>
                <div className="flex-1 h-2 sm:h-2.5 bg-neutral-200/70 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full animate-bar-fill ${
                      score >= 70 ? 'bg-[#0F3D2E]' :
                      score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{
                      width: `${score}%`,
                      animationDelay: `${0.3 + index * 0.1}s`
                    }}
                  />
                </div>
                <span className={`text-responsive-md font-bold w-7 sm:w-8 text-right tabular-nums ${
                  score >= 70 ? 'text-[#0F3D2E]' :
                  score >= 50 ? 'text-amber-500' : 'text-red-500'
                }`}>
                  {score}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 상세 분석 영역들 - 카드 간 여백 확보 */}
      <div className="space-y-4">
        {/* 주요 리스크 요인 블록 (상위 2개) - 상세 개선 분석 바로 위 */}
        {(() => {
          const topRisks = getTopRiskFactors(result);
          if (topRisks.length === 0) return null;
          return (
            <div className="bg-neutral-50 rounded-2xl p-4 sm:p-5">
              <p className="text-responsive-md text-neutral-800 font-bold mb-3.5 sm:mb-4">주요 리스크 요인</p>
              <div className="flex gap-2.5 sm:gap-3">
                {topRisks.map((risk, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 p-3.5 sm:p-4 rounded-xl ${
                      risk.severity === 'critical' ? 'bg-red-50 border border-red-100' : 'bg-amber-50 border border-amber-100'
                    }`}
                  >
                    <p className={`text-responsive-3xl font-bold tabular-nums ${
                      risk.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                    }`}>
                      {risk.value}
                    </p>
                    <p className="text-responsive-base text-neutral-500 mt-0.5 sm:mt-1">{risk.label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 상세 개선 분석 */}
        {result.categoryScores && getAllCategoryAdvice(result.categoryScores).length > 0 && (
          <details ref={el => detailsRefs.current[0] = el} className="bg-white rounded-2xl shadow-md group">
            <summary className="p-4 sm:p-5 cursor-pointer flex items-center justify-between list-none">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-responsive-lg font-bold text-neutral-800">상세 개선 분석</span>
                  <span className="text-responsive-sm bg-amber-100 text-amber-600 px-2 sm:px-2.5 py-0.5 rounded-full font-semibold">
                    {getAllCategoryAdvice(result.categoryScores).length}개
                  </span>
                </div>
                <p className="text-responsive-base text-neutral-500 mt-1">카테고리별 구체적인 개선 방안</p>
              </div>
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-neutral-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 space-y-2.5 sm:space-y-3 border-t border-neutral-100 pt-3.5 sm:pt-4">
              {getAllCategoryAdvice(result.categoryScores).map((advice) => (
                <div key={advice.categoryId} className="p-3.5 sm:p-4 bg-neutral-50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-5.5 h-5.5 sm:w-6 sm:h-6 rounded text-responsive-xs font-bold ${
                      advice.level === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {advice.level === 'critical' ? '!' : '△'}
                    </span>
                    <span className="text-responsive-md font-semibold text-neutral-800">{advice.label}</span>
                    <span className={`text-responsive-md font-semibold tabular-nums ${
                      advice.level === 'critical' ? 'text-red-500' : 'text-amber-500'
                    }`}>{advice.score}점</span>
                  </div>
                  <p className="text-responsive-base text-neutral-600 leading-relaxed">{advice.diagnosis}</p>
                  <ul className="space-y-1.5">
                    {advice.actions.slice(0, 2).map((action, idx) => (
                      <li key={idx} className="text-responsive-base text-neutral-500 flex items-start gap-1.5">
                        <span className="text-[#0F3D2E]">→</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* 주거 유형별 분석 */}
        {result.housingAnalysis && (
          <details ref={el => detailsRefs.current[1] = el} className="bg-white rounded-2xl shadow-md group">
            <summary className="p-4 sm:p-5 cursor-pointer flex items-center justify-between list-none">
              <div className="flex-1">
                <span className="text-responsive-lg font-bold text-neutral-800">{result.housingAnalysis.title}</span>
                <p className="text-responsive-base text-neutral-500 mt-1">선택한 주거 형태 맞춤 전략</p>
              </div>
              <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-neutral-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 sm:px-5 pb-4 sm:pb-5 border-t border-neutral-100 pt-3.5 sm:pt-4">
              <p className="text-responsive-base text-neutral-600 leading-relaxed mb-3.5 sm:mb-4">{result.housingAnalysis.summary}</p>
              <div className="space-y-2">
                {result.housingAnalysis.strategies.slice(0, 3).map((strategy, idx) => (
                  <p key={idx} className="text-responsive-base text-neutral-500 flex items-start gap-1.5">
                    <span className="text-[#0F3D2E]">→</span>
                    <span>{strategy}</span>
                  </p>
                ))}
              </div>
            </div>
          </details>
        )}

        {/* 점수 산정 방식 설명 - 주거 유형별 분석 바로 아래 배치 */}
        <ScoreMethodology ref={el => detailsRefs.current[2] = el} />

      </div>

      {/* 9. 친구 점수 비교 (공유 링크로 들어온 후 직접 진단한 경우) */}
      {friendComparison && !isSharedResult && (
        <div className="bg-gradient-to-br from-[#0F3D2E] via-[#14493a] to-[#1a5c45] rounded-2xl sm:rounded-3xl p-4 sm:p-5 text-white overflow-hidden relative shadow-lg">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-28 sm:w-36 h-28 sm:h-36 bg-white/[0.06] rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-20 sm:w-28 h-20 sm:h-28 bg-white/[0.04] rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* 헤더 */}
          <div className="flex items-center gap-2.5 mb-4 sm:mb-5 relative">
            <div className="w-8 h-8 sm:w-9 sm:h-9 bg-white/15 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 sm:w-[18px] sm:h-[18px] text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-responsive-md sm:text-[16px] font-bold text-white">친구와 점수 비교</p>
          </div>

          {/* 비교 카드 */}
          <div className="flex items-stretch gap-2.5 sm:gap-4 relative">
            {/* 친구 */}
            <div className="flex-1 bg-white/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center backdrop-blur-sm border border-white/[0.08]">
              <p className="text-responsive-xs sm:text-[13px] text-white/60 mb-1">친구</p>
              <p className="text-[28px] sm:text-[34px] font-bold tabular-nums leading-none">{friendComparison.score}</p>
              <p className="text-responsive-sm sm:text-[14px] text-white/70 mt-1.5">{friendComparison.grade}</p>
            </div>

            {/* VS 및 차이 */}
            <div className="flex flex-col items-center justify-center px-1 sm:px-2">
              <div className={`w-11 h-11 sm:w-14 sm:h-14 rounded-full flex items-center justify-center shadow-lg ${
                friendComparison.diff > 0 ? 'bg-emerald-400/25 ring-2 ring-emerald-400/30' : friendComparison.diff < 0 ? 'bg-red-400/25 ring-2 ring-red-400/30' : 'bg-white/20'
              }`}>
                <span className={`text-responsive-sm sm:text-[16px] font-bold ${
                  friendComparison.diff > 0 ? 'text-emerald-300' : friendComparison.diff < 0 ? 'text-red-300' : 'text-white/80'
                }`}>
                  {friendComparison.diff > 0 ? '+' : ''}{friendComparison.diff}
                </span>
              </div>
              <p className="text-[11px] sm:text-[12px] text-white/50 mt-1.5 font-medium">
                {friendComparison.diff > 0 ? '승리!' : friendComparison.diff < 0 ? '아쉬워요' : '무승부'}
              </p>
            </div>

            {/* 나 */}
            <div className={`flex-1 rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center relative ${
              friendComparison.diff >= 0 ? 'bg-white/20 ring-2 ring-white/40 shadow-lg' : 'bg-white/10 border border-white/[0.08]'
            }`}>
              <p className="text-responsive-xs sm:text-[13px] text-white/60 mb-1">나</p>
              <p className="text-[28px] sm:text-[34px] font-bold tabular-nums leading-none">{result.score}</p>
              <p className="text-responsive-sm sm:text-[14px] text-white/70 mt-1.5">{result.grade}</p>
              {friendComparison.diff > 0 && (
                <div className="absolute -top-2 -right-2 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white/20">
                  <span className="text-[14px]">👑</span>
                </div>
              )}
            </div>
          </div>

          {/* 공유 유도 */}
          <button
            onClick={handleKakaoShare}
            className="w-full mt-4 sm:mt-5 h-11 sm:h-12 rounded-xl bg-white/15 hover:bg-white/25 text-white text-responsive-sm sm:text-[15px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 border border-white/10"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
            </svg>
            다른 친구에게도 공유하기
          </button>
        </div>
      )}

      {/* 10. 진단 기록 (이전 진단 대비 + 히스토리 통합) */}
      {history.length > 1 && !isSharedResult && (
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-md ring-1 ring-black/[0.04] overflow-hidden">
          {/* 이전 진단 대비 - 상단 요약 */}
          {previousComparison && (
            <div className={`p-4 sm:p-5 ${
              previousComparison.improved ? 'bg-gradient-to-r from-emerald-50 to-white' :
              previousComparison.diff < 0 ? 'bg-gradient-to-r from-red-50 to-white' :
              'bg-gradient-to-r from-neutral-50 to-white'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center ${
                    previousComparison.improved ? 'bg-emerald-100' : previousComparison.diff < 0 ? 'bg-red-100' : 'bg-neutral-100'
                  }`}>
                    {previousComparison.improved ? (
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    ) : previousComparison.diff < 0 ? (
                      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 12h14" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-responsive-sm sm:text-[15px] font-semibold text-neutral-800 mb-0.5">
                      이전 진단 대비
                    </p>
                    <p className="text-responsive-xs sm:text-[14px] text-neutral-500">
                      {new Date(previousComparison.previousDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} ({previousComparison.previousScore}점)
                    </p>
                  </div>
                </div>
                <div className={`text-right ${previousComparison.improved ? 'text-emerald-600' : previousComparison.diff < 0 ? 'text-red-500' : 'text-neutral-500'}`}>
                  <p className="text-[22px] sm:text-[26px] font-bold tabular-nums leading-tight">
                    {previousComparison.diff > 0 ? '+' : ''}{previousComparison.diff}점
                  </p>
                  <p className="text-responsive-xs sm:text-[14px] font-medium">
                    {previousComparison.improved ? '점수 상승' : previousComparison.diff < 0 ? '점수 하락' : '변동 없음'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 진단 기록 리스트 */}
          <div className="p-4 sm:p-5 pt-3 sm:pt-4">
            <div className="flex items-center gap-2.5 mb-3 sm:mb-4">
              <div className="w-7 h-7 sm:w-8 sm:h-8 bg-neutral-100 rounded-lg flex items-center justify-center">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-responsive-md sm:text-[16px] font-bold text-neutral-800">
                진단 기록
              </h3>
            </div>
            <div className="space-y-0">
              {history.slice(0, 5).map((entry, index) => {
                const isLatest = index === 0;
                const prevEntry = history[index + 1];
                const diff = prevEntry ? entry.score - prevEntry.score : null;

                const handleDelete = (e) => {
                  e.stopPropagation();
                  const updated = deleteFromHistory(entry.id);
                  setHistory(updated);
                };

                return (
                  <div
                    key={entry.id}
                    className={`group flex items-center justify-between py-2.5 sm:py-3 ${!isLatest ? 'border-t border-neutral-100' : ''}`}
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      {isLatest && (
                        <span className="px-1.5 sm:px-2 py-0.5 bg-[#0F3D2E] text-white text-[10px] sm:text-[11px] font-bold rounded tracking-wide">
                          NOW
                        </span>
                      )}
                      <span className={`text-responsive-xs sm:text-[14px] ${isLatest ? 'text-neutral-700 font-medium' : 'text-neutral-500'}`}>
                        {new Date(entry.date).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {diff !== null && (
                        <span className={`text-responsive-xs sm:text-[14px] font-semibold tabular-nums ${diff > 0 ? 'text-emerald-600' : diff < 0 ? 'text-red-500' : 'text-neutral-400'}`}>
                          {diff > 0 ? '+' : ''}{diff}
                        </span>
                      )}
                      <span className={`text-responsive-sm sm:text-[15px] font-bold tabular-nums ${isLatest ? 'text-[#0F3D2E]' : 'text-neutral-600'}`}>
                        {entry.score}점
                      </span>
                      <span className={`text-[10px] sm:text-[12px] px-1.5 sm:px-2 py-0.5 rounded-full font-semibold ${
                        entry.grade === '매우 안정' || entry.grade === '안정'
                          ? 'bg-emerald-100 text-emerald-700'
                          : entry.grade === '주의'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {entry.grade}
                      </span>
                      {!isLatest && (
                        <button
                          onClick={handleDelete}
                          className="ml-1 w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-neutral-300 hover:text-neutral-500 hover:bg-neutral-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-150"
                          aria-label="기록 삭제"
                        >
                          <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            {history.length > 5 && (
              <p className="text-responsive-xs sm:text-[13px] text-neutral-400 text-center mt-2 pt-2 border-t border-neutral-100">
                최근 5회 기록만 표시됩니다
              </p>
            )}
          </div>
        </div>
      )}

      {/* 점수 상승 설계 리포트 - 본인 결과일 때만 표시 (모든 무료 콘텐츠 후에 배치) */}
      {!isSharedResult && (() => {
        const topRisks = getTopRiskFactors(result);
        const riskLevel = topRisks.length > 0 && topRisks.some(r => r.severity === 'critical') ? 'high' : topRisks.length > 0 ? 'medium' : 'low';
        const preview = generatePremiumPreview({
          result,
          expenses: expenses || {},
          income: income || result?.income || 0,
        });

        return (
          <div
            ref={(el) => {
              premiumCardRef.current = el;
              // GA 이벤트: 프리미엄 미리보기 노출 (한 번만 실행)
              if (el && !el.dataset.tracked) {
                el.dataset.tracked = 'true';
                AnalyticsEvents.premiumPreviewView(result.score, result.grade, riskLevel);
              }
            }}
          >
            <PremiumScoreCard
              result={result}
              preview={preview}
              isVisible={isPremiumCardVisible}
              onPreviewClick={() => {
                AnalyticsEvents.premiumCtaClick(result.score, result.grade, riskLevel);
                setShowReportPreview(true);
              }}
            />
            <ReportPreviewModal
              isOpen={showReportPreview}
              onClose={() => setShowReportPreview(false)}
              result={result}
              preview={preview}
              onSubmit={handlePremiumSubmit}
            />
          </div>
        );
      })()}

      {/* 진단받기 CTA - 공유 링크로 들어온 경우 (모바일만, 데스크톱은 사이드바에 있음) */}
      {isSharedResult && (
        <div className="lg:hidden bg-gradient-to-br from-[#0F3D2E] to-[#1a5c45] rounded-2xl p-5 print:hidden">
          {/* 점수 비교 시각화 */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-center">
              <p className="text-white/60 text-responsive-xs mb-1">친구</p>
              <p className="text-white font-bold text-[22px] tabular-nums">{result?.score}점</p>
            </div>
            <div className="text-white/40 text-responsive-lg font-light">vs</div>
            <div className="text-center">
              <p className="text-amber-300/80 text-responsive-xs mb-1">나</p>
              <p className="text-amber-300 font-bold text-[22px]">?점</p>
            </div>
          </div>

          <p className="text-white/70 text-responsive-sm text-center mb-4">
            2분 · 무료 · 회원가입 없음
          </p>

          <button
            onClick={handleRestartClick}
            className="w-full h-12 rounded-xl bg-white text-[#0F3D2E] text-responsive-md font-bold hover:bg-neutral-50 transition-colors shadow-lg"
          >
            나도 진단받기
          </button>
        </div>
      )}

      {/* 다시하기 버튼 - 본인 결과일 때, 모바일에서만 표시 (데스크톱은 사이드바에 있음) */}
      {!isSharedResult && (
        <div className="lg:hidden text-center py-4 print:hidden">
          <button
            onClick={handleRestartClick}
            className="text-[14px] text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="진단을 처음부터 다시 시작"
          >
            수입·지출이 바뀌었나요? <span className="underline">다시 진단받기</span>
          </button>
        </div>
      )}

          </div>{/* 오른쪽 컬럼 끝 */}
        </div>{/* 그리드 끝 */}
      </div>{/* 메인 콘텐츠 끝 */}

      {/* 데스크톱: 하단 푸터 */}
      <footer className="hidden lg:block px-8 xl:px-16 py-6 border-t border-neutral-200 bg-white mt-8">
        <div className="flex items-center justify-between text-neutral-400 text-[14px]">
          <p>© 2026 독립점수 ver2. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="mailto:canilivealone.help@gmail.com" className="hover:text-neutral-600 transition-colors">canilivealone.help@gmail.com</a>
            <a href="/privacy" className="hover:text-neutral-600 transition-colors">개인정보처리방침</a>
            <a href="/terms" className="hover:text-neutral-600 transition-colors">이용약관</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
