// src/routes/InterviewListGate.tsx
import { Navigate } from 'react-router-dom';

import InterviewListPage from '../pages/InterviewListPage';
import CorporateInterviewListPage from '../pages/CorporateInterviewListPage';

type UserRole = 'guest' | 'individual' | 'corporate';

export default function InterviewListGate() {
  const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');

  const roleRaw = localStorage.getItem('userRole') ?? sessionStorage.getItem('userRole');
  const role = (roleRaw as UserRole) ?? 'guest';

  // 로그인 안 했으면 접근 불가 (ProtectedRoute로 감싸져도 2중 안전장치)
  if (!token || role === 'guest') {
    return <Navigate to="/login" replace />;
  }

  // 기업이면 기업용 리스트
  if (role === 'corporate') {
    return <CorporateInterviewListPage />;
  }

  // 개인이면 기존 리스트
  return <InterviewListPage />;
}
