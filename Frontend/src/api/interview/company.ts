// src/api/interview/company.ts
import { isAxiosError } from 'axios';
import axiosInstance from '@/api/axiosInstance';
import { getMyInfo } from '@/api/auth';
import type { ApiEnvelope } from '@/api/myPage/types';
import type { InterviewListStatus, InterviewSessionView, InterviewStatusValue } from './list';
import type { InterviewUserApi, JobPostingApi } from './user';

export type InterviewCompanyApiRow = {
  id: number;
  time?: string | null;
  scheduledAt?: string | null;
  scheduled_at?: string | null;
  status?: string | null;
  userId?: number | null;
  user?: InterviewUserApi | null;
  jobPostingId?: number | null;
  job_posting_id?: number | null;
  jobPosting?: JobPostingApi | null;
  roomId?: string | null;
  room_id?: string | null;
  applicationId?: number | null;
  application_id?: number | null;
};

export type CompanyInterviewEvent = {
  id: number;
  title: string;
  scheduledAt: string;
  applicantId: number;
  candidateName: string;
  position?: string;
  status?: string;
  jobPostId?: number;
  applicationId?: number;
  companyName?: string;
};

type ApiStatusLike = string | null | undefined;

function extractApiMessage(payload: unknown): string | null {
  if (typeof payload !== 'object' || payload === null) return null;

  const maybeMessage = (payload as { message?: unknown }).message;
  if (typeof maybeMessage === 'string' && maybeMessage.trim().length > 0) return maybeMessage;

  return null;
}

function normalizeError(err: unknown, fallback: string): Error {
  if (isAxiosError(err)) {
    const apiMsg = extractApiMessage(err.response?.data);
    const msg = apiMsg ?? err.message ?? fallback;
    return new Error(msg);
  }

  if (err instanceof Error) return err;
  return new Error(fallback);
}

function normalizeInterviewRows(payload: unknown): InterviewCompanyApiRow[] {
  if (Array.isArray(payload)) return payload as InterviewCompanyApiRow[];

  if (payload && typeof payload === 'object') {
    const data = (payload as ApiEnvelope<InterviewCompanyApiRow[]>).data;
    if (Array.isArray(data)) return data;
  }

  return [];
}

