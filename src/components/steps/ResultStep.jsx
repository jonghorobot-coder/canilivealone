import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { domToPng } from 'modern-screenshot';
import { useSurvey } from '../../hooks/useSurvey';
import { calculateResult } from '../../utils/calculate';
import { AnalyticsEvents } from '../../utils/analytics';
import { saveResultToServer, fetchResultById } from '../../utils/saveResult';
import { supabase } from '../../lib/supabase';
import { getAllCategoryAdvice } from '../../data/categoryAdvice';

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
  '매우 안정': '매우 안정적인 독립이 가능합니다',
  '안정': '안정적인 독립이 가능합니다',
  '주의': '독립 전 준비가 필요합니다',
  '위험': '재정 개선이 필요합니다',
  '매우 위험': '독립을 권장하지 않습니다',
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

function useToast() {
  const [toast, setToast] = useState({ show: false, message: '' });

  const showToast = (message, duration = 2000) => {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: '' }), duration);
  };

  return { toast, showToast };
}

function AnalysisLoading() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-12 h-12 mx-auto mb-6">
          <div className="absolute inset-0 border-2 border-gray-100 rounded-full" />
          <div className="absolute inset-0 border-2 border-[#0F3D2E] border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-[18px] font-bold text-neutral-800 mb-3 animate-fade-in" key={messageIndex}>
          {LOADING_MESSAGES[messageIndex]}
        </p>
        <p className="text-[13px] text-neutral-500">
          입력하신 정보를 분석하고 있습니다
        </p>
      </div>
    </div>
  );
}

