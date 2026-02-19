import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SurveyProvider } from './context/SurveyContext';
import { initGA } from './utils/analytics';
import App from './App';
import './index.css';

// Google Analytics 초기화
initGA();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <SurveyProvider>
      <App />
    </SurveyProvider>
  </StrictMode>
);
