import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/Button/Button';

type ScrapCompany = {
  id: number;
  name: string;
  role: string;
  location?: string;
};

type Interview = {
  id: number;
  company: string;
  title: string;
  scheduledAt: string; // ISO
};

type Resume = {
  id: number;
  title: string;
  updatedAt: string; // ISO
};

type PortfolioReport = {
  id: number;
  filename: string;
  analyzedAt: string; // ISO
  highlights: string[];
};

type NotificationItem = {
  id: number;
  message: string;
  createdAt: string; // ISO
  read: boolean;
};

type CalendarEvent = {
  id: number;
  date: string; // YYYY-MM-DD
  label: string;
  kind: 'INTERVIEW';
};

function toYmd(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

function formatYmdToKorean(ymd: string) {
  const [y, m, d] = ymd.split('-');
  return `${y}.${m}.${d}`;
}

function buildMonthCells(year: number, monthIndex0: number) {
  const first = new Date(year, monthIndex0, 1);
  const startDay = first.getDay(); // 0=일
  const start = new Date(year, monthIndex0, 1 - startDay);

  const cells: Date[] = [];
  for (let i = 0; i < 42; i++) {
    cells.push(new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
  }
  return cells;
}

export default function MyPage() {
  const navigate = useNavigate();
  const [showNoti, setShowNoti] = useState(false);

  // ✅ 더미데이터
  const scraps: ScrapCompany[] = [
    { id: 1, name: 'PortMatch', role: 'Frontend (React)', location: 'Seoul' },
    { id: 2, name: 'DreamTech', role: 'Backend (Spring)', location: 'Seoul' },
    { id: 3, name: 'Acme Corp', role: 'Full-stack', location: 'Remote' },
  ];

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const interviews: Interview[] = [
    { id: 101, company: 'PortMatch', title: '1차 기술면접', scheduledAt: '2026-01-21T13:00:00' },
    { id: 102, company: 'Acme Corp', title: '문화/인성', scheduledAt: '2026-01-23T10:30:00' },
    { id: 88, company: 'DreamTech', title: '최종면접', scheduledAt: '2026-01-10T16:00:00' },
  ];

  const resume: Resume = {
    id: 7,
    title: '신입 프론트엔드 이력서 v2',
    updatedAt: '2026-01-18T09:15:00',
  };

  const portfolio: PortfolioReport = {
    id: 55,
    filename: 'portfolio.pdf',
    analyzedAt: '2026-01-18T22:05:00',
    highlights: ['React/TS 경험 강조', '프로젝트 성과 수치화 추천', 'CS 질문 대비 필요'],
  };

  const notifications: NotificationItem[] = [
    {
      id: 1,
      message: '내일 13:00 PortMatch 면접이 있어요.',
      createdAt: '2026-01-20T09:00:00',
      read: false,
    },
    {
      id: 2,
      message: '이력서 완성도가 80%에 가까워요. 마무리만 하면 됨!',
      createdAt: '2026-01-19T12:10:00',
      read: true,
    },
    {
      id: 3,
      message: '포트폴리오 분석 리포트가 생성됐어요.',
      createdAt: '2026-01-18T22:06:00',
      read: true,
    },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  // ✅ 캘린더에는 면접 일정만
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const calendarEvents: CalendarEvent[] = [
    { id: 1, date: '2026-01-21', label: 'PortMatch 1차 기술면접', kind: 'INTERVIEW' },
    { id: 2, date: '2026-01-23', label: 'Acme Corp 문화/인성', kind: 'INTERVIEW' },
    { id: 3, date: '2026-01-10', label: 'DreamTech 최종면접', kind: 'INTERVIEW' },
  ];

  // ✅ 데모로 2026.01 고정 (원하면 new Date()로 바꿔도 됨)
  const demoBase = new Date('2026-01-01T00:00:00');
  const year = demoBase.getFullYear();
  const month0 = demoBase.getMonth();
  const thisMonthLabel = `${year}.${String(month0 + 1).padStart(2, '0')}`;

  const cells = useMemo(() => buildMonthCells(year, month0), [year, month0]);

  const eventMap = useMemo(() => {
    const m = new Map<string, CalendarEvent[]>();
    for (const e of calendarEvents) {
      const list = m.get(e.date) ?? [];
      list.push(e);
      m.set(e.date, list);
    }
    return m;
  }, [calendarEvents]);

  const todayYmd = '2026-01-19';
  const [selectedDate, setSelectedDate] = useState<string>(todayYmd);

  const selectedEvents = useMemo(() => eventMap.get(selectedDate) ?? [], [eventMap, selectedDate]);

  const upcomingInterviews = useMemo(() => {
    const sorted = [...interviews].sort((a, b) => (a.scheduledAt > b.scheduledAt ? 1 : -1));
    return sorted.slice(0, 2);
  }, [interviews]);

  return (
    <div className="bg-pure-white min-h-screen p-10">
      {/* header는 디자인 페이지처럼 가되 배경은 흰색 */}
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">My Page</h1>
        <p className="text-slate-gray mt-2">개인 대시보드</p>
      </header>

      <div className="mt-10 space-y-10">
        {/* 01. Quick Actions */}
        <section className="space-y-6">
          <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
            01. Quick Actions
          </h2>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <PreviewCard
              title="기업 스크랩 목록"
              subtitle={`총 ${scraps.length}개`}
              lines={scraps.slice(0, 2).map((s) => `• ${s.name} / ${s.role}`)}
              actionLabel="목록 보기"
              onClick={() => navigate('/scraps')}
            />

            <PreviewCard
              title="면접 관련"
              subtitle={
                upcomingInterviews.length > 0
                  ? `다가오는 면접 ${upcomingInterviews.length}개`
                  : '다가오는 면접 없음'
              }
              lines={
                upcomingInterviews.length > 0
                  ? upcomingInterviews.map(
                      (i) => `• ${i.company} - ${i.title} (${formatDateTime(i.scheduledAt)})`,
                    )
                  : ['• 일정이 생기면 여기 표시돼요']
              }
              actionLabel="면접 관리"
              onClick={() => navigate('/interviews')}
            />

            <PreviewCard
              title="포트폴리오 분석"
              subtitle={`최근 분석: ${formatDateTime(portfolio.analyzedAt)}`}
              lines={[
                `• 파일: ${portfolio.filename}`,
                ...portfolio.highlights.slice(0, 2).map((h) => `• ${h}`),
              ]}
              actionLabel="리포트 보기"
              onClick={() => navigate('/portfolio')}
            />

            <PreviewCard
              title="이력서 관리"
              subtitle={`최근 수정: ${formatDateTime(resume.updatedAt)}`}
              lines={[`• ${resume.title}`, '• 추천: 프로젝트 성과를 숫자로 써줘요']}
              actionLabel="편집하기"
              onClick={() => navigate('/resume')}
            />
          </div>
        </section>

        {/* 02. Notifications */}
        <section className="space-y-6">
          <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
            02. Notifications
          </h2>

          {/* ✅ 박스는 cloud-dancer */}
          <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm">
            <div className="flex items-center justify-between gap-6">
              <div>
                <p className="text-midnight-ink text-xl font-extrabold">알림</p>
                <p className="text-slate-gray mt-1 text-sm">읽지 않은 알림: {unreadCount}개</p>
              </div>

              <Button variant="outline" size="md" onClick={() => setShowNoti((v) => !v)}>
                {showNoti ? '닫기' : '알림 보기'}
              </Button>
            </div>

            {showNoti && (
              <div className="mt-6 space-y-3">
                {notifications.map((n) => (
                  <div key={n.id} className="bg-pure-white rounded-2xl p-5 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-midnight-ink text-sm font-semibold">{n.message}</p>
                      {!n.read && (
                        <span className="bg-midnight-ink mt-1 h-2 w-2 shrink-0 rounded-full" />
                      )}
                    </div>
                    <p className="text-slate-gray mt-2 text-xs">{formatDateTime(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* 03. Calendar */}
        <section className="space-y-6">
          <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
            03. Calendar
          </h2>

          {/* ✅ 캘린더 전체 박스 cloud-dancer */}
          <div className="bg-cloud-dancer rounded-2xl p-8 shadow-sm">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-midnight-ink text-xl font-extrabold">캘린더</p>
              <p className="text-slate-gray text-lg font-bold">{thisMonthLabel}</p>
            </div>

            <div className="text-slate-gray grid grid-cols-7 gap-3 text-center text-sm font-bold">
              {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>

            <div className="mt-3 grid grid-cols-7 gap-3">
              {cells.map((d, idx) => {
                const ymd = toYmd(d);
                const inThisMonth = d.getMonth() === month0;
                const isToday = ymd === todayYmd;
                const isSelected = ymd === selectedDate;
                const ev = eventMap.get(ymd) ?? [];

                return (
                  <button
                    key={`${ymd}-${idx}`}
                    type="button"
                    onClick={() => setSelectedDate(ymd)}
                    className={[
                      'min-h-19.5 rounded-2xl border p-3 text-left transition',
                      inThisMonth
                        ? 'bg-pure-white border-soft-pebble'
                        : 'bg-cloud-dancer border-soft-pebble/50',
                      'hover:bg-soft-pebble/30',
                      isSelected ? 'ring-midnight-ink ring-2' : '',
                    ].join(' ')}
                  >
                    <div className="flex items-start justify-between">
                      <span
                        className={
                          inThisMonth
                            ? 'text-midnight-ink font-extrabold'
                            : 'text-silver-mist font-extrabold'
                        }
                      >
                        {d.getDate()}
                      </span>
                      {isToday && (
                        <span className="bg-midnight-ink text-cloud-dancer rounded-full px-2 py-0.5 text-[10px] font-bold">
                          TODAY
                        </span>
                      )}
                    </div>

                    {/* ✅ 면접 일정만 표시 */}
                    <div className="mt-2 space-y-1">
                      {ev.slice(0, 2).map((e) => (
                        <p key={e.id} className="text-slate-gray truncate text-xs font-semibold">
                          • {e.label}
                        </p>
                      ))}
                      {ev.length > 2 && (
                        <p className="text-slate-gray text-xs font-bold">+{ev.length - 2} more</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ✅ 선택한 날짜 일정 박스 (cloud-dancer 내부에서, 내용 카드는 white) */}
            <div className="bg-pure-white mt-8 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-midnight-ink text-lg font-extrabold">선택한 날짜 일정</p>
                  <p className="text-slate-gray mt-1 text-sm font-bold">
                    {formatYmdToKorean(selectedDate)}
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-2">
                {selectedEvents.length === 0 ? (
                  <p className="text-slate-gray text-sm font-semibold">
                    이 날짜에는 일정이 없어요.
                  </p>
                ) : (
                  selectedEvents.map((e) => (
                    <div key={e.id} className="bg-cloud-dancer rounded-xl p-4">
                      <p className="text-midnight-ink text-sm font-extrabold">{e.label}</p>
                      <p className="text-slate-gray mt-1 text-xs">{e.kind}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>
        <section>
          {/* ✅ 회원정보수정: 선택 박스 밖(캘린더 섹션의 하단) */}
          <div className="mt-6 flex justify-end">
            <Button variant="dark" size="md" onClick={() => navigate('/profile/edit')}>
              회원 정보 수정
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function PreviewCard({
  title,
  subtitle,
  lines,
  onClick,
  actionLabel,
}: {
  title: string;
  subtitle: string;
  lines: string[];
  onClick: () => void;
  actionLabel: string;
}) {
  return (
    <div className="bg-cloud-dancer space-y-6 rounded-2xl p-8 shadow-sm">
      <div>
        <p className="text-slate-gray text-sm font-bold tracking-widest uppercase">{title}</p>
        <p className="text-midnight-ink mt-2 text-xl font-black">{subtitle}</p>
      </div>

      <div className="space-y-1">
        {lines.map((t, i) => (
          <p key={i} className="text-slate-gray truncate text-sm font-semibold">
            {t}
          </p>
        ))}
      </div>

      <div className="flex justify-end">
        <Button variant="outline" size="md" onClick={onClick}>
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
