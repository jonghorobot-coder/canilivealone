/**
 * 목표 점수 시뮬레이션 엔진
 *
 * 사용자가 목표 점수에 도달하기 위해 무엇을 얼마나 개선해야 하는지 계산합니다.
 *
 * [설계 원칙]
 * - 실제 금액 변화에 따른 점수 변화를 계산
 * - 가중치가 높고 현재 점수가 낮은 카테고리 우선 추천
 * - 현실적으로 조정 가능한 항목만 제안
 * - 향후 프리미엄 기능/PDF 생성 연동을 위해 배열 구조로 관리
 */

import {
  calculateFoodRatioPenalty,
  calculateFixedRatioPenalty,
  calculateTransportRatioPenalty,
  calculateLeisureRatioPenalty,
  calculateMiscRatioPenalty,
  calculateSavingsRatioPenalty,
  calculateHousingRatioPenalty,
} from './calculate';

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

// 카테고리 라벨
const CATEGORY_LABELS = {
  housing: '주거비',
  food: '식비',
  fixed: '고정지출',
  transport: '교통비',
  leisure: '여가비',
  misc: '생활 잡비',
  savings: '저축',
};

// 조정 단위 (만원)
const ADJUSTMENT_STEPS = [5, 10, 15, 20, 30];

/**
 * 비율 변화에 따른 감점 차이를 계산합니다.
 * @param {string} category - 카테고리 ID
 * @param {number} currentRatio - 현재 비율
 * @param {number} newRatio - 새 비율
 * @returns {number} 감점 개선량 (양수)
 */
function calculatePenaltyImprovement(category, currentRatio, newRatio) {
  let currentPenalty = 0;
  let newPenalty = 0;

  switch (category) {
    case 'food':
      currentPenalty = calculateFoodRatioPenalty(currentRatio).penalty;
      newPenalty = calculateFoodRatioPenalty(newRatio).penalty;
      break;
    case 'fixed':
      currentPenalty = calculateFixedRatioPenalty(currentRatio).penalty;
      newPenalty = calculateFixedRatioPenalty(newRatio).penalty;
      break;
    case 'transport':
      currentPenalty = calculateTransportRatioPenalty(currentRatio).penalty;
      newPenalty = calculateTransportRatioPenalty(newRatio).penalty;
      break;
    case 'leisure':
      currentPenalty = calculateLeisureRatioPenalty(currentRatio).penalty;
      newPenalty = calculateLeisureRatioPenalty(newRatio).penalty;
      break;
    case 'misc':
      currentPenalty = calculateMiscRatioPenalty(currentRatio).penalty;
      newPenalty = calculateMiscRatioPenalty(newRatio).penalty;
      break;
    case 'housing':
      currentPenalty = calculateHousingRatioPenalty(currentRatio).penalty;
      newPenalty = calculateHousingRatioPenalty(newRatio).penalty;
      break;
    case 'savings':
      // 저축은 역방향 (높을수록 좋음)
      currentPenalty = calculateSavingsRatioPenalty(currentRatio).penalty;
      newPenalty = calculateSavingsRatioPenalty(newRatio).penalty;
      break;
    default:
      return 0;
  }

  // 감점이 줄어든 만큼 점수 상승
  return newPenalty - currentPenalty; // 둘 다 음수이므로 차이가 양수면 개선
}

/**
 * 카테고리 점수 변화가 총점에 미치는 영향을 계산합니다.
 * @param {string} category - 카테고리 ID
 * @param {number} categoryScoreChange - 카테고리 점수 변화
 * @returns {number} 총점 변화
 */
function calculateTotalScoreImpact(category, categoryScoreChange) {
  const weight = CATEGORY_WEIGHTS[category] || 0;
  return categoryScoreChange * weight;
}

/**
 * 지출 카테고리의 개선 시나리오를 계산합니다.
 * @param {Object} params
 * @param {string} params.category - 카테고리 ID
 * @param {number} params.currentAmount - 현재 금액 (만원)
 * @param {number} params.income - 월 수입 (만원)
 * @param {number} params.currentCategoryScore - 현재 카테고리 점수
 * @returns {Array} 개선 시나리오 배열
 */
