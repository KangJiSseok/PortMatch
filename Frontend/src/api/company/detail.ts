// src/api/company/detail.ts
import axiosInstance from '@/api/axiosInstance';
import type { ApiEnvelope } from '@/api/myPage/types';

export type CompanyDetailApi = {
  cid: string;
  corpName: string;
  logo?: string;
};

export async function fetchCompanyDetail(cid: string): Promise<CompanyDetailApi | null> {
  const res = await axiosInstance.get<ApiEnvelope<CompanyDetailApi>>(`/companies/${cid}`);
  return res.data.data ?? null;
}
