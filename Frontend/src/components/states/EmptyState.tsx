import React from 'react';

type EmptyStateProps = {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function EmptyState({
  title = '추천 기업이 아직 없어요',
  description = '포트폴리오를 분석한 뒤, 조건에 맞는 기업이 생기면 여기에 표시돼요.',
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-[28px] border border-[#f0eee9] bg-white p-7">
      <div className="mb-4 flex items-center gap-2">
        <div className="h-1 w-6 rounded-full bg-[#d6d2c4]" />
        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#a3a3a3]">
          Empty
        </span>
      </div>

      <p className="text-base font-bold text-[#1a1a1a]">{title}</p>
      <p className="mt-2 text-[14.5px] leading-relaxed text-[#4a4a4a]">{description}</p>

      {actionLabel && onAction && (
        <div className="mt-6">
          <button
            onClick={onAction}
            className="rounded-xl border border-[#f0eee9] bg-[#fcfcfc] px-4 py-2 text-[12px] font-bold text-[#1a1a1a] transition-colors hover:bg-[#f0eee9]"
          >
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}
