/**
 * 프리미엄 리포트 데이터 계산 유틸리티
 */

// 카테고리 라벨
const CATEGORY_LABELS = {
  housing: '주거비',
  food: '식비',
  fixed: '고정지출',
  transport: '교통비',
  leisure: '여가비',
  misc: '생활잡비',
  savings: '저축',
};

// 권장 비율 (수입 대비)
const RECOMMENDED_RATIOS = {
  housing: 0.20,
  food: 0.15,
  fixed: 0.10,
  transport: 0.08,
  leisure: 0.08,
  misc: 0.05,
  savings: 0.20,
};

// 등급 기준
const GRADE_THRESHOLDS = [
  { min: 85, grade: '매우 안정', emoji: '🟢' },
  { min: 70, grade: '안정', emoji: '🟢' },
  { min: 55, grade: '주의', emoji: '🟡' },
  { min: 45, grade: '위험', emoji: '🟠' },
  { min: 0, grade: '매우 위험', emoji: '🔴' },
];

/**
 * 등급 계산
 */
function getGrade(score) {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold;
    }
  }
  return GRADE_THRESHOLDS[GRADE_THRESHOLDS.length - 1];
}

/**
 * 백분위 계산 (간단한 추정)
 */
function getPercentile(score, averageScore = 61) {
  // 정규분포 가정, 표준편차 15
  const stdDev = 15;
  const z = (score - averageScore) / stdDev;
  // 간단한 백분위 추정
  const percentile = Math.round(50 + z * 34);
  return Math.max(1, Math.min(99, percentile));
}

/**
 * 최적 절감 조합 계산
 */
function calculateOptimalAdjustments(result, income, expenses) {
  const adjustments = [];
  const categoryScores = result?.categoryScores || {};

  // 각 카테고리별 개선 가능성 분석
  Object.entries(expenses).forEach(([category, expense]) => {
    if (category === 'income' || !RECOMMENDED_RATIOS[category]) return;

    const currentRatio = expense / income;
    const recommendedRatio = RECOMMENDED_RATIOS[category];
    const score = categoryScores[category] || 70;

    if (category === 'savings') {
      // 저축은 증가
      if (currentRatio < recommendedRatio) {
        const increaseAmount = Math.round((recommendedRatio - currentRatio) * income);
        const cappedIncrease = Math.min(increaseAmount, 20); // 최대 20만원
        if (cappedIncrease >= 5) {
          const scoreDiff = Math.round(cappedIncrease * 0.8); // 만원당 0.8점
          adjustments.push({
            category,
            label: CATEGORY_LABELS[category],
            type: 'increase',
            amount: cappedIncrease,
            scoreDiff,
            efficiency: scoreDiff / cappedIncrease,
            currentRatio: Math.round(currentRatio * 100),
            recommendedRatio: Math.round(recommendedRatio * 100),
          });
        }
      }
    } else {
      // 지출은 감소
      if (currentRatio > recommendedRatio && score < 80) {
        const reduceAmount = Math.round((currentRatio - recommendedRatio) * income);
        const cappedReduce = Math.min(reduceAmount, 15); // 최대 15만원
        if (cappedReduce >= 3) {
          const scoreDiff = Math.round(cappedReduce * 0.9); // 만원당 0.9점
          adjustments.push({
            category,
            label: CATEGORY_LABELS[category],
            type: 'reduce',
            amount: cappedReduce,
            scoreDiff,
            efficiency: scoreDiff / cappedReduce,
            currentRatio: Math.round(currentRatio * 100),
            recommendedRatio: Math.round(recommendedRatio * 100),
          });
        }
      }
    }
  });

  // 효율성 순으로 정렬
  adjustments.sort((a, b) => b.efficiency - a.efficiency);

  // 상위 3개 선택하여 최적 조합 구성
  const optimalCombo = adjustments.slice(0, 3);
  const totalAdjustment = optimalCombo.reduce((sum, a) => sum + a.amount, 0);
  const totalScoreDiff = optimalCombo.reduce((sum, a) => sum + a.scoreDiff, 0);

  // 실현 가능성 계산 (조정 금액 / 소득 비율 기반)
  // 조정 비율이 낮을수록 실현 가능성 높음
  const adjustmentRatio = totalAdjustment / income;
  const feasibilityRate = Math.round(Math.max(70, Math.min(98, 100 - adjustmentRatio * 100)));

  return {
    adjustments: optimalCombo,
    totalAdjustment,
    totalScoreDiff,
    feasibilityRate,
    allAdjustments: adjustments,
  };
}

