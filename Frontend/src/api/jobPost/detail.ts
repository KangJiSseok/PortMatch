// src/api/jobPost/detail.ts
import axios from 'axios';
import axiosInstance from '@/api/axiosInstance';

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T | null;
};

// Swagger 기준 공고 상세 응답 data 형태
type JobPostingDetailApi = {
  id: string;
  title: string;
  active: number;
  startDate: string;
  endDate: string;
  vcnt: number;
  cid: string;
  detail: string;
  jobType: number;
  company: {
    cid: string;
    corpName: string;
    totPsncnt: string;
    busiSize: string;
    yrSalesAmt: string;
    corpAddr: string;
    homePg: string;
    busiCont: string;
    logo: string;
  };
  stackIds: number[];
};

// JobPostDetailPage에서 사용하는 최소 뷰 모델
export type JobPostDetailView = {
  isScrapped: boolean;
  external_apply_url?: string | null;
  jobPost: {
    id: number;
    title: string;
    deadline?: string | null; // endDate 매핑
    status?: 'OPEN' | 'CLOSED';
    requirement_text?: string | null; // detail 매핑
    required_stacks?: string[]; // 기술스택 이름들(현재 임시)
  };
  company: {
    id: string; // company cid
    companies_name: string; // corpName
    address?: string | null; // corpAddr
    homepage_url?: string | null; // homePg
  };
};

function toStatus(endDate?: string | null): 'OPEN' | 'CLOSED' {
  if (!endDate) return 'OPEN';
  const end = new Date(`${endDate}T23:59:59`);
  return end.getTime() < Date.now() ? 'CLOSED' : 'OPEN';
}

/**
 * ✅ 기술스택 표시용 임시 라벨
 * 현재 기술스택 DB에 데이터가 없어서 이름 매핑이 불가하므로 #id로 표시합니다.
 *
 * TODO(기술스택 연동):
 * - 백엔드에서 기술스택 DB 채워지고, 아래 API가 정상 데이터 반환하면
 *   GET /api/stacks/posting/{postingId} 를 호출해서 stackName 리스트로 바꾸기
 * - 혹은 stackIds를 기준으로 /api/stacks/{id}를 여러번 호출하는 방식도 가능하지만 비효율(스택 개수만큼 호출)
 */
function mapStackIdsToLabels(stackIds?: number[] | null): string[] {
  const ids = stackIds ?? [];
  return ids.map((sid) => `#${sid}`);
}

function mapDetail(apiData: JobPostingDetailApi): JobPostDetailView {
  const idNum = Number(apiData.id);

  return {
    isScrapped: false, // TODO: 스크랩 상태 API 붙이면 채우기
    external_apply_url: null, // TODO: 외부지원 URL 필드 생기면 매핑
    jobPost: {
      id: Number.isFinite(idNum) ? idNum : 0,
      title: apiData.title ?? '',
      deadline: apiData.endDate ?? null,
      status: toStatus(apiData.endDate),
      requirement_text: apiData.detail ?? null,

      // 임시로 stackIds를 '#id' 형태로 표시
      // TODO(기술스택 연동): stackIds -> stackName 리스트로 변경
      required_stacks: mapStackIdsToLabels(apiData.stackIds),
    },
    company: {
      id: apiData.company?.cid ?? apiData.cid ?? '',
      companies_name: apiData.company?.corpName ?? '-',
      address: apiData.company?.corpAddr ?? null,
      homepage_url: apiData.company?.homePg ?? null,
    },
  };
}

/**
 * 공고 상세 조회
 * - 성공: HTTP 200 + body.code === 1000 + body.data 존재
 * - 없는 공고: 보통 HTTP 400 + body.code === 2001 + data null -> null 반환
 * - 그 외: throw Error(message)
 */
export async function fetchJobPostDetail(jobPostingId: number): Promise<JobPostDetailView | null> {
  try {
    const res = await axiosInstance.get<ApiEnvelope<JobPostingDetailApi>>(
      `/job-postings/${jobPostingId}`,
    );

    if (res.data.code === 1000 && res.data.data) {
      return mapDetail(res.data.data);
    }

    if (res.data.code === 2001) return null;

    throw new Error(res.data.message || '공고 정보를 불러오지 못했어요.');
  } catch (err: unknown) {
    // 서버가 400으로 떨어져도 body에 code/message 담아서 주는 케이스 처리
    if (axios.isAxiosError(err)) {
      const payload = err.response?.data as ApiEnvelope<unknown> | undefined;

      if (payload?.code === 2001) return null;

      const msg =
        payload?.message ??
        (err.response?.status ? `요청 실패 (${err.response.status})` : '공고 정보를 불러오지 못했어요.');

      throw new Error(msg);
    }

    throw err instanceof Error ? err : new Error('알 수 없는 오류가 발생했어요.');
  }
}
