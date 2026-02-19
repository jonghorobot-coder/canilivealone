export function ProgressBar({ current, total, label }) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-neutral-500">
          {label || `${current} / ${total}`}
        </span>
        <span className="text-sm font-medium text-neutral-600 tabular-nums">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-1.5 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-1.5 bg-emerald-600 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
