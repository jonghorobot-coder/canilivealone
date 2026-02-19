// 주거 형태 값 상수
export const HOUSING_TYPES = {
  RENT_STABLE: 'rent_stable',
  RENT_LOW: 'rent_low',
  GOSIWON: 'gosiwon_share',
  JEONSE_SAFE: 'jeonse_safe',
  JEONSE_LOAN: 'jeonse_loan',
};

// 월세 유형 (보증금 있는 월세)
const RENT_TYPES = [HOUSING_TYPES.RENT_STABLE, HOUSING_TYPES.RENT_LOW];

export const questions = [
  // ===== 주거비 (housing) =====
  // 주거 형태 선택 (모든 사용자 공통)
  {
    id: 'housing_q1',
    category: 'housing',
    categoryLabel: '주거비',
    title: '주거 형태',
    question: '독립 후 예상하는 주거 형태는 무엇인가요?',
    options: [
      { label: '월세 (보증금 1,000만원 이상)', value: 'rent_stable', scoreImpact: 0 },
      { label: '월세 (보증금 500만원 미만)', value: 'rent_low', scoreImpact: -10 },
      { label: '고시원 / 쉐어하우스 (보증금 없음 또는 소액)', value: 'gosiwon_share', scoreImpact: -20 },
      { label: '반전세/전세 (대출 없음)', value: 'jeonse_safe', scoreImpact: 0 },
      { label: '전세 (대출 있음)', value: 'jeonse_loan', scoreImpact: -15 },
    ],
  },

  // === 월세 조건부 질문 ===
  {
    id: 'housing_rent_q1',
    category: 'housing',
    categoryLabel: '주거비',
    title: '임대료 인상 대비',
    question: '임대료 인상 시 3개월 이상 버틸 자금이 있습니까?',
    showWhen: { questionId: 'housing_q1', values: RENT_TYPES },
    options: [
      { label: '3개월 이상 충분히 가능', value: 'over_3months', scoreImpact: 0 },
      { label: '1~2개월 정도 가능', value: '1_2months', scoreImpact: -10 },
      { label: '대비 자금 없음', value: 'none', scoreImpact: -20 },
    ],
  },
  {
    id: 'housing_rent_q2',
    category: 'housing',
    categoryLabel: '주거비',
    title: '월세 비율',
    question: '월세가 세후 소득의 30%를 초과합니까?',
    showWhen: { questionId: 'housing_q1', values: RENT_TYPES },
    options: [
      { label: '20% 이하', value: 'under_20', scoreImpact: 0 },
      { label: '21~30%', value: '21_30', scoreImpact: -5 },
      { label: '30% 초과', value: 'over_30', scoreImpact: -15 },
      { label: '40% 초과', value: 'over_40', scoreImpact: -25 },
    ],
  },

  // === 고시원/쉐어하우스 조건부 질문 ===
  {
    id: 'housing_gosiwon_q1',
    category: 'housing',
    categoryLabel: '주거비',
    title: '전환 계획',
    question: '2년 이내 일반 월세로 전환 계획이 있습니까?',
    showWhen: { questionId: 'housing_q1', values: [HOUSING_TYPES.GOSIWON] },
    options: [
      { label: '1년 이내 전환 예정', value: 'within_1year', scoreImpact: 0 },
      { label: '2년 이내 전환 예정', value: 'within_2years', scoreImpact: -5 },
      { label: '계획은 있으나 시기 미정', value: 'no_timeline', scoreImpact: -10 },
      { label: '전환 계획 없음', value: 'no_plan', scoreImpact: -20 },
    ],
  },
  {
    id: 'housing_gosiwon_q2',
    category: 'housing',
    categoryLabel: '주거비',
    title: '보증금 저축',
    question: '보증금 마련을 위한 저축 계획이 있습니까?',
    showWhen: { questionId: 'housing_q1', values: [HOUSING_TYPES.GOSIWON] },
    options: [
      { label: '매월 정기 저축 중', value: 'saving_monthly', scoreImpact: 0 },
      { label: '저축 계획 수립 중', value: 'planning', scoreImpact: -5 },
      { label: '저축 여력이 부족함', value: 'no_余裕', scoreImpact: -15 },
      { label: '저축 계획 없음', value: 'no_plan', scoreImpact: -20 },
    ],
  },
  {
    id: 'housing_gosiwon_q3',
    category: 'housing',
    categoryLabel: '주거비',
    title: '전환 시점',
    question: '전환 예상 시점은 언제입니까?',
    showWhen: { questionId: 'housing_q1', values: [HOUSING_TYPES.GOSIWON] },
    options: [
      { label: '6개월 이내', value: 'within_6months', scoreImpact: 0 },
      { label: '1년 이내', value: 'within_1year', scoreImpact: -5 },
      { label: '2년 이내', value: 'within_2years', scoreImpact: -10 },
      { label: '미정 / 알 수 없음', value: 'unknown', scoreImpact: -15 },
    ],
  },

  // === 전세(대출 없음) 조건부 질문 ===
  {
    id: 'housing_jeonse_q1',
    category: 'housing',
    categoryLabel: '주거비',
    title: '전세금 인상 대비',
    question: '전세금 상승 시 추가 자금 마련이 가능합니까?',
    showWhen: { questionId: 'housing_q1', values: [HOUSING_TYPES.JEONSE_SAFE] },
    options: [
      { label: '여유 자금으로 충분히 가능', value: 'enough', scoreImpact: 0 },
      { label: '일부 대출 필요', value: 'partial_loan', scoreImpact: -10 },
      { label: '대부분 대출 필요', value: 'mostly_loan', scoreImpact: -15 },
      { label: '마련 어려움', value: 'difficult', scoreImpact: -20 },
    ],
  },
  {
    id: 'housing_jeonse_q2',
    category: 'housing',
    categoryLabel: '주거비',
    title: '자산 집중도',
    question: '전세금이 전체 자산의 70% 이상입니까?',
    showWhen: { questionId: 'housing_q1', values: [HOUSING_TYPES.JEONSE_SAFE] },
    options: [
      { label: '50% 미만', value: 'under_50', scoreImpact: 0 },
      { label: '50~70%', value: '50_70', scoreImpact: -5 },
      { label: '70% 이상', value: 'over_70', scoreImpact: -15 },
      { label: '거의 전부 (90% 이상)', value: 'over_90', scoreImpact: -25 },
    ],
  },

  // === 전세(대출 있음) 조건부 질문 ===
  {
    id: 'housing_loan_q1',
    category: 'housing',
    categoryLabel: '주거비',
    title: '금리 상승 대비',
    question: '금리 2% 상승 시 상환 가능합니까?',
    showWhen: { questionId: 'housing_q1', values: [HOUSING_TYPES.JEONSE_LOAN] },
    options: [
      { label: '충분히 감당 가능', value: 'comfortable', scoreImpact: 0 },
      { label: '다른 지출 줄이면 가능', value: 'cut_others', scoreImpact: -10 },
      { label: '상당히 부담됨', value: 'burdensome', scoreImpact: -15 },
      { label: '상환 어려움', value: 'difficult', scoreImpact: -25 },
    ],
  },
  {
    id: 'housing_loan_q2',
    category: 'housing',
    categoryLabel: '주거비',
    title: '상환 비상금',
    question: '6개월 이상 상환 가능한 비상금이 있습니까?',
    showWhen: { questionId: 'housing_q1', values: [HOUSING_TYPES.JEONSE_LOAN] },
    options: [
      { label: '6개월 이상 보유', value: 'over_6months', scoreImpact: 0 },
      { label: '3~6개월 보유', value: '3_6months', scoreImpact: -10 },
      { label: '3개월 미만', value: 'under_3months', scoreImpact: -15 },
      { label: '비상금 없음', value: 'none', scoreImpact: -25 },
    ],
  },

  // ===== 식비 (food) =====
  {
    id: 'food_q1',
    category: 'food',
    categoryLabel: '식비',
    title: '식사 해결 방식',
    question: '평소 식사를 주로 어떻게 해결하나요?',
    options: [
      { label: '대부분 직접 요리', value: 'cook_mostly', scoreImpact: 0 },
      { label: '요리 반, 외식/배달 반', value: 'half_half', scoreImpact: -5 },
      { label: '외식/배달이 더 많음', value: 'eat_out_more', scoreImpact: -10 },
      { label: '거의 외식/배달', value: 'eat_out_always', scoreImpact: -15 },
    ],
  },
  {
    id: 'food_q2',
    category: 'food',
    categoryLabel: '식비',
    title: '배달/외식 빈도',
    question: '일주일에 배달/외식을 몇 번 하나요?',
    options: [
      { label: '주 1~2회 이하', value: 'rarely', scoreImpact: 0 },
      { label: '주 3~4회', value: 'sometimes', scoreImpact: -5 },
      { label: '주 5~7회', value: 'often', scoreImpact: -10 },
      { label: '거의 매일 2회 이상', value: 'always', scoreImpact: -15 },
    ],
  },
  {
    id: 'food_q3',
    category: 'food',
    categoryLabel: '식비',
    title: '식비 통제력',
    question: '한 달 식비를 계획한 대로 지킬 수 있나요?',
    options: [
      { label: '항상 예산 내로 유지', value: 'always_budget', scoreImpact: 0 },
      { label: '대체로 지키지만 가끔 초과', value: 'mostly_budget', scoreImpact: -5 },
      { label: '자주 예산을 초과함', value: 'often_exceed', scoreImpact: -10 },
      { label: '예산 없이 그때그때 씀', value: 'no_budget', scoreImpact: -15 },
    ],
  },
  {
    id: 'food_q4',
    category: 'food',
    categoryLabel: '식비',
    title: '식비 현실 인식',
    question: '입력한 식비로 실제 한 달을 버틸 수 있나요?',
    options: [
      { label: '충분히 가능 (여유 있음)', value: 'enough', scoreImpact: 0 },
      { label: '딱 맞거나 약간 빠듯', value: 'tight', scoreImpact: -5 },
      { label: '솔직히 부족할 것 같음', value: 'not_enough', scoreImpact: -10 },
      { label: '잘 모르겠음', value: 'unknown', scoreImpact: -15 },
    ],
  },

  // ===== 고정지출 (fixed) =====
  {
    id: 'fixed_q1',
    category: 'fixed',
    categoryLabel: '고정지출',
    title: '고정지출 파악도',
    question: '매달 나가는 고정지출을 정확히 알고 있나요?',
    options: [
      { label: '모든 항목과 금액을 정확히 앎', value: 'know_all', scoreImpact: 0 },
      { label: '대략적으로 알고 있음', value: 'know_roughly', scoreImpact: -5 },
      { label: '일부만 파악하고 있음', value: 'know_partial', scoreImpact: -10 },
      { label: '잘 모름', value: 'dont_know', scoreImpact: -15 },
    ],
  },
  {
    id: 'fixed_q2',
    category: 'fixed',
    categoryLabel: '고정지출',
    title: '구독 서비스 관리',
    question: '사용 중인 구독 서비스를 관리하고 있나요?',
    options: [
      { label: '필요한 것만 유지, 정기 점검', value: 'managed_well', scoreImpact: 0 },
      { label: '가끔 정리하는 편', value: 'sometimes_check', scoreImpact: -5 },
      { label: '뭘 구독 중인지 잘 모름', value: 'dont_know', scoreImpact: -10 },
      { label: '안 쓰는데 결제되는 게 있을 듯', value: 'wasting', scoreImpact: -15 },
    ],
  },
  {
    id: 'fixed_q3',
    category: 'fixed',
    categoryLabel: '고정지출',
    title: '통신비 최적화',
    question: '휴대폰/인터넷 요금제를 점검해본 적 있나요?',
    options: [
      { label: '최적 요금제 사용 중', value: 'optimized', scoreImpact: 0 },
      { label: '점검해봤지만 그대로 유지', value: 'checked_kept', scoreImpact: -5 },
      { label: '점검해본 적 없음', value: 'never_checked', scoreImpact: -10 },
      { label: '비싼 거 알지만 바꾸기 귀찮음', value: 'lazy', scoreImpact: -10 },
    ],
  },
  {
    id: 'fixed_q4',
    category: 'fixed',
    categoryLabel: '고정지출',
    title: '숨은 고정비 인식',
    question: '보험료, 할부금, 자동이체 등 숨은 고정비가 있나요?',
    options: [
      { label: '없거나 모두 파악하고 있음', value: 'none_or_known', scoreImpact: 0 },
      { label: '있지만 감당 가능한 수준', value: 'manageable', scoreImpact: -5 },
      { label: '있고, 부담이 되는 편', value: 'burdensome', scoreImpact: -10 },
      { label: '정확히 얼마인지 모름', value: 'unknown', scoreImpact: -15 },
    ],
  },

  // ===== 교통비 (transport) =====
  {
    id: 'transport_q1',
    category: 'transport',
    categoryLabel: '교통비',
    title: '주요 이동 수단',
    question: '주로 어떤 이동 수단을 사용하나요?',
    options: [
      { label: '대중교통 위주', value: 'public', scoreImpact: 0 },
      { label: '자전거/도보 위주', value: 'bike_walk', scoreImpact: 0 },
      { label: '자가용 위주', value: 'car', scoreImpact: -10 },
      { label: '택시/카셰어링 자주 이용', value: 'taxi_share', scoreImpact: -10 },
    ],
  },
  {
    id: 'transport_q2',
    category: 'transport',
    categoryLabel: '교통비',
    title: '출퇴근 비용',
    question: '출퇴근/통학에 드는 월 교통비는?',
    options: [
      { label: '5만원 이하', value: 'under_5', scoreImpact: 0 },
      { label: '5~10만원', value: '5_10', scoreImpact: -5 },
      { label: '10~20만원', value: '10_20', scoreImpact: -10 },
      { label: '20만원 초과', value: 'over_20', scoreImpact: -15 },
    ],
  },
  {
    id: 'transport_q3',
    category: 'transport',
    categoryLabel: '교통비',
    title: '차량 유지비',
    question: '자가용이 있다면, 유지비를 감당할 수 있나요?',
    options: [
      { label: '차량 없음', value: 'no_car', scoreImpact: 0 },
      { label: '있고, 유지비 충분히 감당', value: 'car_comfortable', scoreImpact: 0 },
      { label: '있지만 유지비가 부담됨', value: 'car_burden', scoreImpact: -10 },
      { label: '유지비 때문에 매달 적자', value: 'car_deficit', scoreImpact: -20 },
    ],
  },
  {
    id: 'transport_q4',
    category: 'transport',
    categoryLabel: '교통비',
    title: '교통비 변동성',
    question: '교통비가 예상보다 많이 나온 적이 있나요?',
    options: [
      { label: '거의 없음, 일정함', value: 'stable', scoreImpact: 0 },
      { label: '가끔 초과하지만 소폭', value: 'slight_exceed', scoreImpact: -5 },
      { label: '자주 예상을 초과함', value: 'often_exceed', scoreImpact: -10 },
      { label: '얼마나 쓰는지 파악 안 됨', value: 'no_tracking', scoreImpact: -15 },
    ],
  },

  // ===== 여가비 (leisure) =====
  {
    id: 'leisure_q1',
    category: 'leisure',
    categoryLabel: '여가비',
    title: '여가 소비 패턴',
    question: '주로 어떤 여가 활동에 돈을 쓰나요?',
    options: [
      { label: '무료/저비용 활동 위주', value: 'free_low', scoreImpact: 0 },
      { label: '적당한 취미 (월 5만원 이하)', value: 'moderate', scoreImpact: -5 },
      { label: '비용이 드는 취미 (월 10만원 이상)', value: 'expensive', scoreImpact: -10 },
      { label: '고비용 취미 (월 20만원 이상)', value: 'very_expensive', scoreImpact: -15 },
    ],
  },
  {
    id: 'leisure_q2',
    category: 'leisure',
    categoryLabel: '여가비',
    title: '충동 소비',
    question: '계획에 없던 여가 지출을 얼마나 자주 하나요?',
    options: [
      { label: '거의 안 함', value: 'rarely', scoreImpact: 0 },
      { label: '월 1~2회 정도', value: 'sometimes', scoreImpact: -5 },
      { label: '주 1회 이상', value: 'often', scoreImpact: -10 },
      { label: '자주, 통제가 안 됨', value: 'uncontrolled', scoreImpact: -15 },
    ],
  },
  {
    id: 'leisure_q3',
    category: 'leisure',
    categoryLabel: '여가비',
    title: '여가비 조절 가능성',
    question: '돈이 부족하면 여가비를 줄일 수 있나요?',
    options: [
      { label: '쉽게 줄일 수 있음', value: 'easy_cut', scoreImpact: 0 },
      { label: '어렵지만 가능', value: 'hard_but_possible', scoreImpact: -5 },
      { label: '줄이기 어려움', value: 'hard_to_cut', scoreImpact: -10 },
      { label: '포기 못함, 필수임', value: 'cannot_cut', scoreImpact: -15 },
    ],
  },
  {
    id: 'leisure_q4',
    category: 'leisure',
    categoryLabel: '여가비',
    title: '사회적 지출 압박',
    question: '친구/모임으로 인한 지출 압박이 있나요?',
    options: [
      { label: '거의 없음', value: 'no_pressure', scoreImpact: 0 },
      { label: '가끔 있지만 거절 가능', value: 'can_refuse', scoreImpact: -5 },
      { label: '자주 있고 거절하기 어려움', value: 'hard_refuse', scoreImpact: -10 },
      { label: '사회생활 비용이 큰 부담', value: 'big_burden', scoreImpact: -15 },
    ],
  },

  // ===== 생활 잡비 (misc) =====
  {
    id: 'misc_q1',
    category: 'misc',
    categoryLabel: '생활 잡비',
    title: '생필품 구매 습관',
    question: '생필품을 어떻게 구매하나요?',
    options: [
      { label: '필요할 때만 최소한으로', value: 'minimal', scoreImpact: 0 },
      { label: '할인할 때 미리 구매', value: 'bulk_discount', scoreImpact: 0 },
      { label: '필요 이상으로 사는 편', value: 'over_buy', scoreImpact: -10 },
      { label: '충동적으로 자주 구매', value: 'impulsive', scoreImpact: -15 },
    ],
  },
  {
    id: 'misc_q2',
    category: 'misc',
    categoryLabel: '생활 잡비',
    title: '예상치 못한 지출',
    question: '예상 못한 소소한 지출이 얼마나 자주 생기나요?',
    options: [
      { label: '거의 없음', value: 'rarely', scoreImpact: 0 },
      { label: '월 1~2회, 소액', value: 'sometimes_small', scoreImpact: -5 },
      { label: '자주, 금액도 꽤 됨', value: 'often_significant', scoreImpact: -10 },
      { label: '매주 뭔가 나감', value: 'weekly', scoreImpact: -15 },
    ],
  },
  {
    id: 'misc_q3',
    category: 'misc',
    categoryLabel: '생활 잡비',
    title: '잡비 예산 관리',
    question: '생활 잡비 예산을 따로 관리하나요?',
    options: [
      { label: '예산 설정하고 지킴', value: 'budget_kept', scoreImpact: 0 },
      { label: '대략적 한도만 있음', value: 'rough_limit', scoreImpact: -5 },
      { label: '따로 관리 안 함', value: 'no_management', scoreImpact: -10 },
      { label: '잡비가 뭔지도 모름', value: 'no_awareness', scoreImpact: -15 },
    ],
  },
  {
    id: 'misc_q4',
    category: 'misc',
    categoryLabel: '생활 잡비',
    title: '소소한 지출 인식',
    question: '커피, 편의점 등 소소한 지출을 인식하나요?',
    options: [
      { label: '모두 기록하고 파악함', value: 'track_all', scoreImpact: 0 },
      { label: '대략 얼마인지 앎', value: 'rough_idea', scoreImpact: -5 },
      { label: '잘 모르지만 많을 것 같음', value: 'probably_much', scoreImpact: -10 },
      { label: '전혀 신경 안 씀', value: 'no_care', scoreImpact: -15 },
    ],
  },

  // ===== 저축/비상금 (savings) =====
  {
    id: 'savings_q1',
    category: 'savings',
    categoryLabel: '저축·비상금',
    title: '현재 비상금 수준',
    question: '지금 당장 쓸 수 있는 비상금이 얼마나 있나요?',
    options: [
      { label: '6개월 이상 생활비', value: 'over_6months', scoreImpact: 0 },
      { label: '3~6개월 생활비', value: '3_6months', scoreImpact: -5 },
      { label: '1~3개월 생활비', value: '1_3months', scoreImpact: -10 },
      { label: '1개월 미만 또는 없음', value: 'under_1month', scoreImpact: -20 },
    ],
  },
  {
    id: 'savings_q2',
    category: 'savings',
    categoryLabel: '저축·비상금',
    title: '저축 습관',
    question: '매달 저축을 꾸준히 하고 있나요?',
    options: [
      { label: '월급날 자동이체로 저축', value: 'auto_save', scoreImpact: 0 },
      { label: '남으면 저축하는 편', value: 'save_leftovers', scoreImpact: -5 },
      { label: '저축할 여유가 없음', value: 'no_margin', scoreImpact: -10 },
      { label: '오히려 마이너스/빚', value: 'negative', scoreImpact: -20 },
    ],
  },
  {
    id: 'savings_q3',
    category: 'savings',
    categoryLabel: '저축·비상금',
    title: '긴급 상황 대응',
    question: '갑자기 100만원이 필요하면 어떻게 하나요?',
    options: [
      { label: '비상금에서 바로 해결', value: 'emergency_fund', scoreImpact: 0 },
      { label: '저축 깨서 해결', value: 'break_savings', scoreImpact: -5 },
      { label: '가족/지인에게 빌림', value: 'borrow_family', scoreImpact: -10 },
      { label: '대출/카드론 이용', value: 'loan', scoreImpact: -20 },
    ],
  },
  {
    id: 'savings_q4',
    category: 'savings',
    categoryLabel: '저축·비상금',
    title: '재정 안전망 인식',
    question: '실직/질병 시 몇 개월을 버틸 수 있나요?',
    options: [
      { label: '6개월 이상', value: 'over_6months', scoreImpact: 0 },
      { label: '3~6개월', value: '3_6months', scoreImpact: -5 },
      { label: '1~3개월', value: '1_3months', scoreImpact: -10 },
      { label: '1개월도 어려움', value: 'under_1month', scoreImpact: -20 },
    ],
  },
];

