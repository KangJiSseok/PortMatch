import type { PortfolioResponse, AnalysisResponse } from '../types/portfolio';

interface ApiResponse<T = null> {
  status: boolean;
  code: number;
  message: string;
  data: T;
}

export const portfolioApi = {
  fetchMyPortfolios: async (): Promise<PortfolioResponse[]> => {
    const response = await fetch('/api/portfolios/me', {
      method: 'GET',
      credentials: 'include',
    });

    const result: ApiResponse<PortfolioResponse[]> = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || '포트폴리오 목록을 불러오지 못했습니다.');
    }

    return result.data || [];
  },

  uploadPortfolio: async (file: File): Promise<PortfolioResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/portfolios/me', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    const result: ApiResponse<PortfolioResponse> = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || '파일 업로드에 실패했습니다.');
    }

    return result.data;
  },

  deletePortfolio: async (id: number | string): Promise<void> => {
    // 수정: URL에 id가 포함되도록 템플릿 리터럴(``) 사용
    const response = await fetch(`/api/portfolios/me/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const result: ApiResponse = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || '삭제 요청에 실패했습니다.');
    }
  },

  requestAnalysis: async (portfolioId: number | string): Promise<void> => {
    // 수정: URL 경로 사이에 portfolioId 삽입
    const response = await fetch(`/api/portfolios/me/${portfolioId}/analysis`, {
      method: 'POST',
      credentials: 'include',
    });

    const result: ApiResponse = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || '분석 요청에 실패했습니다.');
    }
  },

  requestAnalysisV2: async (portfolioId: number | string): Promise<any> => {
    // 수정: URL 경로 사이에 portfolioId 삽입
    const response = await fetch(`/api/portfolios/me/${portfolioId}/analysis-v2`, {
      method: 'POST',
      credentials: 'include',
    });

    const result: ApiResponse<any> = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || '분석 요청에 실패했습니다.');
    }
    return result.data;
  },

  getAnalysisResult: async (portfolioId: number | string): Promise<AnalysisResponse | null> => {
    // 수정: URL 경로 사이에 portfolioId 삽입
    const response = await fetch(`/api/portfolios/me/${portfolioId}/analysis`, {
      method: 'GET',
      credentials: 'include',
    });

    const result: ApiResponse<AnalysisResponse> = await response.json();

    if (!response.ok) {
      throw new Error('분석 결과를 가져오는데 실패했습니다.');
    }

    if (!result.status) {
      return null;
    }

    return result.data;
  },

  getPresignedUrl: async (portfolioId: number | string): Promise<{ url: string }> => {
    // 수정: URL 경로 사이에 portfolioId 삽입
    const response = await fetch(`/api/portfolios/${portfolioId}/presigned-url`, {
      method: 'GET',
      credentials: 'include',
    });

    const result: ApiResponse<{ url: string }> = await response.json();

    if (!response.ok || !result.status) {
      throw new Error(result.message || '파일 경로를 불러오지 못했습니다.');
    }

    return result.data;
  },
};
