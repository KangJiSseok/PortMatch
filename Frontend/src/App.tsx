import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import IntroPage from './pages/IntroPage';
import MainPage from './pages/MainPage';
import DesignSystemPage from './pages/DesignSystemPage';
import MyPage from './pages/MyPage';
import InterviewPage from './pages/InterviewPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import { ProtectedRoute, PublicRoute } from './routes/RouteGuard';

function AppContent() {
  const location = useLocation();
  const isAuthenticated = !!(
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')
  );

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  const hideLayoutPages = ['/intro', '/login', '/signup'];
  const shouldHideLayout = hideLayoutPages.includes(location.pathname) || location.pathname === '/';

  return (
    <>
      {!shouldHideLayout && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? <Navigate to="/main" replace /> : <Navigate to="/intro" replace />
            }
          />

          <Route
            path="/intro"
            element={
              <PublicRoute>
                <IntroPage />
              </PublicRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <SignupPage />
              </PublicRoute>
            }
          />

          <Route path="/main" element={<MainPage />} />

          <Route
            path="/mypage"
            element={
              <ProtectedRoute>
                <MyPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/interview"
            element={
              <ProtectedRoute>
                <InterviewPage />
              </ProtectedRoute>
            }
          />

          <Route path="/design" element={<DesignSystemPage />} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      {!shouldHideLayout && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen flex-col">
        <AppContent />
      </div>
    </BrowserRouter>
  );
}

export default App;