/**
 * 누적 손실 계산
 */
function calculateCumulativeLoss(income, expenses) {
  const currentSavings = expenses.savings || 0;
  const recommendedSavings = Math.round(income * RECOMMENDED_RATIOS.savings);
  const monthlySavingsGap = Math.max(0, recommendedSavings - currentSavings);

  return {
    monthly: monthlySavingsGap,
    yearly: monthlySavingsGap * 12,
    threeYear: monthlySavingsGap * 12 * 3,
    fiveYear: monthlySavingsGap * 12 * 5,
    toAge30: (userAge) => monthlySavingsGap * 12 * Math.max(0, 30 - userAge),
  };
}

/**
 * 독립 시뮬레이션
 */
function simulateIndependence(result, income, expenses, optimalAdjustments) {
  const currentScore = result?.score || 50;
  const totalScoreDiff = optimalAdjustments?.totalScoreDiff || 10;
  const targetScore = 70; // "안정" 등급 기준

  const totalExpenses = Object.entries(expenses)
    .filter(([key]) => key !== 'income' && key !== 'savings')
    .reduce((sum, [, val]) => sum + (Number(val) || 0), 0);

  const monthlySurplus = income - totalExpenses;
  const currentEmergencyFund = (expenses.savings || 0) * 3; // 가정: 저축 3개월분

  // 안정 등급까지 필요한 점수
  const pointsNeeded = Math.max(0, targetScore - currentScore);

  // 시나리오 A: 지금 바로 독립 (월 1점 상승 가정 - 느린 개선)
  const monthsToStabilityA = pointsNeeded > 0 ? Math.ceil(pointsNeeded / 1) : 0;

  // 시나리오 B: 3개월 준비 후 (최적화 적용, 월 3-4점 상승)
  const improvedScore = currentScore + totalScoreDiff;
  const pointsNeededAfterPrep = Math.max(0, targetScore - improvedScore);
  const monthsToStabilityB = pointsNeededAfterPrep > 0 ? Math.ceil(pointsNeededAfterPrep / 2) : 0;

  // 시나리오 A: 지금 바로 독립
  const scenarioA = {
    monthlySurplus,
    isDeficit: monthlySurplus < 0,
    sixMonthFund: currentEmergencyFund + (monthlySurplus * 6),
    riskProbability: monthlySurplus < 0 ? Math.min(95, 50 + Math.abs(monthlySurplus) * 2) : Math.max(15, 40 - monthlySurplus),
    monthsToStability: monthsToStabilityA,
  };

  // 시나리오 B: 3개월 준비 후
  const improvedSurplus = monthlySurplus + optimalAdjustments.totalAdjustment;
  const scenarioB = {
    monthlySurplus: improvedSurplus,
    isDeficit: improvedSurplus < 0,
    sixMonthFund: currentEmergencyFund + (optimalAdjustments.totalAdjustment * 3) + (improvedSurplus * 6),
    successProbability: improvedSurplus >= 0 ? Math.min(95, 60 + improvedSurplus * 2) : Math.max(20, 50 + improvedSurplus),
    monthsToStability: monthsToStabilityB,
  };

  // 최적 독립 시점
  const monthsToReady = monthlySurplus >= 10 ? 0 : Math.ceil((10 - monthlySurplus) / 5);
  const optimalDate = new Date();
  optimalDate.setMonth(optimalDate.getMonth() + Math.max(monthsToReady, 3));

  return {
    scenarioA,
    scenarioB,
    optimalDate,
    monthsToReady: Math.max(monthsToReady, 3),
    monthsSaved: Math.max(0, monthsToStabilityA - monthsToStabilityB - 3), // 3개월 준비 기간 제외
  };
}

/**
 * 비상금 계획
 */
function calculateEmergencyPlan(income, expenses) {
  const totalExpenses = Object.entries(expenses)
    .filter(([key]) => key !== 'income' && key !== 'savings')
    .reduce((sum, [, val]) => sum + (Number(val) || 0), 0);

  const currentFund = (expenses.savings || 0) * 2; // 가정
  const recommendedFund = totalExpenses * 3;
  const gap = Math.max(0, recommendedFund - currentFund);

  const plans = [
    { monthly: 15, months: Math.ceil(gap / 15) },
    { monthly: 20, months: Math.ceil(gap / 20), recommended: true },
    { monthly: 25, months: Math.ceil(gap / 25) },
  ];

  return {
    currentFund,
    recommendedFund,
    gap,
    plans,
  };
}

/**
 * 카테고리별 상세 분석
 */
