import { questions, HOUSING_TYPES, HOUSING_ANALYSIS } from '../data/questions';

// ============================================
// 상수 정의
// ============================================

const CATEGORY_IDS = ['housing', 'food', 'fixed', 'transport', 'leisure', 'misc', 'savings'];

const CATEGORY_WEIGHTS = {
  housing: 0.25,
  food: 0.15,
  fixed: 0.10,
  transport: 0.10,
  leisure: 0.10,
  misc: 0.10,
  savings: 0.20,
};

const GRADE_THRESHOLDS = [
  { min: 85, grade: '안정 독립', message: '현재 상태로 안정적인 독립 생활이 가능합니다.' },
  { min: 70, grade: '관리 가능', message: '독립은 가능하지만, 지출 관리에 주의가 필요합니다.' },
  { min: 55, grade: '불안정', message: '독립 생활 유지에 리스크가 있습니다. 재정 점검이 필요합니다.' },
  { min: 40, grade: '위험', message: '현재 상태로는 독립이 어렵습니다. 준비가 더 필요합니다.' },
  { min: 0, grade: '독립 비권장', message: '독립을 권장하지 않습니다. 재정 안정화가 우선입니다.' },
];

const CATEGORY_LABELS = {
  housing: '주거비',
  food: '식비',
  fixed: '고정지출',
  transport: '교통비',
  leisure: '여가비',
  misc: '생활 잡비',
  savings: '저축·비상금',
};

// ============================================
// 유틸리티 함수
// ============================================

/**
 * 문자열을 숫자로 변환 (콤마 제거)
 */
