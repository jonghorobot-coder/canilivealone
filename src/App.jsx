import { useSurvey } from './hooks/useSurvey';
import { CoreLayout } from './layout/CoreLayout';
import { IntroStep } from './components/steps/IntroStep';
import { ExpenseStep } from './components/steps/ExpenseStep';
import { QuestionStep } from './components/steps/QuestionStep';
import { ResultStep } from './components/steps/ResultStep';

function App() {
  const { stepInfo } = useSurvey();
  const { isIntroStep, isExpenseStep, isQuestionStep, isResultStep, currentQuestion } = stepInfo;

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

    if (isResultStep) {
      return <ResultStep />;
    }

    return null;
  };

  return (
    <div className="min-h-dvh bg-neutral-100">
      <div className="w-full px-5">
        <div className="max-w-md mx-auto">
          <CoreLayout>
            {renderStep()}
          </CoreLayout>
        </div>
      </div>
    </div>
  );
}

export default App;
