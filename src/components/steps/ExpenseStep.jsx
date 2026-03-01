import { useEffect, useRef } from 'react';
import { StepLayout } from '../layout/StepLayout';
import { NumberInput } from '../common/NumberInput';
import { useSurvey } from '../../hooks/useSurvey';
import { expenseCategories } from '../../data/expenseCategories';
import { AnalyticsEvents } from '../../utils/analytics';
import { parseNumber } from '../../utils/format';

// 필수 카테고리와 선택 카테고리 분리
const REQUIRED_CATEGORIES = ['housing', 'food', 'fixed', 'transport', 'savings'];
const OPTIONAL_CATEGORIES = ['leisure', 'misc'];

// 카테고리별 아이콘 정의
const CATEGORY_ICONS = {
  housing: (
    <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  ),
  food: (
    <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.87c1.355 0 2.697.055 4.024.165C17.155 8.51 18 9.473 18 10.608v2.513m-3-4.87v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.38a48.474 48.474 0 00-6-.37c-2.032 0-4.034.125-6 .37m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.17c0 .62-.504 1.124-1.125 1.124H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265zm-3 0a.375.375 0 11-.53 0L9 2.845l.265.265zm6 0a.375.375 0 11-.53 0L15 2.845l.265.265z" />
    </svg>
  ),
  fixed: (
    <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
    </svg>
  ),
  transport: (
    <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
    </svg>
  ),
  leisure: (
    <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 01-6.364 0M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
    </svg>
  ),
  misc: (
    <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  ),
  savings: (
    <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  ),
};

