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
};