/**
 * 현재 답변 상태에 따라 표시할 질문 목록을 필터링합니다.
 * @param {Object} answers - 현재까지의 답변 { questionId: value }
 * @returns {Array} 필터링된 질문 배열
 */
export function getFilteredQuestions(answers = {}) {
  return questions.filter((q) => {
    // showWhen 조건이 없으면 항상 표시
    if (!q.showWhen) return true;

    const { questionId, values } = q.showWhen;
    const selectedValue = answers[questionId];

    // 조건 질문에 아직 답하지 않았으면 표시하지 않음
    if (!selectedValue) return false;

    // 선택한 값이 조건 값 목록에 포함되어야 표시
    return values.includes(selectedValue);
  });
}

/**
 * 필터링된 질문 기반으로 카테고리 정보를 동적으로 생성합니다.
 * @param {Array} filteredQuestions - 필터링된 질문 배열
 * @returns {Array} 카테고리 배열
 */
export function getQuestionCategories(filteredQuestions) {
  const categoryMap = {};

  filteredQuestions.forEach((q, index) => {
    if (!categoryMap[q.category]) {
      categoryMap[q.category] = {
        id: q.category,
        label: q.categoryLabel,
        startIndex: index,
        endIndex: index,
      };
    } else {
      categoryMap[q.category].endIndex = index;
    }
  });

  // 카테고리 순서 유지
  const categoryOrder = ['housing', 'food', 'fixed', 'transport', 'leisure', 'misc', 'savings'];
  return categoryOrder
    .filter((id) => categoryMap[id])
    .map((id) => categoryMap[id]);
}

