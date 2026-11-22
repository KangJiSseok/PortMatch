// src/api/jobPostings.ts
import axios from 'axios';
import axiosInstance from '@/api/axiosInstance';
import type {
  ApiResponse,
  JobPostingDto,
  JobPostingListQuery,
  JobPostingPage,
  StackDto,
} from '@/types/backendJobPosting';

const apiBase = import.meta.env.VITE_API_BASE_URL;

export async function fetchJobPostings({ stackIds, ...params }: JobPostingListQuery, signal: AbortSignal) {
  const { data } = await axiosInstance.get<ApiResponse<JobPostingPage>>('/job-postings', {
    params: { ...params, stackIds: stackIds.length ? stackIds.join(',') : undefined },
    signal,
  });
  if (!data.status) throw new Error(data.message);
  return data.data;
}

export async function fetchJobPostingsByCompany(cid: string) {
  const res = await axios.get<ApiResponse<JobPostingDto[]>>(
    `${apiBase}/api/job-postings/company/${cid}`,
  );
  return res.data;
}

export async function fetchActiveJobPostingsByCompany(cid: string) {
  const res = await axiosInstance.get<ApiResponse<JobPostingDto[]>>(
    `/job-postings/company/${cid}`,
  );
  return res.data;
}

export async function fetchJobPostingStacks(postingId: number) {
  const res = await axiosInstance.get<ApiResponse<StackDto[]>>(
    `/stacks/posting/${postingId}`,
  );
  return res.data;
}
