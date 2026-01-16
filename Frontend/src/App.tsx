import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import IntroPage from './pages/IntroPage';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/main" element={<div>Main Page</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;