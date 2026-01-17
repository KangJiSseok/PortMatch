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
          <Route
            path="/"
            element={
              <div className="flex flex-col items-center justify-center min-h-screen p-10">
                <h1 className="text-midnight-ink text-4xl font-bold mb-12" data-aos="fade-down">
                  Portmatch Design Table
                </h1>

                {/* 버튼 매트릭스 테이블 */}
                <div className="space-y-12 w-full max-w-4xl" data-aos="fade-up">
                  {/* Row: Large Buttons */}
                  <section className="space-y-4">
                    <h2 className="text-slate-gray font-semibold border-b pb-2">Size: Large (lg)</h2>
                    <div className="flex items-center gap-6">
                      <Button variant="light" size="lg">Light Large</Button>
                      <Button variant="dark" size="lg">Dark Large</Button>
                      <Button variant="outline" size="lg">Outline Large</Button>
                    </div>
                  </section>

                  {/* Row: Medium Buttons (Default) */}
                  <section className="space-y-4">
                    <h2 className="text-slate-gray font-semibold border-b pb-2">Size: Medium (md)</h2>
                    <div className="flex items-center gap-6">
                      <Button variant="light" size="md">Light Medium</Button>
                      <Button variant="dark" size="md">Dark Medium</Button>
                      <Button variant="outline" size="md">Outline Medium</Button>
                    </div>
                  </section>

                  {/* Row: Small Buttons */}
                  <section className="space-y-4">
                    <h2 className="text-slate-gray font-semibold border-b pb-2">Size: Small (sm)</h2>
                    <div className="flex items-center gap-6">
                      <Button variant="light" size="sm">Light Small</Button>
                      <Button variant="dark" size="sm">Dark Small</Button>
                      <Button variant="outline" size="sm">Outline Small</Button>
                    </div>
                  </section>
                </div>
              </div>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/main" element={<div>Main Page</div>} />
          <Route path="/intro" element={<IntroPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;