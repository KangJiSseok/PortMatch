// src/api/interview/InterviewTemplates.ts
import axiosInstance from '../axiosInstance';

export type InterviewTemplateSummary = {
  id: number | string;
  title: string;
  targetRole: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ApiResponse<T> = {
  status: boolean;
  code: number;
  message: string;
  data: T;
};

export type InterviewTemplateQuestion = {
  id: number | string;
  content: string;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
};

export type InterviewTemplateTopic = {
  id: number | string;
  name: string;
  orderIndex: number;
  createdAt?: string;
  updatedAt?: string;
  questions: InterviewTemplateQuestion[];
};

export type InterviewTemplateDetail = {
  id: number | string;
  userId?: number | string;
  title: string;
  targetRole: string;
  createdAt?: string;
  updatedAt?: string;
  topics: InterviewTemplateTopic[];
};

export type InterviewQuestionMemo = {
  id: number | string;
  content: string;
  orderIndex: number;
  memoContent: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchInterviewTemplates() {
  const response = await axiosInstance.get<ApiResponse<InterviewTemplateSummary[]>>(
    '/interview-templates',
  );
  return response.data;
}

export async function fetchInterviewTemplateDetail(templateId: number | string) {
  const response = await axiosInstance.get<ApiResponse<InterviewTemplateDetail>>(
    `/interview-templates/${templateId}`,
  );
  return response.data;
}

export async function fetchInterviewQuestionMemo(
  templateId: number | string,
  topicId: number | string,
  questionId: number | string,
) {
  const response = await axiosInstance.get<ApiResponse<InterviewQuestionMemo>>(
    `/interview-templates/${templateId}/topics/${topicId}/questions/${questionId}/memo`,
  );
  return response.data;
}

export async function updateInterviewQuestionMemo(
  templateId: number | string,
  topicId: number | string,
  questionId: number | string,
  memoContent: string,
) {
  const response = await axiosInstance.patch<ApiResponse<InterviewQuestionMemo>>(
    `/interview-templates/${templateId}/topics/${topicId}/questions/${questionId}/memo`,
    { memoContent },
  );
  return response.data;
}
