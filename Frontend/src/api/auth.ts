import axios from 'axios';
import type {
  LoginRequest,
  LoginResponse,
  ApplicantSignupRequest,
  CompanySignupRequest,
} from '../types/auth';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/auth/login', data);
  return response.data;
};

export const signupApplicant = async (data: ApplicantSignupRequest) => {
  const response = await api.post('/accounts/signup/applicant', data);
  return response.data;
};

export const signupCompany = async (data: CompanySignupRequest) => {
  const response = await api.post('/accounts/signup/company', data);
  return response.data;
};
