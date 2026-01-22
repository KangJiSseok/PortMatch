import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);

  if (isLoggedIn) {
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
};

export const CompanyRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoggedIn } = useAuthStore();

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'COMPANY') {
    alert('기업 회원만 접근 가능한 페이지입니다.');
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
};
