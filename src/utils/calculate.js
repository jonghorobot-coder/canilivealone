import { questions, HOUSING_TYPES, HOUSING_ANALYSIS } from '../data/questions';

// ============================================
// 독립 가능성 진단 엔진 (Independence Diagnosis Engine)
// ============================================
//
// [주거비(Housing) 점수 계산 공식]
// housing_score = max(0, 100 - adjusted_risk)
//
// [자산 완충 공식] - 소득 감소 감점(C영역)에만 적용
// - 12개월 이상 자산 & 주거비율 ≤45%: 감점 × 0.7 (30% 완화)
// - 6~11개월 자산 & 주거비율 ≤45%: 감점 × 0.85 (15% 완화)
// - 그 외: 완충 없음
//
// [Hard Cut 조건]
// A. 주거비 카테고리 내부:
//    - 주거비율 > 45% → 등급 상한 "위험"
//    - 전세대출 + 비상금 < 3개월 → 등급 상한 "위험"
//    - 소득 감소 대응 불가 + 주거비율 > 40% → 등급 상한 "위험"
//    - 주거 점수 < 45 → 종합 등급 상한 "위험" 제한
//
// B. 식비 카테고리:
//    - 식비율 > 35% → 종합 등급 상한 "주의" 제한
//    ※ 식비율 30% 초과는 고위험 구간으로 감점(-30) 적용
//    ※ 35% 초과는 구조적 과소비로 판단하여 등급 상한 제한
//
// C. 교통비 카테고리:
//    - 교통비율 > 20% → 종합 등급 상한 "주의" 제한
//    ※ 교통비율 15% 초과는 고위험 구간으로 감점(-30) 적용
//    ※ 20% 초과는 구조적 과부담으로 판단하여 등급 상한 제한
//
// D. 여가비 카테고리:
//    - 여가비율 > 20% → 종합 등급 상한 "주의" 제한
//    ※ 여가비율 15% 초과는 고위험 구간으로 감점(-30) 적용
//    ※ 20% 초과는 구조적 과소비로 판단하여 등급 상한 제한
//
// E. 저축·비상금 카테고리:
//    - 저축률 <5% AND 비상금 1개월↓ → 종합 등급 상한 "위험" 제한
//    ※ 저축률 5% 미만은 고위험 구간으로 감점(-30) 적용
//    ※ 비상금까지 부족하면 구조적 취약 상태로 판단
//
// F. 종합 판정 단계:
//    - 저축 점수 < 50 → 종합 등급 상한 "주의" 제한
//    - 수입 < 지출 → "매우 위험" (⚠️ 절대 완화 불가)
//
// [1단계 완화 조건]
// - 12개월 이상 자산 AND 주거비율 ≤ 45%
// - ⚠️ 단, 수입 < 지출 또는 주거비율 > 50%인 경우 완화 불가
//
// ============================================

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

// 새로운 등급 기준 (요구사항 반영)
const GRADE_THRESHOLDS = [
  { min: 85, grade: '매우 안정', message: '현재 상태로 매우 안정적인 독립 생활이 가능합니다.' },
  { min: 70, grade: '안정', message: '독립 생활이 가능하며, 기본적인 재정 안전망이 갖춰져 있습니다.' },
  { min: 55, grade: '주의', message: '독립은 가능하지만, 일부 리스크 요인에 주의가 필요합니다.' },
  { min: 45, grade: '위험', message: '현재 상태로는 독립 생활 유지에 어려움이 예상됩니다.' },
  { min: 0, grade: '매우 위험', message: '독립을 권장하지 않습니다. 재정 안정화가 우선입니다.' },
];

// 주거비율 감점 테이블
const HOUSING_RATIO_PENALTIES = [
  { max: 0.20, penalty: 0 },
  { max: 0.30, penalty: -5 },
  { max: 0.40, penalty: -15 },
  { max: 0.45, penalty: -25 },
  { max: Infinity, penalty: -40 }, // 45% 초과
];

// 식비율 감점 테이블 (A영역: 식비 구조 리스크)
// ※ 30% 초과: 고위험 구간 → 최대 감점(-30) 적용
// ※ 35% 초과: 구조적 과소비 → Hard Cut으로 등급 상한 "주의" 제한 (별도 처리)
const FOOD_RATIO_PENALTIES = [
  { max: 0.15, penalty: 0 },
  { max: 0.20, penalty: -5 },
  { max: 0.25, penalty: -10 },
  { max: 0.30, penalty: -20 },
  { max: Infinity, penalty: -30 }, // 30% 초과 (고위험)
];

// 교통비율 감점 테이블 (A영역: 교통비 구조 리스크)
// ※ 15% 초과: 고위험 구간 → 최대 감점(-30) 적용
// ※ 20% 초과: 구조적 과부담 → Hard Cut으로 등급 상한 "주의" 제한 (별도 처리)
const TRANSPORT_RATIO_PENALTIES = [
  { max: 0.05, penalty: 0 },
  { max: 0.08, penalty: -5 },
  { max: 0.12, penalty: -10 },
  { max: 0.15, penalty: -20 },
  { max: Infinity, penalty: -30 }, // 15% 초과 (고위험)
];

// 여가비율 감점 테이블 (A영역: 선택 소비 구조 리스크)
// ※ 15% 초과: 고위험 구간 → 최대 감점(-30) 적용
// ※ 20% 초과: 구조적 과소비 → Hard Cut으로 등급 상한 "주의" 제한 (별도 처리)
const LEISURE_RATIO_PENALTIES = [
  { max: 0.05, penalty: 0 },
  { max: 0.08, penalty: -5 },
  { max: 0.12, penalty: -10 },
  { max: 0.15, penalty: -20 },
  { max: Infinity, penalty: -30 }, // 15% 초과 (고위험)
];

