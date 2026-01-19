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
        <Route
          path="/design"
          element={
            <div className="bg-cloud-dancer min-h-screen space-y-16 p-10">
              <header className="border-soft-pebble border-b pb-6">
                <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">
                  Design System
                </h1>
              </header>

              <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
                <div className="space-y-12">
                  <section className="bg-pure-white space-y-6 rounded-2xl p-8 shadow-sm">
                    <h2 className="border-midnight-ink border-l-4 pl-3 text-xl font-black">
                      LIGHT THEME
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
                </div>

                <div className="space-y-12">
                  <section className="bg-midnight-ink space-y-6 rounded-2xl p-8 shadow-sm">
                    <h2 className="border-pure-white text-pure-white border-l-4 pl-3 text-xl font-black">
                      DARK THEME
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
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
