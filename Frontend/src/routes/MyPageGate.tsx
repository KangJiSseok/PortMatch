import { Navigate } from 'react-router-dom';
import MyPage from '../pages/MyPage';
import CorporateMyPage from '../pages/CompanyMyPage';
import { useAuthStore } from '@/store/authStore';

export default function MyPageGate() {
  const { isLoggedIn, user } = useAuthStore();

  // 1. 로그인 여부 확인
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. 기업 회원이면 기업 전용 마이페이지로 이동
  if (user.role === 'COMPANY') {
    return <CorporateMyPage />;
  }

  // 3. 그 외(개인 회원)는 일반 마이페이지로 이동
  return <MyPage />;
}
