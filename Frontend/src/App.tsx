import { useEffect, useState } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  Outlet,
  ScrollRestoration,
} from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

// ✅ [추가] Firebase 및 테스트용 imports
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './lib/firebase'; // ⚠️ firebase 설정 파일 경로 확인 필요 (src/firebase.ts 가정)
import { useMessenger } from './hooks/useMessenger';
import SystemAlertScheduler from './components/Messenger/SystemAlertScheduler';

import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

import IntroPage from './pages/common/IntroPage';
import MainPage from './pages/common/MainPage';
import NoticePage from './pages/common/NoticePage';

import InterviewPage from './pages/interview/InterviewPage';
import InterviewLobbyPage from './pages/interview/InterviewLobbyPage';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import LogoutPage from './pages/auth/LogoutPage';

import PortfoliosPage from './pages/user/PortfoliosPage';
import ResumeDetailPage from './pages/user/ResumeDetailPage';
import RecommendCompanyPage from './pages/user/RecommendCompanyPage';
import RecommendJobPostingsPage from './pages/user/RecommendJobPostingsPage';
import MyApplicationPage from './pages/user/MyApplicationPage';

import JobPostingsPage from './pages/job/JobPostingsPage';
import CompanyActivePostingsPage from './pages/job/CompanyActivePostingsPage';
import CompanyJobManagementPage from './pages/job/CompanyJobManagementPage';
import JobPostDetailPage from './pages/job/JobPostDetailPage';
import JobPostFormPage from './pages/job/JobPostFormPage';
import JobApplicationManagementPage from './pages/job/JobApplicationManagementPage';
import JobApplyPage from './pages/job/JobApplyPage';

import CompanyDetailsPage from './pages/company/CompanyDetailsPage';
import CompanyEditPage from './pages/company/CompanyEditPage';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import CompanyProfileEditPage from './pages/company/CompanyProfileEditPage';
import RecommendCandidatesPage from './pages/company/RecommendCandidatesPage';

import SalaryCalculatorPage from './pages/support/SalaryCalculatorPage';
import EmployerCostCalculatorPage from './pages/support/EmployerCostCalculatorPage';
import ScheduleManagementPage from './pages/support/ScheduleManagementPage';
import InterviewTemplatePage from './pages/support/InterviewTemplatePage';
import ResumeFeedbackPage from './pages/support/ResumeFeedbackPage';
import SmartDocComparatorPage from './pages/support/SmartDocComparatorPage';
import InterviewSpeechTimerPage from './pages/support/InterviewSpeechTimerPage';
import SprintCapacityCalculatorPage from './pages/support/SprintCapacityCalculatorPage';
import UnitConverterPage from './pages/support/UnitConverterPage';

import NoticeManagementPage from './pages/admin/NoticeManagementPage';
import NoticeFormPage from './pages/admin/NoticeFormPage';

import { AuthGuard } from './routes/RouteGuard';
import MypageGate from './routes/MyPageGate';
import InterviewListGate from './routes/InterviewListGate';
import { useAuthStore } from './store/authStore';
import CompanyInterviewSchedulePage from './pages/company/CompanyInterviewSchedulePage';
import TestInterviewLobbyPage from './pages/interview/TestInterviewLobbyPage';
import TestInterviewPage from './pages/interview/TestInterviewPage';
import ProfileEditPage from './pages/user/ProfileEditPage';

import { MessengerProvider } from './contexts/MessengerProvider';
import MessengerContainer from './components/Messenger/MessengerContainer';

import { useMyInfo } from './hooks/useAuth';

