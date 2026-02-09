// src/components/Calendar/CalendarScheduleList.tsx
import type { ReactNode } from 'react';

type CalendarScheduleListProps<T> = {
  title: string;
  subtitle?: string;
  items: T[];
  emptyText?: string;
  renderItem: (item: T, idx: number) => ReactNode;
};

export default function CalendarScheduleList<T>({
  title,
  subtitle,
  items,
  emptyText = '이 날짜에는 일정이 없어요.',
  renderItem,
}: CalendarScheduleListProps<T>) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-6 shadow-sm">
      <div>
        <p className="text-lg font-black">{title}</p>
        {subtitle ? <p className="mt-1 text-sm font-semibold text-zinc-500">{subtitle}</p> : null}
      </div>

      {/* ✅ 일정 많으면 스크롤 */}
      <div className="mt-4 max-h-[520px] space-y-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="text-sm font-semibold text-zinc-500">{emptyText}</p>
        ) : (
          items.map((it, idx) => renderItem(it, idx))
        )}
      </div>
    </div>
  );
}
