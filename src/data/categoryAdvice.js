/**
 * 카테고리별 구조 기반 개선 조언
 * - 점수 구간별 맞춤 조언 제공
 * - 전문 금융 설계 톤 유지
 * - 데이터 중심 문장
 */

// 점수 구간: critical (0-49), warning (50-69), stable (70+)
export const CATEGORY_ADVICE = {
  housing: {
    label: '주거비',
    critical: {
      diagnosis: '주거비 부담이 재정 구조의 핵심 리스크 요인입니다.',
      metrics: [
        '권장 주거비율: 월 수입의 30% 이하',
        '현재 구조에서 주거비율 초과 시 타 지출 압박 발생',
      ],
      actions: [
        '주거 형태 재검토 (월세 → 반전세, 지역 이동 등)',
        '주거비 외 고정지출 10% 이상 절감 필요',
        '비상자금 3개월치 이상 확보 후 독립 권장',
      ],
    },
    warning: {
      diagnosis: '주거비 구조에 개선 여지가 있습니다.',
      metrics: [
        '주거비율 30~40% 구간은 주의 관리 필요',
        '소득 변동 시 주거 유지에 리스크 발생 가능',
      ],
      actions: [
        '임대료 인상 대비 월 5만원 이상 별도 적립',
        '계약 갱신 6개월 전 주거비 재협상 검토',
        '주거비 비상자금 3개월치 확보',
      ],
    },
  },

  food: {
    label: '식비',
    critical: {
      diagnosis: '식비 지출 구조가 재정 안정성을 저해하고 있습니다.',
      metrics: [
        '권장 식비율: 월 수입의 15~20%',
        '현재 식비율이 권장 범위를 초과한 상태',
      ],
      actions: [
        '주간 식비 예산제 도입 (주 단위 한도 설정)',
        '배달/외식 빈도 주 3회 이하로 제한',
        '식비 지출 내역 2주간 기록 후 패턴 분석',
      ],
    },
    warning: {
      diagnosis: '식비 관리에 구조적 개선이 필요합니다.',
      metrics: [
        '식비율 20~25% 구간은 관리 강화 필요',
        '외식/배달 비중이 높을 경우 변동성 증가',
      ],
      actions: [
        '월 식비 예산 설정 및 주간 모니터링',
        '배달/외식 지출 별도 추적',
        '식비 절감분 저축 계좌로 자동이체 설정',
      ],
    },
  },

  fixed: {
    label: '고정지출',
    critical: {
      diagnosis: '고정지출 비중이 과다하여 재정 유연성이 제한됩니다.',
      metrics: [
        '권장 고정지출 비율: 월 수입의 20% 이하',
        '고정지출 과다 시 비상 상황 대응력 저하',
      ],
      actions: [
        '구독 서비스 전수 조사 및 미사용 항목 해지',
        '통신비 요금제 최적화 (알뜰폰 전환 검토)',
        '보험료 적정성 점검 (중복 보장 제거)',
        '할부 잔액 조기 상환 검토',
      ],
    },
    warning: {
      diagnosis: '고정지출 구조 점검이 필요합니다.',
      metrics: [
        '고정지출 비율 15~20% 구간',
        '정기 점검 없을 시 불필요 지출 누적 가능',
      ],
      actions: [
        '분기 1회 구독/자동이체 내역 점검',
        '연간 고정지출 총액 산출 후 절감 목표 설정',
        '계약 갱신 시점에 조건 재협상',
      ],
    },
  },

  transport: {
    label: '교통비',
    critical: {
      diagnosis: '교통비 지출이 재정 구조에 부담을 주고 있습니다.',
      metrics: [
        '권장 교통비율: 월 수입의 10% 이하',
        '차량 유지비 포함 시 15% 초과는 고위험',
      ],
      actions: [
        '출퇴근 경로 및 수단 효율성 재검토',
        '차량 보유 시 유지비 대비 대중교통 비용 비교 분석',
        '카풀, 공유 모빌리티 활용 검토',
        '불필요 이동 최소화 (온라인 대체 가능 여부)',
      ],
    },
    warning: {
      diagnosis: '교통비 효율화 여지가 있습니다.',
      metrics: [
        '교통비율 8~12% 구간은 최적화 가능',
        '변동성이 높을 경우 예산 초과 리스크 존재',
      ],
      actions: [
        '월간 교통비 예산 설정',
        '정기권/충전식 교통카드 활용으로 할인 적용',
        '교통비 지출 패턴 월별 추적',
      ],
    },
  },

  leisure: {
    label: '여가비',
    critical: {
      diagnosis: '여가비 지출이 저축 여력을 제한하고 있습니다.',
      metrics: [
        '권장 여가비율: 월 수입의 10% 이하',
        '여가비 과다는 비상자금 축적 지연의 주요 원인',
      ],
      actions: [
        '월 여가비 상한선 설정 (수입의 10% 이내)',
        '충동 소비 방지를 위한 24시간 대기 규칙 적용',
        '무료/저비용 여가 활동 대체 목록 작성',
        '사회적 지출(모임비) 월 한도 별도 설정',
      ],
    },
    warning: {
      diagnosis: '여가비 통제력 강화가 필요합니다.',
      metrics: [
        '여가비율 8~12% 구간',
        '계획 외 지출 빈도에 따라 변동성 증가',
      ],
      actions: [
        '여가비 별도 계좌/카드로 분리 관리',
        '월초 여가 예산 설정 후 잔액 모니터링',
        '대규모 여가 지출은 분기 예산으로 별도 계획',
      ],
    },
  },

  misc: {
    label: '생활 잡비',
    critical: {
      diagnosis: '생활 잡비가 재정 누수의 원인이 되고 있습니다.',
      metrics: [
        '권장 잡비율: 월 수입의 5% 이하',
        '잡비 미관리 시 월 10만원 이상 누수 가능',
      ],
      actions: [
        '2주간 모든 소액 지출 기록 (커피, 편의점 등)',
        '일일 잡비 한도 설정 (예: 5,000원)',
        '현금/체크카드 사용으로 지출 체감도 향상',
        '정기 구매 항목 월 1회 일괄 구매로 전환',
      ],
    },
    warning: {
      diagnosis: '잡비 관리 체계 구축이 필요합니다.',
      metrics: [
        '잡비율 5~8% 구간',
        '소액 다빈도 지출 패턴 시 총액 과소평가 경향',
      ],
      actions: [
        '주간 잡비 예산 설정',
        '소액 지출 앱/가계부로 자동 추적',
        '월말 잡비 총액 리뷰 후 다음 달 예산 조정',
      ],
    },
  },

  savings: {
    label: '저축·비상금',
    critical: {
      diagnosis: '저축 구조가 불안정하여 재정 안전망이 부재합니다.',
      metrics: [
        '권장 저축률: 월 수입의 20% 이상',
        '비상자금: 월 생활비 6개월치 이상 필요',
        '현재 구조로는 예상치 못한 지출 대응 불가',
      ],
      actions: [
        '월급일 자동이체로 선저축 구조 구축',
        '비상자금 목표 설정: 월 생활비 × 6개월',
        '저축 불가 시 지출 구조 전면 재검토 필요',
        '단기 목표: 1개월 생활비 비상금 우선 확보',
      ],
    },
    warning: {
      diagnosis: '저축 여력 확대가 필요합니다.',
      metrics: [
        '저축률 10~15% 구간은 안정권 미달',
        '비상자금 3~6개월 구간은 추가 축적 권장',
      ],
      actions: [
        '저축률 목표 상향: 현재 + 5%p',
        '변동 지출 절감분 저축 계좌로 이전',
        '보너스/추가 수입의 50% 이상 저축 배분',
        '비상자금과 목적자금 계좌 분리 운영',
      ],
    },
  },
};

