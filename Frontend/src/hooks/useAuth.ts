import { useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, logout, signupApplicant, signupCompany } from '../api/auth';
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
    mutationFn: async (data: LoginRequest & { rememberMe: boolean }) => {
      await login(data);

      const meResponse = await fetch('/api/auth/me', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const meJson = await meResponse.json();

      if (!meJson.status || !meJson.data) {
        throw new Error('유저 정보를 불러오는데 실패했습니다.');
      }

      return meJson.data;
    },
    onSuccess: (userData, variables) => {
      setAuth(userData);

      if (!variables.rememberMe) {
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
          sessionStorage.setItem('auth-storage', authData);
          localStorage.removeItem('auth-storage');
        }
      }

      navigate('/main');
    },
    onError: (error) => {
      console.error(error);
    }
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
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const fetchMyInfo = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
          const json = await response.json();
          if (json.status && json.data) {
            setAuth(json.data);
          }
        } else {
          if (response.status === 401) {
            clearAuth();
          }
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchMyInfo();
  }, [setAuth, clearAuth]);
};

export const useAuth = () => {
  const user = useAuthStore((state) => state.user);
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  return { user, isLoggedIn };
};