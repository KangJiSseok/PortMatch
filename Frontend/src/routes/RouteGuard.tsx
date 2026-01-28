import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

/**
 * 1. 로그인한 사용자만 접근 가능 (개인/기업/관리자 공통)
 */
export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login', { replace: true });
    }
  }, [isLoggedIn, navigate]);

  if (!isLoggedIn) return null;
  return <>{children}</>;
};

/**
 * 2. 로그인하지 않은 사용자만 접근 가능 (로그인, 회원가입 등)
 */
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuthStore();

  if (isLoggedIn) {
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
};

/**
 * 3. 기업 회원(COMPANY)만 접근 가능
 */
export const CompanyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (user?.role !== 'COMPANY') {
      alert('기업 회원만 접근 가능한 페이지입니다.');
      navigate('/main', { replace: true });
    }
  }, [isLoggedIn, user, navigate]);

  if (!isLoggedIn || user?.role !== 'COMPANY') return null;
  return <>{children}</>;
};

/**
 * 4. 관리자(ADMIN)만 접근 가능
 */
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/login', { replace: true });
      return;
    }

    if (user?.role !== 'ADMIN') {
      alert('관리자 권한이 필요한 페이지입니다.');
      navigate('/main', { replace: true });
    }
  }, [isLoggedIn, user, navigate]);

  if (!isLoggedIn || user?.role !== 'ADMIN') return null;
  return <>{children}</>;
};
