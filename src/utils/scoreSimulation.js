/**
 * 점수 상승 시뮬레이션 유틸리티
 * calculate.js의 가중치와 감점 테이블을 재활용하여
 * 지출 조정 시 예상 점수 변화를 계산
 */

// 카테고리별 가중치 (calculate.js와 동일)
const CATEGORY_WEIGHTS = {
  housing: 0.25,
  food: 0.15,
  fixed: 0.10,
  transport: 0.10,
  leisure: 0.10,
  misc: 0.10,
  savings: 0.20,
};

// 비율별 점수 테이블 (간소화 - 선형 보간)
const RATIO_SCORE_MAP = {
  housing: { optimal: 0.20, warning: 0.30, danger: 0.45 },
  food: { optimal: 0.15, warning: 0.25, danger: 0.35 },
  transport: { optimal: 0.05, warning: 0.12, danger: 0.20 },
  leisure: { optimal: 0.05, warning: 0.12, danger: 0.20 },
  fixed: { optimal: 0.15, warning: 0.25, danger: 0.30 },
  misc: { optimal: 0.05, warning: 0.12, danger: 0.15 },
  savings: { optimal: 0.20, warning: 0.10, danger: 0.05 }, // 역방향
};

/**
 * 비율로부터 카테고리 점수 추정 (간소화)
 */
function estimateCategoryScore(category, ratio) {
  const map = RATIO_SCORE_MAP[category];
  if (!map) return 70;

  // 저축은 역방향 (높을수록 좋음)
  if (category === 'savings') {
    if (ratio >= map.optimal) return 100;
    if (ratio >= map.warning) return 70 + ((ratio - map.warning) / (map.optimal - map.warning)) * 30;
    if (ratio >= map.danger) return 40 + ((ratio - map.danger) / (map.warning - map.danger)) * 30;
    return Math.max(0, 40 * (ratio / map.danger));
  }

  // 나머지는 정방향 (낮을수록 좋음)
  if (ratio <= map.optimal) return 100;
  if (ratio <= map.warning) return 70 + ((map.warning - ratio) / (map.warning - map.optimal)) * 30;
  if (ratio <= map.danger) return 40 + ((map.danger - ratio) / (map.danger - map.warning)) * 30;
  return Math.max(0, 40 * (1 - (ratio - map.danger) / map.danger));
}

/**
 * 카테고리 점수들로부터 종합 점수 계산
 */
function calculateTotalScore(categoryScores) {
  let weightedSum = 0;
  Object.entries(CATEGORY_WEIGHTS).forEach(([category, weight]) => {
    weightedSum += (categoryScores[category] || 70) * weight;
  });
  return Math.round(weightedSum);
}

/**
 * 지출 조정 시 예상 점수 변화 시뮬레이션
 *
 * @param {Object} params
 * @param {number} params.currentScore - 현재 점수
 * @param {Object} params.categoryScores - 현재 카테고리별 점수
 * @param {number} params.income - 월 수입
 * @param {Object} params.expenses - 현재 지출 { housing, food, ... }
 * @param {Object} params.adjustments - 조정값 { housing: -10, savings: +5, ... } (만원 단위)
 * @returns {Object} 시뮬레이션 결과
 */
