import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import InterviewListPage from '../pages/interview/InterviewListPage';
import CorporateInterviewListPage from '../pages/company/CompanyInterviewListPage';

export default function InterviewListGate() {
  const { isLoggedIn, user } = useAuthStore();

  // 1. 로그인 여부 확인 및 2중 안전장치
  if (!isLoggedIn || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. 기업 회원이면 기업용 인터뷰 리스트 페이지
  if (user.role === 'COMPANY') {
    return <CorporateInterviewListPage />;
  }

  // 3. 개인 회원이면 개인용 인터뷰 리스트 페이지
  return <InterviewListPage />;
}