function pickString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function pickCompanyName(jobPosting: JobPostingApi | null | undefined): string | null {
  if (!jobPosting) return null;
  return (
    pickString(jobPosting.company?.corpName) ??
    pickString(jobPosting.company?.companies_name) ??
    pickString(jobPosting.company?.name) ??
    pickString(jobPosting.corpName) ??
    pickString(jobPosting.companies_name)
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

export function toInterviewSessionViewFromApi(row: InterviewCompanyApiRow): InterviewSessionView | null {
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
  const applicantUserIdRaw = row.userId ?? row.user?.userId;
  const applicantUserId = Number.isFinite(Number(applicantUserIdRaw))
    ? Number(applicantUserIdRaw)
    : undefined;

  const applicationIdRaw = row.applicationId ?? row.application_id;
  const applicationId = Number.isFinite(Number(applicationIdRaw))
    ? Number(applicationIdRaw)
    : Number.NaN;

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
    applicantUserId,
    status: toInterviewListStatus(row.status),
    interviewStatus: normalizeInterviewStatus(row.status) ?? 'UNKNOWN',
  };
}

function toCompanyInterviewEvent(row: InterviewCompanyApiRow): CompanyInterviewEvent | null {
  const interviewId = typeof row.id === 'number' ? row.id : Number(row.id);
  if (!Number.isFinite(interviewId)) return null;

  const scheduledAt =
    pickString(row.time) ?? pickString(row.scheduledAt) ?? pickString(row.scheduled_at);
  if (!scheduledAt) return null;

  const jobPosting = row.jobPosting ?? null;
  const jobPostTitle = pickString(jobPosting?.title) ?? 'Interview';
  const companyName = pickCompanyName(jobPosting) ?? undefined;

  const applicantIdRaw = row.userId ?? row.user?.userId;
  const applicantId = Number.isFinite(Number(applicantIdRaw))
    ? Number(applicantIdRaw)
    : interviewId;
  const candidateName = pickString(row.user?.name) ?? '지원자';

  const applicationIdRaw = row.applicationId ?? row.application_id;
  const applicationId = Number.isFinite(Number(applicationIdRaw))
    ? Number(applicationIdRaw)
    : undefined;

  return {
    id: interviewId,
    title: (row.status ?? '').toString().trim() || 'INTERVIEW',
    scheduledAt,
    applicantId,
    candidateName,
    position: jobPostTitle,
    status: row.status ?? undefined,
    jobPostId:
      typeof row.jobPostingId === 'number'
        ? row.jobPostingId
        : typeof row.job_posting_id === 'number'
          ? row.job_posting_id
          : jobPosting?.id,
    applicationId,
    companyName,
  };
}

function sortByScheduledAt(a: { scheduledAt: string }, b: { scheduledAt: string }) {
  return a.scheduledAt > b.scheduledAt ? 1 : -1;
}

export async function fetchInterviewRowsByCompanyId(
  cid: string,
): Promise<InterviewCompanyApiRow[]> {
  try {
    const res = await axiosInstance.get(`/interviews/company/${cid}`);
    return normalizeInterviewRows(res.data);
  } catch (err) {
    throw normalizeError(err, 'Failed to fetch company interview schedules.');
  }
}

export async function fetchInterviewRowsByJobPostId(
  jobPostId: number,
): Promise<InterviewCompanyApiRow[]> {
  try {
    const res = await axiosInstance.get(`/interviews/posting/${jobPostId}`);
    return normalizeInterviewRows(res.data);
  } catch (err) {
    throw normalizeError(err, 'Failed to fetch job interview schedules.');
  }
}

export async function fetchInterviewRowsForCompany(): Promise<InterviewCompanyApiRow[]> {
  const me = await getMyInfo();
  const cid = me?.data?.cid;
  if (!cid) throw new Error('Failed to resolve current company id.');
  return fetchInterviewRowsByCompanyId(String(cid));
}

export async function fetchCompanyInterviewViews(): Promise<InterviewSessionView[]> {
  const rows = await fetchInterviewRowsForCompany();
  return rows
    .map((row) => toInterviewSessionViewFromApi(row))
    .filter((it): it is InterviewSessionView => Boolean(it))
    .sort(sortByScheduledAt);
}

export async function fetchCompanyInterviewViewsByStatus(
  status: InterviewListStatus,
): Promise<InterviewSessionView[]> {
  const views = await fetchCompanyInterviewViews();
  return views.filter((v) => v.status === status);
}

export async function fetchCompanyUpcomingInterviewViews(
  limit = 3,
): Promise<InterviewSessionView[]> {
  const views = await fetchCompanyInterviewViews();
  return views
    .filter((v) => v.status === 'UPCOMING')
    .slice(0, limit);
}

export async function fetchCompanyInterviewViewById(
  interviewId: number,
): Promise<InterviewSessionView | undefined> {
  const views = await fetchCompanyInterviewViews();
  return views.find((v) => v.interview_id === interviewId);
}

export async function fetchCompanyInterviewEvents(): Promise<CompanyInterviewEvent[]> {
  const rows = await fetchInterviewRowsForCompany();
  return rows
    .map((row) => toCompanyInterviewEvent(row))
    .filter((it): it is CompanyInterviewEvent => Boolean(it))
    .sort(sortByScheduledAt);
}

export async function fetchCompanyInterviewRowById(
  interviewId: number,
): Promise<InterviewCompanyApiRow | null> {
  const rows = await fetchInterviewRowsForCompany();
  return rows.find((row) => row.id === interviewId) ?? null;
}