// 고정지출 비율 감점 테이블
// ※ 30% 초과: 고위험 구간 → 최대 감점(-30) 적용
const FIXED_RATIO_PENALTIES = [
  { max: 0.15, penalty: 0 },
  { max: 0.20, penalty: -5 },
  { max: 0.25, penalty: -10 },
  { max: 0.30, penalty: -20 },
  { max: Infinity, penalty: -30 }, // 30% 초과 (고위험)
];

// 생활잡비 비율 감점 테이블
// ※ 15% 초과: 고위험 구간 → 최대 감점(-30) 적용
const MISC_RATIO_PENALTIES = [
  { max: 0.05, penalty: 0 },
  { max: 0.08, penalty: -5 },
  { max: 0.12, penalty: -10 },
  { max: 0.15, penalty: -20 },
  { max: Infinity, penalty: -30 }, // 15% 초과 (고위험)
];

// 저축률 감점 테이블 (역방향: 높을수록 좋음)
// ※ 5% 미만: 고위험 구간 → 최대 감점(-30) 적용
// ※ 5% 미만 AND 비상금 1개월↓ → Hard Cut으로 등급 상한 "위험" 제한 (별도 처리)
const SAVINGS_RATIO_PENALTIES = [
  { min: 0.20, penalty: 0 },      // 20% 이상
  { min: 0.15, penalty: -5 },     // 15~19%
  { min: 0.10, penalty: -10 },    // 10~14%
  { min: 0.05, penalty: -20 },    // 5~9%
  { min: 0, penalty: -30 },       // 5% 미만 (고위험)
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
 * 주거비율에 따른 감점을 계산합니다.
 * @param {number} housingRatio - 주거비율 (0~1)
 * @returns {Object} { penalty: number, isRiskFlag: boolean }
 */
export function calculateHousingRatioPenalty(housingRatio) {
  for (const { max, penalty } of HOUSING_RATIO_PENALTIES) {
    if (housingRatio <= max) {
      return {
        penalty,
        isRiskFlag: housingRatio > 0.45, // 45% 초과 시 리스크 플래그
      };
    }
  }
  return { penalty: -40, isRiskFlag: true };
}

// ============================================
// 자산 기반 보정 레이어 (Adjustment Layer) - 보수적 버전
// ============================================

/**
 * 소득 감소 대응 감점을 계산합니다 (C 영역).
 * @param {Object} answers - 응답 객체
 * @returns {number} 감점 (음수)
 */
function getIncomeReductionPenalty(answers) {
  const value = answers?.housing_income_reduction;
  const penalties = {
    comfortable: 0,
    adjust_spending: -10,
    difficult: -25,
  };
  return penalties[value] || 0;
}

/**
 * 소득 안정성 감점을 계산합니다.
 * ※ 이 감점에는 자산 완충이 적용되지 않습니다.
 * @param {Object} answers - 응답 객체
 * @returns {number} 감점 (음수)
 */
function getIncomeStabilityPenalty(answers) {
  const value = answers?.income_stability_q1;
  const penalties = {
    stable: 0,
    slight_variation: -5,
    moderate_variation: -10,
    high_variation: -20,
  };
  return penalties[value] || 0;
}

/**
 * 소득 감소 감점에 대한 자산 완충 계수를 계산합니다.
 * ※ 소득 감소 대응 감점(C 영역)에만 적용됩니다.
 * ※ income_stability 감점에는 적용되지 않습니다.
 *
 * @param {Object} answers - 응답 객체
 * @param {number} housingRatio - 주거비율
 * @returns {number} 완충 계수 (0.7~1.0)
 */
function getIncomeReductionBufferFactor(answers, housingRatio) {
  const assetLevel = answers?.housing_asset_q1;

  // 주거비율 45% 초과 시 완충 적용 안 함
  if (housingRatio > 0.45) {
    return 1.0;
  }

  // 12개월 이상: 30% 완화 (계수 0.7)
  if (assetLevel === 'over_12months') {
    return 0.7;
  }

  // 6~11개월: 15% 완화 (계수 0.85)
  if (assetLevel === '6_11months') {
    return 0.85;
  }

  // 그 외: 완충 없음
  return 1.0;
}

/**
 * 주거비 카테고리 점수를 계산합니다 (리스크 기반 + 보수적 보정 레이어).
 * housing_score = max(0, 100 - adjusted_risk_points)
 *
 * [계산 순서]
 * 1. 주거비율 감점 계산 (A영역)
 * 2. 기타 공통 감점 계산 (B, D, E영역)
 * 3. 소득 감소 대응 감점 계산 (C영역 - 완충 대상)
 * 4. 소득 안정성 감점 추가 (완충 미적용)
 * 5. 자산 기반 완충 적용 (소득 감소 감점에만, 30%/15%)
 * 6. adjusted_risk 합산
 * 7. housing_score = max(0, 100 - adjusted_risk)
 * 8. Hard Cut 체크 (별도 함수에서 처리)
 * 9. 1단계 완화 적용 (별도 함수에서 처리)
 *
 * @param {Object} answers - 질문 응답 객체
 * @param {number} housingRatio - 주거비율 (housing / income)
 * @returns {Object} 상세 계산 결과
 */
export function calculateHousingScore(answers, housingRatio) {
  const housingQuestions = questions.filter((q) => q.category === 'housing');

  // =============================================
  // 1단계: 기본 리스크 감점 계산 (A, B, D, E 영역)
  // =============================================

  // A. 주거비율 감점 (완충 없음)
  const { penalty: ratioPenalty, isRiskFlag } = calculateHousingRatioPenalty(housingRatio);

  // B, D, E. 기타 질문 기반 감점 (완충 없음)
  const excludedQuestionIds = ['housing_income_reduction', 'income_stability_q1', 'housing_asset_q1'];
  let baseQuestionPenalty = 0;

  housingQuestions.forEach((question) => {
    if (excludedQuestionIds.includes(question.id)) return;

    const selectedValue = answers[question.id];
    if (selectedValue) {
      const selectedOption = question.options.find((opt) => opt.value === selectedValue);
      if (selectedOption) {
        baseQuestionPenalty += selectedOption.scoreImpact;
      }
    }
  });

  // =============================================
  // 2단계: 소득 관련 감점 계산
  // =============================================

  // C. 소득 감소 대응 감점 (보정 대상)
  const rawIncomeReductionPenalty = getIncomeReductionPenalty(answers);

  // 소득 안정성 감점 (보정 대상 아님)
  const incomeStabilityPenalty = getIncomeStabilityPenalty(answers);

  // =============================================
  // 3단계: 자산 기반 보정 적용 (소득 감소 감점에만)
  // =============================================

  const bufferFactor = getIncomeReductionBufferFactor(answers, housingRatio);
  const adjustedIncomeReductionPenalty = Math.round(rawIncomeReductionPenalty * bufferFactor);

  // =============================================
  // 4단계: 최종 점수 계산
  // =============================================

  // 총 감점 = A(주거비율) + B,D,E(기타) + C보정(소득감소) + 소득안정성
  const totalPenalty = ratioPenalty + baseQuestionPenalty + adjustedIncomeReductionPenalty + incomeStabilityPenalty;
  const score = Math.max(0, 100 + totalPenalty);

  return {
    score,
    housingRatio,
    // 상세 내역
    ratioPenalty,
    baseQuestionPenalty,
    rawIncomeReductionPenalty,
    adjustedIncomeReductionPenalty,
    incomeStabilityPenalty,
    bufferFactor,
    isRatioRiskFlag: isRiskFlag,
    // 자산 정보 (Hard Cut 체크용)
    assetLevel: answers?.housing_asset_q1,
  };
}

// ============================================
// 식비(Food) 점수 계산 - 리스크 기반
// ============================================
//
// [계산 순서]
// 1. 식비율 감점 계산 (A영역)
// 2. food_q2 감점 계산 (배달/외식 빈도)
// 3. food_q3 감점 계산 (통제력)
// 4. food_q4 감점 계산 (현실 인식)
// 5. total_food_risk 합산
// 6. food_score = max(0, 100 - total_food_risk)
//
// [Hard Cut 조건]
// - 식비율 > 35% → 종합 등급 상한 "주의"
//
// [30% vs 35% 구분 설명]
// - 30% 초과: 고위험 구간으로 최대 감점(-30) 적용 (점수 영역)
// - 35% 초과: 구조적 과소비로 판단하여 등급 상한 제한 (Hard Cut 영역)
//
// ============================================

/**
 * 식비율에 따른 감점을 계산합니다.
 * @param {number} foodRatio - 식비율 (0~1)
 * @returns {Object} { penalty: number, isRiskFlag: boolean }
 */
export function calculateFoodRatioPenalty(foodRatio) {
  for (const { max, penalty } of FOOD_RATIO_PENALTIES) {
    if (foodRatio <= max) {
      return {
        penalty,
        isRiskFlag: foodRatio > 0.35, // 35% 초과 시 리스크 플래그
      };
    }
  }
  return { penalty: -30, isRiskFlag: true };
}

/**
 * 식비 카테고리 점수를 계산합니다 (리스크 기반).
 * food_score = max(0, 100 - total_food_risk)
 *
 * @param {Object} answers - 질문 응답 객체
 * @param {number} foodRatio - 식비율 (food / income)
 * @returns {Object} 상세 계산 결과
 */
export function calculateFoodScore(answers, foodRatio) {
  const foodQuestions = questions.filter((q) => q.category === 'food');

  // 1. 식비율 감점 (A영역)
  const { penalty: ratioPenalty, isRiskFlag } = calculateFoodRatioPenalty(foodRatio);

  // 2~4. 질문 기반 감점
  let questionPenalty = 0;

  foodQuestions.forEach((question) => {
    const selectedValue = answers[question.id];
    if (selectedValue) {
      const selectedOption = question.options.find((opt) => opt.value === selectedValue);
      if (selectedOption) {
        questionPenalty += selectedOption.scoreImpact;
      }
    }
  });

  // 5~6. 최종 점수 계산
  const totalPenalty = ratioPenalty + questionPenalty;
  const score = Math.max(0, 100 + totalPenalty);

  return {
    score,
    foodRatio,
    ratioPenalty,
    questionPenalty,
    isRatioRiskFlag: isRiskFlag,
  };
}

// ============================================
// 교통비(Transport) 점수 계산 - 리스크 기반
// ============================================
//
// [계산 순서]
// 1. 교통비율 감점 계산 (A영역)
// 2. transport_q3 감점 계산 (차량 유지비 리스크)
// 3. transport_q4 감점 계산 (변동성 리스크)
// 4. total_transport_risk 합산
// 5. transport_score = max(0, 100 - total_transport_risk)
//
// [Hard Cut 조건]
// - 교통비율 > 20% → 종합 등급 상한 "주의"
//
// [15% vs 20% 구분 설명]
// - 15% 초과: 고위험 구간으로 최대 감점(-30) 적용 (점수 영역)
// - 20% 초과: 구조적 과부담으로 판단하여 등급 상한 제한 (Hard Cut 영역)
//
// ============================================

/**
 * 교통비율에 따른 감점을 계산합니다.
 * @param {number} transportRatio - 교통비율 (0~1)
 * @returns {Object} { penalty: number, isRiskFlag: boolean }
 */
export function calculateTransportRatioPenalty(transportRatio) {
  for (const { max, penalty } of TRANSPORT_RATIO_PENALTIES) {
    if (transportRatio <= max) {
      return {
        penalty,
        isRiskFlag: transportRatio > 0.20, // 20% 초과 시 리스크 플래그
      };
    }
  }
  return { penalty: -30, isRiskFlag: true };
}

/**
 * 교통비 카테고리 점수를 계산합니다 (리스크 기반).
 * transport_score = max(0, 100 - total_transport_risk)
 *
 * @param {Object} answers - 질문 응답 객체
 * @param {number} transportRatio - 교통비율 (transport / income)
 * @returns {Object} 상세 계산 결과
 */
export function calculateTransportScore(answers, transportRatio) {
  const transportQuestions = questions.filter((q) => q.category === 'transport');

  // 1. 교통비율 감점 (A영역)
  const { penalty: ratioPenalty, isRiskFlag } = calculateTransportRatioPenalty(transportRatio);

  // 2~3. 질문 기반 감점 (transport_q3, transport_q4)
  let questionPenalty = 0;

  transportQuestions.forEach((question) => {
    const selectedValue = answers[question.id];
    if (selectedValue) {
      const selectedOption = question.options.find((opt) => opt.value === selectedValue);
      if (selectedOption) {
        questionPenalty += selectedOption.scoreImpact;
      }
    }
  });

  // 4~5. 최종 점수 계산
  const totalPenalty = ratioPenalty + questionPenalty;
  const score = Math.max(0, 100 + totalPenalty);

  return {
    score,
    transportRatio,
    ratioPenalty,
    questionPenalty,
    isRatioRiskFlag: isRiskFlag,
  };
}

// ============================================
// 여가비(Leisure) 점수 계산 - 리스크 기반
// ============================================
//
// [계산 순서]
// 1. 여가비율 감점 계산 (A영역)
// 2. leisure_q2 감점 계산 (충동 소비 리스크)
// 3. leisure_q3 감점 계산 (조절 가능성)
// 4. leisure_q4 감점 계산 (사회적 지출 압박)
// 5. total_leisure_risk 합산
// 6. leisure_score = max(0, 100 - total_leisure_risk)
//
// [Hard Cut 조건]
// - 여가비율 > 20% → 종합 등급 상한 "주의"
//
// [15% vs 20% 구분 설명]
// - 15% 초과: 고위험 구간으로 최대 감점(-30) 적용 (점수 영역)
// - 20% 초과: 구조적 과소비로 판단하여 등급 상한 제한 (Hard Cut 영역)
//
// ============================================

/**
 * 여가비율에 따른 감점을 계산합니다.
 * @param {number} leisureRatio - 여가비율 (0~1)
 * @returns {Object} { penalty: number, isRiskFlag: boolean }
 */
export function calculateLeisureRatioPenalty(leisureRatio) {
  for (const { max, penalty } of LEISURE_RATIO_PENALTIES) {
    if (leisureRatio <= max) {
      return {
        penalty,
        isRiskFlag: leisureRatio > 0.20, // 20% 초과 시 리스크 플래그
      };
    }
  }
  return { penalty: -30, isRiskFlag: true };
}

/**
 * 여가비 카테고리 점수를 계산합니다 (리스크 기반).
 * leisure_score = max(0, 100 - total_leisure_risk)
 *
 * @param {Object} answers - 질문 응답 객체
 * @param {number} leisureRatio - 여가비율 (leisure / income)
 * @returns {Object} 상세 계산 결과
 */
export function calculateLeisureScore(answers, leisureRatio) {
  const leisureQuestions = questions.filter((q) => q.category === 'leisure');

  // 1. 여가비율 감점 (A영역)
  const { penalty: ratioPenalty, isRiskFlag } = calculateLeisureRatioPenalty(leisureRatio);

  // 2~4. 질문 기반 감점 (leisure_q2, leisure_q3, leisure_q4)
  let questionPenalty = 0;

  leisureQuestions.forEach((question) => {
    const selectedValue = answers[question.id];
    if (selectedValue) {
      const selectedOption = question.options.find((opt) => opt.value === selectedValue);
      if (selectedOption) {
        questionPenalty += selectedOption.scoreImpact;
      }
    }
  });

  // 5~6. 최종 점수 계산
  const totalPenalty = ratioPenalty + questionPenalty;
  const score = Math.max(0, 100 + totalPenalty);

  return {
    score,
    leisureRatio,
    ratioPenalty,
    questionPenalty,
    isRatioRiskFlag: isRiskFlag,
  };
}

// ============================================
// 고정지출(Fixed) 점수 계산 - 리스크 기반
// ============================================
//
// [계산 순서]
// 1. 고정지출 비율 감점 계산 (A영역)
// 2. fixed_q1~q4 감점 계산 (관리 능력 리스크)
// 3. total_fixed_risk 합산
// 4. fixed_score = max(0, 100 - total_fixed_risk)
//
// ============================================

/**
 * 고정지출 비율에 따른 감점을 계산합니다.
 * @param {number} fixedRatio - 고정지출 비율 (0~1)
 * @returns {Object} { penalty: number }
 */
export function calculateFixedRatioPenalty(fixedRatio) {
  for (const { max, penalty } of FIXED_RATIO_PENALTIES) {
    if (fixedRatio <= max) {
      return { penalty };
    }
  }
  return { penalty: -30 };
}

/**
 * 고정지출 카테고리 점수를 계산합니다 (리스크 기반).
 * fixed_score = max(0, 100 - total_fixed_risk)
 *
 * @param {Object} answers - 질문 응답 객체
 * @param {number} fixedRatio - 고정지출 비율 (fixed / income)
 * @returns {Object} 상세 계산 결과
 */
export function calculateFixedScore(answers, fixedRatio) {
  const fixedQuestions = questions.filter((q) => q.category === 'fixed');

  // 1. 고정지출 비율 감점 (A영역)
  const { penalty: ratioPenalty } = calculateFixedRatioPenalty(fixedRatio);

  // 2. 질문 기반 감점 (fixed_q1~q4)
  let questionPenalty = 0;

  fixedQuestions.forEach((question) => {
    const selectedValue = answers[question.id];
    if (selectedValue) {
      const selectedOption = question.options.find((opt) => opt.value === selectedValue);
      if (selectedOption) {
        questionPenalty += selectedOption.scoreImpact;
      }
    }
  });

  // 3~4. 최종 점수 계산
  const totalPenalty = ratioPenalty + questionPenalty;
  const score = Math.max(0, 100 + totalPenalty);

  return {
    score,
    fixedRatio,
    ratioPenalty,
    questionPenalty,
  };
}

// ============================================
// 생활잡비(Misc) 점수 계산 - 리스크 기반
// ============================================
//
// [계산 순서]
// 1. 잡비 비율 감점 계산 (A영역)
// 2. misc_q2~q4 감점 계산 (예측 불가 리스크)
// 3. total_misc_risk 합산
// 4. misc_score = max(0, 100 - total_misc_risk)
//
// ============================================

/**
 * 생활잡비 비율에 따른 감점을 계산합니다.
 * @param {number} miscRatio - 잡비 비율 (0~1)
 * @returns {Object} { penalty: number }
 */
export function calculateMiscRatioPenalty(miscRatio) {
  for (const { max, penalty } of MISC_RATIO_PENALTIES) {
    if (miscRatio <= max) {
      return { penalty };
    }
  }
  return { penalty: -30 };
}

/**
 * 생활잡비 카테고리 점수를 계산합니다 (리스크 기반).
 * misc_score = max(0, 100 - total_misc_risk)
 *
 * @param {Object} answers - 질문 응답 객체
 * @param {number} miscRatio - 잡비 비율 (misc / income)
 * @returns {Object} 상세 계산 결과
 */
export function calculateMiscScore(answers, miscRatio) {
  const miscQuestions = questions.filter((q) => q.category === 'misc');

  // 1. 잡비 비율 감점 (A영역)
  const { penalty: ratioPenalty } = calculateMiscRatioPenalty(miscRatio);

  // 2. 질문 기반 감점 (misc_q2~q4)
  let questionPenalty = 0;

  miscQuestions.forEach((question) => {
    const selectedValue = answers[question.id];
    if (selectedValue) {
      const selectedOption = question.options.find((opt) => opt.value === selectedValue);
      if (selectedOption) {
        questionPenalty += selectedOption.scoreImpact;
      }
    }
  });

  // 3~4. 최종 점수 계산
  const totalPenalty = ratioPenalty + questionPenalty;
  const score = Math.max(0, 100 + totalPenalty);

  return {
    score,
    miscRatio,
    ratioPenalty,
    questionPenalty,
  };
}

// ============================================
// 저축·비상금(Savings) 점수 계산 - 리스크 기반
// ============================================
//
// [계산 순서]
// 1. 저축률 감점 계산 (A영역) - 역방향: 높을수록 좋음
// 2. savings_q1~q3 감점 계산 (재정 안전망 리스크)
// 3. total_savings_risk 합산
// 4. savings_score = max(0, 100 - total_savings_risk)
//
// [Hard Cut 조건]
// - 저축률 <5% AND 비상금 1개월↓ → 종합 등급 상한 "위험"
//
// ============================================

/**
 * 저축률에 따른 감점을 계산합니다. (역방향: 높을수록 좋음)
 * @param {number} savingsRatio - 저축률 (0~1)
 * @returns {Object} { penalty: number, isRiskFlag: boolean }
 */
export function calculateSavingsRatioPenalty(savingsRatio) {
  for (const { min, penalty } of SAVINGS_RATIO_PENALTIES) {
    if (savingsRatio >= min) {
      return {
        penalty,
        isRiskFlag: savingsRatio < 0.05, // 5% 미만 시 리스크 플래그
      };
    }
  }
  return { penalty: -30, isRiskFlag: true };
}

/**
 * 저축·비상금 카테고리 점수를 계산합니다 (리스크 기반).
 * savings_score = max(0, 100 - total_savings_risk)
 *
 * @param {Object} answers - 질문 응답 객체
 * @param {number} savingsRatio - 저축률 (savings / income)
 * @returns {Object} 상세 계산 결과
 */
export function calculateSavingsScore(answers, savingsRatio) {
  const savingsQuestions = questions.filter((q) => q.category === 'savings');

  // 1. 저축률 감점 (A영역)
  const { penalty: ratioPenalty, isRiskFlag } = calculateSavingsRatioPenalty(savingsRatio);

  // 2. 질문 기반 감점 (savings_q1~q3)
  let questionPenalty = 0;

  savingsQuestions.forEach((question) => {
    const selectedValue = answers[question.id];
    if (selectedValue) {
      const selectedOption = question.options.find((opt) => opt.value === selectedValue);
      if (selectedOption) {
        questionPenalty += selectedOption.scoreImpact;
      }
    }
  });

  // 3~4. 최종 점수 계산
  const totalPenalty = ratioPenalty + questionPenalty;
  const score = Math.max(0, 100 + totalPenalty);

  // 비상금 수준 (Hard Cut 체크용)
  const emergencyFundLevel = answers?.savings_q1;

  return {
    score,
    savingsRatio,
    ratioPenalty,
    questionPenalty,
    isRatioRiskFlag: isRiskFlag,
    emergencyFundLevel,
  };
}

/**
 * 각 카테고리별 점수를 계산합니다.
 * 모든 카테고리에 비율 기반 리스크 로직 적용.
 *
 * @param {Object} answers - 질문 응답 객체 { questionId: selectedValue }
 * @param {Object} expenses - 지출 데이터 (모든 카테고리 포함)
 * @param {number} income - 월 수입
 * @returns {Object} { scores, housingDetails, foodDetails, transportDetails, leisureDetails, fixedDetails, miscDetails, savingsDetails }
 */
export function calculateCategoryScores(answers, expenses = {}, income = 0) {
  const scores = {};
  let housingDetails = null;
  let foodDetails = null;
  let transportDetails = null;
  let leisureDetails = null;
  let fixedDetails = null;
  let miscDetails = null;
  let savingsDetails = null;
  const incomeAmount = parseAmount(income);

  CATEGORY_IDS.forEach((categoryId) => {
    if (categoryId === 'housing') {
      // 주거비 (비율 기반)
      const housingAmount = parseAmount(expenses.housing);
      const housingRatio = incomeAmount > 0 ? housingAmount / incomeAmount : 0;

      const result = calculateHousingScore(answers, housingRatio);
      scores.housing = result.score;
      housingDetails = result;
    } else if (categoryId === 'food') {
      // 식비 (비율 기반)
      const foodAmount = parseAmount(expenses.food);
      const foodRatio = incomeAmount > 0 ? foodAmount / incomeAmount : 0;

      const result = calculateFoodScore(answers, foodRatio);
      scores.food = result.score;
      foodDetails = result;
    } else if (categoryId === 'transport') {
      // 교통비 (비율 기반)
      const transportAmount = parseAmount(expenses.transport);
      const transportRatio = incomeAmount > 0 ? transportAmount / incomeAmount : 0;

      const result = calculateTransportScore(answers, transportRatio);
      scores.transport = result.score;
      transportDetails = result;
    } else if (categoryId === 'leisure') {
      // 여가비 (비율 기반)
      const leisureAmount = parseAmount(expenses.leisure);
      const leisureRatio = incomeAmount > 0 ? leisureAmount / incomeAmount : 0;

      const result = calculateLeisureScore(answers, leisureRatio);
      scores.leisure = result.score;
      leisureDetails = result;
    } else if (categoryId === 'fixed') {
      // 고정지출 (비율 기반)
      const fixedAmount = parseAmount(expenses.fixed);
      const fixedRatio = incomeAmount > 0 ? fixedAmount / incomeAmount : 0;

      const result = calculateFixedScore(answers, fixedRatio);
      scores.fixed = result.score;
      fixedDetails = result;
    } else if (categoryId === 'misc') {
      // 생활잡비 (비율 기반)
      const miscAmount = parseAmount(expenses.misc);
      const miscRatio = incomeAmount > 0 ? miscAmount / incomeAmount : 0;

      const result = calculateMiscScore(answers, miscRatio);
      scores.misc = result.score;
      miscDetails = result;
    } else if (categoryId === 'savings') {
      // 저축·비상금 (비율 기반)
      const savingsAmount = parseAmount(expenses.savings);
      const savingsRatio = incomeAmount > 0 ? savingsAmount / incomeAmount : 0;

      const result = calculateSavingsScore(answers, savingsRatio);
      scores.savings = result.score;
      savingsDetails = result;
    }
  });

  return { scores, housingDetails, foodDetails, transportDetails, leisureDetails, fixedDetails, miscDetails, savingsDetails };
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
//
// [Hard Cut 적용 범위]
// - 주거비(housing) 카테고리 내부 조건
// - 종합 판정 단계 조건
//
// [절대 완화 불가 조건] ⚠️
// 다음 두 조건은 어떤 경우에도 1단계 완화가 적용되지 않는다:
// 1. 수입 < 지출 (구조적 적자)
// 2. 주거비율 > 50%
//
// [1단계 완화 조건]
// 12개월 이상 자산 AND 주거비율 ≤ 45% AND 절대불가 조건 미해당 시
// → 등급 1단계 상향 (위험→주의, 주의→안정 등)
// ============================================

/**
 * 강제 컷 조건을 적용합니다.
 * 특정 조건에서는 점수와 관계없이 등급 상한이 제한됩니다.
 *
 * @param {Object} params
 * @param {number} params.score - 계산된 최종 점수
 * @param {Object} params.categoryScores - 카테고리별 점수
 * @param {number} params.income - 월 수입 (만원)
 * @param {number} params.monthlyRequired - 보정된 월 필요 비용
 * @param {Object} params.housingDetails - 주거비 상세 정보
 * @param {Object} params.answers - 질문 응답
 * @returns {Object} { finalScore, finalGrade, riskFlags }
 */
export function applyHardCutRules({ score, categoryScores, income, monthlyRequired, housingDetails, foodDetails, transportDetails, leisureDetails, savingsDetails, answers }) {
  const riskFlags = [];
  let adjustedScore = score;
  let maxGrade = null; // 등급 상한

  // === 기본 변수 추출 ===
  const assetLevel = housingDetails?.assetLevel || answers?.housing_asset_q1;
  const housingType = answers?.housing_q1;
  const housingRatio = housingDetails?.housingRatio || 0;
  const hasJeonseLoan = housingType === HOUSING_TYPES.JEONSE_LOAN;
  const emergencyFund = answers?.housing_emergency;
  const hasLowEmergencyFund = emergencyFund === '1_2months' || emergencyFund === 'none';
  const incomeReduction = answers?.housing_income_reduction;

  // === 절대 완화 불가 조건 체크 ===
  // ⚠️ 아래 두 조건은 어떤 자산 수준에서도 완화되지 않음
  const isIncomeDeficit = income > 0 && income < monthlyRequired; // 수입 < 지출
  const isExtremeHousingRatio = housingRatio > 0.50;              // 주거비율 > 50%
  const cannotMitigate = isIncomeDeficit || isExtremeHousingRatio;

  // === 1단계 완화 가능 조건 ===
  // 12개월 이상 자산 AND 주거비율 ≤ 45% AND 절대불가 조건 미해당
  const canMitigateOneLevel =
    assetLevel === 'over_12months' &&
    housingRatio <= 0.45 &&
    !cannotMitigate;

  // ============================================
  // [A] 주거비(housing) 카테고리 Hard Cut 조건
  // ============================================

  // 조건 1: 주거비율 > 45% → 등급 상한 "위험"
  if (housingRatio > 0.45) {
    riskFlags.push({
      type: 'housing_ratio_critical',
      message: `주거비율(${Math.round(housingRatio * 100)}%)이 위험 수준입니다. 소득의 45%를 초과합니다.`,
      severity: 'critical',
    });
    if (!maxGrade || getGradeIndex('위험') > getGradeIndex(maxGrade)) {
      maxGrade = '위험';
    }
  }

  // 조건 2: 비상자금 3개월 미만 AND 전세 대출 있음 → 등급 상한 "위험"
  if (hasJeonseLoan && hasLowEmergencyFund) {
    riskFlags.push({
      type: 'jeonse_loan_no_emergency',
      message: '전세대출이 있으나 비상자금이 3개월 미만입니다. 금리 상승 시 위험합니다.',
      severity: 'critical',
    });
    if (!maxGrade || getGradeIndex('위험') > getGradeIndex(maxGrade)) {
      maxGrade = '위험';
    }
  }

  // 조건 3: 소득 감소 대응 불가 AND 주거비율 40% 초과 → 등급 상한 "위험"
  if (incomeReduction === 'difficult' && housingRatio > 0.40) {
    riskFlags.push({
      type: 'income_reduction_risk',
      message: '소득 감소 시 주거 유지가 어려울 수 있습니다.',
      severity: 'critical',
    });
    if (!maxGrade || getGradeIndex('위험') > getGradeIndex(maxGrade)) {
      maxGrade = '위험';
    }
  }

  // 조건 4: 주거 점수 < 45 → 종합 등급 상한 "위험" 제한
  // (등급 구간상 0~44점은 "매우 위험"이나, 종합 판정에서 상한을 "위험"으로 제한)
  if (categoryScores.housing < 45) {
    riskFlags.push({
      type: 'housing_unstable',
      message: '주거 안정성이 매우 낮습니다.',
      severity: 'danger',
    });
    if (!maxGrade || getGradeIndex('위험') > getGradeIndex(maxGrade)) {
      maxGrade = '위험';
    }
  }

  // ============================================
  // [B] 식비(food) 카테고리 Hard Cut 조건
  // ============================================
  //
  // ※ 식비율 30% 초과는 고위험 구간으로 간주되어 감점(-30)이 적용됩니다.
  // ※ 식비율 35% 초과 시에는 구조적 과소비로 판단하여 종합 등급 상한을 "주의"로 제한합니다.
  //
  // 식비율 30% 초과는 점수 감점 영역 (FOOD_RATIO_PENALTIES에서 처리)
  // 35% 초과는 구조적 과소비로 판단하여 등급 상한 제한

  // 조건 5: 식비율 > 35% → 종합 등급 상한 "주의"
  const foodRatio = foodDetails?.foodRatio || 0;
  if (foodRatio > 0.35) {
    riskFlags.push({
      type: 'food_ratio_high',
      message: `식비율(${Math.round(foodRatio * 100)}%)이 높습니다. 소득의 35%를 초과합니다.`,
      severity: 'warning',
    });
    if (!maxGrade || getGradeIndex('주의') > getGradeIndex(maxGrade)) {
      maxGrade = '주의';
    }
  }

  // ============================================
  // [C] 교통비(transport) 카테고리 Hard Cut 조건
  // ============================================
  //
  // ※ 교통비율 15% 초과는 고위험 구간으로 간주되어 감점(-30)이 적용됩니다.
  // ※ 교통비율 20% 초과 시에는 구조적 과부담으로 판단하여 종합 등급 상한을 "주의"로 제한합니다.
  //
  // 교통비율 15% 초과는 점수 감점 영역 (TRANSPORT_RATIO_PENALTIES에서 처리)
  // 20% 초과는 구조적 과부담으로 판단하여 등급 상한 제한

  // 조건 6: 교통비율 > 20% → 종합 등급 상한 "주의"
  const transportRatio = transportDetails?.transportRatio || 0;
  if (transportRatio > 0.20) {
    riskFlags.push({
      type: 'transport_ratio_high',
      message: `교통비율(${Math.round(transportRatio * 100)}%)이 높습니다. 소득의 20%를 초과합니다.`,
      severity: 'warning',
    });
    if (!maxGrade || getGradeIndex('주의') > getGradeIndex(maxGrade)) {
      maxGrade = '주의';
    }
  }

  // ============================================
  // [D] 여가비(leisure) 카테고리 Hard Cut 조건
  // ============================================
  //
  // ※ 여가비율 15% 초과는 고위험 구간으로 간주되어 감점(-30)이 적용됩니다.
  // ※ 여가비율 20% 초과 시에는 구조적 과소비로 판단하여 종합 등급 상한을 "주의"로 제한합니다.
  //
  // 여가비율 15% 초과는 점수 감점 영역 (LEISURE_RATIO_PENALTIES에서 처리)
  // 20% 초과는 구조적 과소비로 판단하여 등급 상한 제한

  // 조건 7: 여가비율 > 20% → 종합 등급 상한 "주의"
  const leisureRatio = leisureDetails?.leisureRatio || 0;
  if (leisureRatio > 0.20) {
    riskFlags.push({
      type: 'leisure_ratio_high',
      message: `여가비율(${Math.round(leisureRatio * 100)}%)이 높습니다. 소득의 20%를 초과합니다.`,
      severity: 'warning',
    });
    if (!maxGrade || getGradeIndex('주의') > getGradeIndex(maxGrade)) {
      maxGrade = '주의';
    }
  }

  // ============================================
  // [E] 저축·비상금(savings) 카테고리 Hard Cut 조건
  // ============================================
  //
  // ※ 저축률 5% 미만은 고위험 구간으로 간주되어 감점(-30)이 적용됩니다.
  // ※ 저축률 <5% AND 비상금 1개월↓ 시 구조적 취약 상태로 판단하여 등급 상한을 "위험"으로 제한합니다.

  // 조건 8: 저축률 <5% AND 비상금 1개월 미만 → 종합 등급 상한 "위험"
  const savingsRatio = savingsDetails?.savingsRatio || 0;
  const emergencyFundLevel = savingsDetails?.emergencyFundLevel;
  const isLowSavingsRatio = savingsRatio < 0.05;
  const isLowEmergencyFund = emergencyFundLevel === 'under_1month';

  if (isLowSavingsRatio && isLowEmergencyFund) {
    riskFlags.push({
      type: 'savings_critical',
      message: `저축률(${Math.round(savingsRatio * 100)}%)이 매우 낮고 비상금도 1개월 미만입니다. 구조적 취약 상태입니다.`,
      severity: 'critical',
    });
    if (!maxGrade || getGradeIndex('위험') > getGradeIndex(maxGrade)) {
      maxGrade = '위험';
    }
  }

  // ============================================
  // [F] 종합 판정 단계 Hard Cut 조건
  // ============================================

  // 조건 9: savings 점수 < 50 → 종합 등급 상한 "주의" 제한
  // ※ 이 조건은 주거비 내부 로직이 아닌 종합 판정 조건
  if (categoryScores.savings < 50) {
    riskFlags.push({
      type: 'savings_low',
      message: '비상금/저축 준비가 부족합니다.',
      severity: 'warning',
    });
    if (!maxGrade || getGradeIndex('주의') > getGradeIndex(maxGrade)) {
      maxGrade = '주의';
    }
  }

  // 조건 10: 월 수입 < 월 지출 → "매우 위험" (⚠️ 절대 완화 불가)
  if (isIncomeDeficit) {
    riskFlags.push({
      type: 'income_insufficient',
      message: `월 수입(${income}만원)이 예상 지출(${monthlyRequired}만원)보다 적습니다.`,
      severity: 'critical',
    });
    maxGrade = '매우 위험';
    adjustedScore = Math.min(adjustedScore, 44);
  }

  // === 등급 결정 ===
  let finalGrade = getGradeByScore(adjustedScore);

  // maxGrade가 설정된 경우, 해당 등급으로 상한 제한
  if (maxGrade) {
    const maxGradeIndex = getGradeIndex(maxGrade);
    const currentGradeIndex = getGradeIndex(finalGrade);

    if (currentGradeIndex < maxGradeIndex) {
      finalGrade = maxGrade;
    }
  }

  // === 자산 기반 1단계 완화 (조건 충족 시) ===
  // ⚠️ 수입 < 지출, 주거비율 > 50%인 경우 이 완화는 적용되지 않음
  if (canMitigateOneLevel && maxGrade) {
    const currentGradeIndex = getGradeIndex(finalGrade);

    // 한 단계 상향 (매우 위험 → 위험, 위험 → 주의)
    if (currentGradeIndex > 0) {
      const mitigatedGrade = GRADE_THRESHOLDS[currentGradeIndex - 1].grade;
      finalGrade = mitigatedGrade;

      riskFlags.push({
        type: 'asset_mitigation_applied',
        message: '충분한 현금 자산으로 등급이 한 단계 완화되었습니다.',
        severity: 'info',
      });
    }
  }

  return {
    finalScore: adjustedScore,
    finalGrade,
    riskFlags,
    canMitigateOneLevel,
  };
}

/**
 * 등급의 인덱스를 반환합니다 (낮을수록 좋음).
 */
function getGradeIndex(grade) {
  return GRADE_THRESHOLDS.findIndex(g => g.grade === grade);
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
  // 0. 수입 파싱 (먼저 처리)
  const income = parseAmount(expenses.income);

  // 1. 카테고리별 점수 계산 (모든 카테고리 비율 기반)
  const { scores: categoryScores, housingDetails, foodDetails, transportDetails, leisureDetails, fixedDetails, miscDetails, savingsDetails } = calculateCategoryScores(answers, expenses, income);

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

  // 6. 강제 컷 조건 적용 (모든 카테고리 Hard Cut 포함)
  const { finalScore, finalGrade, riskFlags } = applyHardCutRules({
    score: rawScore,
    categoryScores,
    income,
    monthlyRequired,
    housingDetails,
    foodDetails,
    transportDetails,
    leisureDetails,
    savingsDetails,
    answers,
  });

  // 7. 취약 카테고리 분석
  const weakCategories = analyzeWeakCategories(categoryScores);

  // 8. 메시지 생성
  const message = getMessageByGrade(finalGrade);

  // 9. 원본 지출 합계 (보정 전)
  const originalTotal = CATEGORY_IDS.reduce((sum, id) => sum + parseAmount(expenses[id]), 0);

  // 10. 주거 유형 및 분석
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
    housingDetails, // 주거비 상세 정보 추가
    foodDetails, // 식비 상세 정보 추가
    transportDetails, // 교통비 상세 정보 추가
    leisureDetails, // 여가비 상세 정보 추가
    fixedDetails, // 고정지출 상세 정보 추가
    miscDetails, // 생활잡비 상세 정보 추가
    savingsDetails, // 저축·비상금 상세 정보 추가
    details: {
      riskFlags,
      weakCategories,
      adjustedExpenses,
    },
  };
}
