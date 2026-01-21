import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { login, signupApplicant, signupCompany } from '../api/auth';
import type {
  LoginRequest,
  ApplicantSignupRequest,
  CompanySignupRequest,
  UserRole,
} from '../types/auth';

export const useLogin = (rememberMe: boolean) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),
    onSuccess: (data, variables) => {
      const storage = rememberMe ? localStorage : sessionStorage;

      storage.setItem('accessToken', data.token);
      storage.setItem('userRole', variables.expectedRole);
      storage.setItem('isLoggedIn', 'true');

      navigate('/main');
    },
  });
};

export const useSignup = (userType: UserRole) => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ApplicantSignupRequest | CompanySignupRequest) => {
      if (userType === 'APPLICANT') {
        return signupApplicant(data as ApplicantSignupRequest);
      }
      return signupCompany(data as CompanySignupRequest);
    },
    onSuccess: () => {
      alert('회원가입이 완료되었습니다.');
      navigate('/login');
    },
  });
};