export function simulateScoreChange({ currentScore, income, expenses, adjustments }) {
  if (!income || income <= 0) return null;

  const newExpenses = { ...expenses };
  const changes = [];

  // 조정 적용
  Object.entries(adjustments).forEach(([category, adjustment]) => {
    if (adjustment !== 0) {
      const oldValue = newExpenses[category] || 0;
      newExpenses[category] = Math.max(0, oldValue + adjustment);

      const oldRatio = oldValue / income;
      const newRatio = newExpenses[category] / income;
      const oldScore = estimateCategoryScore(category, oldRatio);
      const newScore = estimateCategoryScore(category, newRatio);

      changes.push({
        category,
        adjustment,
        oldRatio: Math.round(oldRatio * 100),
        newRatio: Math.round(newRatio * 100),
        scoreDiff: Math.round(newScore - oldScore),
      });
    }
  });

  // 새 카테고리 점수 계산
  const newCategoryScores = {};
  Object.keys(CATEGORY_WEIGHTS).forEach(category => {
    const expense = newExpenses[category] || 0;
    const ratio = expense / income;
    newCategoryScores[category] = Math.round(estimateCategoryScore(category, ratio));
  });

  const newScore = calculateTotalScore(newCategoryScores);
  const scoreDiff = newScore - currentScore;

  return {
    currentScore,
    newScore,
    scoreDiff,
    changes,
    newCategoryScores,
  };
}

/**
 * 목표 점수 달성을 위한 최적 조정 조합 찾기
 *
 * @param {Object} params
 * @param {number} params.currentScore - 현재 점수
 * @param {number} params.targetScore - 목표 점수
 * @param {Object} params.categoryScores - 현재 카테고리별 점수
 * @param {number} params.income - 월 수입
 * @param {Object} params.expenses - 현재 지출
 * @returns {Object} 최적 조정 조합
 */
export function findOptimalAdjustments({ currentScore, targetScore, categoryScores, income, expenses }) {
  if (!income || income <= 0 || currentScore >= targetScore) {
    return {
      isAchievable: currentScore >= targetScore,
      adjustments: [],
      projectedScore: currentScore,
      totalMonthlySaving: 0,
    };
  }

  const recommendations = [];

  // 각 카테고리별 개선 가능성 분석
  const categories = ['housing', 'food', 'leisure', 'transport', 'misc', 'fixed'];

  categories.forEach(category => {
    const currentExpense = expenses[category] || 0;
    const currentRatio = currentExpense / income;
    const optimalRatio = RATIO_SCORE_MAP[category]?.optimal || 0.1;

    // 현재 비율이 최적보다 높으면 절감 여지 있음
    if (currentRatio > optimalRatio) {
      const potentialSaving = Math.round((currentRatio - optimalRatio) * income);
      const reductionSteps = [5, 10, 15, 20]; // 5만원 단위 절감

      reductionSteps.forEach(reduction => {
        if (reduction <= potentialSaving && reduction <= currentExpense) {
          const sim = simulateScoreChange({
            currentScore,
            categoryScores,
            income,
            expenses,
            adjustments: { [category]: -reduction },
          });

          if (sim && sim.scoreDiff > 0) {
            recommendations.push({
              category,
              type: 'reduce',
              amount: reduction,
              scoreDiff: sim.scoreDiff,
              efficiency: sim.scoreDiff / reduction, // 점수/만원
              description: getCategoryLabel(category) + ` ${reduction}만원 절감`,
            });
          }
        }
      });
    }
  });

  // 저축 증가 시뮬레이션
  const savingsSteps = [5, 10, 15, 20];
  savingsSteps.forEach(increase => {
    const sim = simulateScoreChange({
      currentScore,
      categoryScores,
      income,
      expenses,
      adjustments: { savings: increase },
    });

    if (sim && sim.scoreDiff > 0) {
      recommendations.push({
        category: 'savings',
        type: 'increase',
        amount: increase,
        scoreDiff: sim.scoreDiff,
        efficiency: sim.scoreDiff / increase,
        description: `저축 ${increase}만원 증가`,
      });
    }
  });

  // 효율성 순으로 정렬 (점수/만원 높은 순)
  recommendations.sort((a, b) => b.efficiency - a.efficiency);

  // 목표 달성을 위한 최적 조합 선택
  const selectedAdjustments = [];
  let projectedScore = currentScore;
  let totalMonthlySaving = 0;
  const usedCategories = new Set();

  for (const rec of recommendations) {
    if (projectedScore >= targetScore) break;
    if (usedCategories.has(rec.category)) continue;

    selectedAdjustments.push(rec);
    projectedScore += rec.scoreDiff;
    usedCategories.add(rec.category);

    if (rec.type === 'reduce') {
      totalMonthlySaving += rec.amount;
    }
  }

  return {
    isAchievable: projectedScore >= targetScore,
    adjustments: selectedAdjustments.slice(0, 4), // 최대 4개
    projectedScore: Math.min(projectedScore, 100),
    totalMonthlySaving,
    recommendations: recommendations.slice(0, 6), // 전체 추천 6개
  };
}

