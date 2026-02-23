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

// bfcache(뒤로-앞으로 캐시)에서 복원될 때 루트 경로면 새로고침
// 이렇게 해야 링크로 재접속 시 항상 처음부터 시작됨
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
