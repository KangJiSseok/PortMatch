import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  showIcon?: boolean;
}

const EmptyState = ({ 
  title = "결과를 찾을 수 없습니다", 
  description = "조건을 변경하여 다시 시도해 주세요.",
  actionLabel,
  onAction,
  showIcon = true
}: EmptyStateProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex w-full flex-col items-center justify-center py-24 text-center">
      {showIcon && (
        <div className="bg-cloud-dancer mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            className="text-silver-mist"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>
      )}

      <h3 className="text-midnight-ink text-xl font-black tracking-tighter">
        {title}
      </h3>
      <p className="text-silver-mist mt-2 text-[15px] font-bold">
        {description}
      </p>

      {actionLabel && (
        <button
          onClick={onAction || (() => navigate(-1))}
          className="bg-midnight-ink text-pure-white hover:bg-point-blue mt-8 rounded-xl px-8 py-3 text-xs font-black transition-all active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;