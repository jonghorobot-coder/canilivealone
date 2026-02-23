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

  // 점수에 따른 게이지 색상
  const getScoreColor = (s) => {
    if (s >= 70) return '#0F3D2E';
    if (s >= 50) return '#D97706';
    return '#DC2626';
  };

  const scoreColor = getScoreColor(score);

  // 카테고리별 점수 (상위 4개만)
  const categoryData = result?.categoryScores
    ? [
        { key: 'housing', label: '주거', score: result.categoryScores.housing },
        { key: 'savings', label: '저축', score: result.categoryScores.savings },
        { key: 'food', label: '식비', score: result.categoryScores.food },
        { key: 'fixed', label: '고정', score: result.categoryScores.fixed },
      ]
    : [];

  // SVG 원형 게이지 계산
  const radius = 140;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const offset = circumference - progress;

  return (
    <div
      ref={cardRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '1080px',
        height: '1080px',
        background: 'linear-gradient(145deg, #0F3D2E 0%, #1a5c45 50%, #0F3D2E 100%)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '70px 80px',
        boxSizing: 'border-box',
        visibility: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* 상단 로고 + 브랜드 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '50px',
      }}>
        {/* 파비콘 로고 */}
        <div style={{
          width: '56px',
          height: '56px',
          backgroundColor: 'rgba(255,255,255,0.15)',
          borderRadius: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <svg width="32" height="32" viewBox="0 0 100 100">
            <path d="M50 20L20 35L50 50L80 35L50 20Z" fill="white" opacity="0.95"/>
            <path d="M20 50L50 65L80 50" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.75"/>
            <path d="M20 65L50 80L80 65" stroke="white" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.55"/>
          </svg>
        </div>
        <div style={{
          fontSize: '28px',
          fontWeight: '700',
          color: 'white',
          letterSpacing: '-0.02em',
        }}>
          독립점수
        </div>
      </div>

      {/* 메인 점수 카드 */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: '32px',
        padding: '50px 60px',
        width: '100%',
        maxWidth: '920px',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}>
        {/* 원형 게이지 + 점수 */}
        <div style={{
          position: 'relative',
          width: '320px',
          height: '320px',
          marginBottom: '32px',
        }}>
          <svg width="320" height="320" style={{ transform: 'rotate(-90deg)' }}>
            {/* 배경 원 */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke="#E5E7EB"
              strokeWidth="20"
            />
            {/* 진행 원 */}
            <circle
              cx="160"
              cy="160"
              r={radius}
              fill="none"
              stroke={scoreColor}
              strokeWidth="20"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
            />
          </svg>
          {/* 중앙 점수 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
          }}>
            <div style={{
              fontSize: '96px',
              fontWeight: '800',
              color: '#111827',
              lineHeight: '1',
              letterSpacing: '-3px',
            }}>
              {score}
            </div>
            <div style={{
              fontSize: '24px',
              color: '#9CA3AF',
              marginTop: '8px',
            }}>
              / 100
            </div>
          </div>
        </div>

        {/* 등급 배지 */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px 40px',
          borderRadius: '100px',
          backgroundColor: gradeStyle.bg,
          border: `2px solid ${gradeStyle.border}`,
          marginBottom: '40px',
        }}>
          <span style={{
            fontSize: '28px',
            fontWeight: '700',
            color: gradeStyle.text,
          }}>
            {result?.grade}
          </span>
        </div>

        {/* 카테고리별 점수 바 */}
        <div style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '20px',
        }}>
          {categoryData.map((cat) => (
            <div key={cat.key} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
            }}>
              <div style={{
                fontSize: '18px',
                color: '#6B7280',
                fontWeight: '500',
              }}>
                {cat.label}
              </div>
              <div style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#E5E7EB',
                borderRadius: '6px',
                overflow: 'hidden',
              }}>
                <div style={{
                  width: `${cat.score}%`,
                  height: '100%',
                  backgroundColor: getScoreColor(cat.score),
                  borderRadius: '6px',
                }} />
              </div>
              <div style={{
                fontSize: '20px',
                fontWeight: '700',
                color: getScoreColor(cat.score),
              }}>
                {cat.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 하단 URL */}
      <div style={{
        marginTop: 'auto',
        paddingTop: '40px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
      }}>
        <div style={{
          fontSize: '22px',
          color: 'rgba(255,255,255,0.7)',
        }}>
          나도 진단받기
        </div>
        <div style={{
          fontSize: '22px',
          fontWeight: '600',
          color: 'white',
        }}>
          canilivealone.com
        </div>
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

  const handleCopyLink = async () => {
    try {
      const shareUrl = resultId
        ? `${window.location.origin}/result?id=${resultId}`
        : window.location.href;
      await navigator.clipboard.writeText(shareUrl);
      showToast('링크가 복사되었습니다');
      AnalyticsEvents.copyLink();
    } catch (err) {
      showToast('링크 복사에 실패했습니다');
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
    <div className="py-8 space-y-6">
      <ShareCard result={result} cardRef={shareCardRef} />

      {/* 토스트 */}
      {toast.show && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white text-[14px] rounded-full shadow-lg animate-fade-in">
          {toast.message}
        </div>
      )}

      {/* 헤더 */}
      <header className="text-center pb-4">
        <p className="text-[11px] text-neutral-400 tracking-[0.12em] mb-2 font-medium uppercase">Analysis Report</p>
        <h1 className="text-[20px] font-bold text-neutral-800 tracking-tight">진단 결과</h1>
      </header>

      {/* 점수 카드 */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-8 text-center mx-2">
        <p className="text-[13px] text-neutral-400 font-medium mb-5 tracking-wide">독립 가능성 점수</p>
        <ScoreGauge score={result.score} showScore={showScore} skipAnimation={isSharedResult} />
        <div className={`inline-block px-5 py-2 mt-6 rounded-full ${gradeStyle.bg} ${gradeStyle.border} border ${gradeStyle.text} font-semibold text-[15px] ${(showGrade || isSharedResult) ? (isSharedResult ? '' : 'animate-grade-reveal') : 'opacity-0'}`}>
          {result.grade}
        </div>
        <p className="text-[12px] text-neutral-400 mt-6 tracking-wide">
          현재까지 <span className="font-semibold tabular-nums">{totalCount !== null ? totalCount.toLocaleString() : '...'}</span>명이 진단했습니다
        </p>
      </div>

      {/* 신뢰 안내 */}
      <p className="text-[13px] text-neutral-400 text-center leading-relaxed mx-4">
        이 결과는 입력한 정보를 기반으로 계산된 재정 안정성 진단입니다.
      </p>

      {/* 독립 준비도 인덱스 */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 mx-2">
        <h3 className="text-[17px] font-bold text-neutral-800 mb-4">독립 준비도 인덱스</h3>
        <IndependenceIndex categoryScores={result.categoryScores} showScore={showScore} skipAnimation={isSharedResult} />
      </div>

      {/* 등급별 설명 */}
      {gradeDetail && (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 mx-2">
          <p className="text-[17px] text-neutral-800 font-bold mb-3 leading-relaxed">{gradeDetail.summary}</p>
          <p className="text-[15px] text-neutral-500 leading-relaxed">{gradeDetail.details}</p>
        </div>
      )}

      {/* 주거 유형별 맞춤 분석 */}
      {result.housingAnalysis && (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 mx-2 space-y-5">
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

      {/* 리스크 플래그 */}
      {result.details?.riskFlags?.length > 0 && (
        <div className="space-y-2 mx-2">
          {result.details.riskFlags.map((flag, index) => (
            <div
              key={index}
              className={`p-4 rounded-xl ${
                flag.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'
              }`}
            >
              <p className={`text-[14px] font-medium leading-relaxed ${
                flag.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
              }`}>{flag.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* 재정 요약 */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 mx-2">
        <h3 className="text-[17px] font-bold text-neutral-800 mb-4">재정 요약</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-neutral-500">월 수입</span>
            <span className="text-[17px] font-bold text-neutral-800 tabular-nums">
              {(result.income || 0).toLocaleString()}만원
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-neutral-500">입력 지출</span>
            <span className="text-[17px] font-bold text-neutral-800 tabular-nums">
              {(result.originalExpenses || 0).toLocaleString()}만원
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-neutral-500">보정 지출 (예상)</span>
            <span className="text-[17px] font-semibold text-neutral-600 tabular-nums">
              {(result.monthlyRequired || 0).toLocaleString()}만원
            </span>
          </div>
          <div className="divider my-3"></div>
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-neutral-700 font-semibold">권장 비상금 (6개월)</span>
            <span className="text-[20px] font-bold text-[#0F3D2E] tabular-nums">
              {(result.safetyAssets || 0).toLocaleString()}만원
            </span>
          </div>
        </div>
      </div>

      {/* 카테고리별 점수 */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 mx-2">
        <h3 className="text-[17px] font-bold text-neutral-800 mb-4">카테고리별 점수</h3>
        <div className="space-y-4">
          {result.categoryScores && Object.entries(result.categoryScores).map(([key, score]) => (
            <div key={key} className="flex items-center gap-4">
              <span className="text-[14px] text-neutral-600 w-20 flex-shrink-0 font-medium">
                {CATEGORY_LABELS[key]}
              </span>
              <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    score >= 70 ? 'bg-[#0F3D2E]' :
                    score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className={`text-[14px] font-semibold w-8 text-right tabular-nums ${
                score >= 70 ? 'text-[#0F3D2E]' :
                score >= 50 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 구조 개선 조언 */}
      {result.categoryScores && getAllCategoryAdvice(result.categoryScores).length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 mx-2">
          <h3 className="text-[17px] font-bold text-neutral-800 mb-4">구조 개선 분석</h3>
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

      {/* 공유 영역 */}
      <div className="bg-white rounded-xl border border-neutral-100 shadow-sm p-6 mx-2">
        <h3 className="text-[17px] font-bold text-neutral-800 mb-2 text-center">
          결과 저장 및 공유
        </h3>
        <p className="text-center text-[14px] text-neutral-500 mb-5">
          나의 독립 준비 상태를 기록해두세요
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleSaveImage}
            disabled={isImageSaving}
            className="btn-secondary flex-1 h-12 text-[14px] disabled:opacity-50"
            aria-label="진단 결과를 이미지로 저장"
          >
            {isImageSaving ? '저장 중...' : '이미지로 저장'}
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-secondary flex-1 h-12 text-[14px]"
            aria-label="결과 공유 링크 복사"
          >
            링크 복사
          </button>
        </div>
      </div>

      {/* 다시하기 버튼 */}
      <div className="px-1.5 mt-8">
        <button
          onClick={handleRestart}
          className="btn-primary w-full h-14 text-[15px]"
          aria-label="진단을 처음부터 다시 시작"
        >
          처음부터 다시하기
        </button>
      </div>
    </div>
  );
}
