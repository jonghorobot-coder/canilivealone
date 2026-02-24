/**
 * Google Analytics 4 유틸리티
 * 환경변수 VITE_GA_ID 기반
 */

const GA_ID = import.meta.env.VITE_GA_ID;

// GA 스크립트 로드
export function initGA() {
  if (!GA_ID) {
    console.log('[Analytics] GA_ID not configured');
    return;
  }

  // dataLayer 및 gtag 함수 초기화 (스크립트 로드 전에 필요)
  window.dataLayer = window.dataLayer || [];
  window.gtag = function() {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());

  // gtag.js 스크립트 동적 로드
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // gtag 설정 (이제 안전하게 호출 가능)
  window.gtag('config', GA_ID, {
    send_page_view: true,
  });

  console.log('[Analytics] GA initialized:', GA_ID);
}

// 이벤트 추적
export function trackEvent(eventName, params = {}) {
  if (!GA_ID || typeof window.gtag !== 'function') {
    console.log('[Analytics] Event (dev):', eventName, params);
    return;
  }

  window.gtag('event', eventName, params);
}

// 사전 정의된 이벤트
export const AnalyticsEvents = {
  // 테스트 시작 (start_test)
  startDiagnosis: () => trackEvent('start_test', {
    event_category: 'engagement',
    event_label: 'Start Button Click',
  }),

  // 테스트 완료 (complete_test) - 점수 포함
  reachResult: (score, grade) => trackEvent('complete_test', {
    event_category: 'conversion',
    event_label: grade,
    score: score,
  }),

  // 링크 복사
  copyLink: () => trackEvent('copy_link', {
    event_category: 'share',
    event_label: 'Link Copy',
  }),

  // 이미지 저장
  saveImage: () => trackEvent('save_image', {
    event_category: 'share',
    event_label: 'Image Save',
  }),

  // 스텝 진행
  stepProgress: (step) => trackEvent('step_progress', {
    event_category: 'engagement',
    event_label: `Step ${step}`,
    value: step,
  }),

  // 인트로 화면 조회
  viewIntro: () => trackEvent('view_intro', {
    event_category: 'pageview',
    event_label: 'Intro Page',
  }),

  // 지출 입력 단계 조회
  viewExpenseStep: () => trackEvent('view_expense_step', {
    event_category: 'pageview',
    event_label: 'Expense Step',
  }),

  // 설문 단계 조회
  viewQuestionStep: (questionId) => trackEvent('view_question_step', {
    event_category: 'pageview',
    event_label: `Question ${questionId}`,
    value: questionId,
  }),

  // 결과 페이지 조회 (view_result)
  viewResultPage: () => trackEvent('view_result', {
    event_category: 'pageview',
    event_label: 'Result Page',
  }),

  // 진단 재시작
  restartDiagnosis: () => trackEvent('restart_diagnosis', {
    event_category: 'engagement',
    event_label: 'Restart Button Click',
  }),

  // 공유 이벤트 (통합) - share_type, score, grade 포함
  share: (shareType, score, grade) => trackEvent('share_click', {
    event_category: 'share',
    share_type: shareType, // 'link', 'image', 'kakao'
    score: score,
    grade: grade,
  }),

  // 카카오톡 공유
  shareKakao: (score, grade) => trackEvent('share_kakao', {
    event_category: 'share',
    event_label: 'Kakao Share',
    score: score,
    grade: grade,
  }),

  // 프리미엄 리포트 관련 이벤트
  premiumPreviewView: (score, grade, riskLevel) => trackEvent('premium_preview_view', {
    event_category: 'premium',
    event_label: 'Premium Preview Viewed',
    score: score,
    grade: grade,
    risk_level: riskLevel,
  }),

  premiumCtaClick: (score, grade, riskLevel) => trackEvent('premium_cta_click', {
    event_category: 'premium',
    event_label: 'Premium CTA Click',
    score: score,
    grade: grade,
    risk_level: riskLevel,
  }),

  premiumPurchaseClick: (score, grade, riskLevel) => trackEvent('premium_purchase_click', {
    event_category: 'conversion',
    event_label: 'Premium Purchase Click',
    score: score,
    grade: grade,
    risk_level: riskLevel,
  }),

  // 프리미엄 모달 열기/닫기 (퍼널 분석)
  premiumModalOpen: (score, grade) => trackEvent('premium_modal_open', {
    event_category: 'premium',
    event_label: 'Premium Modal Opened',
    score: score,
    grade: grade,
  }),

  premiumModalClose: (score, grade, step) => trackEvent('premium_modal_close', {
    event_category: 'premium',
    event_label: 'Premium Modal Closed',
    score: score,
    grade: grade,
    exit_step: step, // 'preview', 'email', 'payment' - 어느 단계에서 이탈했는지
  }),

  // 지출 입력 관련 (진단 진행 퍼널)
  expenseInputStart: () => trackEvent('expense_input_start', {
    event_category: 'engagement',
    event_label: 'First Expense Input',
  }),

  expenseDeficitWarning: (deficitAmount) => trackEvent('expense_deficit_warning', {
    event_category: 'engagement',
    event_label: 'Deficit Warning Shown',
    deficit_amount: deficitAmount,
  }),

  // 결과 페이지 상호작용 (사용자 관심사 파악)
  resultSectionExpand: (sectionName) => trackEvent('result_section_expand', {
    event_category: 'engagement',
    event_label: sectionName, // 'goal_simulation', 'score_methodology', 'category_detail'
  }),

  goalSimulationInteract: (currentScore, targetScore) => trackEvent('goal_simulation_interact', {
    event_category: 'engagement',
    event_label: 'Goal Score Selected',
    current_score: currentScore,
    target_score: targetScore,
    score_gap: targetScore - currentScore,
  }),

  gradeRangeToggle: (isOpen) => trackEvent('grade_range_toggle', {
    event_category: 'engagement',
    event_label: isOpen ? 'Grade Range Opened' : 'Grade Range Closed',
  }),

  // 공유 결과 조회 (바이럴 트래킹)
  sharedResultView: (score, grade) => trackEvent('shared_result_view', {
    event_category: 'viral',
    event_label: 'Shared Result Viewed',
    score: score,
    grade: grade,
  }),

  // 공유 결과에서 본인 진단 시작 (전환)
  sharedResultToStart: (friendScore, friendGrade) => trackEvent('shared_result_to_start', {
    event_category: 'conversion',
    event_label: 'Start From Shared Result',
    friend_score: friendScore,
    friend_grade: friendGrade,
  }),

  // 이전 결과 비교 조회
  historyCompareView: (currentScore, previousScore) => trackEvent('history_compare_view', {
    event_category: 'engagement',
    event_label: 'History Comparison Viewed',
    current_score: currentScore,
    previous_score: previousScore,
    score_change: currentScore - previousScore,
  }),

  // 공유 실패 (UX 개선 포인트 파악)
  shareFail: (shareType, errorType) => trackEvent('share_fail', {
    event_category: 'error',
    event_label: `${shareType} Share Failed`,
    share_type: shareType,
    error_type: errorType,
  }),

  // 동의 모달 관련
  consentModalOpen: () => trackEvent('consent_modal_open', {
    event_category: 'engagement',
    event_label: 'Consent Modal Opened',
  }),

  consentModalClose: () => trackEvent('consent_modal_close', {
    event_category: 'engagement',
    event_label: 'Consent Modal Closed Without Agree',
  }),

  // 스크롤 깊이 (결과 페이지에서 어디까지 봤는지)
  resultScrollDepth: (depthPercent) => trackEvent('result_scroll_depth', {
    event_category: 'engagement',
    event_label: `Scrolled ${depthPercent}%`,
    depth_percent: depthPercent,
  }),
};
