// src/components/Calendar/calendarUtils.ts
export function toYmdFromIso(iso: string) {
  return iso.slice(0, 10);
}

export function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatYmdToKorean(ymd: string) {
  const [y, m, d] = ymd.split('-');
  return `${y}.${m}.${d}`;
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export function buildMonthCells(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const startDay = first.getDay(); // 0=일
  const start = new Date(year, monthIndex0, 1 - startDay);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
}

/** ✅ 당일: “5시간 24분 전” / 이후: “N일 후” */
export function formatScheduleHint(startIso: string) {
  const now = new Date();
  const start = new Date(startIso);

  const todayYmd = toYmd(now);
  const startYmd = toYmd(start);

  const today0 = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const start0 = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
  const dayDiff = Math.round((start0 - today0) / (24 * 60 * 60 * 1000));

  if (startYmd === todayYmd) {
    const diffMin = Math.max(0, Math.ceil((start.getTime() - now.getTime()) / (60 * 1000)));
    const h = Math.floor(diffMin / 60);
    const m = diffMin % 60;

    if (h <= 0) return `${m}분 전`;
    if (m === 0) return `${h}시간 전`;
    return `${h}시간 ${m}분 전`;
  }

  if (dayDiff > 0) return `${dayDiff}일 후`;
  return '곧 시작돼요.';
}
