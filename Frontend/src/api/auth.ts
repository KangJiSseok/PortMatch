import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  ApiResponse,
  UserData,
  ApplicantSignupRequest,
  CompanySignupRequest,
} from '../types/auth';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const logout = async (): Promise<ApiResponse<object>> => {
  const response = await api.post<ApiResponse<object>>('/auth/logout');
  return response.data;
};

export const getMyInfo = async (): Promise<ApiResponse<UserData>> => {
  const response = await api.get<ApiResponse<UserData>>('/auth/me');
  return response.data;
};

export const signupApplicant = async (
  data: ApplicantSignupRequest,
): Promise<ApiResponse<object>> => {
  const response = await api.post<ApiResponse<object>>('/accounts/signup/applicant', data);
  return response.data;
};

export const signupCompany = async (data: CompanySignupRequest): Promise<ApiResponse<object>> => {
  const response = await api.post<ApiResponse<object>>('/accounts/signup/company', data);
  return response.data;
};
