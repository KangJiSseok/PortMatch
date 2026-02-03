import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import Select from '../../components/Select/Select';
import WarningBubble from '../../components/WarningBubble/WarningBubble';
import { useSignup } from '../../hooks/useAuth';
import { auth } from '../../lib/firebase';
import type { UserRole, CompanySignupRequest } from '../../types/auth';

interface CompanyApiData {
  cid: string;
  corpName: string;
  totPsncnt: string;
  busiSize: string;
  yrSalesAmt: string;
  corpAddr: string;
  homePg: string;
  busiCont: string;
  logo: string;
}

const YEARS = Array.from({ length: 100 }, (_, i) => ({
  value: `${2026 - i}`,
  label: `${2026 - i}년`,
}));
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1}월` }));
const DAYS = Array.from({ length: 31 }, (_, i) => ({ value: `${i + 1}`, label: `${i + 1}일` }));

function SignupPage() {
  const navigate = useNavigate();
  const [userType, setUserType] = useState<UserRole>('APPLICANT');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shakeField, setShakeField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const [allCompanies, setAllCompanies] = useState<CompanyApiData[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<CompanyApiData[]>([]);
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<CompanyApiData | null>(null);

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
    industry: '',
    employeeCount: '',
    introduction: '',
  });

  const fieldRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { mutate: signupMutate, isPending: isMutationLoading } = useSignup();

  const isLoading = isSubmitting || isMutationLoading;
  const isCompanySelected = selectedCompany !== null;

  useEffect(() => {
    if (userType === 'COMPANY') {
      const fetchCompanies = async () => {
        try {
          const response = await axios.get('/api/companies');
          if (response.data && Array.isArray(response.data.data)) {
            setAllCompanies(response.data.data);
          }
        } catch (error) {
          console.error('Failed to fetch companies:', error);
        }
      };
      fetchCompanies();
    }
  }, [userType]);

  const handleCompanyNameChange = (value: string) => {
    setFormData((prev) => {
      if (isCompanySelected && value !== selectedCompany.corpName) {
        return {
          ...prev,
          companyName: value,
          address: '',
          industry: '',
          employeeCount: '',
          homepageUrl: '',
          introduction: '',
        };
      }
      return { ...prev, companyName: value };
    });

    if (isCompanySelected && value !== selectedCompany.corpName) {
      setSelectedCompany(null);
    }

    if (value.trim()) {
      const filtered = allCompanies.filter((company) =>
        company.corpName.toLowerCase().includes(value.toLowerCase()),
      );
      setFilteredCompanies(filtered);
      setShowCompanyDropdown(true);
    } else {
      setShowCompanyDropdown(false);
    }
  };

  const handleSelectCompany = (company: CompanyApiData) => {
    setFormData((prev) => ({
      ...prev,
      companyName: company.corpName,
      address: company.corpAddr || '',
      industry: company.busiSize || '',
      employeeCount: company.totPsncnt || '',
      homepageUrl: company.homePg || '',
      introduction: company.busiCont || '',
    }));
    setSelectedCompany(company);
    setShowCompanyDropdown(false);
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.companyName;
      delete newErrors.address;
      return newErrors;
    });
  };

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

      const passwordConfirmError =
        currentFormData.passwordConfirm && value !== currentFormData.passwordConfirm
          ? '비밀번호가 일치하지 않습니다.'
          : '';

      setErrors((prev) => ({
        ...prev,
        password: error,
        passwordConfirm: passwordConfirmError,
      }));
      return;
    }

    if (field === 'passwordConfirm') {
      if (!value) error = '비밀번호 확인이 필요합니다.';
      else if (value !== currentFormData.password) error = '비밀번호가 일치하지 않습니다.';
    }

    if (['name', 'phone', 'companyName', 'businessNumber'].includes(field) && !value) {
      error = '필수 입력 항목입니다.';
    }

    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.submit;
      return { ...newErrors, [field]: error };
    });
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

  const handleRollback = async (error: unknown) => {
    const user = auth.currentUser;
    if (user) {
      try {
        await deleteUser(user);
      } catch (deleteErr) {
        console.error('롤백 실패:', deleteErr);
      }
    }
    handleApiError(error);
  };

  const handleSignupSuccess = () => {
    setIsSubmitting(false);
    setShowSuccessToast(true);
    setTimeout(() => {
      navigate('/login');
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
          ];

    const newErrors: Record<string, string> = { ...errors };
    delete newErrors.submit;
    let firstErrorField: string | null = null;

    requiredFields.forEach((field) => {
      if (!formData[field as keyof typeof formData]) {
        newErrors[field] = '필수 입력 항목입니다.';
        if (!firstErrorField) firstErrorField = field;
      }
    });

    if (firstErrorField || Object.values(newErrors).some((msg) => msg)) {
      setErrors(newErrors);
      const errorKey = firstErrorField || Object.keys(newErrors).find((k) => newErrors[k]);
      if (errorKey) {
        setShakeField(errorKey);
        fieldRefs.current[errorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        (
          fieldRefs.current[errorKey]?.querySelector('input, select, textarea') as HTMLElement
        )?.focus();
        setTimeout(() => setShakeField(null), 500);
      }
      return;
    }

    try {
      setIsSubmitting(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password,
      );
      const uid = userCredential.user.uid;
      const commonData = { email: formData.email, password: formData.password, uid };
      if (userType === 'APPLICANT') {
        signupMutate(
          {
            type: 'APPLICANT',
            data: {
              ...commonData,
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
            onSuccess: handleSignupSuccess,
            onError: async (err) => {
              await handleRollback(err);
              setIsSubmitting(false);
            },
          },
        );
      } else {
        let targetCid = selectedCompany ? selectedCompany.cid : null;

        if (!selectedCompany) {
          try {
            const newCompanyResponse = await axios.post('/api/companies', {
              cid: formData.businessNumber.replace(/-/g, ''),
              corpName: formData.companyName,
              totPsncnt: formData.employeeCount,
              corpAddr: formData.address,
              busiSize: formData.industry,
              homePg: formData.homepageUrl,
              busiCont: formData.introduction,
            });

            if (newCompanyResponse.data && newCompanyResponse.data.data) {
              targetCid = newCompanyResponse.data.data;
            } else {
              targetCid = formData.businessNumber.replace(/-/g, '');
            }
          } catch (apiErr) {
            console.error('Company creation failed', apiErr);
            await deleteUser(userCredential.user);
            handleApiError(apiErr);
            setIsSubmitting(false);
            return;
          }
        }

        const companyData = {
          ...commonData,
          companyName: formData.companyName,
          businessNumber: formData.businessNumber.replace(/-/g, ''),
          managerName: formData.name,
          managerPhone: formData.phone.replace(/-/g, ''),
          address: formData.address,
          busiSize: formData.industry,
          employeeCount: formData.employeeCount ? Number(formData.employeeCount) : 0,
          busiCont: formData.introduction,
          homepageUrl: formData.homepageUrl || null,
          cid: targetCid,
        };

        signupMutate(
          {
            type: 'COMPANY',
            data: companyData as unknown as CompanySignupRequest,
          },
          {
            onSuccess: handleSignupSuccess,
            onError: async (err) => {
              await handleRollback(err);
              setIsSubmitting(false);
            },
          },
        );
      }
    } catch (err: unknown) {
      setIsSubmitting(false);
      if (err instanceof FirebaseError) {
        let message = '회원가입 처리 중 오류가 발생했습니다.';
        if (err.code === 'auth/email-already-in-use') message = '이미 사용 중인 이메일입니다.';
        setErrors((prev) => ({ ...prev, submit: message }));
      } else {
        handleApiError(err);
      }
    }
  };

  const handleApiError = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const detailedError = error.response?.data?.data?.errors?.[0]?.reason;
      setErrors((prev) => ({
        ...prev,
        submit:
          detailedError || error.response?.data?.message || '회원가입 처리 중 오류가 발생했습니다.',
      }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.company-search-container')) {
        setShowCompanyDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="bg-pure-white relative flex min-h-screen min-w-300 flex-col items-center justify-center overflow-x-auto py-12">
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
        animate={showSuccessToast ? { opacity: 0.5, scale: 0.98 } : { opacity: 1, y: 0, scale: 1 }}
        className={`bg-pure-white w-180 shrink-0 rounded-[48px] border border-gray-100 px-16 py-14 shadow-lg ${showSuccessToast ? 'pointer-events-none' : ''}`}
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
          {(['APPLICANT', 'COMPANY'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setUserType(id)}
              className={`relative flex-1 py-3.5 text-[15px] font-black transition-all ${userType === id ? 'text-point-blue' : 'text-slate-gray hover:text-midnight-ink'}`}
            >
              {userType === id && (
                <motion.div
                  layoutId="activeTab"
                  className="bg-pure-white absolute inset-0 rounded-[15px] shadow-sm"
                />
              )}
              <span className="relative z-10">
                {id === 'APPLICANT' ? '개인 회원' : '기업 회원'}
              </span>
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
                  animate={shakeField === field ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
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
                    error={errors[field] ? ' ' : undefined}
                  />
                  <WarningBubble message={errors[field]} isVisible={Boolean(errors[field])} />
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
                    animate={
                      shakeField === 'birthYear' ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }
                    }
                    className="relative col-span-2"
                  >
                    <div className="grid grid-cols-3 gap-4">
                      <Select
                        label="출생 연도 *"
                        options={[{ value: '', label: '선택' }, ...YEARS]}
                        onChange={(e) => handleInputChange('birthYear', e.target.value)}
                        error={!!errors.birthYear}
                      />
                      <Select
                        label="월 *"
                        options={[{ value: '', label: '선택' }, ...MONTHS]}
                        onChange={(e) => handleInputChange('birthMonth', e.target.value)}
                        error={!!errors.birthYear}
                      />
                      <Select
                        label="일 *"
                        options={[{ value: '', label: '선택' }, ...DAYS]}
                        onChange={(e) => handleInputChange('birthDay', e.target.value)}
                        error={!!errors.birthYear}
                      />
                    </div>
                    <WarningBubble
                      message={errors.birthYear}
                      isVisible={Boolean(errors.birthYear)}
                    />
                  </motion.div>
                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.gender = el;
                    }}
                    animate={shakeField === 'gender' ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }}
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
                      error={!!errors.gender}
                    />
                    <WarningBubble message={errors.gender} isVisible={Boolean(errors.gender)} />
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
                    animate={
                      shakeField === 'companyName' ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }
                    }
                    className="company-search-container relative col-span-2"
                  >
                    <Input
                      label="기업명 *"
                      placeholder="기업명을 입력하세요 (기존 기업 검색 가능)"
                      value={formData.companyName}
                      onChange={(e) => handleCompanyNameChange(e.target.value)}
                      disabled={isLoading}
                      error={errors.companyName ? ' ' : undefined}
                    />
                    <AnimatePresence>
                      {showCompanyDropdown && filteredCompanies.length > 0 && (
                        <motion.ul
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute top-full right-0 left-0 z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-gray-100 bg-white py-2 shadow-xl"
                        >
                          {filteredCompanies.map((company) => (
                            <li
                              key={company.cid}
                              onClick={() => handleSelectCompany(company)}
                              className="cursor-pointer px-4 py-3 hover:bg-gray-50"
                            >
                              <div className="font-bold text-gray-900">{company.corpName}</div>
                              <div className="text-sm text-gray-500">
                                {company.cid} | {company.corpAddr}
                              </div>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                    <WarningBubble
                      message={errors.companyName}
                      isVisible={Boolean(errors.companyName)}
                    />
                  </motion.div>

                  <div className="col-span-2 grid grid-cols-2 gap-8">
                    <motion.div
                      ref={(el) => {
                        fieldRefs.current.businessNumber = el;
                      }}
                      animate={
                        shakeField === 'businessNumber' ? { x: [0, -10, 10, -10, 10, 0] } : { x: 0 }
                      }
                      className="relative"
                    >
                      <Input
                        label="사업자 등록번호 *"
                        placeholder="000-00-00000"
                        value={formData.businessNumber}
                        onChange={(e) => handleInputChange('businessNumber', e.target.value)}
                        maxLength={12}
                        disabled={isLoading}
                        error={errors.businessNumber ? ' ' : undefined}
                      />
                      <WarningBubble
                        message={errors.businessNumber}
                        isVisible={Boolean(errors.businessNumber)}
                      />
                    </motion.div>
                    <Input
                      label="홈페이지 URL"
                      placeholder="https://..."
                      value={formData.homepageUrl}
                      onChange={(e) => handleInputChange('homepageUrl', e.target.value)}
                      disabled={isLoading || isCompanySelected}
                    />
                  </div>

                  <motion.div
                    ref={(el) => {
                      fieldRefs.current.address = el;
                    }}
                    className="relative col-span-2"
                  >
                    <Input
                      label="기업 위치 (주소)"
                      placeholder="상세 주소를 입력하세요"
                      value={formData.address}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      disabled={isLoading || isCompanySelected}
                    />
                  </motion.div>

                  <div className="relative">
                    <Input
                      label="산업군"
                      placeholder="예: IT/웹서비스"
                      value={formData.industry}
                      onChange={(e) => handleInputChange('industry', e.target.value)}
                      disabled={isLoading || isCompanySelected}
                    />
                  </div>

                  <div className="relative">
                    <Input
                      label="사원수"
                      type="text"
                      placeholder="예: 50명 이하, 100명 등"
                      value={formData.employeeCount}
                      onChange={(e) => handleInputChange('employeeCount', e.target.value)}
                      disabled={isLoading || isCompanySelected}
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="mb-2 block text-sm font-bold text-gray-700">기업 소개</label>
                    <textarea
                      value={formData.introduction}
                      onChange={(e) => handleInputChange('introduction', e.target.value)}
                      placeholder="기업에 대한 간단한 소개를 입력해주세요."
                      disabled={isLoading || isCompanySelected}
                      className={`focus:ring-point-blue/20 w-full rounded-[15px] border px-5 py-4 text-[15px] font-medium transition-all outline-none focus:ring-2 ${
                        isCompanySelected
                          ? 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-500'
                          : 'focus:border-point-blue border-gray-200 bg-gray-50 text-gray-900 placeholder:text-gray-400 focus:bg-white'
                      }`}
                      rows={4}
                    />
                  </div>
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

      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-10 z-50 flex items-center gap-3 rounded-2xl bg-gray-900 px-8 py-4 text-white shadow-2xl"
          >
            <div className="bg-point-blue flex h-6 w-6 items-center justify-center rounded-full">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="font-bold">
              회원가입이 완료되었습니다! 로그인 페이지로 이동합니다.
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SignupPage;
