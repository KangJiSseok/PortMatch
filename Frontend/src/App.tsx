import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import IntroPage from './pages/IntroPage';
import Button from './components/Button/Button';
import Input from './components/Input/Input';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/main" element={<div>Main Page</div>} />
        <Route
          path="/design"
          element={
            <div className="bg-cloud-dancer min-h-screen space-y-16 p-10">
              <header className="border-soft-pebble border-b pb-6">
                <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
                  Port Match Design System
                </h1>
                <p className="text-slate-gray mt-2">
                  공통 컴포넌트 라이브러리 (Branch: fe-feat/common-components)
                </p>
              </header>

              <section className="space-y-8">
                <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
                  01. Buttons
                </h2>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="bg-pure-white space-y-6 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-slate-gray text-sm font-bold tracking-widest uppercase">
                      Light Theme (Company)
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button variant="dark" size="lg">
                        Primary Dark
                      </Button>
                      <Button variant="outline" size="md">
                        Outline
                      </Button>
                    </div>
                  </div>

                  <div className="bg-midnight-ink space-y-6 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-cloud-dancer text-sm font-bold tracking-widest uppercase opacity-60">
                      Dark Theme (Applicant)
                    </h3>
                    <div className="flex flex-wrap items-center gap-4">
                      <Button variant="light" size="lg">
                        Primary Light
                      </Button>
                      <Button variant="outline" size="md" colorTheme="dark">
                        Outline
                      </Button>
                    </div>
                  </div>
                </div>
              </section>

              <section className="space-y-8">
                <h2 className="text-midnight-ink border-midnight-ink border-l-4 pl-4 text-2xl font-bold">
                  02. Inputs
                </h2>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div className="bg-pure-white space-y-6 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-slate-gray text-sm font-bold tracking-widest uppercase">
                      Light Variant
                    </h3>
                    <div className="space-y-4">
                      <Input label="아이디" placeholder="아이디를 입력하세요" variant="light" />
                      <Input
                        label="비밀번호"
                        type="password"
                        placeholder="비밀번호를 입력하세요"
                        variant="light"
                        error="필수 입력 항목입니다."
                      />
                    </div>
                  </div>

                  <div className="bg-midnight-ink space-y-6 rounded-2xl p-8 shadow-sm">
                    <h3 className="text-cloud-dancer text-sm font-bold tracking-widest uppercase opacity-60">
                      Dark Variant
                    </h3>
                    <div className="space-y-4">
                      <Input label="ID" placeholder="Enter your ID" variant="dark" />
                      <Input
                        label="Password"
                        type="password"
                        placeholder="Enter your password"
                        variant="dark"
                        error="Invalid credentials."
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
