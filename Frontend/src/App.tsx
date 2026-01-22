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
import IntroPage from './pages/IntroPage';
import MainPage from './pages/MainPage';
import DesignSystemPage from './pages/DesignSystemPage';
import InterviewPage from './pages/InterviewPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import PortfoliosPage from './pages/PortfoliosPage';
import RecommendCompanyPage from './pages/RecommendCompanyPage';
import CompanyDetailsPage from './pages/CompanyDetailsPage';
import ResumeDetailPage from './pages/ResumeDetailPage';
import JobPostingsPage from '@/pages/JobPostingsPage';
import { ProtectedRoute, PublicRoute } from './routes/RouteGuard';
import InterviewLobbyPage from './pages/InterviewLobbyPage';
import JobPostDetailPage from './pages/JobPostDetailPage';
import MypageGate from './routes/MyPageGate';
import CompanyJobManagementPage from './pages/CompanyJobManagementPage';
import JobApplicationManagementPage from './pages/JobApplicationManagementPage';
import JobPostFormPage from './pages/JobPostFormPage';
import InterviewListGate from './routes/InterviewListGate';

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

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: (
          <Navigate
            to={
              localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
                ? '/main'
                : '/intro'
            }
            replace
          />
        ),
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
        path: 'company/jobs',
        element: (
          <ProtectedRoute>
            <CompanyJobManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'company/jobs/new',
        element: (
          <ProtectedRoute>
            <JobPostFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'company/jobs/edit/:id',
        element: (
          <ProtectedRoute>
            <JobPostFormPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'company/jobs/:id/applicants',
        element: (
          <ProtectedRoute>
            <JobApplicationManagementPage />
          </ProtectedRoute>
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
