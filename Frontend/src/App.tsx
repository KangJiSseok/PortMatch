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

import CompanyInterviewSchedulePage from './pages/company/CompanyInterviewSchedulePage';
import TestInterviewLobbyPage from './pages/interview/TestInterviewLobbyPage';
import TestInterviewPage from './pages/interview/TestInterviewPage';
import ProfileEditPage from './pages/user/ProfileEditPage';

import { AuthGuard } from './routes/RouteGuard';
import MypageGate from './routes/MyPageGate';
import InterviewListGate from './routes/InterviewListGate';

import { MessengerProvider } from './contexts/MessengerProvider';
import MessengerContainer from './components/Messenger/MessengerContainer';

import { useMyInfo } from './hooks/useAuth';
import { useAuthStore } from './store/authStore';

const RootLayout = () => {
  const location = useLocation();

  useMyInfo();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

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
      <SystemAlertScheduler />

      {!shouldHideLayout && <Navbar />}

      <div className="flex-1">
        <Outlet />
      </div>

      {!shouldHideLayout && <Footer />}
      {!shouldHideLayout && <MessengerContainer />}
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
      { index: true, element: <IndexRoute /> },
      { path: 'intro', element: <IntroPage /> },
      {
        path: 'login',
        element: (
          <AuthGuard mode="PUBLIC">
            <LoginPage />
          </AuthGuard>
        ),
      },
      { path: 'logout', element: <LogoutPage /> },
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
      { path: 'main', element: <MainPage /> },
      { path: 'notices', element: <NoticePage /> },
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
      { path: 'companies/:companyId', element: <CompanyDetailsPage /> },
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
          { index: true, element: <Navigate to="me" replace /> },
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
      { path: 'job-postings', element: <JobPostingsPage /> },
      { path: 'companies/:cid/active-postings', element: <CompanyActivePostingsPage /> },
      { path: 'job-posts/:id', element: <JobPostDetailPage /> },
      {
        path: 'job-posts/:id/apply',
        element: (
          <AuthGuard mode="AUTHENTICATED">
            <JobApplyPage />
          </AuthGuard>
        ),
      },
      { path: 'interviews/test/:id/lobby', element: <TestInterviewLobbyPage /> },
      { path: '/interviews/test/room', element: <TestInterviewPage /> },
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
          { path: 'salary', element: <SalaryCalculatorPage /> },
          {
            path: 'employer-cost',
            element: (
              <AuthGuard mode="COMPANY">
                <EmployerCostCalculatorPage />
              </AuthGuard>
            ),
          },
          { path: 'schedule', element: <ScheduleRedirect /> },
          { path: 'schedule/:roomId', element: <ScheduleManagementPage /> },
          {
            path: 'interview-template',
            element: (
              <AuthGuard mode="AUTHENTICATED">
                <InterviewTemplatePage />
              </AuthGuard>
            ),
          },
          { path: 'speech-timer', element: <InterviewSpeechTimerPage /> },
          {
            path: 'sprint-capacity',
            element: (
              <AuthGuard mode="COMPANY">
                <SprintCapacityCalculatorPage />
              </AuthGuard>
            ),
          },
          { path: 'unit-converter', element: <UnitConverterPage /> },
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
      { path: '*', element: <Navigate to="/" replace /> },
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