export function ExpenseStep() {
  const { income, expenses, setIncome, setExpense, nextStep } = useSurvey();
  const hasTrackedFirstInput = useRef(false);
  const hasTrackedDeficit = useRef(false);

  useEffect(() => {
    AnalyticsEvents.viewExpenseStep();
  }, []);

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

  // 필수 카테고리만 체크 (여가비, 생활잡비는 선택사항)
  const requiredCategories = expenseCategories.filter(cat => REQUIRED_CATEGORIES.includes(cat.id));
  const optionalCategories = expenseCategories.filter(cat => OPTIONAL_CATEGORIES.includes(cat.id));

  const allRequiredFilled = requiredCategories.every(
    (cat) => expenses[cat.id] && expenses[cat.id] !== ''
  );

  // 선택 항목 검증: 둘 다 입력하거나 둘 다 비워야 함
  const leisureFilled = expenses.leisure && expenses.leisure !== '' && toNumber(expenses.leisure) >= 0 && expenses.leisure !== '';
  const miscFilled = expenses.misc && expenses.misc !== '' && toNumber(expenses.misc) >= 0 && expenses.misc !== '';
  const hasLeisureValue = expenses.leisure && expenses.leisure !== '';
  const hasMiscValue = expenses.misc && expenses.misc !== '';
  const optionalValid = (hasLeisureValue && hasMiscValue) || (!hasLeisureValue && !hasMiscValue);

  const canProceed = isIncomeFilled && allRequiredFilled && optionalValid;

  const handleNext = () => {
    if (canProceed) {
      AnalyticsEvents.stepProgress(1);
      nextStep();
    }
  };

  const totalExpenses = calculateTotal(expenses);
  const incomeNum = toNumber(income);
  const balance = incomeNum - totalExpenses;

  useEffect(() => {
    if (hasTrackedDeficit.current) return;
    if (balance < 0 && isIncomeFilled) {
      AnalyticsEvents.expenseDeficitWarning(Math.abs(balance));
      hasTrackedDeficit.current = true;
    }
  }, [balance, isIncomeFilled]);

  return (
    <StepLayout
      title="월 수입과 지출을 알려주세요"
      subtitle="대략적인 금액이면 충분해요"
      showProgress={false}
      showBackButton={true}
      nextDisabled={!canProceed}
      onNext={handleNext}
      animateIn={true}
    >
      {/* 요약 카드 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20 animate-stagger animate-stagger-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <span className="text-[14px] text-white/50 block mb-1 font-medium">수입</span>
              <span className="text-[22px] font-bold text-white tabular-nums">
                {incomeNum.toLocaleString()}<span className="text-[15px] text-white/50 ml-1 font-normal">만원</span>
              </span>
            </div>
            <div className="h-12 border-l border-white/20" />
            <div>
              <span className="text-[14px] text-white/50 block mb-1 font-medium">지출</span>
              <span className="text-[22px] font-bold text-white tabular-nums">
                {totalExpenses.toLocaleString()}<span className="text-[15px] text-white/50 ml-1 font-normal">만원</span>
              </span>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[14px] text-white/50 block mb-1 font-medium">잔액</span>
            <span className={`text-[24px] font-bold tabular-nums ${
              balance >= 0 ? 'text-[#6EE7B7]' : 'text-[#FCA5A5]'
            }`}>
              {balance >= 0 ? '+' : ''}{balance.toLocaleString()}<span className="text-[15px] ml-1 font-normal">만원</span>
            </span>
          </div>
        </div>
      </div>

      {/* 수입 입력 카드 */}
      <div className="bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 animate-stagger animate-stagger-3">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8F3EF] to-[#D1E7DD] flex items-center justify-center flex-shrink-0">
            <svg className="w-7 h-7 text-[#0F3D2E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-[18px] font-bold text-neutral-800 tracking-tight">월 수입</p>
            <p className="text-[15px] text-neutral-400 mt-1">세후 실수령액</p>
          </div>
          <div className="relative flex-shrink-0">
            <input
              type="text"
              inputMode="numeric"
              value={formatDisplayNumber(income)}
              onChange={(e) => setIncome(parseNumber(e.target.value))}
              placeholder="250"
              style={{ fontSize: '22px' }}
              className={`input-number w-[140px] h-14 px-4 pr-14 font-semibold text-neutral-800 tabular-nums text-right
                         bg-neutral-50 border-2 rounded-2xl
                         focus:outline-none focus:bg-white
                         transition-all duration-200 placeholder:text-neutral-400
                         ${isIncomeZero
                           ? 'border-red-300 focus:border-red-400'
                           : 'border-neutral-200 focus:border-[#0F3D2E]'
                         }`}
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-[15px] font-medium pointer-events-none">
              만원
            </span>
          </div>
        </div>
        {isIncomeZero && (
          <p className="mt-3 text-[15px] text-red-500 font-semibold">수입을 입력해주세요</p>
        )}
      </div>

      {/* 필수 지출 카테고리들 */}
      {requiredCategories.map((category, index) => (
        <div key={category.id} className={`animate-stagger animate-stagger-${index + 4}`}>
          <NumberInput
            label={category.label}
            description={category.description}
            value={expenses[category.id]}
            onChange={(value) => setExpense(category.id, value)}
            placeholder={category.placeholder}
            icon={CATEGORY_ICONS[category.id]}
          />
        </div>
      ))}

      {/* 구분선 + 선택사항 안내 */}
      <div className="relative py-4 animate-stagger animate-stagger-9">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/20"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-[#0F3D2E] px-4 text-[15px] text-white/60 font-semibold">
            선택사항
          </span>
        </div>
      </div>

      {/* 선택사항 안내 메시지 */}
      <div className="bg-white/5 rounded-2xl p-4 border border-white/10 animate-stagger animate-stagger-10">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <svg className="w-4 h-4 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-[16px] text-white/80 font-semibold">
              아래 항목은 건너뛰어도 괜찮아요
            </p>
            <p className="text-[15px] text-white/50 mt-1">
              입력하시면 더 정확한 분석 결과를 받을 수 있어요
            </p>
          </div>
        </div>
      </div>

      {/* 선택 지출 카테고리들 (여가비, 생활잡비) */}
      {optionalCategories.map((category, index) => (
        <div key={category.id} className={`animate-stagger animate-stagger-${index + 11}`}>
          <NumberInput
            label={category.label}
            description={category.description}
            value={expenses[category.id]}
            onChange={(value) => setExpense(category.id, value)}
            placeholder={category.placeholder}
            icon={CATEGORY_ICONS[category.id]}
          />
        </div>
      ))}

      {/* 선택 항목 부분 입력 안내 */}
      {!optionalValid && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[16px] text-amber-700 font-semibold">
              {hasLeisureValue ? '생활잡비도 함께 입력해 주세요' : '여가비도 함께 입력해 주세요'}
            </p>
          </div>
        </div>
      )}

      {/* 적자 경고 */}
      {balance < 0 && isIncomeFilled && (
        <div className="p-5 rounded-2xl bg-red-50 border border-red-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-[20px] text-red-700 font-bold">
                월 {Math.abs(balance).toLocaleString()}만원 적자
              </p>
              <p className="text-[16px] text-red-500 mt-1">
                괜찮아요, 이 상태로 진단을 진행합니다
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

function formatDisplayNumber(value) {
  if (!value || value === '') return '';
  const num = parseInt(parseNumber(value), 10);
  if (isNaN(num)) return '';
  return num.toLocaleString();
}
