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
    mutationFn: (data: LoginRequest & { rememberMe: boolean }) => login(data),
    onSuccess: (response, variables) => {
      setAuth(response.data);

      if (!variables.rememberMe) {
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
          sessionStorage.setItem('auth-storage', authData);
          localStorage.removeItem('auth-storage');
        }
      }

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
  return useMutation({
    mutationFn: ({ type, data }: SignupParams) => {
      if (type === 'APPLICANT') {
        return signupApplicant(data);
      }
      return signupCompany(data);
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

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return {
    user,
    isLoggedIn,
  };
};
