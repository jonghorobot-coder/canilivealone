import { useId, useRef } from 'react';
import { formatNumber, parseNumber } from '../../utils/format';

// Validation constants
const MAX_VALUE = 10000; // 1억 (만원 단위)

export function NumberInput({
  label,
  description,
  value,
  onChange,
  placeholder = '0',
  unit = '만원',
  className = '',
  max = MAX_VALUE,
  error = '',
  icon = null,
}) {
  const inputRef = useRef(null);
  const id = useId();
  const inputId = `number-input-${id}`;
  const errorId = `number-input-error-${id}`;

  const handleChange = (e) => {
    const rawValue = parseNumber(e.target.value);
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue > max) {
      return;
    }
    onChange(rawValue);
  };

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const displayValue = formatNumber(value);
  const hasError = !!error;

  return (
    <div className={`bg-white rounded-3xl shadow-sm border border-neutral-100 p-6 ${className}`}>
      <div className="flex items-center gap-4">
        {/* 왼쪽: 아이콘 */}
        {icon && (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E8F3EF] to-[#D1E7DD] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}

        {/* 중앙: 라벨 + 설명 */}
        <div className="flex-1 min-w-0">
          {label && (
            <label htmlFor={inputId} className="block">
              <span className="text-[18px] font-bold text-neutral-800 tracking-tight block leading-tight">{label}</span>
              {description && (
                <span className="block text-[15px] text-neutral-400 mt-1">{description}</span>
              )}
            </label>
          )}
        </div>

        {/* 오른쪽: 입력창 */}
        <div className="relative flex-shrink-0">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            inputMode="numeric"
            value={displayValue}
            onChange={handleChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : undefined}
            className={`w-[140px] h-14 px-4 pr-14 text-[20px] font-bold text-neutral-800 tabular-nums text-right
                       bg-neutral-50 border-2 rounded-2xl
                       focus:outline-none focus:bg-white
                       transition-all duration-200 placeholder:text-neutral-300 placeholder:font-normal
                       ${hasError
                         ? 'border-red-300 focus:border-red-400'
                         : 'border-neutral-200 focus:border-[#0F3D2E]'
                       }`}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-400 text-[16px] font-medium pointer-events-none">
            {unit}
          </span>
        </div>
      </div>

      {hasError && (
        <p id={errorId} className="mt-3 text-[15px] text-red-500 font-semibold">{error}</p>
      )}
    </div>
  );
}
