// src/pages/company/CompanyInterviewSchedulePage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';

import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import {
  getExtraInterviewViewByApplicationId,
  type InterviewSessionView,
} from '../../api/myPage';
import { fetchCompanyApplications } from '../../api/applications';
import { fetchJobPostDetail } from '../../api/jobPost/detail';
import {
  createInterviewSchedule,
  fetchCompanyInterviewRowById,
  toInterviewSessionViewFromApi,
  updateInterviewSchedule,
  fetchInterviewRowsByJobPostId,
  type InterviewCompanyApiRow,
} from '../../api/interview';

type NavState = {
  applicantName?: string;
  applicantUserId?: number;
  postingTitle?: string;
  companyName?: string;
  scheduleId?: number;
};

type FormErrors = {
  companyName?: string;
  applicantName?: string;
  postingTitle?: string;
  scheduledLocal?: string;
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

function localInputToApi(value: string) {
  const [datePart, timePart] = value.split('T');
  if (!datePart || !timePart) return new Date().toISOString().replace('Z', '');

  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mi] = timePart.split(':').map(Number);

  const yyyy = String(y ?? new Date().getFullYear()).padStart(4, '0');
  const mm = String(m ?? 1).padStart(2, '0');
  const dd = String(d ?? 1).padStart(2, '0');
  const H = String(hh ?? 0).padStart(2, '0');
  const M = String(mi ?? 0).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${H}:${M}:00`;
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

  // ✅ effect 없이: 렌더 시점에 기존 일정 조회 (localStorage 기반이라 동기 OK)
  const existing = useMemo(() => {
    if (!isParamValid) return undefined;
    return getExtraInterviewViewByApplicationId(safeApplicationId);
  }, [isParamValid, safeApplicationId]);

  // ✅ 초기값은 state initializer로만 세팅 (setState-in-effect ESLint 회피)
  const [currentInterview, setCurrentInterview] = useState<InterviewSessionView | null>(
    () => existing ?? null,
  );

  const [companyName, setCompanyName] = useState<string>(
    () => navState.companyName ?? existing?.companyName ?? '',
  );
  const [applicantName, setApplicantName] = useState<string>(
    () => navState.applicantName ?? existing?.applicantName ?? '',
  );
  const applicantUserId = Number.isFinite(Number(navState.applicantUserId))
    ? Number(navState.applicantUserId)
    : undefined;
  const [postingTitle, setPostingTitle] = useState<string>(
    () => navState.postingTitle ?? existing?.postingTitle ?? '',
  );
  const [scheduledLocal, setScheduledLocal] = useState<string>(() =>
    existing ? toLocalInputValue(existing.scheduledAt) : defaultLocalDateTime,
  );

  const scheduleId =
    typeof navState.scheduleId === 'number' && Number.isFinite(navState.scheduleId)
      ? navState.scheduleId
      : undefined;

  // ✅ Auto-detect existing schedule logic
  const [activeScheduleId, setActiveScheduleId] = useState<number | undefined>(scheduleId);

  useEffect(() => {
    setActiveScheduleId(scheduleId);
  }, [scheduleId]);

  // If no scheduleId explicitly passed, try to find one
  useEffect(() => {
    if (activeScheduleId || !Number.isFinite(safeApplicationId) || !Number.isFinite(safeJobPostId)) return;

    let cancelled = false;
    const autoDetect = async () => {
      try {
        // 1. Get Applicant UserId from Application ID
        const apps = await fetchCompanyApplications(safeJobPostId);
        const targetApp = apps.find(a => a.applicationId === safeApplicationId);
        if (!targetApp || cancelled) return;

        // 2. Get All Interviews for this Job Post
        const interviews = await fetchInterviewRowsByJobPostId(safeJobPostId);
        if (cancelled) return;

        // 3. Find match by UserId
         const match = interviews.find(i => {
             const uid = i.userId ?? i.user?.userId;
             return Number(uid) === targetApp.userId;
         });

         if (match) {
             console.log('Auto-detected existing interview:', match);
             setActiveScheduleId(match.id);
             
             // Also set current interview view immediately if easier
             const view = toInterviewSessionViewFromApi(match);
             if (view) setCurrentInterview(view);
             setBaseSchedule(match);
         }

      } catch (err) {
        console.warn('Failed to auto-detect interview:', err);
      }
    };
    
    void autoDetect();

    return () => { cancelled = true; };
  }, [activeScheduleId, safeApplicationId, safeJobPostId]);

  const [toast, setToast] = useState<string>('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [baseSchedule, setBaseSchedule] = useState<InterviewCompanyApiRow | null>(null);

  useEffect(() => {
    if (applicantName.trim()) return;
    const next = navState.applicantName?.trim();
    if (next) setApplicantName(next);
  }, [applicantName, navState.applicantName]);

  useEffect(() => {
    if (!Number.isFinite(safeJobPostId) || safeJobPostId <= 0) return;

    let cancelled = false;

    const load = async () => {
      try {
        const detail = await fetchJobPostDetail(safeJobPostId);
        if (cancelled || !detail) return;

        if (!postingTitle.trim() && detail.jobPost?.title) {
          setPostingTitle(detail.jobPost.title);
        }

        if (!companyName.trim()) {
          const nextCompanyName =
            detail.company?.companies_name ??
            detail.company?.id ??
            (detail.jobPost?.id ? `Company ${detail.jobPost.id}` : '');

          if (nextCompanyName.trim()) setCompanyName(nextCompanyName);
        }
      } catch (err) {
        console.error('Failed to load job posting detail:', err);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [safeJobPostId, postingTitle, companyName]);

  useEffect(() => {
    if (!activeScheduleId) return;
    let cancelled = false;

    const load = async () => {
      try {
        const row = await fetchCompanyInterviewRowById(activeScheduleId);
        if (cancelled || !row) return; // Added null check
        setBaseSchedule(row);
        
        // UI를 수정 모드로 전환하기 위해 currentInterview 상태 업데이트
        const view = toInterviewSessionViewFromApi(row);
        if (view) {
          setCurrentInterview(view);
        }
      } catch (err) {
        console.error('Failed to load interview schedule:', err);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [activeScheduleId]);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  }, []);

  const modeLabel = currentInterview ? 'EDIT' : 'CREATE';

  const validate = useCallback(() => {
    const next: FormErrors = {};

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
        postingTitle: '\uC720\uD6A8\uD558\uC9C0 \uC54A\uC740 \uC720\uC54C \uC785\uB2C8\uB2E4.',
      }));
      return;
    }

    const ok = validate();
    if (!ok) return;

    const scheduledAtIso = localInputToApi(scheduledLocal);

    const run = async () => {
      if (scheduleId && baseSchedule) {
        const body: { time: string; status?: 'PENDING' | 'CONFIRMED' | 'APPROVED' | 'CANCELED' | 'COMPLETED' } = {
          time: scheduledAtIso,
        };

        // 기존 상태가 유효하면 함께 전송 (필요시)
        /*
        if (baseSchedule?.status) {
           body.status = baseSchedule.status as any; 
        }
        */

        await updateInterviewSchedule(scheduleId, body);

        setCurrentInterview((prev) =>
          prev
            ? { ...prev, scheduledAt: scheduledAtIso }
            : {
                interview_id: scheduleId,
                application_id: safeApplicationId,
                room_id: baseSchedule.roomId ?? baseSchedule.room_id ?? `room_${scheduleId}`,
                scheduledAt: scheduledAtIso,
                job_post_id: safeJobPostId,
                postingTitle: postingTitle.trim(),
                companyName: companyName.trim(),
                applicantName: applicantName.trim(),
                status: 'UPCOMING',
              },
        );

        showToast('\uC77C\uC815 \uC218\uC815 \uC644\uB8CC!');
        return;
      }

      try {
        if (!Number.isFinite(applicantUserId)) {
          showToast('\uC9C0\uC6D0\uC790 ID \uC815\uBCF4\uAC00 \uC5C6\uC2B5\uB2C8\uB2E4.');
          return;
        }
        const createdId = await createInterviewSchedule({
          time: scheduledAtIso,
          status: 'PENDING',
          user: { userId: applicantUserId as number },
          jobPosting: { id: safeJobPostId },
        });

        setCurrentInterview({
          interview_id: createdId,
          application_id: safeApplicationId,
          room_id: `room_${createdId}`,
          scheduledAt: scheduledAtIso,
          job_post_id: safeJobPostId,
          postingTitle: postingTitle.trim(),
          companyName: companyName.trim(),
          applicantName: applicantName.trim(),
          status: 'UPCOMING',
        });

        showToast('\uC77C\uC815 \uB4F1\uB85D \uC644\uB8CC!');
      } catch (err) {
        const msg = err instanceof Error ? err.message : '\uC77C\uC815 \uB4F1\uB85D\uC5D0 \uC2E4\uD328\uD588\uC2B5\uB2C8\uB2E4.';
        showToast(msg);
      }
    };

    void run();
  }, [
    applicantName,
    baseSchedule,
    companyName,
    currentInterview,
    isParamValid,
    postingTitle,
    safeApplicationId,
    safeJobPostId,
    scheduleId,
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
