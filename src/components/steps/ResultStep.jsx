import { useEffect, useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { useSurvey } from '../../hooks/useSurvey';
import { calculateResult } from '../../utils/calculate';
import { AnalyticsEvents } from '../../utils/analytics';

const LOADING_DURATION = 2500;

const LOADING_MESSAGES = [
  '주거 안정성 분석 중...',
  '소비 구조 점검 중...',
  '비상 자금 안정성 평가 중...',
  '독립 가능성 종합 분석 중...',
];

const GRADE_STYLES = {
  '안정 독립': { bg: 'bg-emerald-50', border: 'border-emerald-600', text: 'text-emerald-600' },
  '관리 가능': { bg: 'bg-gray-100', border: 'border-gray-300', text: 'text-gray-600' },
  '불안정': { bg: 'bg-amber-50', border: 'border-amber-500', text: 'text-amber-600' },
  '위험': { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-500' },
  '독립 비권장': { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-500' },
};

const GRADE_DETAILS = {
  '안정 독립': {
    summary: '현재 재정 구조로 안정적인 독립 생활이 가능합니다.',
    details: '수입 대비 지출 비율이 적정하며, 비상 상황에 대한 대비가 갖추어져 있습니다.',
  },
  '관리 가능': {
    summary: '독립은 가능하나, 지출 관리에 주의가 필요합니다.',
    details: '기본적인 독립 조건은 갖추고 있으나, 일부 항목에서 개선의 여지가 있습니다.',
  },
  '불안정': {
    summary: '독립 생활 유지에 리스크가 있습니다.',
    details: '현재 상태로 독립을 시작할 경우, 예상치 못한 지출이나 수입 변동에 취약할 수 있습니다.',
  },
  '위험': {
    summary: '현재 상태로는 독립이 어렵습니다.',
    details: '재정 안정성이 부족한 상태입니다. 독립을 서두르기보다는 안정적인 수입 확보와 지출 구조 개선을 우선적으로 진행하시기 바랍니다.',
  },
  '독립 비권장': {
    summary: '현재 상태에서는 독립을 권장하지 않습니다.',
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
          <div className="absolute inset-0 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
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

function ScoreGauge({ score, showScore }) {
  const animatedScore = useAnimatedCount(score, 1000, showScore);
  const radius = 90;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;
  const offset = circumference - progress;

  const getScoreColor = (s) => {
    if (s >= 70) return 'emerald'; // blue in CSS
    if (s >= 50) return 'amber';
    return 'rose';
  };

  const colorClass = getScoreColor(animatedScore);

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
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-[48px] font-bold tabular-nums text-neutral-800 ${showScore ? 'animate-score-reveal' : 'opacity-0'}`}>
          {animatedScore}
        </span>
        <span className={`text-neutral-500 text-[13px] mt-1 ${showScore ? 'animate-fade-in' : 'opacity-0'}`}>
          / 100점
        </span>
      </div>
    </div>
  );
}

function IndependenceIndex({ categoryScores, showScore }) {
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
          <div key={index.label} className="animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-[14px] font-medium text-neutral-600">{index.label}</span>
              <span className={`text-[14px] font-semibold tabular-nums ${
                colorClass === 'emerald' ? 'text-emerald-600' :
                colorClass === 'amber' ? 'text-amber-500' : 'text-red-500'
              }`}>{score}</span>
            </div>
            <div className="index-bar">
              <div
                className={`index-bar-fill ${colorClass}`}
                style={{ width: showScore ? `${score}%` : '0%' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ShareCard({ result, cardRef }) {
  const gradeStyle = GRADE_STYLES[result?.grade] || {};

  return (
    <div
      ref={cardRef}
      className="fixed -left-[9999px] top-0 w-[400px] bg-white p-10"
      style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
    >
      <div className="text-center">
        <p className="text-xs text-gray-400 mb-1">Financial Independence Score</p>
        <h1 className="text-xl font-bold text-gray-900 mb-10">독립점수</h1>
        <p className="text-sm text-gray-500 mb-2">독립 가능성 점수</p>
        <p className="text-7xl font-bold text-gray-900 mb-2">{result?.score ?? 0}</p>
        <p className="text-gray-400 mb-6">/ 100점</p>
        <div className={`inline-block px-6 py-2 rounded-full ${gradeStyle.bg} ${gradeStyle.border} border ${gradeStyle.text} font-semibold mb-8`}>
          {result?.grade}
        </div>
        <div className="border-t border-gray-100 pt-6">
          <p className="text-xs text-gray-400">독립점수 | 독립 가능성 진단</p>
        </div>
      </div>
    </div>
  );
}

export function ResultStep() {
  const { income, expenses, answers, result, setResult, reset, setCurrentStep } = useSurvey();
  const { toast, showToast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [showScore, setShowScore] = useState(false);
  const [showGrade, setShowGrade] = useState(false);
  const [isImageSaving, setIsImageSaving] = useState(false);
  const shareCardRef = useRef(null);

  useEffect(() => {
    setIsLoading(true);

    const safeIncome = income || '0';
    const safeExpenses = { ...expenses };
    Object.keys(safeExpenses).forEach((key) => {
      if (!safeExpenses[key]) safeExpenses[key] = '0';
    });

    const expensesWithIncome = { ...safeExpenses, income: safeIncome };
    const calculatedResult = calculateResult(expensesWithIncome, answers || {});
    setResult(calculatedResult);

    const timer = setTimeout(() => {
      setIsLoading(false);
      setTimeout(() => setShowScore(true), 300);
      setTimeout(() => setShowGrade(true), 1500);
      if (calculatedResult) {
        AnalyticsEvents.reachResult(calculatedResult.score, calculatedResult.grade);
      }
    }, LOADING_DURATION);

    return () => clearTimeout(timer);
  }, [income, expenses, answers, setResult]);

  const handleRestart = () => {
    reset();
    setCurrentStep(0);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
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

    try {
      const canvas = await html2canvas(shareCardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const link = document.createElement('a');
      link.download = 'independent-score.png';
      link.href = canvas.toDataURL('image/png');
      link.click();

      showToast('이미지가 저장되었습니다');
      AnalyticsEvents.saveImage();
    } catch (err) {
      console.error('Image save error:', err);
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
        <p className="text-[13px] text-neutral-500 tracking-wide mb-3 font-medium">Analysis Report</p>
        <h1 className="text-[22px] font-bold text-neutral-800">진단 결과</h1>
      </header>

      {/* 점수 카드 */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-8 text-center mx-2">
        <p className="text-[15px] text-neutral-500 font-medium mb-6">독립 가능성 점수</p>
        <ScoreGauge score={result.score} showScore={showScore} />
        <div className={`inline-block px-5 py-2 mt-6 rounded-full ${gradeStyle.bg} ${gradeStyle.border} border ${gradeStyle.text} font-semibold text-[15px] ${showGrade ? 'animate-grade-reveal' : 'opacity-0'}`}>
          {result.grade}
        </div>
      </div>

      {/* 신뢰 안내 */}
      <p className="text-[14px] text-neutral-500 text-center leading-relaxed mx-4">
        이 결과는 입력한 정보를 기반으로 계산된 재정 안정성 진단입니다.
      </p>

      {/* 독립 준비도 인덱스 */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mx-2">
        <h3 className="text-[17px] font-bold text-neutral-800 mb-4">독립 준비도 인덱스</h3>
        <IndependenceIndex categoryScores={result.categoryScores} showScore={showScore} />
      </div>

      {/* 등급별 설명 */}
      {gradeDetail && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mx-2">
          <p className="text-[17px] text-neutral-800 font-bold mb-3 leading-relaxed">{gradeDetail.summary}</p>
          <p className="text-[15px] text-neutral-500 leading-relaxed">{gradeDetail.details}</p>
        </div>
      )}

      {/* 주거 유형별 맞춤 분석 */}
      {result.housingAnalysis && (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mx-2 space-y-5">
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
                <li key={index} className="flex items-start gap-2">
                  <span className="text-emerald-600 mt-0.5">•</span>
                  <span className="text-[14px] text-neutral-600">{strategy}</span>
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
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mx-2">
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
            <span className="text-[20px] font-bold text-emerald-600 tabular-nums">
              {(result.safetyAssets || 0).toLocaleString()}만원
            </span>
          </div>
        </div>
      </div>

      {/* 카테고리별 점수 */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mx-2">
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
                    score >= 70 ? 'bg-emerald-600' :
                    score >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className={`text-[14px] font-semibold w-8 text-right tabular-nums ${
                score >= 70 ? 'text-emerald-600' :
                score >= 50 ? 'text-amber-500' : 'text-red-500'
              }`}>
                {score}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 공유 영역 */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mx-2">
        <p className="text-center text-[14px] text-neutral-500 mb-3">
          주변 사람의 독립 준비도는 어떨까요?
        </p>
        <h3 className="text-[17px] font-bold text-neutral-800 mb-6 text-center">
          결과 공유하기
        </h3>
        <div className="flex gap-3">
          <button
            onClick={handleSaveImage}
            disabled={isImageSaving}
            className="btn-secondary flex-1 h-12 text-[14px] disabled:opacity-50"
          >
            {isImageSaving ? '저장 중...' : '이미지로 저장'}
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-secondary flex-1 h-12 text-[14px]"
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
        >
          처음부터 다시하기
        </button>
      </div>
    </div>
  );
}
