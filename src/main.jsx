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
