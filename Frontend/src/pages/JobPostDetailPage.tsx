// src/pages/JobPostDetailPage.tsx
import { useEffect, useMemo, useState, useLayoutEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../components/Button/Button';
import { fetchJobPostDetail, toggleJobPostScrap } from '../api/jobPosts';
import type { JobPostDetailView } from '../types/jobPost'

type PageStatus = 'loading' | 'error' | 'notfound' | 'success';

function formatYmdDot(ymd?: string | null) {
  if (!ymd) return '-';
  return ymd.replaceAll('-', '.');
}

function formatIsoDot(iso?: string | null) {
  if (!iso) return '-';
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

function calcDday(deadline?: string | null) {
  if (!deadline) return '-';
  const end = new Date(`${deadline}T23:59:59`);
  const now = new Date();
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `D-${diffDays}`;
  if (diffDays === 0) return 'D-DAY';
  return '마감';
}



export default function JobPostDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const jobPostId = Number(id);
  
  const [ navH, setNavH ] = useState(80);
  const GAP = 16;
  const OFFSET = useMemo(() => navH + GAP, [navH]);
  
  const [status, setStatus] = useState<PageStatus>('loading');
  const [errorMessage, setErrorMessage] = useState('공고 정보를 불러오지 못했어요.');
  const [data, setData] = useState<JobPostDetailView | null>(null);
  
  const scrollToId = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
  
    const y = el.getBoundingClientRect().top + window.scrollY - OFFSET;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  const load = async () => {
    if (!Number.isFinite(jobPostId)) {
      setStatus('notfound');
      setData(null);
      return;
    }

    setStatus('loading');
    setErrorMessage('공고 정보를 불러오지 못했어요.');

    try {
      const res = await fetchJobPostDetail(jobPostId);
      if (!res) {
        setStatus('notfound');
        setData(null);
        return;
      }
      setData(res);
      setStatus('success');
    } catch (err) {
      setStatus('error');
      setData(null);
      setErrorMessage(err instanceof Error ? err.message : '알 수 없는 오류가 발생했어요.');
    }
  };

  useLayoutEffect(() => {
    const nav = document.getElementById('app-navbar');

    const set = () => setNavH(nav?.offsetHeight ?? 80);

    set();
    window.addEventListener('resize', set);
    return () => window.removeEventListener('resize', set);
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const dday = useMemo(() => calcDday(data?.jobPost.deadline), [data?.jobPost.deadline]);

  const canApply = useMemo(() => {
    const st = (data?.jobPost.status ?? 'OPEN').toUpperCase();
    const d = calcDday(data?.jobPost.deadline);
    if (st !== 'OPEN') return false;
    if (d === '마감') return false;
    return true;
  }, [data?.jobPost.status, data?.jobPost.deadline]);

  if (status === 'loading') return <DetailSkeleton onBack={() => navigate(-1)} />;

  if (status === 'error') {
    return (
      <ErrorBox
        title="공고 정보를 불러오지 못했어요"
        message={errorMessage}
        onRetry={load}
        onBack={() => navigate(-1)}
      />
    );
  }

  if (status === 'notfound' || !data) {
    return (
      <EmptyBox
        title="공고를 찾을 수 없어요"
        message="목록에서 다시 선택해 주세요."
        onBack={() => navigate(-1)}
      />
    );
  }

  const { jobPost, company } = data;

  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
          Job Post
        </h1>
        <p className="text-slate-gray mt-2">공고 상세 (개인)</p>
      </header>

      {/* 사람인 스타일 느낌: 요약 박스 */}
      <section className="bg-cloud-dancer mt-10 rounded-2xl p-8 shadow-sm" id="summary">
        <p className="text-slate-gray text-sm font-bold tracking-widest uppercase">
          {company.companies_name}
        </p>
        <h2 className="text-midnight-ink mt-2 text-3xl font-black">{jobPost.title}</h2>

        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          <MetaCard label="마감일" value={formatYmdDot(jobPost.deadline)} />
          <MetaCard label="D-day" value={dday} />
          <MetaCard label="상태" value={(jobPost.status ?? 'OPEN').toUpperCase()} />
          <MetaCard label="등록일" value={formatIsoDot(jobPost.created_at)} />
        </div>

        {/* 스택 태그 */}
        {(jobPost.required_stacks ?? []).length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {(jobPost.required_stacks ?? []).map((s) => (
              <span
                key={s}
                className="bg-pure-white text-slate-gray rounded-full px-3 py-1 text-xs font-bold"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </section>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 왼쪽: 상세 섹션 */}
        <div className="lg:col-span-2 space-y-8">
          {/* 섹션 탭(사람인 느낌) */}
          <div className="bg-pure-white border-soft-pebble rounded-2xl border p-3 shadow-sm">
            <div className="flex flex-wrap gap-2">
              <TabButton label="상세요강" onClick={() => scrollToId('detail')} />
              <TabButton label="지원자격" onClick={() => scrollToId('requirements')} />
              <TabButton label="기업정보" onClick={() => scrollToId('company')} />
              <TabButton label="취업후기" onClick={() => scrollToId('reviews')} />
            </div>
          </div>

          <section className="bg-cloud-dancer rounded-2xl p-8 shadow-sm" id="detail">
            <h3 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
              01. 상세요강
            </h3>

            <div className="bg-pure-white mt-6 rounded-2xl p-6">
              {jobPost.requirement_text ? (
                <TextBlock text={jobPost.requirement_text} />
              ) : (
                <p className="text-slate-gray text-sm font-semibold">상세요강이 비어 있어요.</p>
              )}
            </div>
          </section>

          <section className="bg-cloud-dancer rounded-2xl p-8 shadow-sm" id="requirements">
            <h3 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
              02. 지원자격
            </h3>

            <div className="bg-pure-white mt-6 rounded-2xl p-6 space-y-4">
              <div>
                <p className="text-midnight-ink text-sm font-extrabold">필수 기술 스택</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(jobPost.required_stacks ?? []).length === 0 ? (
                    <span className="text-slate-gray text-sm font-semibold">-</span>
                  ) : (
                    (jobPost.required_stacks ?? []).map((s) => (
                      <span
                        key={s}
                        className="bg-cloud-dancer text-slate-gray rounded-full px-3 py-1 text-xs font-bold"
                      >
                        {s}
                      </span>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-midnight-ink text-sm font-extrabold">비고</p>
                <p className="text-slate-gray mt-2 text-sm font-semibold leading-6">
                  (TODO) ERD에 “경력/학력/고용형태/근무지” 컬럼이 추가되면 여기에 사람인처럼 쫘악 뿌리면 됨 😼
                </p>
              </div>
            </div>
          </section>

          <section className="bg-cloud-dancer rounded-2xl p-8 shadow-sm" id="company">
            <h3 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
              03. 기업정보
            </h3>

            <div className="bg-pure-white mt-6 rounded-2xl p-6 space-y-3">
              <InfoRow label="기업명" value={company.companies_name} />
              <InfoRow label="기업규모" value={company.size ?? '-'} />
              <InfoRow label="주소" value={company.address} />
              <InfoRow label="홈페이지" value={company.homepage_url ?? '-'} isLink={!!company.homepage_url} />
            </div>
          </section>

          <section className="bg-cloud-dancer rounded-2xl p-8 shadow-sm" id="reviews">
            <h3 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
              04. 취업후기
            </h3>

            <div className="bg-pure-white mt-6 rounded-2xl p-10 text-center">
              <p className="text-midnight-ink text-lg font-extrabold">아직 후기가 없어요.</p>
              <p className="text-slate-gray mt-2 text-sm font-semibold">
                (TODO) 후기 등록/열람 API 붙이면 여기부터 “재밌어지기 시작함”
              </p>
            </div>
          </section>

          <div className="flex justify-end">
            <Button type="button" variant="outline" size="md" onClick={() => navigate(-1)}>
              뒤로
            </Button>
          </div>
        </div>

        {/* 오른쪽: 사람인 느낌 “지원 박스” */}
        <aside className="lg:col-span-1">
          <div className="sticky bg-pure-white border-soft-pebble rounded-2xl border p-6 shadow-sm" style={{ top: OFFSET}}>
            <p className="text-midnight-ink text-xl font-extrabold">지원 정보</p>

            <div className="mt-4 space-y-3">
              <MiniRow label="마감" value={formatYmdDot(jobPost.deadline)} />
              <MiniRow label="D-day" value={dday} />
              <MiniRow label="상태" value={(jobPost.status ?? 'OPEN').toUpperCase()} />
            </div>

            <div className="mt-6 space-y-3">
              <Button
                type="button"
                variant={data.isScrapped ? 'dark' : 'outline'}
                size="md"
                onClick={() => {
                  const next = toggleJobPostScrap(jobPost.id);
                  setData({ ...data, isScrapped: next });
                }}
              >
                {data.isScrapped ? '스크랩 해제' : '스크랩'}
              </Button>

              {/* 외부지원 링크가 있는 경우 */}
              {data.external_apply_url ? (
                <Button
                  type="button"
                  variant="dark"
                  size="md"
                  onClick={() => window.open(data.external_apply_url ?? '', '_blank', 'noreferrer')}
                >
                  외부 페이지로 지원
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="dark"
                  size="md"
                  onClick={() => navigate(`/job-posts/${jobPost.id}/apply`)}
                  disabled={!canApply}
                >
                  지원하기
                </Button>
              )}

              {!canApply && (
                <p className="text-slate-gray text-xs font-semibold">
                  현재 공고 상태/마감일 때문에 지원이 비활성화돼요.
                </p>
              )}
            </div>

            <div className="mt-6 bg-cloud-dancer rounded-2xl p-4">
              <p className="text-midnight-ink text-sm font-extrabold">기업</p>
              <p className="text-slate-gray mt-1 text-sm font-semibold break-all">
                {company.companies_name}
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ---------------- UI parts ---------------- */

function MetaCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-pure-white rounded-2xl p-4">
      <p className="text-midnight-ink text-sm font-extrabold">{label}</p>
      <p className="text-slate-gray mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function TabButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-cloud-dancer text-midnight-ink rounded-full px-4 py-2 text-sm font-extrabold hover:bg-soft-pebble/30 transition"
    >
      {label}
    </button>
  );
}

function TextBlock({ text }: { text: string }) {
  // 줄바꿈을 살려서 사람인처럼 “글 블럭” 느낌
  const lines = text.split('\n');
  return (
    <div className="space-y-2">
      {lines.map((l, i) => (
        <p key={i} className="text-slate-gray text-sm font-semibold leading-6">
          {l === '' ? '\u00A0' : l}
        </p>
      ))}
    </div>
  );
}

function InfoRow({ label, value, isLink }: { label: string; value: string; isLink?: boolean }) {
  return (
    <div className="bg-cloud-dancer rounded-2xl p-4">
      <p className="text-midnight-ink text-sm font-extrabold">{label}</p>
      {isLink ? (
        <a
          className="text-slate-gray mt-1 block text-sm font-semibold underline break-all"
          href={value}
          target="_blank"
          rel="noreferrer"
        >
          {value}
        </a>
      ) : (
        <p className="text-slate-gray mt-1 text-sm font-semibold break-all">{value}</p>
      )}
    </div>
  );
}

function MiniRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between bg-cloud-dancer rounded-2xl px-4 py-3">
      <p className="text-midnight-ink text-sm font-extrabold">{label}</p>
      <p className="text-slate-gray text-sm font-semibold">{value}</p>
    </div>
  );
}

function DetailSkeleton({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Job Post</h1>
        <p className="text-slate-gray mt-2">공고 상세 (개인)</p>
      </header>

      <div className="bg-cloud-dancer mt-10 rounded-2xl p-8 shadow-sm animate-pulse">
        <div className="bg-soft-pebble/50 h-3 w-28 rounded" />
        <div className="bg-soft-pebble/40 mt-3 h-8 w-2/3 rounded" />
        <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-pure-white rounded-2xl p-4">
              <div className="bg-soft-pebble/40 h-3 w-16 rounded" />
              <div className="bg-soft-pebble/30 mt-2 h-3 w-24 rounded" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-pure-white border-soft-pebble rounded-2xl border p-3 shadow-sm animate-pulse">
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-soft-pebble/40 h-10 w-24 rounded-full" />
              ))}
            </div>
          </div>

          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-cloud-dancer rounded-2xl p-8 shadow-sm animate-pulse">
              <div className="bg-soft-pebble/50 h-6 w-40 rounded" />
              <div className="bg-pure-white mt-6 h-32 rounded-2xl" />
            </div>
          ))}

          <div className="flex justify-end">
            <Button type="button" variant="outline" size="md" onClick={onBack}>
              뒤로
            </Button>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-pure-white border-soft-pebble rounded-2xl border p-6 shadow-sm animate-pulse">
            <div className="bg-soft-pebble/50 h-6 w-28 rounded" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-cloud-dancer h-11 rounded-2xl" />
              ))}
            </div>
            <div className="mt-6 space-y-3">
              <div className="bg-soft-pebble/50 h-10 rounded-md" />
              <div className="bg-soft-pebble/40 h-10 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorBox({
  title,
  message,
  onRetry,
  onBack,
}: {
  title: string;
  message: string;
  onRetry: () => void;
  onBack: () => void;
}) {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Job Post</h1>
        <p className="text-slate-gray mt-2">공고 상세 (개인)</p>
      </header>

      <div className="bg-pure-white border-soft-pebble mt-10 rounded-2xl border p-10 text-center shadow-sm">
        <p className="text-midnight-ink text-lg font-extrabold">{title}</p>
        <p className="text-slate-gray mt-2 text-sm font-semibold">{message}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button type="button" variant="outline" size="md" onClick={onBack}>
            뒤로
          </Button>
          <Button type="button" variant="dark" size="md" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyBox({
  title,
  message,
  onBack,
}: {
  title: string;
  message: string;
  onBack: () => void;
}) {
  return (
    <div className="bg-pure-white min-h-screen p-10">
      <header className="border-soft-pebble border-b pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Job Post</h1>
        <p className="text-slate-gray mt-2">공고 상세 (개인)</p>
      </header>

      <div className="bg-cloud-dancer mt-10 rounded-2xl p-10 text-center shadow-sm">
        <p className="text-midnight-ink text-lg font-extrabold">{title}</p>
        <p className="text-slate-gray mt-2 text-sm">{message}</p>
        <div className="mt-6 flex justify-center">
          <Button type="button" variant="dark" size="md" onClick={onBack}>
            뒤로
          </Button>
        </div>
      </div>
    </div>
  );
}
