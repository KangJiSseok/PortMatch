// src/api/jobPostings.ts
import axios from 'axios';
import type { ApiResponse, JobPostingDto } from '@/types/backendJobPosting';

const apiBase = import.meta.env.VITE_API_BASE_URL;

export async function fetchJobPostings() {
  const res = await axios.get<ApiResponse<JobPostingDto[]>>(`${apiBase}/api/job-postings`);
  return res.data;
}
