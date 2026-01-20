import { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import Button from '../components/Button/Button';
import Input from '../components/Input/Input';
import Select from '../components/Select/Select';

const WarningBubble = ({ message, isVisible }: { message: string; isVisible: boolean }) => {
  if (!isVisible || !message) return null;
  return (
    <div className="animate-in fade-in slide-in-from-top-1 absolute top-[calc(100%+6px)] left-0 z-60 duration-200">
      <div className="flex flex-col items-start">
        <svg width="10" height="5" viewBox="0 0 10 5" className="ml-4 fill-current text-red-500/60">
          <path d="M5 0L10 5H0L5 0Z" />
        </svg>
        <div className="rounded-lg bg-red-500/60 px-3 py-2 text-[11px] font-bold whitespace-nowrap text-white shadow-xl backdrop-blur-lg">
          {message}
        </div>
      </div>
    </div>
  );
};

function SignupPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<'individual' | 'corporate'>('individual');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    phone: '',
    birthYear: '',
    birthMonth: '',
    birthDay: '',
    gender: '',
    experienceYears: '0',
    companyName: '',
    businessRegNo: '',
    homepageUrl: '',
    address: '',
    companySize: '',
  });

  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const years = Array.from({ length: 100 }, (_, i) => ({
    value: `${2026 - i}`,
    label: `${2026 - i}년`,
  }));
  const months = Array.from({ length: 12 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1}월` }));
  const days = Array.from({ length: 31 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1}일` }));

  const companySizeOptions = [
    { value: '', label: '선택' },
    { value: 'large', label: '대기업' },
    { value: 'affiliate', label: '대기업 계열사·자회사' },
    { value: 'small', label: '중소기업(300명이하)' },
    { value: 'medium', label: '중견기업(300명이상)' },
    { value: 'venture', label: '벤처기업' },
    { value: 'foreign_invested', label: '외국계(외국 투자기업)' },
    { value: 'foreign_corporate', label: '외국계(외국 법인기업)' },
    { value: 'public', label: '국내 공공기관·공기업' },
    { value: 'non_profit', label: '비영리단체·협회·교육재단' },
    { value: 'foreign_org', label: '외국 기관·비영리기구·단체' },
  ];

  const validateField = (field: string, value: string, currentFormData = formData) => {
    let error = '';

    if (field === 'email') {
      if (!value) error = '이메일을 입력해주세요.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = '올바른 이메일 형식이 아닙니다.';
    }

    if (field === 'password') {
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,16}$/;
      if (!value) error = '비밀번호를 입력해주세요.';
      else if (!passwordRegex.test(value)) error = '8~16자 영문, 숫자, 특수문자를 조합해주세요.';
    }

    if (field === 'passwordConfirm') {
      if (!value) error = '비밀번호 확인이 필요합니다.';
      else if (value !== currentFormData.password) error = '비밀번호가 일치하지 않습니다.';
    }

    if (field === 'password') {
      if (currentFormData.passwordConfirm && value !== currentFormData.passwordConfirm) {
        setErrors((prev) => ({ ...prev, passwordConfirm: '비밀번호가 일치하지 않습니다.' }));
      } else {
        setErrors((prev) => ({ ...prev, passwordConfirm: '' }));
      }
    }

    if (['name', 'phone', 'companyName', 'businessRegNo', 'address'].includes(field) && !value) {
      error = '필수 입력 항목입니다.';
    }

    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;

    if (field === 'phone') {
      const nums = value.replace(/[^0-9]/g, '');
      if (nums.length <= 3) processedValue = nums;
      else if (nums.length <= 7) processedValue = `${nums.slice(0, 3)}-${nums.slice(3, 7)}`;
      else processedValue = `${nums.slice(0, 3)}-${nums.slice(3, 7)}-${nums.slice(7, 11)}`;
    }

    if (field === 'businessRegNo') {
      const onlyNums = value.replace(/[^0-9]/g, '');
      if (onlyNums.length <= 3) processedValue = onlyNums;
      else if (onlyNums.length <= 5)
        processedValue = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 5)}`;
      else
        processedValue = `${onlyNums.slice(0, 3)}-${onlyNums.slice(3, 5)}-${onlyNums.slice(5, 10)}`;
    }

    const nextFormData = { ...formData, [field]: processedValue };
    setFormData(nextFormData);
    validateField(field, processedValue, nextFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const requiredFields =
      userType === 'individual'
        ? ['email', 'password', 'passwordConfirm', 'name', 'phone', 'birthYear', 'gender']
        : [
            'email',
            'password',
            'passwordConfirm',
            'name',
            'phone',
            'companyName',
            'businessRegNo',
            'address',
            'companySize',
          ];

    let firstError: string | null = null;
    const newErrors: Record<string, string> = { ...errors };

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = '필수 입력 항목입니다.';
        if (!firstError) firstError = field;
      }
    });

    setErrors(newErrors);

    if (firstError || Object.values(newErrors).some((msg) => msg)) {
      const errorField = firstError || Object.keys(newErrors).find((key) => newErrors[key] !== '');
      if (errorField) {
        setShakeField(errorField);
        fieldRefs.current[errorField]?.scrollIntoView({ behavior: 'smooth', block: 'center' });

        const inputElement = fieldRefs.current[errorField]?.querySelector(
          'input, select',
        ) as HTMLElement;
        inputElement?.focus();

        setTimeout(() => setShakeField(null), 500);
      }
      return;
    }

    try {
      setIsLoading(true);
      await axios.post('/api/auth/signup', { ...formData, role: userType });
      alert('회원가입이 완료되었습니다.');
      navigate('/login');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        setErrors((prev) => ({
          ...prev,
          submit: error.response?.data?.message || '회원가입 처리 중 오류가 발생했습니다.',
        }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-cloud-dancer relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
      <div className="mb-8 flex items-center gap-6">
        <Link
          to="/main"
          className="text-midnight-ink hover:text-slate-gray flex items-center gap-2 text-sm font-bold transition-colors"
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
          to="/login"
          className="text-midnight-ink hover:text-slate-gray flex items-center gap-2 text-sm font-bold transition-colors"
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
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
          </svg>
          로그인하러 가기
        </Link>
      </div>

      <div className="bg-pure-white w-full max-w-2xl rounded-[40px] p-12 shadow-2xl">
        <div className="text-midnight-ink decoration-soft-pebble mb-12 text-center text-4xl font-black tracking-tighter uppercase underline underline-offset-8">
          PORTMATCH
        </div>

        <div className="bg-cloud-dancer mb-12 flex rounded-2xl p-1.5 shadow-inner">
          {(['individual', 'corporate'] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setUserType(type)}
              className={`flex-1 rounded-xl py-3 text-sm font-extrabold transition-all duration-300 ${userType === type ? 'bg-pure-white text-midnight-ink scale-[1.02] shadow-md' : 'text-slate-gray hover:text-midnight-ink'}`}
            >
              {type === 'individual' ? '개인 회원' : '기업 회원'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <section className="space-y-8">
            <div className="border-soft-pebble border-b pb-2">
              <h2 className="text-midnight-ink text-xl font-black">기본 정보</h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
              {['email', 'password', 'passwordConfirm', 'name', 'phone'].map((field) => (
                <motion.div
                  key={field}
                  ref={(el) => {
                    fieldRefs.current[field] = el;
                  }}
                  animate={shakeField === field ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                  transition={{ duration: 0.4 }}
                  className={`relative ${field === 'email' ? 'md:col-span-2' : ''}`}
                >
                  <Input
                    label={`${field === 'email' ? '이메일' : field === 'password' ? '비밀번호' : field === 'passwordConfirm' ? '비밀번호 확인' : field === 'name' ? '성함 / 담당자명' : '연락처'} *`}
                    placeholder={
                      field === 'email'
                        ? 'example@example.com'
                        : field === 'password'
                          ? '8~16자 영문, 숫자, 특수문자'
                          : field === 'passwordConfirm'
                            ? '비밀번호 재입력'
                            : field === 'name'
                              ? '실명을 입력해주세요'
                              : '010-0000-0000'
                    }
                    type={field.includes('password') ? 'password' : 'text'}
                    value={formData[field as keyof typeof formData]}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    maxLength={field === 'phone' ? 13 : undefined}
                    disabled={isLoading}
                  />
                  <WarningBubble message={errors[field]} isVisible={!!errors[field]} />
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-8">
            <div className="border-soft-pebble border-b pb-2">
              <h2 className="text-midnight-ink text-xl font-black">
                {userType === 'individual' ? '개인 상세 정보' : '기업 상세 정보'}
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 md:grid-cols-2">
              {userType === 'individual' ? (
                <>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.birthYear = el;
                    }}
                    animate={shakeField === 'birthYear' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative md:col-span-2"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <Select
                        label="출생 연도 *"
                        options={[{ value: '', label: '선택' }, ...years]}
                        onChange={(e) => handleInputChange('birthYear', e.target.value)}
                      />
                      <Select
                        label="월 *"
                        options={[{ value: '', label: '선택' }, ...months]}
                        onChange={(e) => handleInputChange('birthMonth', e.target.value)}
                      />
                      <Select
                        label="일 *"
                        options={[{ value: '', label: '선택' }, ...days]}
                        onChange={(e) => handleInputChange('birthDay', e.target.value)}
                      />
                    </div>
                    <WarningBubble message={errors.birthYear} isVisible={!!errors.birthYear} />
                  </motion.div>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.gender = el;
                    }}
                    animate={shakeField === 'gender' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative"
                  >
                    <Select
                      label="성별 *"
                      options={[
                        { value: '', label: '선택' },
                        { value: 'male', label: '남성' },
                        { value: 'female', label: '여성' },
                      ]}
                      onChange={(e) => handleInputChange('gender', e.target.value)}
                    />
                    <WarningBubble message={errors.gender} isVisible={!!errors.gender} />
                  </motion.div>
                  <Input
                    label="총 경력 (년)"
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e) => handleInputChange('experienceYears', e.target.value)}
                    disabled={isLoading}
                  />
                </>
              ) : (
                <>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.companyName = el;
                    }}
                    animate={shakeField === 'companyName' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative md:col-span-2"
                  >
                    <Input
                      label="기업명 *"
                      placeholder="공식 기업명을 입력하세요"
                      value={formData.companyName}
                      onChange={(e) => handleInputChange('companyName', e.target.value)}
                      disabled={isLoading}
                    />
                    <WarningBubble message={errors.companyName} isVisible={!!errors.companyName} />
                  </motion.div>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.businessRegNo = el;
                    }}
                    animate={shakeField === 'businessRegNo' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative"
                  >
                    <Input
                      label="사업자 등록번호 *"
                      placeholder="000-00-00000"
                      value={formData.businessRegNo}
                      onChange={(e) => handleInputChange('businessRegNo', e.target.value)}
                      maxLength={12}
                      disabled={isLoading}
                    />
                    <WarningBubble
                      message={errors.businessRegNo}
                      isVisible={!!errors.businessRegNo}
                    />
                  </motion.div>
                  <Input
                    label="홈페이지 URL"
                    placeholder="https://..."
                    value={formData.homepageUrl}
                    onChange={(e) => handleInputChange('homepageUrl', e.target.value)}
                    disabled={isLoading}
                  />
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.address = el;
                    }}
                    animate={shakeField === 'address' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative md:col-span-2"
                  >
                    <Input
                      label="기업 주소 *"
                      placeholder="상세 주소를 입력하세요"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={isLoading}
                    />
                    <WarningBubble message={errors.address} isVisible={!!errors.address} />
                  </motion.div>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.companySize = el;
                    }}
                    animate={shakeField === 'companySize' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative md:col-span-2"
                  >
                    <Select
                      label="기업 형태 *"
                      options={companySizeOptions}
                      onChange={(e) => handleInputChange('companySize', e.target.value)}
                    />
                    <WarningBubble message={errors.companySize} isVisible={!!errors.companySize} />
                  </motion.div>
                </>
              )}
            </div>
          </section>

          <div className="mt-10 space-y-4">
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-red-100 bg-red-50 p-4 text-center text-sm font-bold text-red-500"
              >
                {errors.submit}
              </motion.div>
            )}
            <Button
              variant="dark"
              type="submit"
              disabled={isLoading}
              className={`w-full py-5 text-xl font-black shadow-lg transition-all active:scale-95 ${isLoading ? 'cursor-not-allowed opacity-50' : ''}`}
            >
              {isLoading ? '가입 중...' : '회원가입 완료'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;
