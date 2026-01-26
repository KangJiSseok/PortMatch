// src/components/Calendar/CalendarPanel.tsx
import { useMemo } from 'react';
import Button from '../Button/Button';
import { buildMonthCells, toYmd } from './calendarUtils';

type CalendarPanelProps = {
  viewMonth: Date; // 해당 월 1일
  selectedDate: string; // YYYY-MM-DD
  todayYmd: string;

  onSelectDate: (ymd: string) => void;
  onChangeViewMonth: (monthStart: Date) => void;

  getEventCount?: (ymd: string) => number;
};

export default function CalendarPanel({
  viewMonth,
  selectedDate,
  todayYmd,
  onSelectDate,
  onChangeViewMonth,
  getEventCount,
}: CalendarPanelProps) {
  const year = viewMonth.getFullYear();
  const month0 = viewMonth.getMonth();
  const thisMonthLabel = `${year}.${String(month0 + 1).padStart(2, '0')}`;

  const cells = useMemo(() => buildMonthCells(year, month0), [year, month0]);

  const goPrevMonth = () => {
    const next = new Date(year, month0 - 1, 1);
    onChangeViewMonth(next);
    onSelectDate(toYmd(next));
  };

  const goNextMonth = () => {
    const next = new Date(year, month0 + 1, 1);
    onChangeViewMonth(next);
    onSelectDate(toYmd(next));
  };

  const goToday = () => {
    const now = new Date();
    onChangeViewMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(toYmd(now));
  };

  return (
    <div>
      {/* ✅ 헤더 */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-lg font-black">{thisMonthLabel}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="md" onClick={goPrevMonth}>
            ◀
          </Button>
          <Button type="button" variant="outline" size="md" onClick={goNextMonth}>
            ▶
          </Button>
          <Button type="button" variant="outline" size="md" onClick={goToday}>
            오늘
          </Button>
        </div>
      </div>

      {/* ✅ 요일 */}
      <div className="grid grid-cols-7 gap-3 text-center text-sm font-bold text-zinc-500">
        {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* ✅ 날짜 */}
      <div className="mt-3 grid grid-cols-7 gap-3">
        {cells.map((d, idx) => {
          const ymd = toYmd(d);
          const inThisMonth = d.getMonth() === month0;
          const isToday = ymd === todayYmd;
          const isSelected = ymd === selectedDate;

          const cnt = getEventCount ? getEventCount(ymd) : 0;

          return (
            <Button
              key={`${ymd}-${idx}`}
              type="button"
              variant="outline"
              size="md"
              onClick={() => {
                onSelectDate(ymd);
                if (!inThisMonth) onChangeViewMonth(new Date(d.getFullYear(), d.getMonth(), 1));
              }}
              className={[
                'flex w-full flex-col !items-stretch !justify-start text-left',
                // ✅ Button 기본 px-6 py-2.5를 이기기 위해 !로 덮어쓰기
                'min-h-[90px] cursor-pointer rounded-2xl border !px-3.5 !py-2 transition',
                inThisMonth ? 'border-zinc-200 bg-white' : 'border-zinc-200/60 bg-zinc-50',
                'hover:bg-zinc-100/60',
                isSelected ? 'ring-midnight-ink ring-2' : '',
              ].join(' ')}
            >
              {/* ✅ 날짜 + TODAY (왼쪽으로 붙이기) */}
              <div className="-ml-1 flex items-center justify-start gap-2">
                <span
                  className={
                    inThisMonth
                      ? 'text-midnight-ink font-extrabold'
                      : 'font-extrabold text-zinc-400'
                  }
                >
                  {d.getDate()}
                </span>

                {isToday && (
                  <span className="bg-midnight-ink rounded-full px-2 py-0.5 text-[10px] font-bold text-white">
                    TODAY
                  </span>
                )}
              </div>

              <div className="mt-1 flex items-center gap-3">
                {cnt > 0 ? (
                  <>
                    <span className="bg-point-blue mt-0.5 h-2 w-2 rounded-full" />
                    <span className="text-xs font-black text-zinc-600">{cnt}건</span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-zinc-400" />
                )}
              </div>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
