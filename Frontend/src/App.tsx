import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';

import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';
import IntroPage from './pages/IntroPage';
import MainPage from './pages/MainPage';
import DesignSystemPage from './pages/DesignSystemPage';

function AppContent() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem('isLoggedIn') === 'true';
  });

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  const isIntroPage = location.pathname === '/intro' || location.pathname === '/';

  return (
    <>
      {!isIntroPage && <Navbar />}
      <div className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              isLoggedIn ? <Navigate to="/main" replace /> : <Navigate to="/intro" replace />
            }
          />
          <Route path="/intro" element={<IntroPage />} />
          <Route path="/main" element={<MainPage />} />
          <Route path="/design" element={<DesignSystemPage />} />
        </Routes>
      </div>
      {!isIntroPage && <Footer />}
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
