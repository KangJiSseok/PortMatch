// src/routes/MyPageGate.tsx
import { Navigate } from 'react-router-dom';
import MyPage from '../pages/MyPage';
import CorporateMyPage from '../pages/CompanyMyPage';

type UserRole = 'guest' | 'individual' | 'corporate';

export default function MyPageGate() {
  const token = localStorage.getItem('accessToken');
  const role = (localStorage.getItem('userRole') as UserRole) ?? 'guest';

  // 로그인 안 했으면 마이페이지 못 들어가게
  if (!token || role === 'guest') {
    return <Navigate to="/login" replace />;
  }

  // 기업이면 기업 마이페이지
  if (role === 'corporate') {
    return <CorporateMyPage />;
  }

  // 개인이면 기존 MyPage
  return <MyPage />;
}
