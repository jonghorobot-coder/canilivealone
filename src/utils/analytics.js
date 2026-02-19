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

  // gtag.js 스크립트 동적 로드
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  // gtag 설정
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
  // 진단 시작
  startDiagnosis: () => trackEvent('start_diagnosis', {
    event_category: 'engagement',
    event_label: 'Start Button Click',
  }),

  // 결과 도달
  reachResult: (score, grade) => trackEvent('reach_result', {
    event_category: 'conversion',
    event_label: grade,
    value: score,
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
};