function calculateExpenseReductionScenarios({ category, currentAmount, income, currentCategoryScore }) {
  const scenarios = [];
  if (income <= 0 || currentAmount <= 0) return scenarios;

  const currentRatio = currentAmount / income;

  for (const reduction of ADJUSTMENT_STEPS) {
    const newAmount = Math.max(0, currentAmount - reduction);
    const newRatio = newAmount / income;

    // 비율 감점 개선량
    const penaltyImprovement = calculatePenaltyImprovement(category, currentRatio, newRatio);

    if (penaltyImprovement > 0) {
      // 카테고리 점수 상승
      const categoryScoreIncrease = penaltyImprovement;
      // 총점 상승
      const totalScoreIncrease = calculateTotalScoreImpact(category, categoryScoreIncrease);

      if (totalScoreIncrease >= 0.5) { // 0.5점 이상 상승하는 경우만 추천
        scenarios.push({
          category,
          categoryLabel: CATEGORY_LABELS[category],
          action: 'reduce',
          actionLabel: '절감',
          amount: reduction,
          newAmount,
          categoryScoreIncrease: Math.round(categoryScoreIncrease),
          totalScoreIncrease: Math.round(totalScoreIncrease * 10) / 10,
          description: `${CATEGORY_LABELS[category]}를 월 ${reduction}만원 줄이면`,
          impact: `+${Math.round(totalScoreIncrease)}점 상승`,
        });
      }
    }
  }

  return scenarios;
}

/**
 * 저축 증가 시나리오를 계산합니다.
 * @param {Object} params
 * @param {number} params.currentAmount - 현재 저축액 (만원)
 * @param {number} params.income - 월 수입 (만원)
 * @returns {Array} 개선 시나리오 배열
 */
function calculateSavingsIncreaseScenarios({ currentAmount, income }) {
  const scenarios = [];
  if (income <= 0) return scenarios;

  const currentRatio = currentAmount / income;

  for (const increase of ADJUSTMENT_STEPS) {
    const newAmount = currentAmount + increase;
    const newRatio = newAmount / income;

    // 비율 감점 개선량 (저축은 높을수록 좋음)
    const penaltyImprovement = calculatePenaltyImprovement('savings', currentRatio, newRatio);

    if (penaltyImprovement > 0) {
      const categoryScoreIncrease = penaltyImprovement;
      const totalScoreIncrease = calculateTotalScoreImpact('savings', categoryScoreIncrease);

      if (totalScoreIncrease >= 0.5) {
        scenarios.push({
          category: 'savings',
          categoryLabel: CATEGORY_LABELS.savings,
          action: 'increase',
          actionLabel: '증가',
          amount: increase,
          newAmount,
          categoryScoreIncrease: Math.round(categoryScoreIncrease),
          totalScoreIncrease: Math.round(totalScoreIncrease * 10) / 10,
          description: `저축을 월 ${increase}만원 늘리면`,
          impact: `+${Math.round(totalScoreIncrease)}점 상승`,
        });
      }
    }
  }

  return scenarios;
}

/**
 * 목표 점수 달성을 위한 개선 로드맵을 생성합니다.
 * @param {Object} params
 * @param {number} params.currentScore - 현재 점수
 * @param {number} params.targetScore - 목표 점수
 * @param {Object} params.categoryScores - 카테고리별 점수
 * @param {Object} params.expenses - 지출 데이터 (만원)
 * @param {number} params.income - 월 수입 (만원)
 * @returns {Object} 개선 로드맵
 */
