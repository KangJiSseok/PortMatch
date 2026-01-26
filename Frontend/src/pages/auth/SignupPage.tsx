import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import { useSignup } from '../../hooks/useAuth';
import type { UserRole } from '../../types/auth';

const WarningBubble = ({ message, isVisible }: { message: string; isVisible: boolean }) => {
  if (!isVisible || !message) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-[calc(100%+4px)] left-4 z-50"
    >
      <div className="flex flex-col items-start">
        <div className="ml-4 h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-red-500/80" />
        <div className="rounded-lg bg-red-500/80 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-md">
          {message}
        </div>
      </div>
    </motion.div>
  );
};

function SignupPage() {
  const [userType, setUserType] = useState<UserRole>('APPLICANT');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);

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
    businessNumber: '',
    homepageUrl: '',
    address: '',
    companySize: '',
  });

  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const { mutate: signupMutate, isPending: isLoading } = useSignup();

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

    if (['name', 'phone', 'companyName', 'businessNumber', 'address'].includes(field) && !value) {
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

    if (field === 'businessNumber') {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const requiredFields =
      userType === 'APPLICANT'
        ? ['email', 'password', 'passwordConfirm', 'name', 'phone', 'birthYear', 'gender']
        : [
            'email',
            'password',
            'passwordConfirm',
            'name',
            'phone',
            'companyName',
            'businessNumber',
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

    if (userType === 'APPLICANT') {
      signupMutate(
        {
          type: 'APPLICANT',
          data: {
            email: formData.email,
            password: formData.password,
            name: formData.name,
            phone: formData.phone.replace(/-/g, ''),
            birthYear: formData.birthYear,
            birthMonth: formData.birthMonth.padStart(2, '0'),
            birthDay: formData.birthDay.padStart(2, '0'),
            gender: formData.gender.toUpperCase(),
            experienceYears: Number(formData.experienceYears),
          },
        },
        {
          onError: (error: unknown) => {
            if (axios.isAxiosError(error)) {
              const detailedError = error.response?.data?.data?.errors?.[0]?.reason;
              setErrors((prev) => ({
                ...prev,
                submit:
                  detailedError ||
                  error.response?.data?.message ||
                  '회원가입 처리 중 오류가 발생했습니다.',
              }));
            }
          },
        },
      );
    } else {
      signupMutate(
        {
          type: 'COMPANY',
          data: {
            email: formData.email,
            password: formData.password,
            companyName: formData.companyName,
            businessNumber: formData.businessNumber.replace(/-/g, ''),
            managerName: formData.name,
            managerPhone: formData.phone.replace(/-/g, ''),
            address: formData.address,
            companySize: formData.companySize,
            homepageUrl: formData.homepageUrl || null,
          },
        },
        {
          onError: (error: unknown) => {
            if (axios.isAxiosError(error)) {
              const detailedError = error.response?.data?.data?.errors?.[0]?.reason;
              setErrors((prev) => ({
                ...prev,
                submit:
                  detailedError ||
                  error.response?.data?.message ||
                  '회원가입 처리 중 오류가 발생했습니다.',
              }));
            }
          },
        },
      );
    }
  };

  return (
    <div className="bg-pure-white relative flex min-h-screen min-w-[1200px] flex-col items-center justify-center overflow-x-auto py-12">
      <nav className="mb-10 flex shrink-0 items-center gap-10">
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
          to="/login"
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
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M13.8 12H3" />
            </svg>
          </div>
          로그인하러 가기
        </Link>
      </nav>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-pure-white w-[720px] shrink-0 rounded-[48px] border border-gray-100 px-16 py-14 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)]"
      >
        <div className="mb-12 text-center">
          <span className="text-point-blue text-[12px] font-black tracking-[0.4em] uppercase opacity-50">
            Join the Network
          </span>
          <h2 className="text-midnight-ink mt-3 text-4xl font-black tracking-tighter uppercase">
            PORTMATCH
          </h2>
          <div className="bg-point-blue mx-auto mt-4 h-1.5 w-10 rounded-full" />
        </div>

        <div className="mb-12 flex rounded-[20px] bg-gray-50 p-1.5">
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

        <form onSubmit={handleSubmit} className="space-y-14">
          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <h3 className="text-midnight-ink text-lg font-black tracking-tight">기본 정보</h3>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              {['email', 'password', 'passwordConfirm', 'name', 'phone'].map((field) => (
                <motion.div
                  key={field}
                  ref={(el) => {
                    fieldRefs.current[field] = el;
                  }}
                  animate={shakeField === field ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                  className={`relative ${field === 'email' ? 'col-span-2' : ''}`}
                >
                  <Input
                    label={`${field === 'email' ? '이메일 주소' : field === 'password' ? '비밀번호' : field === 'passwordConfirm' ? '비밀번호 확인' : field === 'name' ? '성함 / 담당자명' : '연락처'} *`}
                    placeholder={
                      field === 'email'
                        ? 'example@portmatch.com'
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange(field, e.target.value)
                    }
                    maxLength={field === 'phone' ? 13 : undefined}
                    disabled={isLoading}
                  />
                  <WarningBubble message={errors[field]} isVisible={!!errors[field]} />
                </motion.div>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            <div className="flex items-center gap-4">
              <h3 className="text-midnight-ink text-lg font-black tracking-tight">
                {userType === 'APPLICANT' ? '개인 상세 정보' : '기업 상세 정보'}
              </h3>
              <div className="h-px flex-1 bg-gray-100" />
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-10">
              {userType === 'APPLICANT' ? (
                <>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.birthYear = el;
                    }}
                    animate={shakeField === 'birthYear' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative col-span-2"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <Select
                        label="출생 연도 *"
                        options={[{ value: '', label: '선택' }, ...years]}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleInputChange('birthYear', e.target.value)
                        }
                      />
                      <Select
                        label="월 *"
                        options={[{ value: '', label: '선택' }, ...months]}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleInputChange('birthMonth', e.target.value)
                        }
                      />
                      <Select
                        label="일 *"
                        options={[{ value: '', label: '선택' }, ...days]}
                        onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                          handleInputChange('birthDay', e.target.value)
                        }
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
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleInputChange('gender', e.target.value)
                      }
                    />
                    <WarningBubble message={errors.gender} isVisible={!!errors.gender} />
                  </motion.div>
                  <Input
                    label="총 경력 (년)"
                    type="number"
                    min="0"
                    value={formData.experienceYears}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('experienceYears', e.target.value)
                    }
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
                    className="relative col-span-2"
                  >
                    <Input
                      label="기업명 *"
                      placeholder="공식 기업명을 입력하세요"
                      value={formData.companyName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('companyName', e.target.value)
                      }
                      disabled={isLoading}
                    />
                    <WarningBubble message={errors.companyName} isVisible={!!errors.companyName} />
                  </motion.div>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.businessNumber = el;
                    }}
                    animate={shakeField === 'businessNumber' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative"
                  >
                    <Input
                      label="사업자 등록번호 *"
                      placeholder="000-00-00000"
                      value={formData.businessNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('businessNumber', e.target.value)
                      }
                      maxLength={12}
                      disabled={isLoading}
                    />
                    <WarningBubble
                      message={errors.businessNumber}
                      isVisible={!!errors.businessNumber}
                    />
                  </motion.div>
                  <Input
                    label="홈페이지 URL"
                    placeholder="https://..."
                    value={formData.homepageUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      handleInputChange('homepageUrl', e.target.value)
                    }
                    disabled={isLoading}
                  />
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.address = el;
                    }}
                    animate={shakeField === 'address' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative col-span-2"
                  >
                    <Input
                      label="기업 주소 *"
                      placeholder="상세 주소를 입력하세요"
                      value={formData.address}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange('address', e.target.value)
                      }
                      disabled={isLoading}
                    />
                    <WarningBubble message={errors.address} isVisible={!!errors.address} />
                  </motion.div>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.companySize = el;
                    }}
                    animate={shakeField === 'companySize' ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                    className="relative col-span-2"
                  >
                    <Select
                      label="기업 형태 *"
                      options={companySizeOptions}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                        handleInputChange('companySize', e.target.value)
                      }
                    />
                    <WarningBubble message={errors.companySize} isVisible={!!errors.companySize} />
                  </motion.div>
                </>
              )}
            </div>
          </section>

          <div className="pt-4">
            <AnimatePresence>
              {errors.submit && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="mb-6 rounded-2xl border border-red-100 bg-red-50 py-4 text-center text-sm font-black text-red-500"
                >
                  {errors.submit}
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="blue"
              type="submit"
              disabled={isLoading}
              className={`shadow-point-blue/20 w-full rounded-[20px] py-5 text-xl font-black shadow-2xl transition-all active:scale-[0.99] ${isLoading ? 'opacity-70' : ''}`}
            >
              {isLoading ? '계정 생성 중...' : '회원가입 완료하기'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default SignupPage;
