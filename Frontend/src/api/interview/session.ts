import axiosInstance from '../axiosInstance';

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

// API 기본 경로
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

// 1. 세션 생성 (방 만들기)
export async function createInterviewSession(): Promise<string> {
  const res = await axiosInstance.post<string>(BASE, undefined, TEXT_CONFIG);
  return ensureText(res.data);
}

// 2. 세션 연결 (토큰 발급) - 수정됨
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

  // [수정] URL 경로에 sessionId와 connections를 명시
  // 백엔드 API가 /interview/sessions/{sessionId}/connections 라고 가정
  const url = `${BASE}/${sessionId}/connections`;

  try {
    const res = await axiosInstance.post<string>(url, body, TEXT_CONFIG);
    return ensureText(res.data);
  } catch (error) {
    console.error('토큰 발급 실패:', error);
    throw error;
  }
}