function ScoreGauge({ score, showScore, skipAnimation = false }) {
  const animatedScore = useAnimatedCount(score, 1000, showScore && !skipAnimation);
  const displayScore = skipAnimation ? score : animatedScore;
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = (displayScore / 100) * circumference;
  const offset = circumference - progress;

  const getScoreColor = (s) => {
    if (s >= 70) return 'emerald'; // blue in CSS
    if (s >= 50) return 'amber';
    return 'rose';
  };

  const colorClass = getScoreColor(displayScore);

  return (
    <div className="relative w-[200px] h-[200px] mx-auto">
      <svg className="w-full h-full" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={radius} className="score-ring-bg" />
        <circle
          cx="100"
          cy="100"
          r={radius}
          className={`score-ring-progress ${colorClass}`}
          strokeDasharray={circumference}
          strokeDashoffset={showScore ? offset : circumference}
          style={{ transition: skipAnimation ? 'none' : 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[48px] font-bold tabular-nums text-neutral-800 ${showScore || skipAnimation ? '' : 'opacity-0'}`}>
          {displayScore}
        </span>
        <span className={`text-neutral-500 text-[13px] mt-1 ${showScore || skipAnimation ? '' : 'opacity-0'}`}>
          / 100점
        </span>
      </div>
    </div>
  );
}

function IndependenceIndex({ categoryScores, showScore, skipAnimation = false }) {
  const indices = [
    { label: '재정 안정성', key: ['housing', 'savings'] },
    { label: '지출 통제력', key: ['food', 'leisure', 'misc'] },
    { label: '비상 대응력', key: ['fixed', 'transport'] },
  ];

  const calculateIndexScore = (keys) => {
    if (!categoryScores) return 0;
    const scores = keys.map(k => categoryScores[k] || 0);
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getBarColor = (score) => {
    if (score >= 70) return 'emerald'; // blue in CSS
    if (score >= 50) return 'amber';
    return 'rose';
  };

  return (
    <div className="space-y-4">
      {indices.map((index, i) => {
        const score = calculateIndexScore(index.key);
        const colorClass = getBarColor(score);
        return (
          <div
            key={index.label}
            className={skipAnimation ? '' : 'animate-fade-in'}
            style={skipAnimation ? {} : { animationDelay: `${i * 0.1}s` }}
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[14px] font-medium text-neutral-600">{index.label}</span>
              <span className={`text-[14px] font-semibold tabular-nums ${
                colorClass === 'emerald' ? 'text-[#0F3D2E]' :
                colorClass === 'amber' ? 'text-amber-500' : 'text-red-500'
              }`}>{score}</span>
            </div>
            <div className="index-bar">
              <div
                className={`index-bar-fill ${colorClass}`}
                style={{
                  width: (showScore || skipAnimation) ? `${score}%` : '0%',
                  transition: skipAnimation ? 'none' : undefined,
                }}
              />
            </div>
          </div>
        );
      })}
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
            fontSize: '13px',
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
          나도 진단받기
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

export function ResultStep() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { income, expenses, answers, result, setResult, reset, setCurrentStep } = useSurvey();
  const { toast, showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showScore, setShowScore] = useState(false);
  const [showGrade, setShowGrade] = useState(false);
  const [isImageSaving, setIsImageSaving] = useState(false);
  const [totalCount, setTotalCount] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [isSharedResult, setIsSharedResult] = useState(false);
  const shareCardRef = useRef(null);

  const sharedId = searchParams.get('id');

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

  // 공유된 결과 조회 (id가 URL에 있는 경우)
  useEffect(() => {
    if (!sharedId) return;

    async function loadSharedResult() {
      setIsSharedResult(true);

      const sharedResult = await fetchResultById(sharedId);

      if (sharedResult) {
        setResult(sharedResult);
        setResultId(sharedId);
      }

      // 공유 링크: 로딩/애니메이션 스킵
      setIsLoading(false);
      setShowScore(true);
      setShowGrade(true);

      AnalyticsEvents.viewResultPage();
    }

    loadSharedResult();
  }, [sharedId, setResult]);

  // 새 결과 계산 (id가 URL에 없는 경우)
  useEffect(() => {
    if (sharedId) return; // 공유 링크인 경우 스킵

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

        // Supabase에 저장하고 ID 받아오기
        const savedId = await saveResultToServer(calculatedResult);
        if (savedId) {
          setResultId(savedId);
          // URL에 id 추가 (히스토리 교체)
          setSearchParams({ id: savedId }, { replace: true });
        } else {
          // 저장 실패 시 사용자에게 알림 (앱 동작은 유지)
          showToast('결과 저장에 실패했습니다. 링크 공유가 제한됩니다.');
        }
      }
    }, LOADING_DURATION);

    return () => clearTimeout(timer);
  }, [income, expenses, answers, setResult, sharedId, setSearchParams]);

  const handleRestart = () => {
    AnalyticsEvents.restartDiagnosis();
    localStorage.removeItem('result_saved_id');
    reset();
    setCurrentStep(0);
    // URL에서 id 제거하고 홈으로
    window.location.href = '/';
  };

  const handleShare = async () => {
    const shareUrl = resultId
      ? `${window.location.origin}/result?id=${resultId}`
      : window.location.href;

    const shareData = {
      title: '독립점수 진단 결과',
      text: '나의 독립 진단 분석 리포트입니다.',
      url: shareUrl,
    };

    // Web Share API 지원 시 네이티브 공유
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        AnalyticsEvents.copyLink();
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
        AnalyticsEvents.copyLink();
      } catch (err) {
        showToast('공유하기에 실패했습니다');
      }
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
      AnalyticsEvents.saveImage();
    } catch (err) {
      console.error('Image save error:', err);
      el.style.visibility = 'hidden';
      showToast('이미지 저장에 실패했습니다');
    } finally {
      setIsImageSaving(false);
    }
  };

  if (isLoading) return <AnalysisLoading />;

  if (!result) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-6">결과를 불러올 수 없습니다.</p>
          <button
            onClick={handleRestart}
            className="btn-secondary w-full py-4"
            aria-label="진단을 처음부터 다시 시작"
          >
            처음부터 다시하기
          </button>
        </div>
      </div>
    );
  }

  const gradeStyle = GRADE_STYLES[result.grade] || {};
  const gradeDetail = GRADE_DETAILS[result.grade];

  return (
    <div className="min-h-dvh bg-[#FAFAFA] lg:bg-gradient-to-br lg:from-[#f8faf9] lg:to-[#f0f4f2]">
      <ShareCard result={result} cardRef={shareCardRef} />

      {/* 토스트 */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white text-[13px] rounded-full shadow-lg animate-fade-in">
          {toast.message}
        </div>
      )}

      {/* 데스크톱: 상단 네비게이션 */}
      <nav className="hidden lg:flex items-center justify-between px-8 xl:px-16 py-4 bg-white border-b border-neutral-100">
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
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-neutral-500">분석 완료</span>
          <span className="w-2 h-2 bg-[#0F3D2E] rounded-full" />
        </div>
      </nav>

      {/* 모바일: 그린 헤더 영역 */}
      <div
        className="lg:hidden text-center pt-5 pb-14 px-4"
        style={{ background: 'linear-gradient(165deg, #0a2e1f 0%, #0F3D2E 60%, #1a5c45 100%)' }}
      >
        <div className="w-7 h-7 bg-white/15 rounded-[7px] flex items-center justify-center mx-auto mb-2">
          <svg width="14" height="14" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.9"/>
            <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.7"/>
            <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.5"/>
          </svg>
        </div>
        <p className="text-[10px] text-white/50 tracking-[0.1em] uppercase">Analysis Complete</p>
      </div>

      {/* 메인 콘텐츠 */}
      <div className="px-4 -mt-10 lg:mt-0 lg:px-8 xl:px-16 lg:py-8 pb-6">
        <div className="lg:max-w-5xl lg:mx-auto lg:grid lg:grid-cols-3 lg:gap-8">

          {/* 왼쪽: 점수 카드 (데스크톱 전용 사이드바) */}
          <div className="hidden lg:block lg:col-span-1 space-y-4 lg:space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center lg:sticky lg:top-8">
              <ScoreGauge score={result.score} showScore={showScore} skipAnimation={isSharedResult} />
              <div className={`inline-block px-4 py-1.5 mt-4 rounded-full ${gradeStyle.bg} ${gradeStyle.border} border ${gradeStyle.text} font-semibold text-[14px] ${(showGrade || isSharedResult) ? (isSharedResult ? '' : 'animate-grade-reveal') : 'opacity-0'}`}>
                {result.grade}
              </div>
              <p className="text-[12px] text-neutral-500 mt-3">
                {GRADE_VERDICT[result.grade]}
              </p>
              <p className="text-[11px] text-neutral-400 mt-4 tracking-wide">
                현재까지 <span className="font-semibold tabular-nums">{totalCount !== null ? totalCount.toLocaleString() : '...'}</span>명이 진단했습니다
              </p>

              {/* 데스크톱: 공유 버튼을 점수 카드에 포함 */}
              <div className="hidden lg:block mt-6 pt-6 border-t border-neutral-100">
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveImage}
                    disabled={isImageSaving}
                    className="flex-1 h-10 rounded-[8px] bg-[#0F3D2E] text-white text-[12px] font-semibold disabled:opacity-50 transition-colors hover:bg-[#0a2e22]"
                  >
                    {isImageSaving ? '저장 중...' : '이미지 저장'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex-1 h-10 rounded-[8px] border border-neutral-200 text-neutral-600 text-[12px] font-semibold transition-colors hover:bg-neutral-50"
                  >
                    공유하기
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽: 상세 분석 */}
          <div className="lg:col-span-2 space-y-4 mt-4 lg:mt-0">
        {/* 모바일 전용 점수 카드 */}
        <div className="lg:hidden bg-white rounded-xl shadow-sm p-6 text-center">
          <ScoreGauge score={result.score} showScore={showScore} skipAnimation={isSharedResult} />
          <div className={`inline-block px-4 py-1.5 mt-4 rounded-full ${gradeStyle.bg} ${gradeStyle.border} border ${gradeStyle.text} font-semibold text-[14px] ${(showGrade || isSharedResult) ? (isSharedResult ? '' : 'animate-grade-reveal') : 'opacity-0'}`}>
            {result.grade}
          </div>
          <p className="text-[12px] text-neutral-500 mt-3">
            {GRADE_VERDICT[result.grade]}
          </p>
          <p className="text-[11px] text-neutral-400 mt-4 tracking-wide">
            현재까지 <span className="font-semibold tabular-nums">{totalCount !== null ? totalCount.toLocaleString() : '...'}</span>명이 진단했습니다
          </p>
        </div>

      {/* 2. 등급별 설명 */}
      {gradeDetail && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <p className="text-[15px] text-neutral-800 font-bold mb-2 leading-relaxed">{gradeDetail.summary}</p>
          <p className="text-[13px] text-neutral-500 leading-relaxed">{gradeDetail.details}</p>
        </div>
      )}

      {/* 3. 리스크 플래그 */}
      {result.details?.riskFlags?.length > 0 && (
        <div className="space-y-2">
          {result.details.riskFlags.map((flag, index) => (
            <div
              key={index}
              className={`p-3.5 rounded-xl ${
                flag.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'
              }`}
            >
              <p className={`text-[13px] font-medium leading-relaxed ${
                flag.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
              }`}>{flag.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* 4. 카테고리별 점수 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-neutral-800 mb-3">카테고리별 점수</h3>
        <div className="space-y-3">
          {result.categoryScores && CATEGORY_ORDER.map((key) => {
            const score = result.categoryScores[key];
            return (
              <div key={key} className="flex items-center gap-3">
                <span className="text-[12px] text-neutral-500 w-16 flex-shrink-0 font-medium">
                  {CATEGORY_LABELS[key]}
                </span>
                <div className="flex-1 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      score >= 70 ? 'bg-[#0F3D2E]' :
                      score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className={`text-[12px] font-semibold w-7 text-right tabular-nums ${
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

      {/* 5. 구조 개선 조언 */}
      {result.categoryScores && getAllCategoryAdvice(result.categoryScores).length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-[14px] font-bold text-neutral-800 mb-3">구조 개선 분석</h3>
          <div className="space-y-6">
            {getAllCategoryAdvice(result.categoryScores).map((advice) => (
              <div key={advice.categoryId} className="space-y-3">
                {/* 카테고리 헤더 */}
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded text-[11px] font-bold ${
                    advice.level === 'critical'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-amber-100 text-amber-600'
                  }`}>
                    {advice.level === 'critical' ? '!' : '△'}
                  </span>
                  <span className="text-[15px] font-semibold text-neutral-800">
                    {advice.label}
                  </span>
                  <span className={`text-[13px] font-medium tabular-nums ${
                    advice.level === 'critical' ? 'text-red-500' : 'text-amber-500'
                  }`}>
                    {advice.score}점
                  </span>
                </div>

                {/* 진단 */}
                <p className="text-[14px] text-neutral-700 leading-relaxed">
                  {advice.diagnosis}
                </p>

                {/* 기준 지표 */}
                <div className="bg-neutral-50 rounded-lg p-3">
                  <p className="text-[12px] font-medium text-neutral-500 mb-2">기준 지표</p>
                  <ul className="space-y-1">
                    {advice.metrics.map((metric, idx) => (
                      <li key={idx} className="text-[13px] text-neutral-600 flex items-start gap-2">
                        <span className="text-neutral-400 mt-0.5">•</span>
                        <span>{metric}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 개선 조치 */}
                <div>
                  <p className="text-[12px] font-medium text-neutral-500 mb-2">개선 조치</p>
                  <ul className="space-y-1.5">
                    {advice.actions.map((action, idx) => (
                      <li key={idx} className="text-[13px] text-neutral-700 flex items-start gap-2">
                        <span className="text-[#0F3D2E] font-medium mt-0.5">{idx + 1}.</span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 구분선 (마지막 항목 제외) */}
                {advice !== getAllCategoryAdvice(result.categoryScores).slice(-1)[0] && (
                  <div className="border-t border-neutral-100 pt-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. 주거 유형별 맞춤 분석 */}
      {result.housingAnalysis && (
        <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
          <div>
            <h3 className="text-[17px] font-bold text-neutral-800 mb-3">{result.housingAnalysis.title}</h3>
            <p className="text-[15px] text-neutral-600 leading-relaxed">
              {result.housingAnalysis.summary}
            </p>
            <p className="text-[15px] text-neutral-600 leading-relaxed mt-2">
              {result.housingAnalysis.details}
            </p>
          </div>
          <div className="border-t border-neutral-100 pt-5">
            <h4 className="text-[15px] font-semibold text-neutral-700 mb-3">전략 제안</h4>
            <ul className="space-y-2">
              {result.housingAnalysis.strategies.map((strategy, index) => (
                <li key={index} className="flex items-baseline gap-2">
                  <span className="text-[#0F3D2E] text-[10px]">●</span>
                  <span className="text-[14px] text-neutral-600 leading-relaxed">{strategy}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* 7. 독립 준비도 인덱스 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-neutral-800 mb-3">독립 준비도 인덱스</h3>
        <IndependenceIndex categoryScores={result.categoryScores} showScore={showScore} skipAnimation={isSharedResult} />
      </div>

      {/* 8. 재정 요약 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-neutral-800 mb-3">재정 요약</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-neutral-500">월 수입</span>
            <span className="text-[14px] font-bold text-neutral-800 tabular-nums">
              {(result.income || 0).toLocaleString()}만원
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-neutral-500">입력 지출</span>
            <span className="text-[14px] font-bold text-neutral-800 tabular-nums">
              {(result.originalExpenses || 0).toLocaleString()}만원
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-neutral-500">보정 지출 (예상)</span>
            <span className="text-[14px] font-semibold text-neutral-600 tabular-nums">
              {(result.monthlyRequired || 0).toLocaleString()}만원
            </span>
          </div>
          <div className="divider my-2"></div>
          <div className="flex justify-between items-center">
            <span className="text-[12px] text-neutral-700 font-semibold">권장 비상금 (6개월)</span>
            <span className="text-[16px] font-bold text-[#0F3D2E] tabular-nums">
              {(result.safetyAssets || 0).toLocaleString()}만원
            </span>
          </div>
        </div>
      </div>

      {/* 9. 공유 영역 - 모바일 전용 */}
      <div className="lg:hidden bg-white rounded-xl shadow-sm p-4">
        <h3 className="text-[14px] font-bold text-neutral-800 mb-1 text-center">
          결과 저장 및 공유
        </h3>
        <p className="text-center text-[12px] text-neutral-500 mb-4">
          나의 독립 준비 상태를 기록해두세요
        </p>
        <div className="flex gap-2">
          <button
            onClick={handleSaveImage}
            disabled={isImageSaving}
            className="flex-1 h-11 rounded-[10px] bg-[#0F3D2E] text-white text-[13px] font-semibold disabled:opacity-50 transition-colors hover:bg-[#0a2e22]"
            aria-label="진단 결과를 이미지로 저장"
          >
            {isImageSaving ? '저장 중...' : '이미지 저장'}
          </button>
          <button
            onClick={handleShare}
            className="flex-1 h-11 rounded-[10px] bg-[#0F3D2E] text-white text-[13px] font-semibold transition-colors hover:bg-[#0a2e22]"
            aria-label="결과 공유 공유하기"
          >
            공유하기
          </button>
        </div>
      </div>

      {/* 다시하기 버튼 */}
      <div className="pt-2 pb-6 lg:pb-0">
        <button
          onClick={handleRestart}
          className="w-full h-12 rounded-[10px] border border-neutral-200 bg-white text-neutral-600 text-[14px] font-medium hover:bg-neutral-50 transition-colors"
          aria-label="진단을 처음부터 다시 시작"
        >
          처음부터 다시하기
        </button>
      </div>

          </div>{/* 오른쪽 컬럼 끝 */}
        </div>{/* 그리드 끝 */}
      </div>{/* 메인 콘텐츠 끝 */}

      {/* 데스크톱: 하단 푸터 */}
      <footer className="hidden lg:block px-8 xl:px-16 py-6 border-t border-neutral-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-neutral-400 text-[13px]">
          <p>© 2026 독립점수 ver1. All rights reserved.</p>
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
