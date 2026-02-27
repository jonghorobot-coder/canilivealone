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
}) {
  const inputRef = useRef(null);
  const id = useId();
  const inputId = `number-input-${id}`;
  const errorId = `number-input-error-${id}`;

  const handleChange = (e) => {
    const rawValue = parseNumber(e.target.value);

    // 숫자 외 입력은 parseNumber에서 이미 차단됨
    // 음수는 parseNumber가 숫자만 추출하므로 불가능

    // 최대값 제한 (1억 이상 차단)
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue > max) {
      return; // 입력 차단
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
    <div className={className}>
      {label && (
        <label htmlFor={inputId} className="block mb-2">
          <span className="text-[13px] font-semibold text-neutral-700 tracking-tight">{label}</span>
          {description && (
            <span className="block text-[11px] text-neutral-500 mt-0.5">{description}</span>
          )}
        </label>
      )}
      <div className="relative">
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
          className={`w-full h-11 px-3 pr-12 text-[15px] font-medium text-neutral-800 tabular-nums tracking-tight
                     bg-white border rounded-[10px]
                     focus:outline-none focus:ring-1
                     transition-colors duration-150 placeholder:text-neutral-400
                     ${hasError
                       ? 'border-[#B42318] focus:border-[#B42318] focus:ring-[#B42318]/20'
                       : 'border-neutral-200 focus:border-[#0F3D2E] focus:ring-[#0F3D2E]/20'
                     }`}
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-[13px] font-medium">
          {unit}
        </span>
      </div>
      {hasError && (
        <p id={errorId} className="mt-1.5 text-[11px] text-[#B42318] font-medium">{error}</p>
      )}
    </div>
  );
}
