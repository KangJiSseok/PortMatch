import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate, useBlocker } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Button from '../../components/Button/Button';

type CompanyProject = {
  id: number;
  title: string;
  period: string;
  description: string;
};

type CompanyProfile = {
  id: number;
  name: string;
  logo: string; // URL or dataURL(base64)
  description: string;
  location: string;

  industry: string; // select or 기타 직접 입력
  employeeCount: string; // 숫자 (명은 UI에서 밖으로)
  revenue: string; // ✅ 천만원 단위 숫자 (천만원은 UI에서 밖으로)

  website: string;
  enterpriseType: string;

  businessNumber?: string | null; // ✅ 10자리 유효성(값 있으면)
  contactEmail?: string | null;
  contactPhone?: string | null;

  projects?: CompanyProject[];
};

type FormErrors = Partial<Record<keyof CompanyProfile, string>> & {
  projects?: string;
};

const STORAGE_KEY = 'demo_company_profile_v2';

const INDUSTRY_OPTIONS = [
  'IT / 소프트웨어',
  '게임',
  '금융 / 핀테크',
  '제조 / 생산',
  '교육 / 에듀테크',
  '의료 / 헬스케어',
  '커머스 / 이커머스',
  '미디어 / 콘텐츠',
  '모빌리티',
  '공공 / 기관',
  '기타',
] as const;

const ENTERPRISE_OPTIONS = [
  '대기업',
  '중견기업',
  '중소기업',
  '스타트업',
  '공기업/공공기관',
  '외국계',
] as const;

const DUMMY_COMPANY: CompanyProfile = {
  id: 1,
  name: '넥스트웨이브 테크놀로지스',
  logo: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?q=80&w=200&auto=format&fit=crop',
  description:
    '넥스트웨이브 테크놀로지스는 차세대 AI 기반 데이터 분석 솔루션을 제공하는 혁신 기업입니다. 클라우드 네이티브 아키텍처를 기반으로 확장성 높은 서비스를 개발합니다.',
  location: '서울 강남구 테헤란로 518',
  industry: 'IT / 소프트웨어',
  employeeCount: '150',
  revenue: '3200', // ✅ 천만원 단위 (3200 * 1천만원 = 320억)
  website: 'http://www.nwave.kr/main.html',
  enterpriseType: '중소기업',
  businessNumber: '1234567890',
  contactEmail: 'contact@nwave.kr',
  contactPhone: '02-1234-5678',
  projects: [
    {
      id: 1,
      title: '글로벌 AI 데이터 매칭 플랫폼 구축',
      period: '2024.01 - 2024.12',
      description: '실시간 데이터 스트리밍 기반 매칭 엔진을 개발하여 정확도를 개선했습니다.',
    },
    {
      id: 2,
      title: '차세대 클라우드 보안 관제 시스템',
      period: '2023.06 - 2023.12',
      description: '멀티 클라우드 환경 위협 탐지 및 자동 대응 시스템을 구축했습니다.',
    },
  ],
};

const REQUIRED_LABELS: Partial<Record<keyof CompanyProfile, string>> = {
  name: '회사명',
  industry: '산업',
  location: '주소(위치)',
  description: '기업 소개',
};

function onlyDigits(v: string) {
  return v.replaceAll(/[^\d]/g, '');
}

function stripAll(v: string, tokens: string[]) {
  let out = v ?? '';
  tokens.forEach((t) => {
    out = out.replaceAll(t, '');
  });
  return out.trim();
}

function isValidHttpUrl(v: string) {
  return /^https?:\/\/.+/i.test(v.trim());
}

// ✅ 원 단위 데이터가 섞여도 천만원 단위로 보정
function toRevenueUnit(v: string) {
  const cleaned = stripAll(v ?? '', ['원', '천만원', ',', ' ']);
  const digits = onlyDigits(cleaned);
  if (!digits) return '';

  const n = Number(digits);
  if (!Number.isFinite(n)) return digits;

  // 1천만원 이상이면 원 단위로 들어왔다고 보고 환산
  if (n >= 10_000_000) return String(Math.round(n / 10_000_000));
  return digits;
}

