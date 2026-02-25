import { useEffect, useState, useRef } from 'react';
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
} from '../../utils/historyStorage';
import {
  generateImprovementRoadmap,
  getTargetScoreRange,
  getGradeTargets,
} from '../../utils/goalSimulation';
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
  '매우 안정': '당장 독립해도 걱정 없어요',
  '안정': '조금만 다듬으면 독립 가능해요',
  '주의': '지금은 조금 불안해요',
  '위험': '독립하면 힘들 수 있어요',
  '매우 위험': '지금은 독립을 미루세요',
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
    <div className="min-h-dvh flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        {!showTimeout ? (
          <>
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
          </>
        ) : (
          <>
            <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[18px] font-bold text-neutral-800 mb-2">
              분석이 오래 걸리고 있어요
            </p>
            <p className="text-[14px] text-neutral-500 mb-6 leading-relaxed">
              네트워크 상태를 확인하시고<br />
              아래 버튼을 눌러 다시 시도해주세요.
            </p>
            <button
              onClick={onRetry}
              className="w-full h-12 rounded-xl bg-[#0F3D2E] text-white text-[15px] font-semibold hover:bg-[#0a2e22] transition-colors mb-3"
            >
              다시 시도하기
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full text-neutral-400 text-[13px] hover:text-neutral-600 transition-colors"
            >
              처음으로 돌아가기
            </button>
          </>
        )}
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 animate-overlay-bg"
          onClick={onCancel}
        />
        <div className="relative bg-gradient-to-br from-[#0F3D2E] to-[#1a5c45] rounded-2xl p-6 max-w-sm w-full shadow-xl animate-overlay-content text-center">
          {/* 점수 비교 시각화 */}
          <div className="mb-4">
            <div className="inline-flex items-center gap-3 bg-white/10 rounded-full px-4 py-2">
              <span className="text-white/70 text-[13px]">친구</span>
              <span className="text-white font-bold text-[18px]">{friendScore}점</span>
              <span className="text-white/50">vs</span>
              <span className="text-[#FEE500] font-bold text-[18px]">?점</span>
              <span className="text-white/70 text-[13px]">나</span>
            </div>
          </div>

          <h3 className="text-[18px] font-bold text-white mb-2">
            나는 몇 점일까?
          </h3>
          <p className="text-[14px] text-white/70 mb-5 leading-relaxed">
            수입과 지출만 입력하면 끝!<br />
            <span className="text-white/50 text-[13px]">2분 · 무료 · 회원가입 없음</span>
          </p>

          <button
            onClick={onConfirm}
            className="w-full h-12 rounded-[10px] bg-white text-[#0F3D2E] text-[15px] font-bold hover:bg-neutral-100 transition-colors shadow-lg mb-3"
          >
            내 점수 확인하기
          </button>
          <button
            onClick={onCancel}
            className="w-full text-white/50 text-[13px] hover:text-white/70 transition-colors"
          >
            나중에 할게요
          </button>
        </div>
      </div>
    );
  }

  // 본인 재시작용 모달
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 animate-overlay-bg"
        onClick={onCancel}
      />
      <div className="relative bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl animate-overlay-content">
        <h3 className="text-[17px] font-bold text-neutral-800 mb-2">
          다시 진단받으시겠어요?
        </h3>
        <p className="text-[14px] text-neutral-500 mb-2 leading-relaxed">
          수입이나 지출이 바뀌었다면<br />
          새로운 점수를 확인해보세요.
        </p>
        <p className="text-[12px] text-neutral-400 mb-5">
          현재 결과는 링크로 저장되어 있어요.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 h-12 rounded-[10px] border border-neutral-200 text-neutral-600 text-[14px] font-semibold hover:bg-neutral-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 h-12 rounded-[10px] bg-[#0F3D2E] text-white text-[14px] font-semibold hover:bg-[#0a2e22] transition-colors"
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

const KAKAOPAY_LINK = 'https://qr.kakaopay.com/FC3Bnn1CY135606608';

// 프리미엄 리포트 이메일 입력 모달 (2단계로 단순화)
function PremiumEmailModal({ isOpen, onClose, onSubmit, isLoading, score, grade }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [step, setStep] = useState('email'); // 'email' | 'complete'
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

  const handleSubmitAndPay = async () => {
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

    // 바로 카카오페이 결제 페이지로 이동
    window.open(KAKAOPAY_LINK, '_blank');
    setStep('complete');
  };

  const handleClose = () => {
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

        {/* Step 1: 이메일 입력 + 바로 결제 */}
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
              onKeyDown={(e) => e.key === 'Enter' && handleSubmitAndPay()}
            />
            {error && (
              <p className="text-[12px] text-red-500 mt-1">{error}</p>
            )}

            <button
              onClick={handleSubmitAndPay}
              disabled={isLoading}
              className="w-full h-12 mt-4 rounded-[10px] bg-[#FEE500] text-[#191919] text-[15px] font-bold hover:bg-[#F5DC00] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#191919">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
              </svg>
              {isLoading ? '처리 중...' : '카카오페이 9,900원 결제'}
            </button>

            <button
              onClick={handleClose}
              className="w-full text-neutral-400 text-[13px] mt-3 hover:text-neutral-600 transition-colors"
            >
              취소
            </button>
          </>
        )}

        {/* Step 2: 완료 안내 (간소화) */}
        {step === 'complete' && (
          <>
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-[17px] font-bold text-neutral-800 mb-1">
                결제 진행 중
              </h3>
              <p className="text-[13px] text-neutral-500">
                결제 완료 후 24시간 내 발송됩니다
              </p>
            </div>

            <div className="bg-neutral-50 rounded-xl p-3 mb-4 text-center">
              <p className="text-[12px] text-neutral-500">발송 이메일</p>
              <p className="text-[14px] font-semibold text-neutral-800">{savedEmail}</p>
            </div>

            <button
              onClick={handleClose}
              className="w-full h-11 rounded-[10px] bg-[#0F3D2E] text-white text-[14px] font-semibold hover:bg-[#0a2e22] transition-colors"
            >
              확인
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 목표 점수 시뮬레이션 컴포넌트 (간소화)
function GoalSimulation({ result, expenses, income }) {
  const [targetScore, setTargetScore] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const currentScore = result?.score || 0;
  // 기본 접힘 상태 (UI 단순화)
  const [isExpanded, setIsExpanded] = useState(false);
  const scoreRange = getTargetScoreRange(currentScore);
  const gradeTargets = getGradeTargets(currentScore);

  // 초기 목표 점수 설정
  useEffect(() => {
    if (targetScore === null && currentScore < 100) {
      setTargetScore(scoreRange.default);
    }
  }, [currentScore, scoreRange.default, targetScore]);

  // 시뮬레이션 계산
  useEffect(() => {
    if (targetScore && result?.categoryScores) {
      const newRoadmap = generateImprovementRoadmap({
        currentScore,
        targetScore,
        categoryScores: result.categoryScores,
        expenses: expenses || {},
        income: income || result.income || 0,
      });
      setRoadmap(newRoadmap);
    }
  }, [targetScore, currentScore, result, expenses, income]);

  // 100점이면 시뮬레이션 불필요
  if (currentScore >= 100) {
    return null;
  }

  const handleGradeTargetClick = (score) => {
    setTargetScore(score);
    AnalyticsEvents.goalSimulationInteract(currentScore, score);
  };

  // 달성 가능성 판별
  const getFeasibilityStatus = () => {
    if (!roadmap) return null;
    if (roadmap.alreadyAchieved) return { label: '이미 달성', color: 'text-[#0F3D2E]', bg: 'bg-[#E8F3EF]' };
    if (roadmap.isAchievable) return { label: '달성 가능', color: 'text-[#0F3D2E]', bg: 'bg-[#E8F3EF]' };
    return { label: '달성 어려움', color: 'text-amber-600', bg: 'bg-amber-50' };
  };

  const feasibility = getFeasibilityStatus();

  return (
    <div className="bg-white rounded-xl shadow-sm">
      {/* 헤더 - 통일된 스타일 */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => {
          const newState = !isExpanded;
          setIsExpanded(newState);
          if (newState) {
            AnalyticsEvents.resultSectionExpand('goal_simulation');
          }
        }}
      >
        <div className="flex-1">
          <span className="text-[13px] font-bold text-neutral-800">목표 점수 시뮬레이션</span>
          <p className="text-[11px] text-neutral-400 mt-0.5">
            {isExpanded ? '목표 등급을 선택하세요' : '달성 가능성 분석'}
          </p>
        </div>
        <svg
          className={`w-4 h-4 text-neutral-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* 펼쳐진 내용 */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-neutral-100 pt-3">
          {/* 등급 목표 버튼 */}
          {gradeTargets.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] text-neutral-400 uppercase tracking-wide">목표 등급 선택</p>
              <div className="flex flex-wrap gap-2">
                {gradeTargets.slice(0, 3).map((target) => (
                  <button
                    key={target.grade}
                    onClick={() => handleGradeTargetClick(target.targetScore)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
                      targetScore === target.targetScore
                        ? 'bg-[#0F3D2E] text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {target.grade}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 달성 가능성 결과 */}
          {roadmap && feasibility && (
            <div className="space-y-3 pt-3 border-t border-neutral-100">
              {/* 현재 → 목표 */}
              <div className="flex items-center justify-center gap-3">
                <div className="text-center">
                  <p className="text-[11px] text-neutral-400">현재</p>
                  <p className="text-[20px] font-bold text-neutral-800 tabular-nums">{currentScore}점</p>
                </div>
                <svg className="w-5 h-5 text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="text-center">
                  <p className="text-[11px] text-neutral-400">목표</p>
                  <p className="text-[20px] font-bold text-[#0F3D2E] tabular-nums">{targetScore}점</p>
                </div>
              </div>

              {/* 달성 가능성 배지 */}
              <div className={`p-3 rounded-lg ${feasibility.bg} text-center`}>
                <p className={`text-[14px] font-bold ${feasibility.color}`}>
                  {feasibility.label}
                </p>
                {roadmap.estimatedMonths && roadmap.isAchievable && (
                  <p className="text-[12px] text-neutral-600 mt-1">
                    예상 소요 기간: 약 {roadmap.estimatedMonths}개월
                  </p>
                )}
              </div>

              {/* 구체적 개선 플랜 유도 - Coming Soon */}
              <div className="p-3 bg-neutral-50 rounded-lg opacity-60">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12px] text-neutral-500">
                    월별 실행 계획 & 절감 목표
                  </p>
                  <span className="text-[10px] bg-neutral-200 text-neutral-500 px-2 py-0.5 rounded-full">
                    준비 중
                  </span>
                </div>
                <div className="w-full h-9 rounded-lg border border-dashed border-neutral-300 flex items-center justify-center">
                  <span className="text-[12px] text-neutral-400">맞춤 리빌드 플랜 (곧 출시)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 접힌 상태 미리보기 */}
      {!isExpanded && gradeTargets.length > 0 && (
        <div className="px-4 pb-4 border-t border-neutral-100 pt-3">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-neutral-600">
              다음 등급: <span className="font-semibold text-[#0F3D2E]">{gradeTargets[0]?.grade}</span>
              <span className="text-neutral-400 ml-1">(+{gradeTargets[0]?.targetScore - currentScore}점)</span>
            </p>
            <span className="text-[10px] text-[#0F3D2E] bg-[#E8F3EF] px-2 py-0.5 rounded-full">
              탭하여 분석
            </span>
          </div>
        </div>
      )}
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
function ScoreMethodology() {
  return (
    <details className="bg-white rounded-xl shadow-sm group">
      <summary className="p-4 cursor-pointer flex items-center justify-between list-none">
        <div className="flex-1">
          <span className="text-[13px] font-bold text-neutral-800">점수 산정 방식</span>
          <p className="text-[11px] text-neutral-400 mt-0.5">7개 카테고리 가중 평균</p>
        </div>
        <svg className="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </summary>
      <div className="px-4 pb-4 space-y-4 border-t border-neutral-100 pt-3">
        {/* 카테고리별 가중치 */}
        <div className="space-y-2">
          <p className="text-[11px] text-neutral-400 uppercase tracking-wide">카테고리별 가중치</p>
          <div className="space-y-2">
            {SCORE_METHODOLOGY.categories.map((cat) => (
              <div key={cat.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-medium text-neutral-700">{cat.label}</span>
                    <span className="text-[12px] font-semibold text-[#0F3D2E] tabular-nums">{cat.weight}%</span>
                  </div>
                  <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#0F3D2E] rounded-full"
                      style={{ width: `${cat.weight * 4}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 평가 원칙 */}
        <div className="space-y-2 pt-2 border-t border-neutral-100">
          <p className="text-[11px] text-neutral-400 uppercase tracking-wide">평가 원칙</p>
          <ul className="space-y-1.5">
            {SCORE_METHODOLOGY.principles.map((principle, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-[#0F3D2E] text-[10px] mt-1">●</span>
                <span className="text-[12px] text-neutral-600 leading-relaxed">{principle}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 한계 안내 */}
        <div className="p-3 bg-neutral-50 rounded-lg">
          <p className="text-[11px] text-neutral-500 leading-relaxed">
            ⚠️ {SCORE_METHODOLOGY.disclaimer}
          </p>
        </div>
      </div>
    </details>
  );
}

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
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [isPremiumLoading, setIsPremiumLoading] = useState(false);
  const shareCardRef = useRef(null);
  const scrollMilestonesRef = useRef(new Set());

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

  // 공유된 결과 조회 (처음 마운트 시 URL에 id가 있었던 경우만)
  useEffect(() => {
    if (!initialSharedId) return;

    async function loadSharedResult() {
      setIsSharedResult(true);

      const sharedResult = await fetchResultById(initialSharedId);

      if (sharedResult) {
        setResult(sharedResult);
        setResultId(initialSharedId);

        // 친구 점수 저장 (나중에 비교용)
        saveFriendScore(sharedResult.score, sharedResult.grade);

        // 공유된 결과 조회 이벤트
        AnalyticsEvents.sharedResultView(sharedResult.score, sharedResult.grade);
      }

      // 공유 링크: 로딩/애니메이션 스킵
      setIsLoading(false);
      setShowScore(true);
      setShowGrade(true);

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
          <p className="text-neutral-400 mb-6 text-[13px]">링크가 만료되었거나 일시적인 오류입니다.</p>
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
    <div className="min-h-dvh bg-[#FAFAFA] lg:bg-gradient-to-br lg:from-[#f8faf9] lg:to-[#f0f4f2] print:bg-white">
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
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-gray-900 text-white text-[13px] rounded-full shadow-lg animate-fade-in print:hidden" role="alert">
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
              <p className="text-[13px] text-neutral-600 mt-2 font-medium">
                {GRADE_VERDICT[result.grade]}
              </p>
              <p className="text-[11px] text-neutral-400 mt-4 tracking-wide">
                현재까지 <span className="font-semibold tabular-nums">{totalCount !== null ? totalCount.toLocaleString() : '...'}</span>명이 진단했습니다
              </p>

              {/* 데스크톱: 공유 버튼 (단순화) */}
              <div className="hidden lg:block mt-5 pt-5 border-t border-neutral-100 print:hidden">
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={handleKakaoShare}
                    className="flex-1 h-10 rounded-[8px] bg-[#FEE500] text-[#191919] text-[12px] font-semibold transition-colors hover:bg-[#F5DC00] flex items-center justify-center gap-1.5"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="#191919">
                      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                    </svg>
                    공유
                  </button>
                  <button
                    onClick={handleSaveImage}
                    disabled={isImageSaving}
                    className="flex-1 h-10 rounded-[8px] bg-[#0F3D2E] text-white text-[12px] font-semibold disabled:opacity-50 transition-colors hover:bg-[#0a2e22]"
                  >
                    {isImageSaving ? '저장 중' : '이미지'}
                  </button>
                  <button
                    onClick={handleShare}
                    className="h-10 w-10 rounded-[8px] border border-neutral-200 text-neutral-500 flex items-center justify-center transition-colors hover:bg-neutral-50"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                {isSharedResult ? (
                  <button
                    onClick={handleRestartClick}
                    className="w-full h-10 mt-2 rounded-[8px] bg-[#0F3D2E] text-white text-[12px] font-semibold transition-colors hover:bg-[#0a2e22]"
                  >
                    내 점수 확인하기
                  </button>
                ) : (
                  <button
                    onClick={handleRestartClick}
                    className="w-full text-neutral-400 text-[11px] mt-3 hover:text-neutral-600 transition-colors"
                  >
                    다시 진단받기
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 오른쪽: 상세 분석 */}
          <div className="lg:col-span-2 space-y-4 mt-4 lg:mt-0">
        {/* 모바일 전용 점수 카드 - 컴팩트 */}
        <div className="lg:hidden bg-white rounded-xl shadow-sm p-5 text-center">
          <ScoreGauge score={result.score} showScore={showScore} skipAnimation={isSharedResult} />
          <div className={`inline-flex items-center gap-2 px-4 py-1.5 mt-3 rounded-full ${gradeStyle.bg} ${gradeStyle.border} border ${(showGrade || isSharedResult) ? (isSharedResult ? '' : 'animate-grade-reveal') : 'opacity-0'}`}>
            <span className={`${gradeStyle.text} font-bold text-[14px]`}>{result.grade}</span>
          </div>
          <p className="text-[14px] text-neutral-700 mt-2 font-semibold">
            {GRADE_VERDICT[result.grade]}
          </p>
          <p className="text-[10px] text-neutral-400 mt-3">
            <span className="font-semibold tabular-nums">{totalCount !== null ? totalCount.toLocaleString() : '...'}</span>명이 진단 완료
          </p>

          {/* 모바일 공유 버튼 - 점수 카드 내 (단순화) */}
          <div className="mt-4 pt-4 border-t border-neutral-100 print:hidden">
            <div className="flex gap-2">
              <button
                onClick={handleKakaoShare}
                className="flex-1 h-10 rounded-lg bg-[#FEE500] text-[#191919] text-[12px] font-semibold flex items-center justify-center gap-1.5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#191919">
                  <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
                </svg>
                공유
              </button>
              <button
                onClick={handleSaveImage}
                disabled={isImageSaving}
                className="flex-1 h-10 rounded-lg bg-[#0F3D2E] text-white text-[12px] font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {isImageSaving ? '저장 중' : '이미지'}
              </button>
              <button
                onClick={handleShare}
                className="h-10 w-10 rounded-lg border border-neutral-200 text-neutral-500 flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

      {/* 적자 경고 UI - 수입 < 지출인 경우 */}
      {result.details?.riskFlags?.some(flag => flag.type === 'income_insufficient') && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <div className="flex items-center gap-2.5">
            <div className="flex-shrink-0 w-7 h-7 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-3.5 h-3.5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[13px] font-bold text-red-800">
                매달 {Math.abs((result.income || 0) - (result.originalExpenses || 0)).toLocaleString()}만원 적자 구조
              </p>
              <p className="text-[11px] text-red-600">독립 시 자금 압박 가능성이 매우 높습니다</p>
            </div>
          </div>
        </div>
      )}

      {/* 주요 리스크 요인 블록 (상위 2개) */}
      {(() => {
        const topRisks = getTopRiskFactors(result);
        if (topRisks.length === 0) return null;
        return (
          <div className="bg-white rounded-xl shadow-sm p-3">
            <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-2">주요 리스크 요인</p>
            <div className="flex gap-2">
              {topRisks.map((risk, idx) => (
                <div
                  key={idx}
                  className={`flex-1 p-2.5 rounded-lg ${
                    risk.severity === 'critical' ? 'bg-red-50' : 'bg-amber-50'
                  }`}
                >
                  <p className={`text-[18px] font-bold tabular-nums ${
                    risk.severity === 'critical' ? 'text-red-600' : 'text-amber-600'
                  }`}>
                    {risk.value}
                  </p>
                  <p className="text-[11px] text-neutral-500">{risk.label}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* 점수 상승 설계 리포트 - 유료 전환 핵심 (리스크 바로 뒤 배치) */}
      {/* TODO: 배포 전 !isSharedResult 조건 복구 필요 */}
      {(() => {
        const topRisks = getTopRiskFactors(result);
        const riskLevel = topRisks.length > 0 && topRisks.some(r => r.severity === 'critical') ? 'high' : topRisks.length > 0 ? 'medium' : 'low';
        const preview = generatePremiumPreview({
          result,
          expenses: expenses || {},
          income: income || result?.income || 0,
        });

        return (
          <div
            className="bg-gradient-to-br from-[#0F3D2E] to-[#1a5c45] rounded-xl p-4 text-white"
            ref={(el) => {
              // GA 이벤트: 프리미엄 미리보기 노출 (한 번만 실행)
              if (el && !el.dataset.tracked) {
                el.dataset.tracked = 'true';
                AnalyticsEvents.premiumPreviewView(result.score, result.grade, riskLevel);
              }
            }}
          >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">📈</span>
                <h3 className="text-[14px] font-bold">점수 상승 설계 리포트</h3>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">프리미엄</span>
            </div>

            {/* 비교 시각화 - Before/After */}
            <div className="bg-white/10 rounded-lg p-3 mb-3">
              {/* 현재 vs 목표 점수 */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-center">
                  <p className="text-[10px] text-white/60">현재</p>
                  <p className="text-[24px] font-bold tabular-nums">{result.score}점</p>
                </div>
                <svg className="w-5 h-5 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
                <div className="text-center">
                  <p className="text-[10px] text-white/60">목표</p>
                  <p className="text-[24px] font-bold tabular-nums text-emerald-300">{preview?.targetScore || Math.min(result.score + 20, 100)}점</p>
                </div>
              </div>

              {/* 타임라인 비교 바 */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/50 w-10">혼자</span>
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/40 rounded-full" style={{ width: '100%' }} />
                  </div>
                  <span className="text-[11px] text-white/70 w-14 text-right">{preview?.timeline?.monthsWithoutPlan || 11}개월</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-emerald-300 w-10">플랜</span>
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${((preview?.timeline?.monthsWithPlan || 6) / (preview?.timeline?.monthsWithoutPlan || 11)) * 100}%` }} />
                  </div>
                  <span className="text-[11px] text-emerald-300 font-semibold w-14 text-right">{preview?.timeline?.monthsWithPlan || 6}개월</span>
                </div>
              </div>

              {/* 절약 시간 강조 */}
              <div className="mt-2 pt-2 border-t border-white/10 text-center">
                <span className="text-[12px] text-white/80">
                  <span className="text-emerald-300 font-bold">{preview?.timeline?.savedMonths || 5}개월</span> 더 빠르게 독립 준비
                </span>
              </div>
            </div>

            {/* 미리보기 정보 */}
            {preview?.adjustments?.length > 0 && (
              <div className="space-y-1.5 mb-3">
                <p className="text-[10px] text-white/50 uppercase tracking-wide">핵심 개선 영역</p>
                {preview.adjustments.slice(0, 2).map((adj, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-white/80">{adj.description}</span>
                    <span className="text-emerald-300 font-semibold">+{adj.scoreDiff}점</span>
                  </div>
                ))}
              </div>
            )}

            {/* CTA 버튼 */}
            <button
              className="w-full h-11 rounded-lg bg-white text-[#0F3D2E] text-[14px] font-bold hover:bg-neutral-100 transition-colors flex items-center justify-center gap-1.5 shadow-lg"
              onClick={() => {
                AnalyticsEvents.premiumCtaClick(result.score, result.grade, riskLevel);
                setShowPremiumModal(true);
              }}
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="#0F3D2E">
                <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
              </svg>
              <span>카카오페이로 구매</span>
              <span className="text-[12px] font-normal text-[#0F3D2E]/60">9,900원</span>
            </button>
            <p className="text-[10px] text-white/50 text-center mt-2">
              결제 확인 후 이메일로 맞춤 리포트 발송
            </p>
          </div>
        );
      })()}

      {/* 재정 요약 - 간소화 */}
      <div className="bg-white rounded-xl shadow-sm p-3">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-[10px] text-neutral-400">월 수입</p>
            <p className="text-[15px] font-bold text-neutral-800 tabular-nums">
              {(result.income || 0).toLocaleString()}<span className="text-[11px] font-normal">만</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400">월 지출</p>
            <p className="text-[15px] font-bold text-neutral-800 tabular-nums">
              {(result.originalExpenses || 0).toLocaleString()}<span className="text-[11px] font-normal">만</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400">여유자금</p>
            <p className={`text-[15px] font-bold tabular-nums ${
              (result.income || 0) - (result.originalExpenses || 0) >= 0 ? 'text-[#0F3D2E]' : 'text-red-500'
            }`}>
              {((result.income || 0) - (result.originalExpenses || 0)).toLocaleString()}<span className="text-[11px] font-normal">만</span>
            </p>
          </div>
        </div>
      </div>

      {/* 카테고리별 점수 */}
      <div className="bg-white rounded-xl shadow-sm p-3">
        <p className="text-[11px] text-neutral-400 uppercase tracking-wide mb-2">카테고리별 점수</p>
        <div className="space-y-2">
          {result.categoryScores && CATEGORY_ORDER.map((key) => {
            const score = result.categoryScores[key];
            return (
              <div key={key} className="flex items-center gap-2">
                <span className="text-[11px] text-neutral-500 w-14 flex-shrink-0">
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
                <span className={`text-[11px] font-semibold w-6 text-right tabular-nums ${
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


      {/* 상세 분석 영역들 - 통일된 스타일 */}
      <div className="space-y-2">
        {/* 상세 개선 분석 */}
        {result.categoryScores && getAllCategoryAdvice(result.categoryScores).length > 0 && (
          <details className="bg-white rounded-xl shadow-sm group">
            <summary className="p-4 cursor-pointer flex items-center justify-between list-none">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-neutral-800">상세 개선 분석</span>
                  <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                    {getAllCategoryAdvice(result.categoryScores).length}개
                  </span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-0.5">카테고리별 구체적인 개선 방안</p>
              </div>
              <svg className="w-4 h-4 text-neutral-400 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="px-4 pb-4 space-y-3 border-t border-neutral-100 pt-3">
              {getAllCategoryAdvice(result.categoryScores).map((advice) => (
                <div key={advice.categoryId} className="p-3 bg-neutral-50 rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold ${
                      advice.level === 'critical' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {advice.level === 'critical' ? '!' : '△'}
                    </span>
                    <span className="text-[13px] font-semibold text-neutral-800">{advice.label}</span>
                    <span className={`text-[11px] font-medium tabular-nums ${
                      advice.level === 'critical' ? 'text-red-500' : 'text-amber-500'
                    }`}>{advice.score}점</span>
                  </div>
                  <p className="text-[12px] text-neutral-600 leading-relaxed">{advice.diagnosis}</p>
                  <ul className="space-y-1">
                    {advice.actions.slice(0, 2).map((action, idx) => (
                      <li key={idx} className="text-[11px] text-neutral-500 flex items-start gap-1.5">
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
      </div>

      {/* 9. 친구 점수 비교 (공유 링크로 들어온 후 직접 진단한 경우) */}
      {friendComparison && !isSharedResult && (
        <div className="bg-gradient-to-br from-[#0F3D2E] via-[#1a5c45] to-[#0F3D2E] rounded-2xl p-5 text-white overflow-hidden relative">
          {/* 배경 장식 */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          {/* 헤더 */}
          <div className="flex items-center gap-2 mb-4 relative">
            <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <p className="text-[14px] font-semibold text-white/90">친구와 점수 비교</p>
          </div>

          {/* 비교 카드 */}
          <div className="flex items-stretch gap-3 relative">
            {/* 친구 */}
            <div className="flex-1 bg-white/10 rounded-xl p-4 text-center backdrop-blur-sm">
              <p className="text-[11px] text-white/60 mb-1">친구</p>
              <p className="text-[32px] font-bold tabular-nums leading-none">{friendComparison.score}</p>
              <p className="text-[12px] text-white/70 mt-1">{friendComparison.grade}</p>
            </div>

            {/* VS 및 차이 */}
            <div className="flex flex-col items-center justify-center px-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                friendComparison.diff > 0 ? 'bg-green-400/20' : friendComparison.diff < 0 ? 'bg-red-400/20' : 'bg-white/20'
              }`}>
                <span className={`text-[14px] font-bold ${
                  friendComparison.diff > 0 ? 'text-green-300' : friendComparison.diff < 0 ? 'text-red-300' : 'text-white/80'
                }`}>
                  {friendComparison.diff > 0 ? '+' : ''}{friendComparison.diff}
                </span>
              </div>
              <p className="text-[10px] text-white/50 mt-1">
                {friendComparison.diff > 0 ? '승리!' : friendComparison.diff < 0 ? '아쉬워요' : '무승부'}
              </p>
            </div>

            {/* 나 */}
            <div className={`flex-1 rounded-xl p-4 text-center ${
              friendComparison.diff >= 0 ? 'bg-white/20 ring-2 ring-white/30' : 'bg-white/10'
            }`}>
              <p className="text-[11px] text-white/60 mb-1">나</p>
              <p className="text-[32px] font-bold tabular-nums leading-none">{result.score}</p>
              <p className="text-[12px] text-white/70 mt-1">{result.grade}</p>
              {friendComparison.diff > 0 && (
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-[12px]">👑</span>
                </div>
              )}
            </div>
          </div>

          {/* 공유 유도 */}
          <button
            onClick={handleKakaoShare}
            className="w-full mt-4 h-10 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[13px] font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M12 3C6.48 3 2 6.58 2 11c0 2.83 1.89 5.31 4.71 6.72-.18.67-.7 2.42-.8 2.8-.13.47.17.47.36.34.15-.1 2.37-1.6 3.33-2.25.78.11 1.58.17 2.4.17 5.52 0 10-3.58 10-8s-4.48-8-10-8z"/>
            </svg>
            다른 친구에게도 공유하기
          </button>
        </div>
      )}

      {/* 10. 이전 진단 대비 변화 (2회 이상 진단한 경우) */}
      {previousComparison && !isSharedResult && (
        <div className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-[12px] text-neutral-500 mb-1">
              이전 진단 대비
            </p>
            <p className="text-[13px] text-neutral-700">
              {new Date(previousComparison.previousDate).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 진단 ({previousComparison.previousScore}점)
            </p>
          </div>
          <div className={`text-right ${previousComparison.improved ? 'text-[#0F3D2E]' : previousComparison.diff < 0 ? 'text-red-500' : 'text-neutral-500'}`}>
            <p className="text-[20px] font-bold tabular-nums">
              {previousComparison.diff > 0 ? '+' : ''}{previousComparison.diff}점
            </p>
            <p className="text-[11px]">
              {previousComparison.improved ? '상승' : previousComparison.diff < 0 ? '하락' : '유지'}
            </p>
          </div>
        </div>
      )}

      {/* 11. 진단 히스토리 (2회 이상 진단 기록이 있을 때만) */}
      {history.length > 1 && !isSharedResult && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="text-[14px] font-bold text-neutral-800 mb-3">
            진단 기록
          </h3>
          <div className="space-y-2">
            {history.slice(0, 5).map((entry, index) => {
              const isLatest = index === 0;
              const prevEntry = history[index + 1];
              const diff = prevEntry ? entry.score - prevEntry.score : null;

              return (
                <div
                  key={entry.id}
                  className={`flex items-center justify-between py-2 ${!isLatest ? 'border-t border-neutral-100' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    {isLatest && (
                      <span className="px-2 py-0.5 bg-[#0F3D2E] text-white text-[10px] font-semibold rounded">
                        NOW
                      </span>
                    )}
                    <span className="text-[12px] text-neutral-500">
                      {new Date(entry.date).toLocaleDateString('ko-KR', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {diff !== null && (
                      <span className={`text-[11px] ${diff > 0 ? 'text-[#0F3D2E]' : diff < 0 ? 'text-red-500' : 'text-neutral-400'}`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                    <span className={`text-[14px] font-bold tabular-nums ${isLatest ? 'text-[#0F3D2E]' : 'text-neutral-600'}`}>
                      {entry.score}점
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full ${
                      entry.grade === '매우 안정' || entry.grade === '안정'
                        ? 'bg-[#E8F3EF] text-[#0F3D2E]'
                        : entry.grade === '주의'
                        ? 'bg-[#FFF7E5] text-[#9A6B00]'
                        : 'bg-[#FDECEC] text-[#912018]'
                    }`}>
                      {entry.grade}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          {history.length > 5 && (
            <p className="text-[11px] text-neutral-400 text-center mt-3">
              최근 5회 기록만 표시됩니다
            </p>
          )}
        </div>
      )}

      {/* 점수 산정 방식 설명 */}
      <ScoreMethodology />

      {/* 진단받기 CTA - 공유 링크로 들어온 경우 (모바일만) */}
      {isSharedResult && (
        <div className="lg:hidden bg-gradient-to-br from-[#0F3D2E] to-[#1a5c45] rounded-xl p-5 print:hidden">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="text-center">
              <p className="text-white/60 text-[11px] mb-1">친구</p>
              <p className="text-white font-bold text-[22px]">{result?.score}점</p>
            </div>
            <div className="text-white/40 text-[20px] font-light">vs</div>
            <div className="text-center">
              <p className="text-[#FEE500]/80 text-[11px] mb-1">나</p>
              <p className="text-[#FEE500] font-bold text-[22px]">?점</p>
            </div>
          </div>
          <p className="text-white/70 text-[12px] text-center mb-4">
            2분 · 무료 · 회원가입 없음
          </p>
          <button
            onClick={handleRestartClick}
            className="w-full h-12 rounded-[10px] bg-white text-[#0F3D2E] text-[15px] font-bold hover:bg-neutral-50 transition-colors shadow-lg"
          >
            내 점수 확인하기
          </button>
        </div>
      )}

      {/* 다시하기 - 텍스트 버튼으로 단순화 */}
      {!isSharedResult && (
        <div className="lg:hidden text-center py-4 print:hidden">
          <button
            onClick={handleRestartClick}
            className="text-neutral-400 text-[13px] hover:text-neutral-600 transition-colors"
            aria-label="진단을 처음부터 다시 시작"
          >
            수입이나 지출이 바뀌었나요? <span className="underline">다시 진단받기</span>
          </button>
        </div>
      )}

          </div>{/* 오른쪽 컬럼 끝 */}
        </div>{/* 그리드 끝 */}
      </div>{/* 메인 콘텐츠 끝 */}

      {/* 데스크톱: 하단 푸터 */}
      <footer className="hidden lg:block px-8 xl:px-16 py-6 border-t border-neutral-200 bg-white mt-8">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-neutral-400 text-[13px]">
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
