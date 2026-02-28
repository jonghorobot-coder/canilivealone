import { useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useSurvey } from './hooks/useSurvey';
import { CoreLayout } from './layout/CoreLayout';
import { ScrollToTop } from './components/ScrollToTop';
import { IntroStep } from './components/steps/IntroStep';
import { ExpenseStep } from './components/steps/ExpenseStep';
import { QuestionStep } from './components/steps/QuestionStep';
import { ResultStep } from './components/steps/ResultStep';
import { NotFound } from './pages/NotFound';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { AdminPage } from './pages/AdminPage';

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
  const { stepInfo, currentStep, prevStep } = useSurvey();
  const { isIntroStep, isExpenseStep, isQuestionStep, isResultStep, currentQuestion } = stepInfo;
  const prevStepRef = useRef(currentStep);

  // 스텝 변경 시 스크롤 맨 위로
  useEffect(() => {
    if (prevStepRef.current !== currentStep) {
      window.scrollTo(0, 0);
      prevStepRef.current = currentStep;
    }
  }, [currentStep]);

  // 브라우저 뒤로가기 버튼 처리
  useEffect(() => {
    const isInProgress = isExpenseStep || isQuestionStep;

    // 진행 중일 때만 히스토리 상태 추가
    if (isInProgress) {
      // 현재 상태가 없으면 추가
      if (!window.history.state?.surveyStep) {
        window.history.pushState({ surveyStep: currentStep }, '');
      }
    }

    const handlePopState = (e) => {
      // 설문 진행 중에 뒤로가기 누르면 이전 스텝으로
      if (isInProgress) {
        e.preventDefault();
        // 히스토리 상태 다시 추가 (뒤로가기로 빠져나가지 않도록)
        window.history.pushState({ surveyStep: currentStep }, '');
        prevStep();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isExpenseStep, isQuestionStep, currentStep, prevStep]);

  // 진단 중 이탈 방지
  useEffect(() => {
    const isInProgress = isExpenseStep || isQuestionStep;

    const handleBeforeUnload = (e) => {
      if (isInProgress) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    if (isInProgress) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isExpenseStep, isQuestionStep]);

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
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<SurveyPage />} />
        <Route path="/result" element={<ResultPage />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/mng-x9k2m7" element={<AdminPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
