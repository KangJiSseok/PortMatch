import { useEffect } from 'react';
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

import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

import IntroPage from './pages/common/IntroPage';
import MainPage from './pages/common/MainPage';
import NoticePage from './pages/common/NoticePage';

import InterviewPage from './pages/interview/InterviewPage';
import InterviewLobbyPage from './pages/interview/InterviewLobbyPage';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

import PortfoliosPage from './pages/user/PortfoliosPage';
import ResumeDetailPage from './pages/user/ResumeDetailPage';
import RecommendCompanyPage from './pages/user/RecommendCompanyPage';
import ProfileEditPage from './pages/user/ProfileEditPage';

import JobPostingsPage from './pages/job/JobPostingsPage';
import CompanyJobManagementPage from './pages/job/CompanyJobManagementPage';
import JobPostDetailPage from './pages/job/JobPostDetailPage';
import JobPostFormPage from './pages/job/JobPostFormPage';
import JobApplicationManagementPage from './pages/job/JobApplicationManagementPage';
import JobApplyPage from './pages/job/JobApplyPage';

import CompanyDetailsPage from './pages/company/CompanyDetailsPage';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import CompanyProfileEditPage from './pages/company/CompanyProfileEditPage';
import RecommendCandidatesPage from './pages/company/RecommendCandidatesPage';

import SalaryCalculatorPage from './pages/support/SalaryCalculatorPage';
import EmployerCostCalculatorPage from './pages/support/EmployerCostCalculatorPage';
import ScheduleManagementPage from './pages/support/ScheduleManagementPage';
import InterviewTemplatePage from './pages/support/InterviewTemplatePage';
import ResumeFeedbackPage from './pages/support/ResumeFeedbackPage';
import InterviewQuestionGeneratorPage from './pages/support/InterviewQuestionGeneratorPage';
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

const RootLayout = () => {
  const location = useLocation();

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  const hideLayoutPages = ['/intro', '/login', '/signup'];
  const shouldHideLayout = hideLayoutPages.includes(location.pathname) || location.pathname === '/';

  return (
    <div className="flex min-h-screen flex-col">
      <ScrollRestoration />
      {!shouldHideLayout && <Navbar />}
      <div className="flex-1">
        <Outlet />
      </div>
      {!shouldHideLayout && <Footer />}
    </div>
  );
};

const IndexRoute = () => {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  return <Navigate to={isLoggedIn ? '/main' : '/intro'} replace />;
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
        path: 'companies/:companyId',
        element: <CompanyDetailsPage />,
      },
      {
        path: 'resumes',
        children: [
          {
            index: true,
            element: <Navigate to="/portfolios" replace />,
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
        path: 'job-postings',
        element: <JobPostingsPage />,
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
            path: 'resume-feedback',
            element: (
              <AuthGuard mode="AUTHENTICATED">
                <ResumeFeedbackPage />
              </AuthGuard>
            ),
          },
          {
            path: 'interview-generator',
            element: (
              <AuthGuard mode="COMPANY">
                <InterviewQuestionGeneratorPage />
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
  return <RouterProvider router={router} />;
}

export default App;