function parseAmount(value) {
  if (!value && value !== 0) return 0;
  const num = parseInt(String(value).replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

// ============================================
// 1. 카테고리별 점수 계산
// ============================================

/**
 * 각 카테고리별 점수를 계산합니다.
 * 기본 100점에서 각 질문의 scoreImpact를 합산합니다.
 *
 * @param {Object} answers - 질문 응답 객체 { questionId: selectedValue }
 * @returns {Object} 카테고리별 점수 { housing: 75, food: 82, ... }
 */
export function calculateCategoryScores(answers) {
  const scores = {};

  CATEGORY_IDS.forEach((categoryId) => {
    // 해당 카테고리의 질문들 필터링
    const categoryQuestions = questions.filter((q) => q.category === categoryId);

    // 기본 점수 100점
    let score = 100;

    categoryQuestions.forEach((question) => {
      const selectedValue = answers[question.id];
      if (selectedValue) {
        const selectedOption = question.options.find((opt) => opt.value === selectedValue);
        if (selectedOption) {
          score += selectedOption.scoreImpact; // scoreImpact는 음수
        }
      }
    });

    // 0점 이하로 내려가지 않도록 처리
    scores[categoryId] = Math.max(0, score);
  });

  return scores;
}

// ============================================
// 2. 보정 계수 계산
// ============================================

/**
 * 점수 구간별 보정 계수를 반환합니다.
 * 점수가 낮을수록 실제 지출이 예상보다 높을 가능성이 있음을 반영합니다.
 *
 * @param {number} score - 카테고리 점수 (0-100)
 * @returns {number} 보정 계수 (1.00 ~ 1.15)
 */
export function getAdjustmentFactor(score) {
  if (score >= 80) return 1.00;
  if (score >= 65) return 1.05;
  if (score >= 50) return 1.10;
  return 1.15;
}

/**
 * 모든 카테고리의 보정 계수를 계산합니다.
 *
 * @param {Object} categoryScores - 카테고리별 점수
 * @returns {Object} 카테고리별 보정 계수
 */
export function calculateAllAdjustmentFactors(categoryScores) {
  const factors = {};

  CATEGORY_IDS.forEach((categoryId) => {
    factors[categoryId] = getAdjustmentFactor(categoryScores[categoryId] || 100);
  });

  return factors;
}

// ============================================
// 3. 보정된 월 지출 계산
// ============================================

/**
 * 보정 계수를 적용한 실제 예상 월 지출을 계산합니다.
 *
 * @param {Object} expenses - 사용자 입력 지출 { housing: "50", food: "30", ... }
 * @param {Object} adjustmentFactors - 카테고리별 보정 계수
 * @returns {Object} { adjustedExpenses: {...}, monthlyRequired: number }
 */
export function calculateAdjustedExpenses(expenses, adjustmentFactors) {
  const adjustedExpenses = {};
  let monthlyRequired = 0;

  CATEGORY_IDS.forEach((categoryId) => {
    const originalAmount = parseAmount(expenses[categoryId]);
    const factor = adjustmentFactors[categoryId] || 1.00;
    const adjustedAmount = Math.round(originalAmount * factor);

    adjustedExpenses[categoryId] = adjustedAmount;
    monthlyRequired += adjustedAmount;
  });

  return {
    adjustedExpenses,
    monthlyRequired,
  };
}

// ============================================
// 4. 안전 자산 계산
// ============================================

/**
 * 6개월 안전 자산을 계산합니다.
 *
 * @param {number} monthlyRequired - 보정된 월 필요 비용
 * @returns {number} 권장 안전 자산 (6개월치)
 */
export function calculateSafetyAssets(monthlyRequired) {
  return monthlyRequired * 6;
}

// ============================================
// 5. 최종 독립 점수 계산 (가중 평균)
// ============================================

/**
 * 카테고리별 가중치를 적용한 최종 점수를 계산합니다.
 *
 * @param {Object} categoryScores - 카테고리별 점수
 * @returns {number} 최종 점수 (0-100, 반올림)
 */
export function calculateFinalScore(categoryScores) {
  let weightedSum = 0;
  let totalWeight = 0;

  CATEGORY_IDS.forEach((categoryId) => {
    const score = categoryScores[categoryId] || 0;
    const weight = CATEGORY_WEIGHTS[categoryId] || 0;

    weightedSum += score * weight;
    totalWeight += weight;
  });

  // 가중치 합이 1이 아닐 경우를 대비한 정규화
  const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

  return Math.round(finalScore);
}

// ============================================
// 6. 강제 컷 조건 (Hard Cut Rules)
// ============================================

/**
 * 강제 컷 조건을 적용합니다.
 * 특정 조건에서는 점수와 관계없이 등급이 제한됩니다.
 *
 * @param {Object} params
 * @param {number} params.score - 계산된 최종 점수
 * @param {Object} params.categoryScores - 카테고리별 점수
 * @param {number} params.income - 월 수입 (만원)
 * @param {number} params.monthlyRequired - 보정된 월 필요 비용
 * @returns {Object} { finalScore, finalGrade, riskFlags }
 */
export function applyHardCutRules({ score, categoryScores, income, monthlyRequired }) {
  const riskFlags = [];
  let adjustedScore = score;
  let maxGrade = null; // 등급 상한

  // 조건 1: savings 점수 < 50 → 최대 "불안정"
  if (categoryScores.savings < 50) {
    riskFlags.push({
      type: 'savings_low',
      message: '비상금/저축 준비가 부족합니다.',
      severity: 'warning',
    });
    if (!maxGrade || GRADE_THRESHOLDS.findIndex(g => g.grade === '불안정') < GRADE_THRESHOLDS.findIndex(g => g.grade === maxGrade)) {
      maxGrade = '불안정';
    }
  }

  // 조건 2: housing 점수 < 45 → 최대 "위험"
  if (categoryScores.housing < 45) {
    riskFlags.push({
      type: 'housing_unstable',
      message: '주거 안정성이 매우 낮습니다.',
      severity: 'danger',
    });
    if (!maxGrade || GRADE_THRESHOLDS.findIndex(g => g.grade === '위험') < GRADE_THRESHOLDS.findIndex(g => g.grade === maxGrade)) {
      maxGrade = '위험';
    }
  }

  // 조건 3: 월 수입 < monthlyRequired → "독립 비권장"
  if (income > 0 && income < monthlyRequired) {
    riskFlags.push({
      type: 'income_insufficient',
      message: `월 수입(${income}만원)이 예상 지출(${monthlyRequired}만원)보다 적습니다.`,
      severity: 'critical',
    });
    maxGrade = '독립 비권장';
    adjustedScore = Math.min(adjustedScore, 39); // 39점 이하로 강제
  }

  // 등급 결정
  let finalGrade = getGradeByScore(adjustedScore);

  // maxGrade가 설정된 경우, 더 낮은 등급으로 제한
  if (maxGrade) {
    const maxGradeIndex = GRADE_THRESHOLDS.findIndex(g => g.grade === maxGrade);
    const currentGradeIndex = GRADE_THRESHOLDS.findIndex(g => g.grade === finalGrade);

    if (currentGradeIndex < maxGradeIndex) {
      finalGrade = maxGrade;
    }
  }

  return {
    finalScore: adjustedScore,
    finalGrade,
    riskFlags,
  };
}

// ============================================
// 7. 등급 분류
// ============================================

/**
 * 점수에 따른 등급을 반환합니다.
 *
 * @param {number} score - 최종 점수
 * @returns {string} 등급
 */
export function getGradeByScore(score) {
  for (const threshold of GRADE_THRESHOLDS) {
    if (score >= threshold.min) {
      return threshold.grade;
    }
  }
  return '독립 비권장';
}

/**
 * 등급에 따른 메시지를 반환합니다.
 *
 * @param {string} grade - 등급
 * @returns {string} 메시지
 */
export function getMessageByGrade(grade) {
  const threshold = GRADE_THRESHOLDS.find(t => t.grade === grade);
  return threshold ? threshold.message : '';
}

// ============================================
// 8. 취약 카테고리 분석
// ============================================

/**
 * 점수가 낮은 취약 카테고리를 분석합니다.
 *
 * @param {Object} categoryScores - 카테고리별 점수
 * @returns {Array} 취약 카테고리 목록 (점수 오름차순)
 */
export function analyzeWeakCategories(categoryScores) {
  const weakCategories = [];

  CATEGORY_IDS.forEach((categoryId) => {
    const score = categoryScores[categoryId];
    if (score < 70) {
      weakCategories.push({
        category: categoryId,
        label: CATEGORY_LABELS[categoryId],
        score,
        severity: score < 50 ? 'high' : 'medium',
      });
    }
  });

  // 점수 낮은 순으로 정렬
  weakCategories.sort((a, b) => a.score - b.score);

  return weakCategories;
}

// ============================================
// 9. 메인 계산 함수
// ============================================

/**
 * 주거 유형을 확인합니다.
 *
 * @param {Object} answers - 질문 응답 데이터
 * @returns {string|null} 주거 유형 값
 */
export function getHousingType(answers) {
  return answers?.housing_q1 || null;
}

/**
 * 주거 유형에 따른 분석 데이터를 반환합니다.
 *
 * @param {string} housingType - 주거 유형 값
 * @returns {Object|null} 분석 데이터
 */
export function getHousingAnalysis(housingType) {
  return HOUSING_ANALYSIS[housingType] || null;
}

/**
 * 독립 가능성 진단 결과를 계산합니다.
 *
 * @param {Object} expenses - 지출 데이터 { housing, food, ..., income }
 * @param {Object} answers - 질문 응답 데이터 { questionId: selectedValue }
 * @returns {Object} 진단 결과
 */
export function calculateResult(expenses, answers) {
  // 1. 카테고리별 점수 계산
  const categoryScores = calculateCategoryScores(answers);

  // 2. 보정 계수 계산
  const adjustmentFactors = calculateAllAdjustmentFactors(categoryScores);

  // 3. 보정된 월 지출 계산
  const { adjustedExpenses, monthlyRequired } = calculateAdjustedExpenses(
    expenses,
    adjustmentFactors
  );

  // 4. 안전 자산 계산
  const safetyAssets = calculateSafetyAssets(monthlyRequired);

  // 5. 최종 점수 계산 (가중 평균)
  const rawScore = calculateFinalScore(categoryScores);

  // 6. 수입 파싱
  const income = parseAmount(expenses.income);

  // 7. 강제 컷 조건 적용
  const { finalScore, finalGrade, riskFlags } = applyHardCutRules({
    score: rawScore,
    categoryScores,
    income,
    monthlyRequired,
  });

  // 8. 취약 카테고리 분석
  const weakCategories = analyzeWeakCategories(categoryScores);

  // 9. 메시지 생성
  const message = getMessageByGrade(finalGrade);

  // 10. 원본 지출 합계 (보정 전)
  const originalTotal = CATEGORY_IDS.reduce((sum, id) => sum + parseAmount(expenses[id]), 0);

  // 11. 주거 유형 및 분석
  const housingType = getHousingType(answers);
  const housingAnalysis = getHousingAnalysis(housingType);

  return {
    score: finalScore,
    categoryScores,
    adjustmentFactors,
    originalExpenses: originalTotal,
    monthlyRequired,
    safetyAssets,
    income,
    grade: finalGrade,
    message,
    housingType,
    housingAnalysis,
    details: {
      riskFlags,
      weakCategories,
      adjustedExpenses,
    },
  };
}