const RootLayout = () => {
  const location = useLocation();
  const { rooms } = useMessenger(); // ✅ 테스트 메시지 전송을 위해 채팅방 목록 가져오기

  useMyInfo();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  // ✅ [테스트용] 시스템 메시지 강제 발송 함수
  const handleTestSystemAlert = async () => {
    if (!rooms || rooms.length === 0) {
      alert(
        '활성화된 채팅방이 없어 테스트 메시지를 보낼 수 없습니다.\n먼저 채용 공고에 지원하거나 채팅을 시작해주세요.',
      );
      return;
    }

    // 첫 번째 채팅방을 타겟으로 설정
    const targetRoomId = rooms[0].id;
    const opponentName = rooms[0].companyName || rooms[0].applicantName || '상대방';

    try {
      await addDoc(collection(db, 'chats', targetRoomId, 'messages'), {
        text: `[테스트 알림] 🔔\n이것은 시스템 알림 테스트입니다.\n\n대상 채팅방: ${opponentName}\n전송 시각: ${new Date().toLocaleTimeString()}`,
        senderId: 'system', // ✅ 시스템 ID로 설정
        createdAt: serverTimestamp(),
        type: 'text',
        isRead: false,
        systemType: 'alert',
      });
      alert(`[${opponentName}] 님과의 채팅방으로\n테스트 알림을 전송했습니다!`);
    } catch (error) {
      console.error('테스트 전송 실패:', error);
      alert('메시지 전송에 실패했습니다.');
    }
  };

  const hideLayoutPages = ['/intro', '/login', '/signup'];
  const isInterviewPage = /^\/interviews\/[^/]+\/(lobby|room)$/.test(location.pathname);
  const isTestInterviewPage = /^\/interviews\/test\/([^/]+\/lobby|room)$/.test(location.pathname);

  const shouldHideLayout =
    hideLayoutPages.includes(location.pathname) ||
    location.pathname === '/' ||
    isInterviewPage ||
    isTestInterviewPage;

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollRestoration />

      {/* ✅ 앱 전역에서 동작하는 시스템 알림 스케줄러 (UI 없음) */}
      <SystemAlertScheduler />

      {!shouldHideLayout && <Navbar />}

      <div className="flex-1">
        <Outlet />
      </div>

      {!shouldHideLayout && <Footer />}
      {!shouldHideLayout && <MessengerContainer />}

      {/* ✅ [테스트용] 시스템 알림 발송 버튼 (개발 확인용, 좌측 하단 고정) */}
      {!shouldHideLayout && (
        <button
          onClick={handleTestSystemAlert}
          className="fixed bottom-6 left-6 z-50 flex items-center gap-2 rounded-full bg-slate-800 px-4 py-3 text-xs font-bold text-white shadow-xl transition-transform hover:scale-105 active:scale-95"
        >
          🔔 알림 테스트 보내기
        </button>
      )}
    </div>
  );
};

const IndexRoute = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return <Navigate to={isLoggedIn ? '/main' : '/intro'} replace />;
};