function normalizeLoadedProfile(p: CompanyProfile): CompanyProfile {
  const employee = stripAll(p.employeeCount ?? '', ['명', ',', ' ']);
  const revenue = toRevenueUnit(p.revenue ?? '');
  const biz = p.businessNumber
    ? onlyDigits(stripAll(p.businessNumber, ['-', ' ']))
    : p.businessNumber;

  return {
    ...p,
    employeeCount: onlyDigits(employee) || employee,
    revenue,
    businessNumber: biz ?? null,
  };
}

function safeLoadProfile(): CompanyProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DUMMY_COMPANY;
    const parsed = JSON.parse(raw) as CompanyProfile;
    return normalizeLoadedProfile({ ...DUMMY_COMPANY, ...parsed });
  } catch {
    return DUMMY_COMPANY;
  }
}

function safeSaveProfile(profile: CompanyProfile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // demo: ignore
  }
}

function CompanyProfileEditPage() {
  const navigate = useNavigate();

  const [company, setCompany] = useState<CompanyProfile | null>(DUMMY_COMPANY);
  const [form, setForm] = useState<CompanyProfile>(DUMMY_COMPANY);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);

  const [toast, setToast] = useState<{ message: ReactNode; visible: boolean }>({
    message: '',
    visible: false,
  });

  const [nextProjectId, setNextProjectId] = useState(-1);

  // ✅ 에러 스크롤용 refs
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});

  // ✅ 로고 업로드 input ref
  const logoFileInputRef = useRef<HTMLInputElement | null>(null);
  const [logoFileName, setLogoFileName] = useState<string>('');

  // ✅ 산업: select + 기타 입력
  const [industrySelect, setIndustrySelect] = useState<string>(DUMMY_COMPANY.industry);
  const [industryOther, setIndustryOther] = useState<string>('');

  // ✅ 취소(confirm) 모달
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);

  // ✅ 취소-confirm에서만 blocker 우회용
  const bypassBlockerRef = useRef(false);

  const showToastMessage = (msg: ReactNode) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: '', visible: false }), 2500);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      const next = safeLoadProfile();
      setCompany(next);
      setForm(next);

      if (INDUSTRY_OPTIONS.includes(next.industry as (typeof INDUSTRY_OPTIONS)[number])) {
        setIndustrySelect(next.industry);
        setIndustryOther('');
      } else {
        setIndustrySelect('기타');
        setIndustryOther(next.industry);
      }

      const minId = next.projects?.reduce((acc, p) => Math.min(acc, p.id), 0) ?? 0;
      setNextProjectId(Math.min(-1, minId - 1));

      setIsLoading(false);
    }, 80);

    return () => clearTimeout(t);
  }, []);

  const isDirty = useMemo(() => {
    if (!company) return false;
    return JSON.stringify(company) !== JSON.stringify(form);
  }, [company, form]);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !bypassBlockerRef.current && isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isDirty) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const setField = <K extends keyof CompanyProfile>(key: K, value: CompanyProfile[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: '' }));
  };

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;

    const offset = 120;
    const bodyTop = document.body.getBoundingClientRect().top;
    const elTop = element.getBoundingClientRect().top;
    const elPos = elTop - bodyTop;
    const target = elPos - offset;

    window.scrollTo({ top: target, behavior: 'smooth' });
  };

  const scrollToError = (errorKeys: string[]) => {
    const firstKey = errorKeys[0];
    if (!firstKey) return;

    if (firstKey === 'projects') {
      scrollToId('section-projects');
      return;
    }

    const el = inputRefs.current[firstKey];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in el && typeof (el as unknown as { focus: () => void }).focus === 'function') {
        (el as unknown as { focus: () => void }).focus();
      }
    }
  };

  // ✅ 산업 변경
  const handleIndustrySelect = (v: string) => {
    setIndustrySelect(v);
    setErrors((prev) => ({ ...prev, industry: '' }));

    if (v === '기타') {
      setField('industry', industryOther.trim());
      return;
    }

    setIndustryOther('');
    setField('industry', v);
  };

  const handleIndustryOtherChange = (v: string) => {
    setIndustryOther(v);
    setErrors((prev) => ({ ...prev, industry: '' }));
    setField('industry', v);
  };

  // ✅ 로고 업로드
  const openLogoPicker = () => {
    logoFileInputRef.current?.click();
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoFileName(file.name);

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      if (!result) return;
      setField('logo', result);
      showToastMessage('로고 업로드 완료!');
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  // ✅ 프로젝트 CRUD
  const handleAddProject = () => {
    const newProject: CompanyProject = {
      id: nextProjectId,
      title: '',
      period: '',
      description: '',
    };

    setNextProjectId((p) => p - 1);

    setForm((prev) => ({
      ...prev,
      projects: [...(prev.projects ?? []), newProject],
    }));

    setErrors((prev) => ({ ...prev, projects: '' }));
    showToastMessage('프로젝트 추가 완료!');
  };

  const handleRemoveProject = (id: number) => {
    setForm((prev) => ({
      ...prev,
      projects: (prev.projects ?? []).filter((p) => p.id !== id),
    }));
    if (errors.projects) setErrors((prev) => ({ ...prev, projects: '' }));
  };

  const updateProject = (id: number, patch: Partial<CompanyProject>) => {
    setForm((prev) => ({
      ...prev,
      projects: (prev.projects ?? []).map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    if (errors.projects) setErrors((prev) => ({ ...prev, projects: '' }));
  };

  // ✅ 사업자번호 유효성(값이 있으면 10자리여야 함)
  const isBusinessNumberValid = (raw?: string | null) => {
    const digits = onlyDigits(raw ?? '');
    if (digits.length === 0) return true; // 비어있으면 OK(선택)
    return digits.length === 10;
  };

  const validate = () => {
    const next: FormErrors = {};

    if (!form.name?.trim()) next.name = '회사명은 필수입니다.';

    if (industrySelect === '기타') {
      if (!industryOther.trim()) next.industry = '산업(기타)을 입력해 주세요.';
    } else {
      if (!form.industry?.trim()) next.industry = '산업은 필수입니다.';
    }

    if (!form.location?.trim()) next.location = '주소(위치)는 필수입니다.';
    if (!form.description?.trim()) next.description = '기업 소개는 필수입니다.';

    if (form.website?.trim() && !isValidHttpUrl(form.website)) {
      next.website = 'http:// 또는 https:// 로 시작해야 합니다.';
    }

    // ✅ 사업자번호: 값이 있으면 10자리 아니면 에러 + 빨간테두리
    if (!isBusinessNumberValid(form.businessNumber ?? '')) {
      next.businessNumber = '유효하지 않은 사업자 번호입니다. (10자리)';
    }

    // ✅ 매출액: 천만원 단위 숫자만 허용(빈 값은 허용)
    if (form.revenue?.trim()) {
      const digits = onlyDigits(form.revenue);
      if (!digits) next.revenue = '매출액은 숫자로 입력해 주세요.';
    }

    // ✅ 프로젝트 검증: 제목 없이 기간/설명만 쓰는 이상한 케이스 막기
    const projects = form.projects ?? [];
    const hasInvalidProject = projects.some(
      (p) => p.title.trim() === '' && (p.period.trim() !== '' || p.description.trim() !== ''),
    );
    if (hasInvalidProject) next.projects = '프로젝트 내용을 입력했다면 제목도 함께 입력해 주세요.';

    setErrors(next);

    const errorKeys = Object.keys(next);
    if (errorKeys.length > 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      const missing = errorKeys
        .filter((k) => k in REQUIRED_LABELS)
        .map((k) => REQUIRED_LABELS[k as keyof CompanyProfile])
        .filter(Boolean);

      const message =
        missing.length > 0
          ? `필수 항목을 입력해 주세요:\n- ${missing.join('\n- ')}`
          : '입력값을 확인해 주세요.';

      window.alert(message);
      scrollToError(errorKeys);
      return false;
    }

    return true;
  };

  const handleSave = () => {
    if (isSaving) return;
    if (!validate()) return;

    setIsSaving(true);

    setTimeout(() => {
      // ✅ 완전 빈 프로젝트는 저장 전에 자동 제거 (프로젝트 0개 저장 가능)
      const cleanedProjects = (form.projects ?? []).filter(
        (p) => p.title.trim() || p.period.trim() || p.description.trim(),
      );

      const normalized: CompanyProfile = {
        ...form,
        employeeCount: onlyDigits(form.employeeCount ?? ''),
        revenue: toRevenueUnit(form.revenue ?? ''),
        businessNumber: form.businessNumber ? onlyDigits(form.businessNumber) : form.businessNumber,
        projects: cleanedProjects,
      };

      safeSaveProfile(normalized);
      setCompany(normalized);
      setForm(normalized);

      setIsSaving(false);
      showToastMessage('저장 완료! (로컬 저장)');
      setTimeout(() => navigate('/company/profile'), 200);
    }, 220);
  };

  // ✅ 취소 UX: 변경 없으면 바로 이동 / 변경 있으면 "저장 안 됨" 모달
  const handleCancel = () => {
    if (!isDirty) {
      navigate('/company/profile');
      return;
    }
    setCancelConfirmOpen(true);
  };

  const confirmCancelLeave = () => {
    setCancelConfirmOpen(false);
    bypassBlockerRef.current = true;
    navigate('/company/profile');
    setTimeout(() => {
      bypassBlockerRef.current = false;
    }, 0);
  };

  if (isLoading) {
    return (
      <div className="bg-pure-white flex min-h-screen items-center justify-center">
        <div className="border-point-blue h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-pure-white text-midnight-ink min-h-screen min-w-7xl pb-20">
      <section className="bg-midnight-ink relative flex min-h-100 w-full flex-col justify-end overflow-hidden pb-16">
        <div className="from-point-blue/20 absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] via-transparent to-transparent" />
        <div className="bg-point-blue/10 absolute -bottom-24 -left-24 h-96 w-96 rounded-full blur-3xl" />

        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col px-8">
          {/* ✅ 버튼은 바닥 유지 / 텍스트만 self-center로 위로 */}
          <div className="flex flex-row items-end gap-12">
            <div className="border-pure-white bg-pure-white h-40 w-40 shrink-0 overflow-hidden rounded-3xl border-4 shadow-xl">
              <img src={form.logo} className="h-full w-full object-contain p-4" alt="logo" />
            </div>

            {/* ✅ 여기만 self-center */}
            <div className="flex w-full min-w-0 flex-1 flex-col items-start self-center">
              <div className="w-full">
                <h1 className="text-pure-white line-clamp-2 w-full text-left text-4xl leading-tight font-black tracking-tighter break-all">
                  {form.name || '-'}
                </h1>
              </div>

              <p className="text-pure-white mt-2 min-h-7 w-full text-left text-lg font-bold break-keep opacity-90">
                {form.industry || '산업 정보가 없습니다'}
              </p>
            </div>

            <div className="flex shrink-0 justify-end gap-3">
              <Button
                variant="light"
                size="lg"
                disabled={!form.website}
                className={`h-14.5 rounded-2xl px-6 text-base font-black whitespace-nowrap shadow-lg transition-all ${
                  form.website ? 'hover:scale-105' : 'opacity-50'
                }`}
                onClick={() => form.website && window.open(form.website, '_blank')}
              >
                기업 홈페이지 〉
              </Button>

              <Button
                variant="outline"
                colorTheme="dark"
                size="lg"
                className="h-14.5 rounded-2xl px-6 text-base font-black whitespace-nowrap shadow-lg"
                onClick={handleCancel}
              >
                취소
              </Button>

              <Button
                variant="blue"
                size="lg"
                className="h-14.5 rounded-2xl px-6 text-base font-black whitespace-nowrap shadow-lg transition-all hover:scale-105"
                disabled={!isDirty || isSaving}
                onClick={handleSave}
              >
                {isSaving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-16 w-full max-w-7xl px-8">
        <div className="grid grid-cols-12 gap-12">
          <div className="col-span-8 space-y-12">
            <section
              id="section-basic"
              className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                기본 정보 수정
              </h2>

              <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                <Field
                  label="회사명"
                  name="name"
                  value={form.name}
                  error={errors.name}
                  isShaking={isShaking}
                  inputRef={(el) => (inputRefs.current.name = el)}
                  onChange={(v) => setField('name', v)}
                />

                <div>
                  <label className="text-slate-gray mb-3 block text-sm font-black">산업</label>
                  <select
                    ref={(el) => {
                      if (industrySelect !== '기타') inputRefs.current.industry = el;
                    }}
                    value={industrySelect}
                    onChange={(e) => handleIndustrySelect(e.target.value)}
                    className={`w-full rounded-2xl border bg-white px-5 py-3 text-base font-medium transition-all outline-none ${
                      errors.industry
                        ? 'border-error bg-error/5 ring-error/10 ring-4'
                        : 'border-silver-mist/60 focus:border-point-blue focus:ring-point-blue/10 focus:ring-4'
                    }`}
                  >
                    <option value="">산업 선택</option>
                    {INDUSTRY_OPTIONS.map((op) => (
                      <option key={op} value={op}>
                        {op}
                      </option>
                    ))}
                  </select>

                  {industrySelect === '기타' ? (
                    <div className="mt-3">
                      <input
                        ref={(el) => {
                          inputRefs.current.industry = el;
                        }}
                        value={industryOther}
                        onChange={(e) => handleIndustryOtherChange(e.target.value)}
                        placeholder="산업을 직접 입력해 주세요"
                        className={`w-full rounded-2xl border px-5 py-3 text-base font-medium transition-all outline-none ${
                          errors.industry
                            ? 'border-error bg-error/5 ring-error/10 ring-4'
                            : 'border-silver-mist/60 focus:border-point-blue focus:ring-point-blue/10 focus:ring-4'
                        }`}
                      />
                    </div>
                  ) : null}

                  <div className="mt-2 min-h-6">
                    <AnimatePresence>
                      {errors.industry ? (
                        <motion.p
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1, x: isShaking ? [-4, 4, -4, 4, 0] : 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ x: { duration: 0.35 } }}
                          className="text-error text-sm font-bold"
                        >
                          {errors.industry}
                        </motion.p>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </div>

                <FieldWithSuffix
                  label="사원수"
                  name="employeeCount"
                  value={form.employeeCount}
                  suffix="명"
                  inputRef={(el) => (inputRefs.current.employeeCount = el)}
                  onChange={(v) => setField('employeeCount', onlyDigits(v))}
                  placeholder="예) 150"
                />

                <FieldWithSuffix
                  label="매출액"
                  name="revenue"
                  value={form.revenue}
                  suffix="천만원"
                  error={errors.revenue}
                  isShaking={isShaking}
                  inputRef={(el) => (inputRefs.current.revenue = el)}
                  onChange={(v) => setField('revenue', onlyDigits(v))}
                  placeholder="예) 3200"
                />

                <SelectField
                  label="기업구분"
                  name="enterpriseType"
                  value={form.enterpriseType}
                  inputRef={(el) => (inputRefs.current.enterpriseType = el)}
                  onChange={(v) => setField('enterpriseType', v)}
                  options={ENTERPRISE_OPTIONS as unknown as string[]}
                  placeholder="기업구분 선택"
                />

                <Field
                  label="홈페이지"
                  name="website"
                  value={form.website}
                  error={errors.website}
                  isShaking={isShaking}
                  inputRef={(el) => (inputRefs.current.website = el)}
                  onChange={(v) => setField('website', v)}
                  placeholder="http:// 또는 https://"
                />
              </div>

              <div className="mt-8 grid grid-cols-1 gap-6">
                <Field
                  full
                  label="주소(위치)"
                  name="location"
                  value={form.location}
                  error={errors.location}
                  isShaking={isShaking}
                  inputRef={(el) => (inputRefs.current.location = el)}
                  onChange={(v) => setField('location', v)}
                />

                <div className="col-span-2">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <label className="text-slate-gray block text-sm font-black">로고 업로드</label>
                    <input
                      ref={logoFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="md"
                        className="rounded-xl text-base font-black"
                        onClick={openLogoPicker}
                      >
                        파일 선택
                      </Button>
                      {logoFileName ? (
                        <span className="text-slate-gray text-xs font-bold">{logoFileName}</span>
                      ) : null}
                    </div>
                  </div>

                  <div className="border-silver-mist/40 rounded-3xl border p-6">
                    <div className="text-slate-gray mb-3 text-sm font-black">로고 미리보기</div>
                    <div className="bg-cloud-dancer/30 border-silver-mist flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border">
                      {form.logo ? (
                        <img
                          src={form.logo}
                          alt="logo preview"
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <span className="text-slate-gray text-xs font-bold">없음</span>
                      )}
                    </div>
                    <p className="text-slate-gray mt-4 text-xs font-bold opacity-70">
                      ※ 데모 모드: 업로드 이미지는 브라우저(localStorage)에 저장됩니다.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section
              id="section-intro"
              className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                기업 소개 수정
              </h2>

              <label className="text-slate-gray mb-3 block text-sm font-black">기업 소개</label>
              <textarea
                ref={(el) => {
                  inputRefs.current.description = el;
                }}
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                rows={7}
                className={`w-full resize-none rounded-2xl border px-5 py-4 text-base font-medium transition-all outline-none ${
                  errors.description
                    ? 'border-error bg-error/5 ring-error/10 ring-4'
                    : 'border-silver-mist/60 focus:border-point-blue focus:ring-point-blue/10 focus:ring-4'
                }`}
                placeholder="지원자가 읽는 소개 글이에요."
              />
              {errors.description ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: isShaking ? [-4, 4, -4, 4, 0] : 0 }}
                  transition={{ x: { duration: 0.35 } }}
                  className="text-error mt-2 text-sm font-bold"
                >
                  {errors.description}
                </motion.p>
              ) : null}
            </section>

            <section
              id="section-projects"
              className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
            >
              <div className="mb-10 flex items-center justify-between gap-4">
                <h2 className="border-point-blue text-midnight-ink border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  프로젝트 내역 수정
                </h2>

                <Button
                  variant="blue"
                  size="md"
                  className="rounded-xl px-4 py-3 text-base font-black"
                  onClick={handleAddProject}
                >
                  + 프로젝트 추가
                </Button>
              </div>

              {errors.projects ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: isShaking ? [-4, 4, -4, 4, 0] : 0 }}
                  transition={{ x: { duration: 0.35 } }}
                  className="bg-error/5 border-error mb-6 rounded-2xl border px-5 py-4"
                >
                  <p className="text-error text-sm font-bold">{errors.projects}</p>
                </motion.div>
              ) : null}

              <div className="space-y-6">
                {(form.projects ?? []).length ? (
                  (form.projects ?? []).map((p) => (
                    <div key={p.id} className="border-silver-mist rounded-3xl border p-8">
                      <div className="mb-6 flex items-center justify-between gap-3">
                        <h3 className="text-midnight-ink text-lg font-black">프로젝트</h3>
                        <Button
                          variant="outline"
                          size="md"
                          className="rounded-xl text-base font-black"
                          onClick={() => handleRemoveProject(p.id)}
                        >
                          삭제
                        </Button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-16 gap-y-6">
                        <Field
                          label="프로젝트명"
                          name={`project-title-${p.id}`}
                          value={p.title}
                          onChange={(v) => updateProject(p.id, { title: v })}
                          placeholder="예) AI 데이터 매칭 플랫폼"
                        />
                        <Field
                          label="기간"
                          name={`project-period-${p.id}`}
                          value={p.period}
                          onChange={(v) => updateProject(p.id, { period: v })}
                          placeholder="예) 2024.01 - 2024.12"
                        />
                        <div className="col-span-2">
                          <label className="text-slate-gray mb-3 block text-sm font-black">
                            설명
                          </label>
                          <textarea
                            value={p.description}
                            onChange={(e) => updateProject(p.id, { description: e.target.value })}
                            rows={4}
                            className="border-silver-mist/60 focus:border-point-blue focus:ring-point-blue/10 w-full resize-none rounded-2xl border px-5 py-4 text-base font-medium transition-all outline-none focus:ring-4"
                            placeholder="무슨 일을 했고 어떤 성과가 있었는지 적어주세요."
                          />
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-slate-gray py-16 text-center text-base font-medium">
                    프로젝트가 없습니다. “프로젝트 추가”로 등록해 주세요.
                  </div>
                )}
              </div>
            </section>

            <section
              id="section-contact"
              className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                연락처 / 인증 정보
              </h2>

              <div className="grid grid-cols-2 gap-x-16 gap-y-8">
                <Field
                  label="이메일"
                  name="contactEmail"
                  value={form.contactEmail ?? ''}
                  inputRef={(el) => (inputRefs.current.contactEmail = el)}
                  onChange={(v) => setField('contactEmail', v)}
                  placeholder="contact@company.com"
                />
                <Field
                  label="전화번호"
                  name="contactPhone"
                  value={form.contactPhone ?? ''}
                  inputRef={(el) => (inputRefs.current.contactPhone = el)}
                  onChange={(v) => setField('contactPhone', v)}
                  placeholder="02-0000-0000"
                />

                <Field
                  label="사업자등록번호"
                  name="businessNumber"
                  value={form.businessNumber ?? ''}
                  error={errors.businessNumber}
                  isShaking={isShaking}
                  inputRef={(el) => (inputRefs.current.businessNumber = el)}
                  onChange={(v) => {
                    const digits = onlyDigits(v);
                    setField('businessNumber', digits);

                    if (digits.length > 0 && digits.length !== 10) {
                      setErrors((prev) => ({
                        ...prev,
                        businessNumber: '유효하지 않은 사업자 번호입니다. (10자리)',
                      }));
                    } else {
                      setErrors((prev) => ({ ...prev, businessNumber: '' }));
                    }
                  }}
                  placeholder="숫자 10자리"
                />
              </div>
            </section>
          </div>

          {/* ✅ QuickMenu */}
          <aside className="col-span-4 min-w-0">
            <div className="sticky top-24 space-y-5">
              <div className="bg-pure-white rounded-4xl border border-zinc-100 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="mb-6">
                  <h3 className="text-midnight-ink text-md font-black tracking-widest uppercase opacity-40">
                    Quick Menu
                  </h3>
                </div>

                <nav className="space-y-3">
                  {[
                    { id: 'section-basic', label: '기본 정보' },
                    { id: 'section-intro', label: '기업 소개' },
                    { id: 'section-projects', label: '프로젝트' },
                    { id: 'section-contact', label: '연락처' },
                  ].map((item) => (
                    <Button
                      key={item.id}
                      variant="outline"
                      size="md"
                      className="group w-full justify-start border-transparent bg-transparent px-0 py-2 hover:border-transparent hover:bg-transparent"
                      onClick={() => scrollToId(item.id)}
                    >
                      <span className="bg-point-blue mr-4 inline-block h-5 w-1 rounded-full" />
                      <span className="text-midnight-ink group-hover:text-point-blue text-base font-black transition-all group-hover:translate-x-0.5">
                        {item.label}
                      </span>
                    </Button>
                  ))}
                </nav>
              </div>

              <Button
                variant="dark"
                size="md"
                className="w-full rounded-xl py-4 text-base font-black shadow-2xl"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              >
                맨 위로 이동
              </Button>
            </div>
          </aside>
        </div>
      </div>

      {/* ✅ 취소(confirm) 모달 */}
      <AnimatePresence>
        {cancelConfirmOpen && (
          <div className="fixed inset-0 z-[320] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCancelConfirmOpen(false)}
              className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 16 }}
              className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white p-10 text-center shadow-2xl"
            >
              <div className="bg-error/10 text-error mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              <h3 className="text-midnight-ink mb-2 text-2xl font-black tracking-tight whitespace-nowrap">
                변경내용이 저장되지 않았어요
              </h3>
              <p className="text-slate-gray text-lg font-bold">
                저장하지 않고 나가면 수정사항이 사라집니다.
              </p>

              <div className="mt-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={() => setCancelConfirmOpen(false)}
                >
                  계속 수정
                </Button>
                <Button
                  variant="red"
                  size="lg"
                  className="flex-1 rounded-2xl shadow-lg"
                  onClick={confirmCancelLeave}
                >
                  저장 안 하고 나가기
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✅ 이탈 방지 모달 (라우트 이동 시) */}
      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => blocker.reset?.()}
              className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white p-10 text-center shadow-2xl"
            >
              <div className="bg-error/10 text-error mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>

              <h3 className="text-midnight-ink mb-2 text-2xl font-black tracking-tight whitespace-nowrap">
                수정을 중단할까요?
              </h3>
              <p className="text-slate-gray text-lg font-bold">
                페이지를 벗어나면 입력하신 <br /> 변경사항이 저장되지 않습니다.
              </p>

              <div className="mt-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={() => blocker.reset?.()}
                >
                  계속 수정하기
                </Button>
                <Button
                  variant="red"
                  size="lg"
                  className="flex-1 rounded-2xl shadow-lg"
                  onClick={() => blocker.proceed?.()}
                >
                  나가기
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ✅ 토스트 */}
      <AnimatePresence>
        {toast.visible && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="bg-midnight-ink text-pure-white fixed bottom-10 left-1/2 z-[100] rounded-2xl px-6 py-3 text-center text-sm font-bold whitespace-nowrap shadow-2xl"
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  full = false,
  inputRef,
  isShaking,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  full?: boolean;
  inputRef?: (el: HTMLInputElement | null) => void;
  isShaking?: boolean;
}) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <label className="text-slate-gray mb-3 block text-sm font-black">{label}</label>
      <input
        ref={inputRef}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-2xl border px-5 py-3 text-base font-medium transition-all outline-none ${
          error
            ? 'border-error bg-error/5 ring-error/10 ring-4'
            : 'border-silver-mist/60 focus:border-point-blue focus:ring-point-blue/10 focus:ring-4'
        }`}
      />
      <div className="mt-2 min-h-6">
        <AnimatePresence>
          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: isShaking ? [-4, 4, -4, 4, 0] : 0 }}
              exit={{ opacity: 0 }}
              transition={{ x: { duration: 0.35 } }}
              className="text-error text-sm font-bold"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function FieldWithSuffix({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  inputRef,
  suffix,
  isShaking,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  inputRef?: (el: HTMLInputElement | null) => void;
  suffix: string;
  isShaking?: boolean;
}) {
  return (
    <div>
      <label className="text-slate-gray mb-3 block text-sm font-black">{label}</label>

      <div className="flex items-center gap-3">
        <input
          ref={inputRef}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-2xl border px-5 py-3 text-base font-medium transition-all outline-none ${
            error
              ? 'border-error bg-error/5 ring-error/10 ring-4'
              : 'border-silver-mist/60 focus:border-point-blue focus:ring-point-blue/10 focus:ring-4'
          }`}
        />
        <span className="text-slate-gray shrink-0 text-sm font-black">{suffix}</span>
      </div>

      <div className="mt-2 min-h-6">
        <AnimatePresence>
          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: isShaking ? [-4, 4, -4, 4, 0] : 0 }}
              exit={{ opacity: 0 }}
              transition={{ x: { duration: 0.35 } }}
              className="text-error text-sm font-bold"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SelectField({
  label,
  name,
  value,
  onChange,
  options,
  placeholder,
  error,
  inputRef,
  isShaking,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder?: string;
  error?: string;
  inputRef?: (el: HTMLSelectElement | null) => void;
  isShaking?: boolean;
}) {
  return (
    <div>
      <label className="text-slate-gray mb-3 block text-sm font-black">{label}</label>
      <select
        ref={inputRef}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-2xl border bg-white px-5 py-3 text-base font-medium transition-all outline-none ${
          error
            ? 'border-error bg-error/5 ring-error/10 ring-4'
            : 'border-silver-mist/60 focus:border-point-blue focus:ring-point-blue/10 focus:ring-4'
        }`}
      >
        <option value="">{placeholder ?? '선택'}</option>
        {options.map((op) => (
          <option key={op} value={op}>
            {op}
          </option>
        ))}
      </select>

      <div className="mt-2 min-h-6">
        <AnimatePresence>
          {error ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, x: isShaking ? [-4, 4, -4, 4, 0] : 0 }}
              exit={{ opacity: 0 }}
              transition={{ x: { duration: 0.35 } }}
              className="text-error text-sm font-bold"
            >
              {error}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default CompanyProfileEditPage;