function analyzeCategoryDetails(result, income, expenses) {
  const details = [];
  const categoryScores = result?.categoryScores || {};

  Object.entries(expenses).forEach(([category, expense]) => {
    if (category === 'income' || !CATEGORY_LABELS[category]) return;

    const score = categoryScores[category] || 70;
    const currentRatio = Math.round((expense / income) * 100);
    const recommendedRatio = Math.round((RECOMMENDED_RATIOS[category] || 0.1) * 100);
    const isOverBudget = category !== 'savings' ? currentRatio > recommendedRatio : currentRatio < recommendedRatio;
    const gap = Math.abs(currentRatio - recommendedRatio);

    // 연간 손실 계산
    const monthlyLoss = category !== 'savings'
      ? Math.max(0, expense - income * (RECOMMENDED_RATIOS[category] || 0.1))
      : Math.max(0, income * RECOMMENDED_RATIOS.savings - expense);

    details.push({
      category,
      label: CATEGORY_LABELS[category],
      expense,
      score,
      currentRatio,
      recommendedRatio,
      isOverBudget,
      gap,
      monthlyLoss,
      yearlyLoss: monthlyLoss * 12,
      suggestions: getSuggestions(category, isOverBudget),
    });
  });

  // gap 큰 순으로 정렬 (개선 필요도 높은 순)
  details.sort((a, b) => {
    // 먼저 isOverBudget 기준 (문제 있는 것 먼저)
    if (a.isOverBudget !== b.isOverBudget) {
      return a.isOverBudget ? -1 : 1;
    }
    // 그 다음 gap 큰 순
    return b.gap - a.gap;
  });

  return details;
}

/**
 * 카테고리별 개선 제안
 */
function getSuggestions(category, isOverBudget) {
  if (!isOverBudget) return ['현재 적정 수준입니다.'];

  const suggestions = {
    housing: [
      '월세 재협상 검토 (5-10만원 절감 가능)',
      '주거급여 신청 자격 확인',
      '이사 시 더 저렴한 지역 검토',
    ],
    food: [
      '주 2회 외식을 1회로 줄이기',
      '식재료 대량 구매 및 meal prep',
      '배달 앱 대신 직접 픽업',
    ],
    transport: [
      '대중교통 정기권 활용',
      '카풀 또는 자전거 출퇴근 검토',
      '불필요한 차량 유지비 점검',
    ],
    leisure: [
      '무료/저가 문화생활 탐색',
      '구독 서비스 통합 또는 해지',
      '월 여가비 예산 설정 후 관리',
    ],
    fixed: [
      '통신비 요금제 재검토',
      '보험 중복 가입 확인',
      '사용 안 하는 구독 서비스 해지',
    ],
    misc: [
      '소액 결제 내역 주간 점검',
      '충동구매 24시간 룰 적용',
      '현금/체크카드 사용으로 지출 인식 강화',
    ],
    savings: [
      '급여일 다음날 자동이체 설정',
      '비상금 전용 통장 분리',
      '저축 목표 시각화 (앱 활용)',
    ],
  };

  return suggestions[category] || ['지출 패턴을 점검해보세요.'];
}

/**
 * 6개월 로드맵 생성
 */
