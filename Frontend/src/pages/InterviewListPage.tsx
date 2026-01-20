import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Button from '../components/Button/Button';

// ✅ ERD 기반 공용 더미 (비동기 fetch)
import {
  fetchMyInterviewViewsByStatus,
  type InterviewListStatus,
  type InterviewSessionView,
} from '../api/mockData';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export default function InterviewListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<InterviewListStatus>('UPCOMING');

  // ✅ 상태 UI
  const [items, setItems] = useState<InterviewSessionView[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('면접 목록을 불러오지 못했어요.');

  const load = async () => {
    setIsLoading(true);
    setIsError(false);
    setErrorMessage('면접 목록을 불러오지 못했어요.');

    try {
      const data = await fetchMyInterviewViewsByStatus(tab); // 에러 테스트
      setItems(data);
    } catch (err) {
      setItems([]);
      setIsError(true);
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    } finally {
      setIsLoading(false);
    }
  };


  // ✅ 탭 바뀔 때마다 다시 로드
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
          Interviews
        </h1>
        <p className="text-slate-gray mt-2">화상면접 관리 (개인)</p>
      </header>

      <div className="mt-10 space-y-8">
        {/* 탭 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant={tab === 'UPCOMING' ? 'dark' : 'outline'}
            size="md"
            onClick={() => setTab('UPCOMING')}
          >
            예정
          </Button>
          <Button
            type="button"
            variant={tab === 'DONE' ? 'dark' : 'outline'}
            size="md"
            onClick={() => setTab('DONE')}
          >
            완료
          </Button>
        </div>

        {/* ✅ 상태 UI: Loading */}
        {isLoading && <ListSkeleton />}

        {/* ✅ 상태 UI: Error */}
        {!isLoading && isError && (
          <div className="bg-pure-white rounded-2xl border border-soft-pebble p-8 shadow-sm">
            <p className="text-midnight-ink text-lg font-extrabold">데이터를 불러오지 못했어요</p>
            <p className="text-slate-gray mt-2 text-sm font-semibold">{errorMessage}</p>
            <div className="mt-6 flex justify-end">
              <Button type="button" variant="dark" size="md" onClick={load}>
                다시 시도
              </Button>
            </div>
          </div>
        )}

        {/* ✅ 상태 UI: Empty / Success */}
        {!isLoading && !isError && (
          <div className="space-y-4">
            {items.length === 0 ? (
              <div className="bg-cloud-dancer rounded-2xl p-10 text-center shadow-sm">
                <p className="text-midnight-ink text-lg font-extrabold">표시할 면접이 없어요.</p>
                <p className="text-slate-gray mt-2 text-sm">
                  면접 일정이 잡히면 여기로 쏙 들어옵니다.
                </p>
              </div>
            ) : (
              items.map((s) => (
                <div key={s.interview_id} className="bg-cloud-dancer rounded-2xl p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    {/* 왼쪽 정보 */}
                    <div className="min-w-0">
                      <p className="text-slate-gray text-sm font-bold tracking-widest uppercase">
                        {s.companyName}
                      </p>
                      <p className="text-midnight-ink mt-2 truncate text-2xl font-black">
                        {s.postingTitle}
                      </p>
                      <p className="text-slate-gray mt-2 text-sm font-semibold">
                        {formatDateTime(s.scheduledAt)}
                      </p>
                    </div>

                    {/* 오른쪽 버튼 */}
                    <div className="flex shrink-0 gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="md"
                        onClick={() => navigate(`/interviews/${s.interview_id}/lobby`)}
                      >
                        상세
                      </Button>

                      {tab === 'UPCOMING' ? (
                        <Button
                          type="button"
                          variant="dark"
                          size="md"
                          onClick={() => navigate(`/interviews/${s.interview_id}/lobby`)}
                        >
                          입장
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="outline"
                          size="md"
                          onClick={() => alert('TODO: 완료 면접 리포트 페이지')}
                        >
                          기록
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="button" variant="outline" size="md" onClick={() => navigate('/mypage')}>
            마이페이지로
          </Button>
        </div>
      </div>
    </div>
  );
}

/** ✅ 로딩 상태용 스켈레톤 */
function ListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-cloud-dancer rounded-2xl p-6 shadow-sm animate-pulse"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="bg-soft-pebble/50 h-3 w-24 rounded" />
              <div className="bg-soft-pebble/40 mt-3 h-6 w-64 rounded" />
              <div className="bg-soft-pebble/30 mt-3 h-4 w-40 rounded" />
            </div>

            <div className="flex shrink-0 gap-3">
              <div className="bg-soft-pebble/40 h-10 w-20 rounded-md" />
              <div className="bg-soft-pebble/50 h-10 w-20 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
