import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useSurvey } from './hooks/useSurvey';
import { CoreLayout } from './layout/CoreLayout';
import { IntroStep } from './components/steps/IntroStep';
import { ExpenseStep } from './components/steps/ExpenseStep';
import { QuestionStep } from './components/steps/QuestionStep';
import { ResultStep } from './components/steps/ResultStep';
import { NotFound } from './pages/NotFound';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';

function PageLayout({ children }) {
  return (
    <div className="min-h-dvh">
      <CoreLayout>
        {children}
      </CoreLayout>
    </div>
  );
}

function SurveyPage() {
  const navigate = useNavigate();
  const { stepInfo } = useSurvey();
  const { isIntroStep, isExpenseStep, isQuestionStep, isResultStep, currentQuestion } = stepInfo;

  useEffect(() => {
    if (isResultStep) {
      navigate('/result', { replace: true });
    }
  }, [isResultStep, navigate]);

  const renderStep = () => {
    if (isIntroStep) {
      return <IntroStep />;
    }

    if (isExpenseStep) {
      return <ExpenseStep />;
    }

    if (isQuestionStep && currentQuestion) {
      return <QuestionStep key={currentQuestion.id} question={currentQuestion} />;
    }

    return null;
  };

  return <PageLayout>{renderStep()}</PageLayout>;
}

function ResultPage() {
  return (
    <PageLayout>
      <ResultStep />
    </PageLayout>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<SurveyPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<TermsOfService />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
