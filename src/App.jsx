import { useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useSurvey } from './hooks/useSurvey';
import { CoreLayout } from './layout/CoreLayout';
import { IntroStep } from './components/steps/IntroStep';
import { ExpenseStep } from './components/steps/ExpenseStep';
import { QuestionStep } from './components/steps/QuestionStep';
import { ResultStep } from './components/steps/ResultStep';

function PageLayout({ children }) {
  return (
    <div className="min-h-dvh bg-neutral-100">
      <div className="w-full px-5">
        <div className="max-w-md mx-auto">
          <CoreLayout>
            {children}
          </CoreLayout>
        </div>
      </div>
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
    </Routes>
  );
}

export default App;
