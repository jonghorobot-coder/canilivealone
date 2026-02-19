import { useRef } from 'react';
import { formatNumber, parseNumber } from '../../utils/format';

export function NumberInput({
  label,
  description,
  value,
  onChange,
  placeholder = '0',
  unit = '만원',
  className = '',
}) {
  const inputRef = useRef(null);

  const handleChange = (e) => {
    const rawValue = parseNumber(e.target.value);
    onChange(rawValue);
  };

  const handleFocus = () => {
    setTimeout(() => {
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 300);
  };

  const displayValue = formatNumber(value);

  return (
    <div className={className}>
      {label && (
        <label className="block mb-2">
          <span className="text-sm font-semibold text-neutral-700">{label}</span>
          {description && (
            <span className="block text-xs text-neutral-500 mt-0.5">{description}</span>
          )}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full h-11 px-3 pr-12 text-base font-medium text-neutral-800 tabular-nums
                     bg-white border border-neutral-300 rounded-lg
                     focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600
                     transition-colors duration-150 placeholder:text-neutral-400"
        />
        <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-500 text-sm font-medium">
          {unit}
        </span>
      </div>
    </div>
  );
}