// 기존 호환성을 위한 정적 카테고리 (조건부 질문 없는 기본 상태)
export const questionCategories = getQuestionCategories(
  questions.filter((q) => !q.showWhen)
);

// 카테고리 ID로 해당 카테고리 질문들 가져오기
export function getQuestionsByCategory(categoryId) {
  return questions.filter((q) => q.category === categoryId);
}

// 질문 index로 카테고리 정보 가져오기
export function getCategoryByIndex(index, categories) {
  return categories.find(
    (cat) => index >= cat.startIndex && index <= cat.endIndex
  );
}

// 주거 유형별 분석 텍스트
export const HOUSING_ANALYSIS = {
  [HOUSING_TYPES.RENT_STABLE]: {
    title: '월세 분석',
    summary: '비교적 안정적인 주거 구조입니다.',
    details: '임대료 인상 대비 자금 확보가 중요합니다. 월 주거비 비율을 30% 이하로 유지하는 전략이 필요합니다.',
    strategies: [
      '임대료 인상 대비 3개월 이상 비상금 확보',
      '월 주거비 비율 30% 이하 유지',
      '계약 갱신 시점 전 비교 검토',
    ],
  },
  [HOUSING_TYPES.RENT_LOW]: {
    title: '월세 분석',
    summary: '보증금이 낮아 초기 부담은 적으나 월세 부담이 클 수 있습니다.',
    details: '임대료 인상 대비 자금 확보가 중요합니다. 월 주거비 비율을 30% 이하로 유지하는 전략이 필요합니다.',
    strategies: [
      '보증금 증액으로 월세 절감 검토',
      '임대료 인상 대비 비상금 확보',
      '월 주거비 비율 30% 이하 유지',
    ],
  },
  [HOUSING_TYPES.GOSIWON]: {
    title: '주거 분석',
    summary: '현재는 단기 거주 구조입니다.',
    details: '장기적인 재무 자립을 위해서는 향후 안정적인 임대 구조로의 전환 계획이 필요합니다.',
    strategies: [
      '보증금 마련 목표 설정',
      '1~2년 내 월세 또는 전세 전환 로드맵 수립',
      '월 고정비 대비 저축률 30% 이상 유지 권장',
      '주거 안정성 점수 개선을 위한 자산 축적 전략 필요',
    ],
  },
  [HOUSING_TYPES.JEONSE_SAFE]: {
    title: '전세 분석',
    summary: '대출 없는 전세로 안정적인 구조입니다.',
    details: '자산이 전세금에 과도하게 묶여 있는 경우 유동성 관리 전략이 필요합니다.',
    strategies: [
      '전세금 외 유동 자산 20% 이상 확보',
      '전세금 반환 보증보험 가입 검토',
      '계약 만료 전 시세 변동 모니터링',
    ],
  },
  [HOUSING_TYPES.JEONSE_LOAN]: {
    title: '전세대출 분석',
    summary: '금리 상승 리스크 대비가 핵심입니다.',
    details: '금리 변동에 따른 상환 부담 증가에 대비해야 합니다. 비상금 및 상환 여력을 확보해야 합니다.',
    strategies: [
      '금리 2% 상승 시나리오 대비',
      '6개월 이상 상환 가능한 비상금 확보',
      '고정금리 전환 검토',
      '대출 상환 로드맵 수립',
    ],
  },
};
