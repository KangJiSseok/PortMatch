import axiosInstance from '@/api/axiosInstance';

export type InterviewRole =
  | 'interviewer'
  | 'applicant'
  | 'interviewee'
  | 'INTERVIEWER'
  | 'APPLICANT';

type ServerRole = 'INTERVIEWER' | 'APPLICANT';

type CreateConnectionBody = {
  role: ServerRole;
  nickname: string;
};

const BASE = '/interview/sessions';

const TEXT_CONFIG = {
  headers: { Accept: '*/*' },
  responseType: 'text' as const,
};

function toServerRole(role: InterviewRole): ServerRole {
  if (role === 'INTERVIEWER' || role === 'interviewer') return 'INTERVIEWER';
  return 'APPLICANT';
}

function ensureText(data: unknown): string {
  return typeof data === 'string' ? data : '';
}

export async function createInterviewSession(): Promise<string> {
  const res = await axiosInstance.post<string>(BASE, undefined, TEXT_CONFIG);
  return ensureText(res.data);
}

export async function createInterviewConnection(params: {
  sessionId: string;
  role: InterviewRole;
  nickname: string;
}): Promise<string> {
  const { sessionId, role, nickname } = params;

  const body: CreateConnectionBody = {
    role: toServerRole(role),
    nickname,
  };

  const res = await axiosInstance.post<string>(
    `${BASE}/${encodeURIComponent(sessionId)}/connections`,
    body,
    TEXT_CONFIG,
  );

  return ensureText(res.data);
}

export async function deleteInterviewSession(sessionId: string): Promise<void> {
  await axiosInstance.delete(`${BASE}/${encodeURIComponent(sessionId)}`, TEXT_CONFIG);
}
