export function ProgressBar({ current, total, label }) {
  const percentage = (current / total) * 100;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[12px] text-neutral-500 tracking-wide">
          {label || `${current} / ${total}`}
        </span>
        <span className="text-[12px] font-medium text-neutral-500 tabular-nums">
          {Math.round(percentage)}%
        </span>
      </div>
      <div className="h-1 bg-neutral-100 rounded-full overflow-hidden">
        <div
          className="h-1 bg-[#0F3D2E] rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
