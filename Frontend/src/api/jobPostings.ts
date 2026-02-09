// src/api/jobPostings.ts
import axios from 'axios';
import axiosInstance from '@/api/axiosInstance';
import type { ApiResponse, JobPostingDto, StackDto } from '@/types/backendJobPosting';

const apiBase = import.meta.env.VITE_API_BASE_URL;

export async function fetchJobPostings() {
  const res = await axios.get<ApiResponse<JobPostingDto[]>>(`${apiBase}/api/job-postings`);
  return res.data;
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
  const res = await axios.get<ApiResponse<StackDto[]>>(
    `${apiBase}/api/stacks/posting/${postingId}`,
  );
  return res.data;
}