/**
 * 목표 점수 달성 예상 시점 계산
 *
 * @param {Object} params
 * @param {number} params.currentScore - 현재 점수
 * @param {number} params.targetScore - 목표 점수
 * @param {number} params.monthlySavingIncrease - 월 저축 증가분 (만원)
 * @returns {Object} 달성 예상 시점
 */
export function estimateAchievementTimeline({ currentScore, targetScore, monthlySavingIncrease = 0 }) {
  const scoreGap = targetScore - currentScore;

  if (scoreGap <= 0) {
    return { months: 0, isImmediate: true };
  }

  // 기본 가정: 리빌드 플랜 적용 시 월 2-3점 상승 가능
  // 저축 증가분에 따라 가속
  const baseMonthlyImprovement = 2;
  const savingsBonus = monthlySavingIncrease > 0 ? Math.min(monthlySavingIncrease / 10, 2) : 0;
  const monthlyImprovement = baseMonthlyImprovement + savingsBonus;

  const monthsWithPlan = Math.ceil(scoreGap / monthlyImprovement);
  const monthsWithoutPlan = Math.ceil(scoreGap / 1); // 플랜 없이는 월 1점

  return {
    monthsWithPlan: Math.min(monthsWithPlan, 12),
    monthsWithoutPlan: Math.min(monthsWithoutPlan, 24),
    savedMonths: monthsWithoutPlan - monthsWithPlan,
    monthlyImprovement,
  };
}

/**
 * 프리미엄 리포트용 종합 시뮬레이션
 */
export function generatePremiumPreview({ result, expenses, income }) {
  const currentScore = result?.score || 50;
  const categoryScores = result?.categoryScores || {};

  // 목표 점수 설정 (다음 등급 기준)
  let targetScore;
  if (currentScore < 45) targetScore = 55;
  else if (currentScore < 55) targetScore = 70;
  else if (currentScore < 70) targetScore = 85;
  else if (currentScore < 85) targetScore = 95;
  else targetScore = 100;

  // 최적 조정 찾기
  const optimal = findOptimalAdjustments({
    currentScore,
    targetScore,
    categoryScores,
    income: income || result?.income || 0,
    expenses: expenses || {},
  });

  // 달성 시점 계산
  const timeline = estimateAchievementTimeline({
    currentScore,
    targetScore,
    monthlySavingIncrease: optimal.totalMonthlySaving,
  });

  // 3개월/6개월 예상 점수
  const month3Score = Math.min(currentScore + (timeline.monthlyImprovement * 3), targetScore);
  const month6Score = Math.min(currentScore + (timeline.monthlyImprovement * 6), targetScore);

  return {
    currentScore,
    targetScore,
    projectedScore: optimal.projectedScore,
    isAchievable: optimal.isAchievable,
    adjustments: optimal.adjustments,
    totalMonthlySaving: optimal.totalMonthlySaving,
    timeline,
    month3Score: Math.round(month3Score),
    month6Score: Math.round(month6Score),
    savedMonths: timeline.savedMonths,
  };
}

function getCategoryLabel(category) {
  const labels = {
    housing: '주거비',
    food: '식비',
    fixed: '고정지출',
    transport: '교통비',
    leisure: '여가비',
    misc: '생활잡비',
    savings: '저축',
  };
  return labels[category] || category;
}
