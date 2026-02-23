import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SurveyProvider } from './context/SurveyContext';
import { initGA } from './utils/analytics';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

// Google Analytics 초기화
initGA();

// 인스타그램 등 인앱 브라우저에서 웹뷰가 숨겨졌다가 다시 보일 때 새로고침
// 인앱 브라우저는 X 눌러도 페이지를 메모리에 유지하므로 이 처리가 필요함
let hiddenTime = 0;

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    hiddenTime = Date.now();
  } else if (document.visibilityState === 'visible') {
    // 30초 이상 숨겨져 있었으면 새로고침 (짧은 앱 전환은 무시)
    const wasHiddenFor = Date.now() - hiddenTime;
    if (hiddenTime > 0 && wasHiddenFor > 30000 && window.location.pathname === '/') {
      window.location.reload();
    }
  }
});

// bfcache(뒤로-앞으로 캐시)에서 복원될 때도 새로고침
window.addEventListener('pageshow', (event) => {
  if (event.persisted && window.location.pathname === '/') {
    window.location.reload();
  }
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <SurveyProvider>
          <App />
        </SurveyProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
