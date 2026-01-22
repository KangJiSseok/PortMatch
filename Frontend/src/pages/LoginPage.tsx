import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import Checkbox from '../components/Checkbox/Checkbox';
import { useLogin } from '../hooks/useAuth';
import type { UserRole } from '../types/auth';

const WarningBubble = ({ message, isVisible }: { message: string; isVisible: boolean }) => {
  if (!isVisible || !message) return null;
  return (
    <div className="animate-in fade-in slide-in-from-top-1 absolute top-[calc(100%+4px)] left-0 z-60 duration-200">
      <div className="flex flex-col items-start">
        <svg width="10" height="5" viewBox="0 0 10 5" className="ml-4 fill-current text-red-500/50">
          <path d="M5 0L10 5H0L5 0Z" />
        </svg>
        <div className="rounded-lg bg-red-500/50 px-3 py-1.5 text-[11px] font-bold whitespace-nowrap text-white shadow-lg backdrop-blur-md">
          {message}
        </div>
      </div>
    </div>
  );
};

function LoginPage() {
  const [userType, setUserType] = useState<UserRole>('APPLICANT');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);

  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { mutate: loginMutate, isPending: isLoading } = useLogin();

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const newErrors: Record<string, string> = {};
    let firstError: string | null = null;

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
      if (!firstError) firstError = 'email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
      if (!firstError) firstError = 'email';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
      if (!firstError) firstError = 'password';
    }

    setErrors(newErrors);

    if (firstError) {
      setShakeField(firstError);
      const targetElement = fieldRefs.current[firstError];
      if (targetElement) {
        targetElement.querySelector('input')?.focus();
      }
      setTimeout(() => setShakeField(null), 500);
      return;
    }

    loginMutate(
      {
        email: formData.email,
        password: formData.password,
        expectedRole: userType,
      },
      {
        onError: (error: unknown) => {
          if (axios.isAxiosError(error)) {
            const serverMessage = error.response?.data?.message;

            if (error.response?.status === 401) {
              setErrors({ auth: '이메일 또는 비밀번호가 일치하지 않습니다.' });
            } else if (serverMessage) {
              setErrors({ auth: serverMessage });
            } else {
              setErrors({ auth: '서버 연결에 실패했습니다. 잠시 후 다시 시도해주세요.' });
            }
          } else {
            setErrors({ auth: '예상치 못한 오류가 발생했습니다.' });
          }
        },
      },
    );
  };

  return (
    <div className="bg-cloud-dancer relative flex min-h-screen min-w-5xl flex-col items-center justify-center px-6 py-12">
      <div className="mb-6 flex items-center gap-6">
        <Link
          to="/main"
          className="text-midnight-ink hover:text-slate-gray flex items-center gap-2 text-sm font-bold whitespace-nowrap transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          메인으로 이동
        </Link>
        <div className="bg-soft-pebble h-3 w-px" />
        <Link
          to="/signup"
          className="text-midnight-ink hover:text-slate-gray flex items-center gap-2 text-sm font-bold whitespace-nowrap transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          회원가입 하러가기
        </Link>
      </div>

      <div className="bg-pure-white w-lg rounded-3xl p-10 shadow-xl">
        <div className="text-midnight-ink decoration-soft-pebble mb-10 text-center text-3xl font-black tracking-tighter whitespace-nowrap uppercase underline underline-offset-8">
          PORTMATCH
        </div>

        <div className="bg-cloud-dancer mb-10 flex rounded-xl p-1">
          {(
            [
              { id: 'APPLICANT', label: '개인 로그인' },
              { id: 'COMPANY', label: '기업 로그인' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setUserType(tab.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-bold whitespace-nowrap transition-all ${userType === tab.id ? 'bg-pure-white text-midnight-ink shadow-sm' : 'text-slate-gray'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-12">
          <div className="space-y-12">
            <motion.div
              ref={(el) => {
                fieldRefs.current.email = el;
              }}
              animate={shakeField === 'email' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <Input
                label="이메일 *"
                type="email"
                placeholder="example@portmatch.com"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('email', e.target.value)
                }
                disabled={isLoading}
              />
              <WarningBubble message={errors.email} isVisible={!!errors.email} />
            </motion.div>

            <motion.div
              ref={(el) => {
                fieldRefs.current.password = el;
              }}
              animate={shakeField === 'password' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <Input
                label="비밀번호 *"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('password', e.target.value)
                }
                disabled={isLoading}
              />
              <WarningBubble message={errors.password} isVisible={!!errors.password} />
            </motion.div>
          </div>

          <div className="flex items-center justify-between">
            <Checkbox
              label="로그인 상태 유지"
              checked={rememberMe}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
            />
            <button
              type="button"
              className="text-slate-gray text-sm font-medium whitespace-nowrap hover:underline"
            >
              비밀번호 찾기
            </button>
          </div>

          <div className="space-y-4">
            {errors.auth && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-red-50 px-2 py-3 text-center text-sm font-bold whitespace-nowrap text-red-500"
              >
                {errors.auth}
              </motion.div>
            )}
            <Button
              variant="dark"
              type="submit"
              disabled={isLoading}
              className={`shadow-midnight-ink/20 w-full shrink-0 py-5 text-xl font-black shadow-lg ${isLoading ? 'opacity-50' : ''}`}
            >
              {isLoading
                ? '로그인 중...'
                : userType === 'APPLICANT'
                  ? '개인 로그인'
                  : '기업 로그인'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
