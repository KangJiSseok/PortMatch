import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import IntroPage from './pages/IntroPage';
import Button from './components/Button/Button';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-pure-white">
        <Routes>
          <Route path="/" element={<IntroPage />} />
          <Route path="/intro" element={<IntroPage />} />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/main" element={<div>Main Page</div>} />
          <Route
            path="/design"
            element={
              <div className="flex flex-col items-center justify-center min-h-screen p-10">
                <h1 className="text-midnight-ink text-4xl font-bold mb-12">
                  Port Match Design System
                </h1>
                <div className="space-y-12 w-full max-w-4xl">
                  <section className="space-y-4">
                    <h2 className="text-slate-gray font-semibold border-b pb-2">Size: Large (lg)</h2>
                    <div className="flex items-center gap-6">
                      <Button variant="light" size="lg">Light Large</Button>
                      <Button variant="dark" size="lg">Dark Large</Button>
                      <Button variant="outline" size="lg">Outline Large</Button>
                    </div>
                  </section>
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;