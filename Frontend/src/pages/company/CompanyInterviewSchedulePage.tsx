// src/pages/company/CompanyInterviewSchedulePage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import {
  getExtraInterviewViewByApplicationId,
  type InterviewSessionView,
  upsertExtraInterviewView,
} from '../../api/myPage';

type NavState = {
  applicantName?: string;
  postingTitle?: string;
  companyName?: string;
};

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function localInputToIso(value: string) {
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return new Date().toISOString();

  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mi] = timePart.split(':').map(Number);

  const dt = new Date(y, (m ?? 1) - 1, d ?? 1, hh ?? 0, mi ?? 0, 0);
  return dt.toISOString();
}

function nowLocalMinValue() {
  const d = new Date();
  d.setSeconds(0, 0);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function plusMinutes(date: Date, minutes: number) {
  const d = new Date(date);
  d.setMinutes(d.getMinutes() + minutes);
  return d;
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

const ROUTES = {
  applicantList: (jobPostId: number) => `/company/jobs/${jobPostId}/applicants`,
  lobby: (interviewId: number) => `/interviews/${interviewId}/lobby`,
} as const;

export default function CompanyInterviewSchedulePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobPostId, applicationId } = useParams();

  const navState = (location.state ?? {}) as NavState;

  const safeJobPostId = Number(jobPostId);
  const safeApplicationId = Number(applicationId);

  const isParamValid = Number.isFinite(safeJobPostId) && Number.isFinite(safeApplicationId);

  const minValue = useMemo(() => nowLocalMinValue(), []);
  const defaultLocalDateTime = useMemo(() => {
    const base = plusMinutes(new Date(), 60);
    base.setSeconds(0, 0);
    return toLocalInputValue(base.toISOString());
  }, []);

  const [companyName, setCompanyName] = useState<string>(navState.companyName ?? '');
  const [applicantName, setApplicantName] = useState<string>(navState.applicantName ?? '');
  const [postingTitle, setPostingTitle] = useState<string>(navState.postingTitle ?? '');
  const [scheduledLocal, setScheduledLocal] = useState<string>(defaultLocalDateTime);

  const [currentInterview, setCurrentInterview] = useState<InterviewSessionView | null>(null);
  const [toast, setToast] = useState<string>('');

  const [errors, setErrors] = useState<{
    companyName?: string;
    applicantName?: string;
    postingTitle?: string;
    scheduledLocal?: string;
  }>({});

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  }, []);

  // ✅ 기존 일정 있으면 자동으로 EDIT 모드로 세팅
  useEffect(() => {
    if (!isParamValid) return;

    const existing = getExtraInterviewViewByApplicationId(safeApplicationId);
    if (!existing) return;

    setCurrentInterview(existing);
    setCompanyName((v) => v || existing.companyName);
    setPostingTitle((v) => v || existing.postingTitle);
    setApplicantName((v) => v || existing.applicantName || '');
    setScheduledLocal(toLocalInputValue(existing.scheduledAt));
  }, [isParamValid, safeApplicationId]);

  const modeLabel = currentInterview ? 'EDIT' : 'CREATE';

  const validate = useCallback(() => {
    const next: typeof errors = {};

    if (!companyName.trim()) next.companyName = '기업명을 입력해 주세요.';
    if (!postingTitle.trim()) next.postingTitle = '공고 제목을 입력해 주세요.';
    if (!applicantName.trim()) next.applicantName = '지원자 이름(표시용)을 입력해 주세요.';

    if (!scheduledLocal) {
      next.scheduledLocal = '면접 일시를 선택해 주세요.';
    } else if (scheduledLocal < nowLocalMinValue()) {
      next.scheduledLocal = '과거 시간은 선택할 수 없어요.';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }, [applicantName, companyName, postingTitle, scheduledLocal]);

  const onSubmit = useCallback(() => {
    if (!isParamValid) {
      setErrors((prev) => ({
        ...prev,
        postingTitle: '라우트 파라미터(jobPostId/applicationId)가 유효하지 않아요.',
      }));
      return;
    }

    const ok = validate();
    if (!ok) return;

    const scheduledAtIso = localInputToIso(scheduledLocal);

    // ✅ 없으면 생성, 있으면 수정 (로비로 자동 이동 X)
    const saved = upsertExtraInterviewView({
      application_id: safeApplicationId,
      job_post_id: safeJobPostId,
      companyName: companyName.trim(),
      postingTitle: postingTitle.trim(),
      applicantName: applicantName.trim(),
      scheduledAt: scheduledAtIso,
    });

    setCurrentInterview(saved);
    showToast(currentInterview ? '일정 수정 완료!' : '일정 등록 완료!');
  }, [
    applicantName,
    companyName,
    currentInterview,
    isParamValid,
    postingTitle,
    safeApplicationId,
    safeJobPostId,
    scheduledLocal,
    showToast,
    validate,
  ]);

  const goBackToList = useCallback(() => {
    if (!Number.isFinite(safeJobPostId)) {
      navigate(-1);
      return;
    }
    navigate(ROUTES.applicantList(safeJobPostId));
  }, [navigate, safeJobPostId]);

  const goLobby = useCallback(() => {
    if (!currentInterview) return;
    navigate(ROUTES.lobby(currentInterview.interview_id), {
      state: {
        sessionId: currentInterview.room_id,
        initialMicOn: false,
        initialCamOn: false,
      },
    });
  }, [currentInterview, navigate]);

  return (
    <div className="bg-pure-white text-midnight-ink min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <div className="flex items-start justify-between gap-6">
            <div className="min-w-0">
              <h1 className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase">
                Interview Schedule
              </h1>
              <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
                지원자 이력서를 확인하고 면접 일정을 {currentInterview ? '수정' : '등록'}하세요.
              </p>

              {!isParamValid && (
                <p className="text-error mt-4 text-sm font-black">
                  ⚠️ jobPostId / applicationId 파라미터가 이상함. URL 확인해줘.
                </p>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <Button variant="outline" size="md" className="rounded-xl" onClick={goBackToList}>
                목록
              </Button>
              <Button isBack variant="outline" size="md" className="rounded-xl" />
            </div>
          </div>
        </header>

        <section className="border-silver-mist bg-pure-white rounded-4xl border p-10 shadow-xl shadow-gray-200/50">
          <div className="mb-8 flex items-center gap-3">
            <div className="bg-point-blue h-6 w-1.5 rounded-full" />
            <h2 className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap">
              일정 정보
            </h2>
            <span className="text-soft-pebble text-sm font-black tracking-widest whitespace-nowrap uppercase">
              {modeLabel}
            </span>
          </div>

          {currentInterview && (
            <div className="bg-cloud-dancer/60 mb-8 rounded-3xl p-6">
              <p className="text-midnight-ink text-sm font-black">현재 저장된 면접 일정</p>
              <p className="text-slate-gray mt-2 text-lg font-black">
                {formatDateTime(currentInterview.scheduledAt)}
              </p>
              <p className="text-slate-gray mt-2 text-xs font-bold opacity-50">
                자동으로 로비로 안 보냅니다. 원하면 아래 버튼으로 이동하세요 😇
              </p>
            </div>
          )}

          <div className="grid gap-6">
            <Input
              id="companyName"
              label="기업명"
              placeholder="예) PortMatch"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              error={errors.companyName}
            />

            <Input
              id="postingTitle"
              label="공고 제목"
              placeholder="예) Frontend Intern"
              value={postingTitle}
              onChange={(e) => setPostingTitle(e.target.value)}
              error={errors.postingTitle}
            />

            <Input
              id="applicantName"
              label="지원자 표시명"
              placeholder="예) 지원자 01"
              value={applicantName}
              onChange={(e) => setApplicantName(e.target.value)}
              error={errors.applicantName}
            />

            <div className="flex flex-col gap-2">
              <label htmlFor="scheduledAt" className="text-slate-gray text-sm font-bold">
                면접 일시
              </label>
              <input
                id="scheduledAt"
                type="datetime-local"
                min={minValue}
                value={scheduledLocal}
                onChange={(e) => setScheduledLocal(e.target.value)}
                className={[
                  'w-full rounded-xl border px-4 py-3 font-medium transition-all duration-300 outline-none',
                  errors.scheduledLocal
                    ? 'border-error'
                    : 'border-soft-pebble focus:border-midnight-ink focus:shadow-[0_0_0_1px_#1a1a1a]',
                  'bg-pure-white text-midnight-ink',
                ].join(' ')}
              />
              {errors.scheduledLocal && (
                <span className="text-error mt-1 text-xs font-medium">{errors.scheduledLocal}</span>
              )}
            </div>
          </div>

          <div className="mt-10 flex flex-wrap justify-end gap-3">
            {currentInterview && (
              <Button variant="outline" size="lg" className="rounded-2xl px-10" onClick={goLobby}>
                로비로 이동
              </Button>
            )}

            <Button
              variant="outline"
              size="lg"
              className="rounded-2xl px-10"
              onClick={goBackToList}
            >
              목록으로
            </Button>

            <Button
              variant="blue"
              size="lg"
              className="rounded-2xl px-10 shadow-xl"
              onClick={onSubmit}
              disabled={!isParamValid}
            >
              {currentInterview ? '일정 수정' : '일정 등록'}
            </Button>
          </div>
        </section>

        {toast && (
          <div className="bg-midnight-ink text-pure-white fixed right-10 bottom-10 z-50 rounded-2xl px-6 py-4 text-sm font-black shadow-2xl">
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
