import type { PortfolioResponse, AnalysisResponse } from '../types/portfolio';

const getAuthHeaders = (): Record<string, string> => {
  const authData = localStorage.getItem('auth-storage');
  if (!authData) return {};
  try {
    const parsed = JSON.parse(authData);
    const token = parsed.state?.user?.accessToken || parsed.state?.token;
    if (!token) return {};
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  } catch {
    return {};
  }
};

export const portfolioApi = {
  fetchMyPortfolios: async (): Promise<PortfolioResponse[]> => {
    const response = await fetch('/api/portfolios/me', {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
    return response.json();
  },

  uploadPortfolio: async (file: File): Promise<PortfolioResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const headers = getAuthHeaders();
    delete headers['Content-Type'];
    const response = await fetch('/api/portfolios/me', {
      method: 'POST',
      headers: headers,
      body: formData,
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
    return response.json();
  },

  deletePortfolio: async (id: number | string): Promise<void> => {
    const response = await fetch(`/api/portfolios/me/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
  },

  requestAnalysis: async (portfolioId: number | string): Promise<void> => {
    const response = await fetch(`/api/portfolios/me/${portfolioId}/analysis`, {
      method: 'POST',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
  },

  getAnalysisResult: async (portfolioId: number | string): Promise<AnalysisResponse> => {
    const response = await fetch(`/api/portfolios/me/${portfolioId}/analysis`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
    return response.json();
  },

  getPresignedUrl: async (portfolioId: number | string): Promise<{ url: string }> => {
    const response = await fetch(`/api/portfolios/${portfolioId}/presigned-url`, {
      method: 'GET',
      headers: getAuthHeaders(),
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
    return response.json();
  },
};
