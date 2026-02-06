// src/api/interview/list.ts
// src/api/interview/list.ts
import { fetchInterviewRowsForMe, type InterviewApiRow } from './user';

export type InterviewListStatus = 'UPCOMING' | 'DONE';

export type InterviewStatusValue =
  | 'PENDING'
  | 'CONFIRMED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'UNKNOWN';

export type InterviewSessionView = {
  interview_id: number;
  application_id: number;
  room_id: string;
  scheduledAt: string;

  job_post_id: number;
  postingTitle: string;
  companyName: string;

  applicantName?: string;
  applicantUserId?: number;

  status: InterviewListStatus;
  interviewStatus?: InterviewStatusValue;
};

type ApiStatusLike = string | null | undefined;

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickCompanyName(jobPosting: InterviewApiRow['jobPosting']): string | null {
  if (!jobPosting) return null;

  const jp = jobPosting as InterviewApiRow['jobPosting'] & {
    companyName?: unknown;
    company?: {
      name?: unknown;
      companies_name?: unknown;
      corpName?: unknown;
      companyName?: unknown;
    } | null;
    companies_name?: unknown;
    corpName?: unknown;
  };

  return (
    pickString(jp.companyName) ??
    pickString(jp.company?.companyName) ??
    pickString(jp.company?.name) ??
    pickString(jp.company?.companies_name) ??
    pickString(jp.company?.corpName) ??
    pickString(jp.companies_name) ??
    pickString(jp.corpName)
  );
}

function normalizeInterviewStatus(apiStatus: ApiStatusLike): InterviewStatusValue | null {
  const normalized = (apiStatus ?? '').toString().trim().toUpperCase();
  if (!normalized) return null;
  if (
    normalized === 'PENDING' ||
    normalized === 'CONFIRMED' ||
    normalized === 'COMPLETED' ||
    normalized === 'CANCELED'
  ) {
    return normalized;
  }
  return 'UNKNOWN';
}

function toInterviewListStatus(apiStatus: ApiStatusLike): InterviewListStatus {
  const status = normalizeInterviewStatus(apiStatus);
  if (status === 'COMPLETED' || status === 'CANCELED') return 'DONE';
  if (status === 'PENDING' || status === 'CONFIRMED') return 'UPCOMING';
  return 'UPCOMING';
}

function toInterviewSessionViewFromApi(row: InterviewApiRow): InterviewSessionView | null {
  const interviewId = typeof row.id === 'number' ? row.id : Number(row.id);
  if (!Number.isFinite(interviewId)) return null;

  const scheduledAt =
    pickString(row.time) ?? pickString(row.scheduledAt) ?? pickString(row.scheduled_at);
  if (!scheduledAt) return null;

  const jobPosting = row.jobPosting ?? null;
  const jobPostIdRaw = row.jobPostingId ?? row.job_posting_id ?? jobPosting?.id;
  const jobPostId = typeof jobPostIdRaw === 'number' ? jobPostIdRaw : Number(jobPostIdRaw);
  const safeJobPostId = Number.isFinite(jobPostId) ? jobPostId : interviewId;

  const postingTitle = pickString(jobPosting?.title) ?? `Interview #${interviewId}`;
  const companyName = pickCompanyName(jobPosting) ?? '-';
  const applicantName = pickString(row.user?.name) ?? undefined;

  const applicationIdRaw =
    row.applicationId ?? row.application_id ?? row.jobPostingId ?? row.job_posting_id ?? interviewId;
  const applicationId = Number.isFinite(Number(applicationIdRaw))
    ? Number(applicationIdRaw)
    : interviewId;

  const roomId = pickString(row.roomId) ?? pickString(row.room_id) ?? `room_${interviewId}`;

  return {
    interview_id: interviewId,
    application_id: applicationId,
    room_id: roomId,
    scheduledAt,
    job_post_id: safeJobPostId,
    postingTitle,
    companyName,
    applicantName,
    status: toInterviewListStatus(row.status),
    interviewStatus: normalizeInterviewStatus(row.status) ?? 'UNKNOWN',
  };
}

function sortByScheduledAt(a: InterviewSessionView, b: InterviewSessionView) {
  return a.scheduledAt > b.scheduledAt ? 1 : -1;
}

async function buildInterviewViewsFromApi(): Promise<InterviewSessionView[]> {
  const rows = await fetchInterviewRowsForMe();
  return rows
    .map((row) => toInterviewSessionViewFromApi(row))
    .filter((it): it is InterviewSessionView => Boolean(it))
    .sort(sortByScheduledAt);
}

export async function fetchMyInterviewViews(): Promise<InterviewSessionView[]> {
  return buildInterviewViewsFromApi();
}

export async function fetchMyUpcomingInterviewViews(
  limit = 2,
): Promise<InterviewSessionView[]> {
  const views = await buildInterviewViewsFromApi();
  return views
    .filter((v) => v.status === 'UPCOMING')
    .slice(0, limit);
}

export async function fetchMyInterviewViewsByStatus(
  status: InterviewListStatus,
): Promise<InterviewSessionView[]> {
  const views = await buildInterviewViewsFromApi();
  return views.filter((v) => v.status === status);
}

export async function fetchMyInterviewViewById(
  interviewId: number,
): Promise<InterviewSessionView | undefined> {
  const views = await buildInterviewViewsFromApi();
  return views.find((v) => v.interview_id === interviewId);
}
