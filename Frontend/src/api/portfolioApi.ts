import type { PortfolioResponse, AnalysisResponse } from '../types/portfolio';

export const portfolioApi = {
  fetchMyPortfolios: async (): Promise<PortfolioResponse[]> => {
    const response = await fetch('/api/portfolios/me', {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
    const result = await response.json();
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
    if (!response.ok) throw new Error();
    const result = await response.json();
    return result.data;
  },

  deletePortfolio: async (id: number | string): Promise<void> => {
    const response = await fetch(`/api/portfolios/me/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
  },

  requestAnalysis: async (portfolioId: number | string): Promise<void> => {
    const response = await fetch(`/api/portfolios/me/${portfolioId}/analysis`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
  },

  getAnalysisResult: async (portfolioId: number | string): Promise<AnalysisResponse> => {
    const response = await fetch(`/api/portfolios/me/${portfolioId}/analysis`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
    return response.json();
  },

  getPresignedUrl: async (portfolioId: number | string): Promise<{ url: string }> => {
    const response = await fetch(`/api/portfolios/${portfolioId}/presigned-url`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!response.ok) throw new Error();
    const result = await response.json();
    return result.data;
  },
};
