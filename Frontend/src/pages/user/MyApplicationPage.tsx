import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText } from 'lucide-react';

import Button from '../../components/Button/Button';

type ApplicationStatus = 'APPLIED' | 'READ' | 'PASS' | 'FAIL';
type TabType = 'ACTIVE' | 'RESULT';

type MyApplicationItem = {
  applicationId: number;
  jobPostingId: number;
  jobPostingTitle: string;
  companyName: string;
  companyCid?: string;
  status: ApplicationStatus;
  resumeId: number;
  resumeTitle: string;
  appliedAt: string;
};

type ApiResponse<T> = {
  status: boolean;
  code: number;
  message: string;
  data: T;
};

const ACTIVE_STATUSES: ApplicationStatus[] = ['APPLIED', 'READ'];
const RESULT_STATUSES: ApplicationStatus[] = ['PASS', 'FAIL'];

function formatDateTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '-';
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function statusLabel(status: ApplicationStatus) {
  switch (status) {
    case 'APPLIED':
      return '지원 완료';
    case 'READ':
      return '열람됨';
    case 'PASS':
      return '합격';
    case 'FAIL':
      return '불합격';
    default:
      return status;
  }
}

function statusClass(status: ApplicationStatus) {
  switch (status) {
    case 'APPLIED':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'READ':
      return 'bg-sky-50 text-sky-600 border-sky-100';
    case 'PASS':
      return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    case 'FAIL':
      return 'bg-zinc-100 text-zinc-500 border-zinc-200';
    default:
      return 'bg-zinc-50 text-zinc-400 border-zinc-100';
  }
}

export default function MyApplicationPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<TabType>('ACTIVE');
  const [allItems, setAllItems] = useState<MyApplicationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('지원 목록을 불러오지 못했어요.');
  const [cancelingPostingId, setCancelingPostingId] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setIsError(false);
    try {
      const response = await fetch('/api/job-postings/applications/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error(`목록 조회 실패 (${response.status})`);
      const json = (await response.json()) as ApiResponse<MyApplicationItem[]>;
      if (!json.status || !Array.isArray(json.data))
        throw new Error(json.message || '데이터 형식 오류');
      setAllItems(json.data);
    } catch (err) {
      setAllItems([]);
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2500);
    return () => clearTimeout(t);
  }, [notice]);

  const items = useMemo(() => {
    return allItems.filter((item) =>
      tab === 'ACTIVE'
        ? ACTIVE_STATUSES.includes(item.status)
        : RESULT_STATUSES.includes(item.status),
    );
  }, [allItems, tab]);

  const handleCancel = async (jobPostingId: number) => {
    if (cancelingPostingId !== null) return;
    if (!window.confirm('정말 지원을 취소하시겠습니까?')) return;

    setCancelingPostingId(jobPostingId);
    try {
      const response = await fetch(`/api/job-postings/${jobPostingId}/apply`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('지원 취소에 실패했습니다.');
      setAllItems((prev) => prev.filter((item) => item.jobPostingId !== jobPostingId));
      setNotice('지원 취소가 완료되었습니다.');
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '오류가 발생했어요.');
    } finally {
      setCancelingPostingId(null);
    }
  };

  return (
    <div className="text-midnight-ink min-h-screen bg-[#FBFCFE] pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <h1 className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase">
            Application
          </h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
            내가 지원한 공고와 제출한 이력서를 한눈에 관리하세요.
          </p>
        </header>

        <section className="space-y-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <h2 className="text-2xl font-black tracking-tight">지원 목록</h2>
            </div>
            {/* 상단 탭 버튼: variant="filter" 적용 */}
            <div className="flex gap-2 rounded-2xl bg-zinc-100 p-1">
              <Button
                variant="filter"
                isActive={tab === 'ACTIVE'}
                onClick={() => setTab('ACTIVE')}
                className="rounded-xl border-none shadow-none"
              >
                진행중
              </Button>
              <Button
                variant="filter"
                isActive={tab === 'RESULT'}
                onClick={() => setTab('RESULT')}
                className="rounded-xl border-none shadow-none"
              >
                결과확인
              </Button>
            </div>
          </div>

          {!isLoading && !isError && (
            <div className="grid gap-4">
              {items.map((item) => {
                const isCanceling = cancelingPostingId === item.jobPostingId;
                const canCancel = ACTIVE_STATUSES.includes(item.status);
                return (
                  <div
                    key={item.applicationId}
                    className="group relative flex items-center justify-between rounded-[28px] border border-zinc-100 bg-white p-8 transition-all hover:border-zinc-200 hover:shadow-xl hover:shadow-indigo-50/40"
                  >
                    {/* 좌측 정보 영역 */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-3 flex items-center gap-3">
                        <span
                          className={`rounded-lg border px-3 py-0.5 text-[11px] font-black tracking-tight ${statusClass(item.status)}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                        <span className="text-sm font-bold tracking-wider text-zinc-400 uppercase opacity-60">
                          {item.companyName}
                        </span>
                      </div>

                      <h3
                        onClick={() => navigate(`/job-posts/${item.jobPostingId}`)}
                        className="text-midnight-ink hover:text-point-blue inline-block cursor-pointer truncate text-2xl font-black tracking-tight transition-colors"
                      >
                        {item.jobPostingTitle}
                      </h3>

                      <div className="mt-4 flex items-center gap-4 text-zinc-500">
                        <span className="text-[12px] font-bold text-zinc-400">
                          {formatDateTime(item.appliedAt)}
                        </span>
                        <div className="h-3 w-[1px] bg-zinc-200" />
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-zinc-300" />
                          <span className="max-w-[200px] truncate text-xs font-bold">
                            {item.resumeTitle}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 우측 액션 영역: variant="blue" 적용 및 수직 중앙 정렬 */}
                    <div className="ml-8 flex shrink-0 items-center">
                      <Button
                        variant="blue"
                        size="lg"
                        className="rounded-[20px] px-7 py-4 shadow-sm"
                        onClick={() => navigate(`/resumes/${item.resumeId}`)}
                      >
                        이력서 보기
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>

                    {/* ✅ 오른쪽 상단 끝 X 버튼: variant="close" 적용 및 위치 상향 조정 */}
                    {canCancel && (
                      <div className="absolute top-2 right-2">
                        <Button
                          variant="close"
                          size="sm"
                          disabled={isCanceling}
                          onClick={() => handleCancel(item.jobPostingId)}
                          title="지원 취소"
                          /* !hover:text-red-600을 사용하여 우선순위를 높였습니다. */
                          className="bg-transparent !text-rose-600 border-none shadow-none hover:bg-transparent hover:!text-zinc-400 transition-all duration-200 hover:scale-110 active:scale-95"
                        >
                          {isCanceling ? (
                            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 rounded-xl">
                              <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                            </div>
                          ) : null}
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {notice && (
        <div className="bg-midnight-ink animate-in fade-in slide-in-from-bottom-4 fixed bottom-12 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-8 py-4 text-sm font-black text-white shadow-2xl">
          {notice}
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="grid gap-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="h-[160px] animate-pulse rounded-[28px] border border-zinc-100 bg-zinc-50/50 p-8"
        />
      ))}
    </div>
  );
}
