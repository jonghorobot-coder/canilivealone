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
    <div className={`bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-neutral-100/80 p-4 sm:p-5 ${className}`}>
      <div className="flex items-center gap-3 sm:gap-4">
        {/* 왼쪽: 아이콘 */}
        {icon && (
          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-[#E8F3EF] to-[#D4EBE3] flex items-center justify-center flex-shrink-0">
            {icon}
          </div>
        )}

        {/* 중앙: 라벨 + 설명 */}
        <div className="flex-1 min-w-0">
          {label && (
            <label htmlFor={inputId} className="block">
              <span className="text-[15px] sm:text-[16px] font-semibold text-neutral-800 tracking-[-0.01em] block leading-tight">{label}</span>
              {description && (
                <span className="block text-[13px] sm:text-[14px] text-neutral-400 mt-0.5">{description}</span>
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
            className={`input-number text-[17px] sm:text-[18px] w-[110px] sm:w-[130px] h-[46px] sm:h-[52px] px-3 sm:px-4 pr-11 sm:pr-12 font-semibold text-neutral-800 tabular-nums text-right
                       bg-neutral-50/80 border-[1.5px] rounded-xl
                       focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#0F3D2E]/10
                       transition-all duration-150 placeholder:text-neutral-300
                       ${hasError
                         ? 'border-red-300 focus:border-red-400 focus:ring-red-100'
                         : 'border-neutral-200 focus:border-[#0F3D2E]'
                       }`}
          />
          <span className="absolute right-3 sm:right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[13px] sm:text-[14px] font-medium pointer-events-none">
            {unit}
          </span>
        </div>
      </div>

      {hasError && (
        <p id={errorId} className="mt-3 text-[13px] sm:text-[14px] text-red-500 font-medium">{error}</p>
      )}
    </div>
  );
}