export function generateImprovementRoadmap({ currentScore, targetScore, categoryScores, expenses, income }) {
  const scoreDifference = targetScore - currentScore;

  if (scoreDifference <= 0) {
    return {
      isAchievable: true,
      alreadyAchieved: true,
      scoreDifference: 0,
      recommendations: [],
      totalPotentialIncrease: 0,
      estimatedMonths: 0,
      summary: '이미 목표 점수에 도달했습니다.',
    };
  }

  // 모든 카테고리의 개선 시나리오 수집
  const allScenarios = [];

  // 지출 감소 시나리오 (housing, food, fixed, transport, leisure, misc)
  const expenseCategories = ['food', 'fixed', 'transport', 'leisure', 'misc'];

  expenseCategories.forEach((category) => {
    const scenarios = calculateExpenseReductionScenarios({
      category,
      currentAmount: parseAmount(expenses[category]),
      income,
      currentCategoryScore: categoryScores[category] || 100,
    });
    allScenarios.push(...scenarios);
  });

  // 주거비 감소 시나리오 (주거비는 줄이기 어려우므로 별도 표시)
  const housingScenarios = calculateExpenseReductionScenarios({
    category: 'housing',
    currentAmount: parseAmount(expenses.housing),
    income,
    currentCategoryScore: categoryScores.housing || 100,
  });
  // 주거비는 실현 가능성이 낮으므로 별도 표시
  housingScenarios.forEach(s => { s.difficulty = 'hard'; });
  allScenarios.push(...housingScenarios);

  // 저축 증가 시나리오
  const savingsScenarios = calculateSavingsIncreaseScenarios({
    currentAmount: parseAmount(expenses.savings),
    income,
  });
  allScenarios.push(...savingsScenarios);

  // 점수 상승 효과가 큰 순으로 정렬
  allScenarios.sort((a, b) => b.totalScoreIncrease - a.totalScoreIncrease);

  // 목표 달성에 필요한 최적 조합 선택
  const recommendations = [];
  let accumulatedIncrease = 0;
  const usedCategories = new Set();

  for (const scenario of allScenarios) {
    // 같은 카테고리는 한 번만 추천
    if (usedCategories.has(scenario.category)) continue;

    recommendations.push(scenario);
    usedCategories.add(scenario.category);
    accumulatedIncrease += scenario.totalScoreIncrease;

    // 목표 달성 가능하면 중단
    if (accumulatedIncrease >= scoreDifference) break;

    // 최대 5개까지만 추천
    if (recommendations.length >= 5) break;
  }

  // 달성 가능 여부 및 예상 기간 계산
  const isAchievable = accumulatedIncrease >= scoreDifference;

  // 예상 달성 기간 (월 단위)
  // - 1~5점 차이: 1개월
  // - 6~10점 차이: 2개월
  // - 11~20점 차이: 3개월
  // - 20점 초과: 6개월+
  let estimatedMonths;
  if (scoreDifference <= 5) estimatedMonths = 1;
  else if (scoreDifference <= 10) estimatedMonths = 2;
  else if (scoreDifference <= 20) estimatedMonths = 3;
  else estimatedMonths = 6;

  // 실행 팁 생성
  const actionTip = generateActionTip(recommendations);

  return {
    isAchievable,
    alreadyAchieved: false,
    scoreDifference,
    recommendations,
    totalPotentialIncrease: Math.round(accumulatedIncrease),
    estimatedMonths,
    actionTip,
    summary: isAchievable
      ? `${recommendations.length}가지 개선으로 목표 달성이 가능합니다.`
      : `현재 구조에서는 최대 +${Math.round(accumulatedIncrease)}점 상승이 가능합니다.`,
  };
}

/**
 * 실행 팁을 생성합니다.
 * @param {Array} recommendations - 추천 목록
 * @returns {string} 실행 팁
 */
function generateActionTip(recommendations) {
  if (recommendations.length === 0) {
    return '이미 최적의 재정 구조입니다.';
  }

  const topRecommendation = recommendations[0];

  if (topRecommendation.category === 'savings') {
    return `매달 ${topRecommendation.amount}만원을 자동이체로 저축 계좌에 넣어보세요.`;
  }

  if (topRecommendation.category === 'food') {
    return '주 2회 외식을 줄이면 월 10만원 이상 절약됩니다.';
  }

  if (topRecommendation.category === 'leisure') {
    return '구독 서비스를 점검하고 사용하지 않는 것은 해지하세요.';
  }

  if (topRecommendation.category === 'fixed') {
    return '알뜰폰 전환과 불필요한 구독 해지를 검토하세요.';
  }

  if (topRecommendation.category === 'transport') {
    return '대중교통 정기권 활용이나 카풀을 고려해보세요.';
  }

  return `${topRecommendation.categoryLabel} 관리부터 시작해보세요.`;
}

/**
 * 문자열을 숫자로 변환합니다.
 */
function parseAmount(value) {
  if (!value && value !== 0) return 0;
  const num = parseInt(String(value).replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

/**
 * 목표 점수 범위를 계산합니다.
 * @param {number} currentScore - 현재 점수
 * @returns {Object} { min, max, default }
 */
export function getTargetScoreRange(currentScore) {
  const min = Math.min(currentScore + 1, 100);
  const max = 100;
  const defaultTarget = Math.min(currentScore + 10, 100);

  return { min, max, default: defaultTarget };
}

/**
 * 등급 달성에 필요한 점수를 반환합니다.
 * @param {number} currentScore - 현재 점수
 * @returns {Array} 등급별 목표 점수 옵션
 */
export function getGradeTargets(currentScore) {
  const grades = [
    { grade: '매우 안정', minScore: 85 },
    { grade: '안정', minScore: 70 },
    { grade: '주의', minScore: 55 },
    { grade: '위험', minScore: 45 },
  ];

  return grades
    .filter(g => g.minScore > currentScore)
    .map(g => ({
      grade: g.grade,
      targetScore: g.minScore,
      pointsNeeded: g.minScore - currentScore,
    }));
}
