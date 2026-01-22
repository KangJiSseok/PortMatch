import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, logout, getMyInfo, signupApplicant, signupCompany } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import type {
  LoginRequest,
  ApplicantSignupRequest,
  CompanySignupRequest,
  UserRole,
} from '../types/auth';

export const useLogin = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (response) => {
      setAuth(response.data);
      navigate('/main');
    },
  });
};

export const useLogout = () => {
  const navigate = useNavigate();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clearAuth();
      navigate('/login');
    },
  });
};

type SignupParams =
  | { type: Extract<UserRole, 'APPLICANT'>; data: ApplicantSignupRequest }
  | { type: Extract<UserRole, 'COMPANY'>; data: CompanySignupRequest };

export const useSignup = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: ({ type, data }: SignupParams) => {
      if (type === 'APPLICANT') {
        return signupApplicant(data);
      }
      return signupCompany(data);
    },
    onSuccess: () => {
      alert('회원가입이 완료되었습니다.');
      navigate('/login');
    },
  });
};

export const useMyInfo = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return useQuery({
    queryKey: ['myInfo'],
    queryFn: getMyInfo,
    enabled: isLoggedIn,
    select: (response) => response.data,
    staleTime: 1000 * 60 * 5,
  });
};
