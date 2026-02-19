import { StepLayout } from '../layout/StepLayout';
import { NumberInput } from '../common/NumberInput';
import { useSurvey } from '../../hooks/useSurvey';
import { expenseCategories } from '../../data/expenseCategories';
import { AnalyticsEvents } from '../../utils/analytics';

// 카테고리 그룹 정의
const livingExpenses = ['housing', 'food', 'transport', 'leisure', 'misc'];
const fixedExpenses = ['fixed', 'savings'];

export function ExpenseStep() {
  const { income, expenses, setIncome, setExpense, nextStep } = useSurvey();

  const isIncomeFilled = income && income !== '' && parseNumber(income) > 0;
  const allExpensesFilled = expenseCategories.every(
    (cat) => expenses[cat.id] && expenses[cat.id] !== ''
  );
  const canProceed = isIncomeFilled && allExpensesFilled;

  const handleNext = () => {
    if (canProceed) {
      AnalyticsEvents.stepProgress(1);
      nextStep();
    }
  };

  const totalExpenses = calculateTotal(expenses);
  const incomeNum = parseNumber(income);
  const balance = incomeNum - totalExpenses;

  const livingCategories = expenseCategories.filter(c => livingExpenses.includes(c.id));
  const fixedCategories = expenseCategories.filter(c => fixedExpenses.includes(c.id));

  return (
    <StepLayout
      title="월 수입과 지출을 입력하세요"
      subtitle="정확한 진단을 위해 실제 금액에 가깝게 입력해주세요"
      showBackButton={true}
      nextDisabled={!canProceed}
      onNext={handleNext}
    >
      {/* 요약 카드 */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-xs text-neutral-500 block mb-0.5">수입</span>
              <span className="text-lg font-semibold text-neutral-800 tabular-nums">
                {incomeNum.toLocaleString()}
              </span>
            </div>
            <div className="h-10 border-l border-neutral-200" />
            <div>
              <span className="text-xs text-neutral-500 block mb-0.5">지출</span>
              <span className="text-lg font-semibold text-neutral-800 tabular-nums">
                {totalExpenses.toLocaleString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-neutral-500 block mb-0.5">잔액</span>
            <span className={`text-xl font-semibold tabular-nums ${
              balance >= 0 ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}<span className="text-sm ml-0.5">만원</span>
            </span>
          </div>
        </div>
      </div>

      {/* 수입 입력 카드 */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-emerald-600 text-lg font-semibold">₩</span>
          <div>
            <p className="text-sm font-semibold text-neutral-800">월 수입</p>
            <p className="text-xs text-neutral-500">세후 실수령액 기준</p>
          </div>
        </div>
        <NumberInput
          value={income}
          onChange={setIncome}
          placeholder="250"
        />
      </div>

      {/* 생활지출 그룹 */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
          <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h3 className="text-sm font-semibold text-neutral-800">생활지출</h3>
        </div>
        <div className="space-y-4">
          {livingCategories.map((category) => (
            <NumberInput
              key={category.id}
              label={category.label}
              description={category.description}
              value={expenses[category.id]}
              onChange={(value) => setExpense(category.id, value)}
              placeholder={category.placeholder}
            />
          ))}
        </div>
      </div>

      {/* 고정지출 그룹 */}
      <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-100">
          <svg className="w-4 h-4 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-sm font-semibold text-neutral-800">고정·저축</h3>
        </div>
        <div className="space-y-4">
          {fixedCategories.map((category) => (
            <NumberInput
              key={category.id}
              label={category.label}
              description={category.description}
              value={expenses[category.id]}
              onChange={(value) => setExpense(category.id, value)}
              placeholder={category.placeholder}
            />
          ))}
        </div>
      </div>

      {/* 경고 메시지 */}
      {balance < 0 && isIncomeFilled && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50">
          <p className="text-sm text-red-600 font-medium">
            지출이 수입보다 많습니다.
          </p>
        </div>
      )}
    </StepLayout>
  );
}

function parseNumber(value) {
  if (!value && value !== 0) return 0;
  const num = parseInt(String(value).replace(/[^\d]/g, ''), 10);
  return isNaN(num) ? 0 : num;
}

function calculateTotal(expenses) {
  return Object.values(expenses).reduce((sum, val) => {
    return sum + parseNumber(val);
  }, 0);
}
