export function Spinner({ className = "" }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className}`}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="3"
        className="opacity-20"
      />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** 中央にスピナーとメッセージを表示するページ読み込み中の共通表示 */
export function LoadingBlock({ label = "読み込み中" }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-ink/40 py-12 justify-center">
      <Spinner className="w-4 h-4" />
      <span className="text-sm">{label}...</span>
    </div>
  );
}
