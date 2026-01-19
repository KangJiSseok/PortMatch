import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AOS from 'aos';
import 'aos/dist/aos.css';
import IntroPage from './pages/IntroPage';
import Button from './components/Button/Button';
import Input from './components/Input/Input';
import Checkbox from './components/Checkbox/Checkbox';
import Select from './components/Select/Select';
import FileUploader from './components/FileUploader/FileUploader';
import Navbar from './components/Navbar/Navbar';
import Footer from './components/Footer/Footer';

import MyPage from './pages/MyPage';
import InterviewPage from './pages/InterviewPage';

function App() {
  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: false,
    });
  }, []);

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<IntroPage />} />
        <Route path="/intro" element={<IntroPage />} />
        <Route
          path="/design"
          element={
            <div className="bg-cloud-dancer flex min-h-screen flex-col pt-20">
              <main className="flex-1 space-y-16 p-10">
                <header className="border-soft-pebble border-b pb-6">
                  <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
                    Port Match Design System
                  </h1>
                  <p className="text-slate-gray mt-2">공통 컴포넌트 및 레이아웃 시스템</p>
                </header>

                <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                  <section className="bg-pure-white space-y-6 rounded-2xl p-8 shadow-sm">
                    <h2 className="border-midnight-ink border-l-4 pl-3 text-xl font-black uppercase">
                      Light Theme
                    </h2>
                    <Input label="이메일" placeholder="example@portmatch.com" variant="light" />
                    <Select
                      label="직군 선택"
                      options={[
                        { value: 'fe', label: '프론트엔드' },
                        { value: 'be', label: '백엔드' },
                      ]}
                      variant="light"
                    />
                    <Checkbox label="아이디 저장" variant="light" />
                    <FileUploader label="포트폴리오 업로드" variant="light" />
                    <div className="flex gap-2">
                      <Button variant="dark">로그인</Button>
                      <Button variant="outline" colorTheme="light">
                        취소
                      </Button>
                    </div>
                  </section>

                  <section className="bg-midnight-ink text-pure-white space-y-6 rounded-2xl p-8 shadow-sm">
                    <h2 className="border-pure-white border-l-4 pl-3 text-xl font-black uppercase">
                      Dark Theme
                    </h2>
                    <Input label="ID" placeholder="Enter email" variant="dark" />
                    <Select
                      label="Position"
                      options={[
                        { value: 'fe', label: 'Frontend' },
                        { value: 'be', label: 'Backend' },
                      ]}
                      variant="dark"
                    />
                    <Checkbox label="Remember me" variant="dark" />
                    <FileUploader label="Upload Resume" variant="dark" />
                    <div className="flex gap-2">
                      <Button variant="light">Login</Button>
                      <Button variant="outline" colorTheme="dark">
                        Cancel
                      </Button>
                    </div>
                  </section>
                </div>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
