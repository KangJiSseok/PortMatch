import { useEffect, useRef } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
  mode: 'PUBLIC' | 'AUTHENTICATED' | 'COMPANY' | 'ADMIN';
}

export const AuthGuard = ({ children, mode }: AuthGuardProps) => {
  const { user, isLoggedIn } = useAuthStore();
  const navigate = useNavigate();
  const isAlerted = useRef(false);

  useEffect(() => {
    if (isAlerted.current) return;

    if (mode === 'PUBLIC') return;

    if (!isLoggedIn) {
      isAlerted.current = true;
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login', { replace: true });
      return;
    }

    if (mode === 'COMPANY' && user?.role !== 'COMPANY') {
      isAlerted.current = true;
      alert('기업 회원만 접근 가능한 페이지입니다.');
      navigate('/main', { replace: true });
      return;
    }

    if (mode === 'ADMIN' && user?.role !== 'ADMIN') {
      isAlerted.current = true;
      alert('관리자 권한이 필요한 페이지입니다.');
      navigate('/main', { replace: true });
      return;
    }
  }, [isLoggedIn, user, mode, navigate]);

  if (mode === 'PUBLIC') {
    return isLoggedIn ? <Navigate to="/main" replace /> : <>{children}</>;
  }

  if (!isLoggedIn) return null;

  if (mode === 'COMPANY' && user?.role !== 'COMPANY') return null;
  if (mode === 'ADMIN' && user?.role !== 'ADMIN') return null;

  return <>{children}</>;
};
