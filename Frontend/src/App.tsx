import { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
  useLocation,
  Outlet,
} from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

import IntroPage from './pages/common/IntroPage';
import MainPage from './pages/common/MainPage';
import DesignSystemPage from './pages/common/DesignSystemPage';

import InterviewPage from './pages/interview/InterviewPage';
import InterviewLobbyPage from './pages/interview/InterviewLobbyPage';

import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';

import PortfoliosPage from './pages/user/PortfoliosPage';
import ResumeDetailPage from './pages/user/ResumeDetailPage';
import RecommendCompanyPage from './pages/user/RecommendCompanyPage';

import JobPostingsPage from '@/pages/job/JobPostingsPage';
import JobPostDetailPage from './pages/job/JobPostDetailPage';
import JobPostFormPage from './pages/job/JobPostFormPage';
import JobApplicationManagementPage from './pages/job/JobApplicationManagementPage';
import JobApplyPage from './pages/job/JobApplyPage';

import CompanyDetailsPage from './pages/company/CompanyDetailsPage';
import CompanyJobManagementPage from './pages/company/CompanyJobManagementPage';
import CompanyProfilePage from './pages/company/CompanyProfilePage';
import CompanyProfileEditPage from './pages/company/CompanyProfileEditPage';

import { ProtectedRoute, PublicRoute, CompanyRoute } from './routes/RouteGuard';
import MypageGate from './routes/MyPageGate';
import InterviewListGate from './routes/InterviewListGate';
import { useAuthStore } from './store/authStore';

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
        element: (
          <PublicRoute>
            <IntroPage />
          </PublicRoute>
        ),
      },
      {
        path: 'login',
        element: (
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        ),
      },
      {
        path: 'signup',
        element: (
          <PublicRoute>
            <SignupPage />
          </PublicRoute>
        ),
      },
      {
        path: 'main',
        element: <MainPage />,
      },
      {
        path: 'mypage',
        element: (
          <ProtectedRoute>
            <MypageGate />
          </ProtectedRoute>
        ),
      },
      {
        path: 'companies/:companyId',
        element: <CompanyDetailsPage />,
      },
      {
        path: 'resumes/:resumeId',
        element: (
          <ProtectedRoute>
            <ResumeDetailPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'interviews',
        element: (
          <ProtectedRoute>
            <InterviewListGate />
          </ProtectedRoute>
        ),
      },
      {
        path: 'interviews/:id/lobby',
        element: (
          <ProtectedRoute>
            <InterviewLobbyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'interviews/:id/room',
        element: (
          <ProtectedRoute>
            <InterviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'portfolios',
        element: (
          <ProtectedRoute>
            <PortfoliosPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recommend/companies',
        element: (
          <ProtectedRoute>
            <RecommendCompanyPage />
          </ProtectedRoute>
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
          <ProtectedRoute>
            <JobApplyPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'company/jobs',
        element: (
          <CompanyRoute>
            <CompanyJobManagementPage />
          </CompanyRoute>
        ),
      },
      {
        path: 'company/jobs/new',
        element: (
          <CompanyRoute>
            <JobPostFormPage />
          </CompanyRoute>
        ),
      },
      {
        path: 'company/jobs/edit/:id',
        element: (
          <CompanyRoute>
            <JobPostFormPage />
          </CompanyRoute>
        ),
      },
      {
        path: 'company/jobs/:id/applicants',
        element: (
          <CompanyRoute>
            <JobApplicationManagementPage />
          </CompanyRoute>
        ),
      },
      {
        path: 'company/profile',
        element: (
          <CompanyRoute>
            <CompanyProfilePage />
          </CompanyRoute>
        ),
      },
      {
        path: 'company/profile/edit',
        element: (
          <CompanyRoute>
            <CompanyProfileEditPage />
          </CompanyRoute>
        ),
      },
      {
        path: 'design',
        element: <DesignSystemPage />,
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