/**
 * 점수에 따른 조언 레벨 반환
 * @param {number} score - 카테고리 점수 (0-100)
 * @returns {'critical' | 'warning' | 'stable'}
 */
export function getAdviceLevel(score) {
  if (score < 50) return 'critical';
  if (score < 70) return 'warning';
  return 'stable';
}

/**
 * 카테고리별 개선 조언 반환
 * @param {string} categoryId - 카테고리 ID
 * @param {number} score - 카테고리 점수
 * @returns {Object|null} 조언 객체 또는 null (stable인 경우)
 */
export function getCategoryAdvice(categoryId, score) {
  const level = getAdviceLevel(score);
  if (level === 'stable') return null;

  const category = CATEGORY_ADVICE[categoryId];
  if (!category) return null;

  return {
    categoryId,
    label: category.label,
    level,
    ...category[level],
  };
}

/**
 * 모든 카테고리의 개선 조언 반환 (점수 낮은 순)
 * @param {Object} categoryScores - 카테고리별 점수 객체
 * @returns {Array} 조언 배열 (stable 제외, 점수 낮은 순 정렬)
 */
export function getAllCategoryAdvice(categoryScores) {
  if (!categoryScores) return [];

  const adviceList = Object.entries(categoryScores)
    .map(([categoryId, score]) => {
      const advice = getCategoryAdvice(categoryId, score);
      if (!advice) return null;
      return { ...advice, score };
    })
    .filter(Boolean)
    .sort((a, b) => a.score - b.score); // 점수 낮은 순

  return adviceList;
}
