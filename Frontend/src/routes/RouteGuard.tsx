import { Navigate } from 'react-router-dom';

export const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated =
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated =
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');

  if (isAuthenticated) {
    return <Navigate to="/main" replace />;
  }

  return <>{children}</>;
};
