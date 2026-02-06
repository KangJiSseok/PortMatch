import axiosInstance from '@/api/axiosInstance';
import type { ApiEnvelope } from '@/api/myPage/types';

export type CompanySearchResult = {
  cid: string;
  corpName: string;
  totPsncnt?: string;
  busiSize?: string;
  corpAddr?: string;
  homePg?: string;
  logo?: string;
  recentJobTitles?: string[];
  recentJob?: Array<{ id: number; title: string }>;
};

type CompanySearchResponse =
  | ApiEnvelope<CompanySearchResult | CompanySearchResult[]>
  | CompanySearchResult
  | CompanySearchResult[];

export async function fetchCompanySearch(keyword: string): Promise<CompanySearchResult | null> {
  const res = await axiosInstance.get<CompanySearchResponse>('/companies/search', {
    params: { keyword },
  });

  const raw = (res.data as ApiEnvelope<CompanySearchResult | CompanySearchResult[]>)?.data ?? res.data;
  if (Array.isArray(raw)) return raw[0] ?? null;
  if (raw && typeof raw === 'object') return raw as CompanySearchResult;
  return null;
}