const ScheduleRedirect = () => {
  const [randomId] = useState(() => Math.random().toString(36).substring(2, 11));

  return <Navigate to={`/support/schedule/${randomId}`} replace />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <IndexRoute />,
      },
      {
        path: 'intro',
        element: <IntroPage />,
      },
      {
        path: 'login',
        element: (
          <AuthGuard mode="PUBLIC">
            <LoginPage />
          </AuthGuard>
        ),
      },
      {
        path: 'logout',
        element: <LogoutPage />,
      },
      {
        path: 'signup',
        element: (
          <AuthGuard mode="PUBLIC">
            <SignupPage />
          </AuthGuard>
        ),
      },
      {
        path: 'profile/edit',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <ProfileEditPage />
          </AuthGuard>
        ),
      },
      {
        path: 'main',
        element: <MainPage />,
      },
      {
        path: 'notices',
        element: <NoticePage />,
      },
      {
        path: 'mypage',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <MypageGate />
          </AuthGuard>
        ),
      },
      {
        path: '/applications/me',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <MyApplicationPage />
          </AuthGuard>
        ),
      },
      {
        path: 'companies/:companyId',
        element: <CompanyDetailsPage />,
      },
      {
        path: 'companies/:companyId/edit',
        element: (
          <AuthGuard mode="COMPANY">
            <CompanyEditPage />
          </AuthGuard>
        ),
      },
      {
        path: 'resumes',
        children: [
          {
            index: true,
            element: <Navigate to="me" replace />,
          },
          {
            path: ':resumeId',
            element: (
              <AuthGuard mode="AUTHENTICATED">
                <ResumeDetailPage />
              </AuthGuard>
            ),
          },
        ],
      },
      {
        path: 'interviews',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <InterviewListGate />
          </AuthGuard>
        ),
      },
      {
        path: 'interviews/:id/lobby',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <InterviewLobbyPage />
          </AuthGuard>
        ),
      },
      {
        path: 'interviews/:id/room',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <InterviewPage />
          </AuthGuard>
        ),
      },
      {
        path: 'portfolios',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <PortfoliosPage />
          </AuthGuard>
        ),
      },
      {
        path: 'recommend/companies',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <RecommendCompanyPage />
          </AuthGuard>
        ),
      },
      {
        path: 'recommend/jobposting',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <RecommendJobPostingsPage />
          </AuthGuard>
        ),
      },
      {
        path: 'job-postings',
        element: <JobPostingsPage />,
      },
      {
        path: 'companies/:cid/active-postings',
        element: <CompanyActivePostingsPage />,
      },
      {
        path: 'job-posts/:id',
        element: <JobPostDetailPage />,
      },
      {
        path: 'job-posts/:id/apply',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <JobApplyPage />
          </AuthGuard>
        ),
      },
      {
        path: 'interviews/test/:id/lobby',
        element: <TestInterviewLobbyPage />,
      },
      {
        path: '/interviews/test/room',
        element: <TestInterviewPage />,
      },
      {
        path: 'company/jobs',
        element: (
          <AuthGuard mode="COMPANY">
            <CompanyJobManagementPage />
          </AuthGuard>
        ),
      },
      {
        path: 'company/jobs/new',
        element: (
          <AuthGuard mode="COMPANY">
            <JobPostFormPage />
          </AuthGuard>
        ),
      },
      {
        path: 'company/jobs/edit/:id',
        element: (
          <AuthGuard mode="COMPANY">
            <JobPostFormPage />
          </AuthGuard>
        ),
      },
      {
        path: 'company/jobs/:id/applicants',
        element: (
          <AuthGuard mode="COMPANY">
            <JobApplicationManagementPage />
          </AuthGuard>
        ),
      },
      {
        path: 'company/jobs/:jobPostId/applicants/:applicationId/schedule',
        element: (
          <AuthGuard mode="COMPANY">
            <CompanyInterviewSchedulePage />
          </AuthGuard>
        ),
      },
      {
        path: 'company/profile',
        element: (
          <AuthGuard mode="COMPANY">
            <CompanyProfilePage />
          </AuthGuard>
        ),
      },
      {
        path: 'company/profile/edit',
        element: (
          <AuthGuard mode="COMPANY">
            <CompanyProfileEditPage />
          </AuthGuard>
        ),
      },
      {
        path: 'company/recommend/candidates',
        element: (
          <AuthGuard mode="COMPANY">
            <RecommendCandidatesPage />
          </AuthGuard>
        ),
      },
      {
        path: 'support',
        children: [
          {
            path: 'salary',
            element: <SalaryCalculatorPage />,
          },
          {
            path: 'employer-cost',
            element: (
              <AuthGuard mode="COMPANY">
                <EmployerCostCalculatorPage />
              </AuthGuard>
            ),
          },
          {
            path: 'schedule',
            element: <ScheduleRedirect />,
          },
          {
            path: 'schedule/:roomId',
            element: <ScheduleManagementPage />,
          },
          {
            path: 'interview-template',
            element: (
              <AuthGuard mode="AUTHENTICATED">
                <InterviewTemplatePage />
              </AuthGuard>
            ),
          },
          {
            path: 'speech-timer',
            element: <InterviewSpeechTimerPage />,
          },
          {
            path: 'sprint-capacity',
            element: (
              <AuthGuard mode="COMPANY">
                <SprintCapacityCalculatorPage />
              </AuthGuard>
            ),
          },
          {
            path: 'unit-converter',
            element: <UnitConverterPage />,
          },
          {
            path: 'portfolio-feedback',
            element: (
              <AuthGuard mode="AUTHENTICATED">
                <ResumeFeedbackPage />
              </AuthGuard>
            ),
          },
          {
            path: 'doc-comparator',
            element: (
              <AuthGuard mode="COMPANY">
                <SmartDocComparatorPage />
              </AuthGuard>
            ),
          },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            path: 'notices/manage',
            element: (
              <AuthGuard mode="ADMIN">
                <NoticeManagementPage />
              </AuthGuard>
            ),
          },
          {
            path: 'notices/new',
            element: (
              <AuthGuard mode="ADMIN">
                <NoticeFormPage />
              </AuthGuard>
            ),
          },
          {
            path: 'notices/edit/:id',
            element: (
              <AuthGuard mode="ADMIN">
                <NoticeFormPage />
              </AuthGuard>
            ),
          },
        ],
      },
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

function App() {
  return (
    <MessengerProvider>
      <RouterProvider router={router} />
    </MessengerProvider>
  );
}

export default App;
