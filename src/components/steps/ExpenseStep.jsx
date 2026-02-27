import { useEffect, useRef } from 'react';
import { StepLayout } from '../layout/StepLayout';
import { NumberInput } from '../common/NumberInput';
import { useSurvey } from '../../hooks/useSurvey';
import { expenseCategories } from '../../data/expenseCategories';
import { AnalyticsEvents } from '../../utils/analytics';
import { parseNumber } from '../../utils/format';

// 카테고리 그룹 정의
const livingExpenses = ['housing', 'food', 'transport', 'leisure', 'misc'];
const fixedExpenses = ['fixed', 'savings'];

export function ExpenseStep() {
  const { income, expenses, setIncome, setExpense, nextStep } = useSurvey();
  const hasTrackedFirstInput = useRef(false);
  const hasTrackedDeficit = useRef(false);

  useEffect(() => {
    AnalyticsEvents.viewExpenseStep();
  }, []);

  // 첫 지출 입력 추적
  useEffect(() => {
    if (hasTrackedFirstInput.current) return;
    const hasAnyExpense = Object.values(expenses).some(val => val && val !== '' && toNumber(val) > 0);
    if (hasAnyExpense) {
      AnalyticsEvents.expenseInputStart();
      hasTrackedFirstInput.current = true;
    }
  }, [expenses]);

  const incomeValue = toNumber(income);
  const isIncomeZero = income !== '' && incomeValue === 0;
  const isIncomeFilled = income && income !== '' && incomeValue > 0;
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
  const incomeNum = toNumber(income);
  const balance = incomeNum - totalExpenses;

  const livingCategories = expenseCategories.filter(c => livingExpenses.includes(c.id));
  const fixedCategories = expenseCategories.filter(c => fixedExpenses.includes(c.id));

  // 적자 경고 추적 (한 번만)
  useEffect(() => {
    if (hasTrackedDeficit.current) return;
    if (balance < 0 && isIncomeFilled) {
      AnalyticsEvents.expenseDeficitWarning(Math.abs(balance));
      hasTrackedDeficit.current = true;
    }
  }, [balance, isIncomeFilled]);

  return (
    <StepLayout
      title="월 수입과 지출을 입력하세요"
      subtitle="정확한 진단을 위해 실제 금액에 가깝게 입력해주세요"
      showBackButton={true}
      nextDisabled={!canProceed}
      onNext={handleNext}
    >
      {/* 요약 카드 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5 tracking-wide">수입</span>
              <span className="text-[16px] font-semibold text-neutral-800 tabular-nums tracking-tight">
                {incomeNum.toLocaleString()}<span className="text-[11px] text-neutral-500 ml-0.5">만원</span>
              </span>
            </div>
            <div className="h-9 border-l border-neutral-200" />
            <div>
              <span className="text-[10px] text-neutral-500 block mb-0.5 tracking-wide">지출</span>
              <span className="text-[16px] font-semibold text-neutral-800 tabular-nums tracking-tight">
                {totalExpenses.toLocaleString()}<span className="text-[11px] text-neutral-500 ml-0.5">만원</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-neutral-500 block mb-0.5 tracking-wide">잔액</span>
            <span className={`text-[17px] font-semibold tabular-nums tracking-tight ${
              balance >= 0 ? 'text-[#0F3D2E]' : 'text-[#B42318]'
            }`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}<span className="text-[12px] ml-0.5">만원</span>
            </span>
          </div>
        </div>
      </div>

      {/* 수입 입력 카드 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <span className="text-[#0F3D2E] text-[15px] font-semibold">₩</span>
          <div>
            <p className="text-[13px] font-semibold text-neutral-800 tracking-tight">월 수입</p>
            <p className="text-[10px] text-neutral-500">세후 실수령액 기준</p>
          </div>
        </div>
        <NumberInput
          value={income}
          onChange={setIncome}
          placeholder="250"
          error={isIncomeZero ? '수입이 0원입니다. 정확한 금액을 입력해주세요.' : ''}
        />
      </div>

      {/* 생활지출 그룹 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-neutral-100">
          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <h3 className="text-[12px] font-semibold text-neutral-600 tracking-tight">생활지출</h3>
        </div>
        <div className="space-y-3">
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
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3 pb-2.5 border-b border-neutral-100">
          <svg className="w-3.5 h-3.5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <h3 className="text-[12px] font-semibold text-neutral-600 tracking-tight">고정·저축</h3>
        </div>
        <div className="space-y-3">
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
        <div className="p-4 rounded-[12px] border border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] text-red-800 font-semibold mb-1">
                월 {Math.abs(balance).toLocaleString()}만원 적자 상태
              </p>
              <p className="text-[12px] text-red-600 leading-relaxed">
                적자 구조로 진단이 진행됩니다.<br />
                독립 가능성 점수가 낮게 산출될 수 있어요.
              </p>
            </div>
          </div>
        </div>
      )}
    </StepLayout>
  );
}

function toNumber(value) {
  const parsed = parseNumber(value);
  const num = parseInt(parsed, 10);
  return isNaN(num) ? 0 : num;
}

function calculateTotal(expenses) {
  return Object.values(expenses).reduce((sum, val) => {
    return sum + toNumber(val);
  }, 0);
}
