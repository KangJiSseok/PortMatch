import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth as firebaseAuth } from '../../lib/firebase';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Checkbox from '../../components/Checkbox/Checkbox';
import WarningBubble from '../../components/WarningBubble/WarningBubble';
import { useLogin } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';

function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mutate: loginMutate, isPending: isLoading } = useLogin();

  const [userType, setUserType] = useState<UserRole>(
    (location.state?.userType as UserRole) || 'APPLICANT',
  );
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);

  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const newErrors: Record<string, string> = {};
    let firstError: string | null = null;

    if (!formData.email) {
      newErrors.email = '이메일을 입력해주세요.';
      firstError = 'email';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
      firstError = 'email';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
      if (!firstError) firstError = 'password';
    }

    setErrors(newErrors);

    if (firstError) {
      setShakeField(firstError);
      fieldRefs.current[firstError]?.querySelector('input')?.focus();
      setTimeout(() => setShakeField(null), 500);
      return;
    }

    try {
      await signInWithEmailAndPassword(firebaseAuth, formData.email, formData.password);

      loginMutate(
        {
          email: formData.email,
          password: formData.password,
          expectedRole: userType,
          rememberMe,
        },
        {
          onSuccess: () => navigate('/main'),
          onError: (error: unknown) => {
            if (axios.isAxiosError(error)) {
              const serverMessage = error.response?.data?.message;
              setErrors({
                auth:
                  error.response?.status === 401
                    ? '이메일 또는 비밀번호가 일치하지 않습니다.'
                    : serverMessage || '서버 연결에 실패했습니다.',
              });
            } else {
              setErrors({ auth: '예상치 못한 오류가 발생했습니다.' });
            }
          },
        },
      );
    } catch (err: unknown) {
      if (err instanceof FirebaseError) {
        let message = '로그인 처리 중 오류가 발생했습니다.';
        if (
          err.code === 'auth/invalid-credential' ||
          err.code === 'auth/user-not-found' ||
          err.code === 'auth/wrong-password'
        ) {
          message = '이메일 또는 비밀번호가 일치하지 않습니다.';
        } else if (err.code === 'auth/too-many-requests') {
          message = '너무 많은 로그인 시도가 있었습니다. 잠시 후 다시 시도해주세요.';
        }
        setErrors({ auth: message });
      } else {
        setErrors({ auth: '예상치 못한 오류가 발생했습니다.' });
      }
    }
  };

  return (
    <div className="bg-pure-white relative flex min-h-screen min-w-300 flex-col items-center justify-center overflow-x-auto py-8">
      <nav className="mb-8 flex shrink-0 items-center gap-10">
        <Link
          to="/main"
          className="text-midnight-ink hover:text-point-blue group flex items-center gap-3 text-[14px] font-black transition-all"
        >
          <div className="bg-cloud-dancer group-hover:bg-point-blue/10 flex h-9 w-9 items-center justify-center rounded-xl transition-colors">
            <svg
              width="20"
              height="20"
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
          </div>
          메인으로 이동
        </Link>
        <div className="h-4 w-[1.5px] bg-gray-200" />
        <Link
          to="/signup"
          className="text-midnight-ink hover:text-point-blue group flex items-center gap-3 text-[14px] font-black transition-all"
        >
          <div className="bg-cloud-dancer group-hover:bg-point-blue/10 flex h-9 w-9 items-center justify-center rounded-xl transition-colors">
            <svg
              width="20"
              height="20"
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
          </div>
          회원가입
        </Link>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-pure-white w-160 shrink-0 rounded-[48px] border border-gray-100 px-20 py-12 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]"
      >
        <div className="mb-10 text-center">
          <span className="text-point-blue text-[12px] font-black tracking-[0.4em] uppercase opacity-50">
            Identity Gateway
          </span>
          <h2 className="text-midnight-ink mt-3 text-4xl font-black tracking-tighter uppercase">
            PORTMATCH
          </h2>
          <div className="bg-point-blue mx-auto mt-4 h-1.5 w-10 rounded-full" />
        </div>

        <div className="mb-10 flex rounded-[20px] bg-gray-50 p-1.5">
          {(
            [
              { id: 'APPLICANT', label: '개인 회원' },
              { id: 'COMPANY', label: '기업 회원' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setUserType(tab.id)}
              className={`relative flex-1 py-3.5 text-[15px] font-black transition-all ${userType === tab.id ? 'text-point-blue' : 'text-slate-gray hover:text-midnight-ink'}`}
            >
              {userType === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="bg-pure-white absolute inset-0 rounded-[15px] shadow-sm"
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-8">
            <motion.div
              ref={(el) => {
                fieldRefs.current.email = el;
              }}
              animate={shakeField === 'email' ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
              className="relative"
            >
              <Input
                label="이메일 주소"
                type="email"
                placeholder="example@portmatch.com"
                value={formData.email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('email', e.target.value)
                }
                disabled={isLoading}
                error={errors.email ? ' ' : undefined}
              />
              <WarningBubble message={errors.email} isVisible={!!errors.email} />
            </motion.div>

            <motion.div
              ref={(el) => {
                fieldRefs.current.password = el;
              }}
              animate={shakeField === 'password' ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
              className="relative"
            >
              <Input
                label="비밀번호"
                type="password"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleInputChange('password', e.target.value)
                }
                disabled={isLoading}
                error={errors.password ? ' ' : undefined}
              />
              <WarningBubble message={errors.password} isVisible={!!errors.password} />
            </motion.div>
          </div>

          <div className="flex items-center justify-between px-2">
            <Checkbox
              label="로그인 상태 유지"
              checked={rememberMe}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
            />
          </div>

          <div className="pt-2">
            <AnimatePresence>
              {errors.auth && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="mb-6 rounded-2xl border border-red-100 bg-red-50 py-4 text-center text-sm font-black text-red-500"
                >
                  {errors.auth}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="blue"
              type="submit"
              disabled={isLoading}
              className={`shadow-point-blue/20 w-full rounded-[20px] py-5 text-xl font-black shadow-2xl transition-all active:scale-[0.99] ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading
                ? '인증 진행 중...'
                : `${userType === 'APPLICANT' ? '개인' : '기업'} 로그인 시작하기`}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default LoginPage;