function generateRoadmap(result, optimalAdjustments) {
  const currentScore = result?.score || 50;
  const totalScoreDiff = optimalAdjustments?.totalScoreDiff || 10;

  // 점수 상승 분배 (총합이 optimalAdjustments.totalScoreDiff와 일치하도록)
  const month1Diff = Math.round(totalScoreDiff * 0.25);
  const month2Diff = Math.round(totalScoreDiff * 0.15);
  const month3Diff = Math.round(totalScoreDiff * 0.35);
  const month4Diff = Math.round(totalScoreDiff * 0.10);
  const month5Diff = Math.round(totalScoreDiff * 0.08);
  const month6Diff = totalScoreDiff - month1Diff - month2Diff - month3Diff - month4Diff - month5Diff;

  const month3Score = Math.min(100, currentScore + month1Diff + month2Diff + month3Diff);
  const finalScore = Math.min(100, currentScore + totalScoreDiff);
  const month3Grade = getGrade(month3Score).grade;

  return [
    {
      month: 1,
      title: '새는 돈 막기',
      tasks: [
        '구독 서비스 정리 (-2만원)',
        '충동구매 패턴 파악',
        '지출 앱 설치 및 기록 시작',
      ],
      expectedScore: currentScore + month1Diff,
      scoreDiff: month1Diff,
      isDetailed: true,
    },
    {
      month: 2,
      title: '고정비 최적화',
      tasks: [
        '통신비 재검토 (-1만원)',
        '보험 중복 확인',
        '공과금 자동이체 설정',
      ],
      expectedScore: currentScore + month1Diff + month2Diff,
      scoreDiff: month2Diff,
      isDetailed: true,
    },
    {
      month: 3,
      title: '저축 자동화',
      tasks: [
        '저축 자동이체 설정',
        '비상금 통장 분리',
        '목표 금액 설정',
      ],
      expectedScore: month3Score,
      scoreDiff: month3Diff,
      milestone: `${month3Score}점 달성 (${month3Grade})`,
      isDetailed: true,
    },
    {
      month: 4,
      title: '습관 점검',
      tasks: ['1분기 리뷰 및 조정'],
      expectedScore: currentScore + month1Diff + month2Diff + month3Diff + month4Diff,
      scoreDiff: month4Diff,
      isDetailed: false,
    },
    {
      month: 5,
      title: '목표 재설정',
      tasks: ['비상금 점검 및 목표 수정'],
      expectedScore: currentScore + month1Diff + month2Diff + month3Diff + month4Diff + month5Diff,
      scoreDiff: month5Diff,
      isDetailed: false,
    },
    {
      month: 6,
      title: '습관 정착',
      tasks: ['6개월 성과 리뷰'],
      expectedScore: finalScore,
      scoreDiff: month6Diff,
      milestone: `${finalScore}점 달성 (+${totalScoreDiff}점)`,
      isDetailed: false,
    },
  ];
}

/**
 * 맞춤 예산표 생성
 */
function generateBudgetTable(income, expenses, optimalAdjustments) {
  const table = [];
  const adjustmentMap = {};

  optimalAdjustments.adjustments.forEach(adj => {
    adjustmentMap[adj.category] = adj;
  });

  Object.entries(expenses).forEach(([category, expense]) => {
    if (category === 'income' || !CATEGORY_LABELS[category]) return;

    const adj = adjustmentMap[category];
    const recommended = adj
      ? (adj.type === 'reduce' ? expense - adj.amount : expense + adj.amount)
      : expense;
    const change = recommended - expense;
    const scoreDiff = adj?.scoreDiff || 0;

    table.push({
      category,
      label: CATEGORY_LABELS[category],
      current: expense,
      recommended,
      change,
      scoreDiff,
    });
  });

  return table;
}

/**
 * 전체 리포트 데이터 생성
 */
export function generateReportData(result, income, expenses, userAge = 25, userEmail = '') {
  const score = result?.score || 50;
  const grade = getGrade(score);
  const averageScore = 61; // TODO: 실제 평균 데이터
  const percentile = getPercentile(score, averageScore);

  const optimalAdjustments = calculateOptimalAdjustments(result, income, expenses);
  const cumulativeLoss = calculateCumulativeLoss(income, expenses);
  const independence = simulateIndependence(result, income, expenses, optimalAdjustments);
  const emergencyPlan = calculateEmergencyPlan(income, expenses);
  const categoryDetails = analyzeCategoryDetails(result, income, expenses);
  const roadmap = generateRoadmap(result, optimalAdjustments);
  const budgetTable = generateBudgetTable(income, expenses, optimalAdjustments);

  // 사용자 이름 추출 (이메일 @ 앞부분)
  const userName = userEmail ? userEmail.split('@')[0] : '';

  return {
    // 기본 정보
    generatedAt: new Date().toISOString(),
    userEmail,
    userName,
    score,
    grade: grade.grade,
    gradeEmoji: grade.emoji,
    averageScore,
    percentile,
    isAboveAverage: score >= averageScore,

    // 수입/지출
    income,
    totalExpenses: Object.entries(expenses)
      .filter(([key]) => key !== 'income' && key !== 'savings')
      .reduce((sum, [, val]) => sum + (Number(val) || 0), 0),

    // 핵심 분석
    optimalAdjustments,
    cumulativeLoss: {
      monthly: cumulativeLoss.monthly,
      yearly: cumulativeLoss.yearly,
      threeYear: cumulativeLoss.threeYear,
      fiveYear: cumulativeLoss.fiveYear,
      toAge30: cumulativeLoss.toAge30(userAge),
    },

    // 시뮬레이션
    independence,
    emergencyPlan,

    // 상세 분석
    categoryDetails,
    roadmap,
    budgetTable,

    // 예상 점수
    projectedScore: Math.min(100, score + optimalAdjustments.totalScoreDiff),
    projectedGrade: getGrade(Math.min(100, score + optimalAdjustments.totalScoreDiff)).grade,
  };
}
