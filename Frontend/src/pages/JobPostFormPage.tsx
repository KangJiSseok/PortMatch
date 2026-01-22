import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button/Button';

interface JobPostForm {
  title: string;
  career: string;
  education: string;
  employment_type: string;
  salary: string;
  work_location: string;
  work_days: string;
  work_hours: string;
  deadline: string;
  requirement_text: string;
  required_stacks: string[];
}

type FormErrors = Partial<Record<keyof JobPostForm, string>>;

const ErrorDisplay = ({
  name,
  errors,
  isShaking,
}: {
  name: keyof JobPostForm;
  errors: FormErrors;
  isShaking: boolean;
}) => (
  <div className="mt-1.5 min-h-7 overflow-hidden">
    <AnimatePresence>
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            x: isShaking ? [-4, 4, -4, 4, 0] : 0,
          }}
          exit={{ opacity: 0 }}
          transition={{ x: { duration: 0.4 } }}
          className="text-sm font-black whitespace-nowrap text-red-500"
        >
          {errors[name]}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const JobPostFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEdit = !!id;

  const [form, setForm] = useState<JobPostForm>({
    title: '',
    career: '',
    education: '',
    employment_type: '',
    salary: '',
    work_location: '',
    work_days: '',
    work_hours: '',
    deadline: '',
    requirement_text: '',
    required_stacks: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);
  const [stackInput, setStackInput] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  const inputRefs = useRef<Record<string, HTMLElement | null>>({});

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const { isLoading } = useQuery({
    queryKey: ['jobPost', id],
    queryFn: async () => {
      const response = await fetch(`/api/job-posts/${id}`);
      const data = await response.json();
      setForm(data.jobPost);
      return data;
    },
    enabled: isEdit,
  });

  const mutation = useMutation({
    mutationFn: async (formData: JobPostForm) => {
      const method = isEdit ? 'PATCH' : 'POST';
      const url = isEdit ? `/api/job-posts/${id}` : '/api/job-posts';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      return response.json();
    },
    onSuccess: () => {
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      navigate('/company/jobs');
    },
  });

  const scrollToError = (errorKeys: string[]) => {
    const firstErrorKey = errorKeys[0];
    const element = inputRefs.current[firstErrorKey];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      element.focus();
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!form.title.trim()) newErrors.title = '공고 제목을 입력해주세요.';
    if (!form.career) newErrors.career = '경력 조건을 선택해주세요.';
    if (!form.education.trim()) newErrors.education = '학력 조건을 입력해주세요.';
    if (!form.employment_type.trim()) newErrors.employment_type = '고용 형태를 입력해주세요.';
    if (!form.salary.trim()) newErrors.salary = '급여 조건을 입력해주세요.';
    if (!form.work_location.trim()) newErrors.work_location = '근무 지역을 입력해주세요.';
    if (!form.deadline) newErrors.deadline = '마감일을 선택해주세요.';
    if (!form.requirement_text.trim()) newErrors.requirement_text = '상세 요강을 입력해주세요.';

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors);
    if (errorKeys.length > 0) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      scrollToError(errorKeys);
      return false;
    }
    return true;
  };

  const handleSubmit = () => {
    if (validateForm()) {
      mutation.mutate(form);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);

    if (errors[name as keyof JobPostForm]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAddStack = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && stackInput.trim()) {
      e.preventDefault();
      if (!form.required_stacks.includes(stackInput.trim())) {
        setForm((prev) => ({
          ...prev,
          required_stacks: [...prev.required_stacks, stackInput.trim()],
        }));
        setIsDirty(true);
      }
      setStackInput('');
    }
  };

  const removeStack = (stack: string) => {
    setForm((prev) => ({
      ...prev,
      required_stacks: prev.required_stacks.filter((s) => s !== stack),
    }));
    setIsDirty(true);
  };

  if (isEdit && isLoading) {
    return (
      <div className="flex min-h-screen min-w-5xl items-center justify-center bg-white pt-32">
        <div className="text-center">
          <div className="relative mx-auto mb-6 h-24 w-24">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="absolute inset-0 rounded-full border-t-4 border-b-4 border-blue-600"
            />
          </div>
          <p className="text-lg font-black whitespace-nowrap text-slate-400">
            데이터를 불러오고 있습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pure-white min-h-screen min-w-5xl pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <header className="mb-12 border-l-4 border-blue-600 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-black tracking-tighter whitespace-nowrap text-slate-900 uppercase"
          >
            {isEdit ? 'Edit Job Posting' : 'New Job Posting'}
          </motion.h1>
          <p className="mt-2 text-lg font-bold whitespace-nowrap text-slate-400 italic">
            기업의 미래를 함께할 인재를 위한 공고를 작성하세요
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          <section className="bg-pure-white rounded-4xl border border-slate-100 p-10 shadow-xl shadow-slate-200/50">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-blue-600" />
              <h2 className="text-2xl font-black tracking-tight whitespace-nowrap text-slate-800">
                기본 정보
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2.5 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  공고 제목
                </label>
                <input
                  ref={(el) => {
                    inputRefs.current.title = el;
                  }}
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="예) 시니어 프론트엔드 개발자 채용"
                  className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                    errors.title
                      ? 'border-red-500 bg-red-50/30 ring-4 ring-red-500/5'
                      : 'focus:bg-pure-white border-slate-100 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5'
                  }`}
                />
                <ErrorDisplay name="title" errors={errors} isShaking={isShaking} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2.5 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                    경력 조건
                  </label>
                  <select
                    ref={(el) => {
                      inputRefs.current.career = el;
                    }}
                    name="career"
                    value={form.career}
                    onChange={handleChange}
                    className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                      errors.career
                        ? 'border-red-500 bg-red-50/30'
                        : 'border-slate-100 focus:border-blue-600 focus:bg-white'
                    }`}
                  >
                    <option value="">선택</option>
                    <option value="신입">신입</option>
                    <option value="경력">경력</option>
                    <option value="경력무관">경력무관</option>
                  </select>
                  <ErrorDisplay name="career" errors={errors} isShaking={isShaking} />
                </div>
                <div>
                  <label className="mb-2.5 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                    학력 사항
                  </label>
                  <input
                    ref={(el) => {
                      inputRefs.current.education = el;
                    }}
                    type="text"
                    name="education"
                    value={form.education}
                    onChange={handleChange}
                    placeholder="예) 대졸 이상"
                    className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                      errors.education
                        ? 'border-red-500 bg-red-50/30'
                        : 'border-slate-100 focus:border-blue-600 focus:bg-white'
                    }`}
                  />
                  <ErrorDisplay name="education" errors={errors} isShaking={isShaking} />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-pure-white rounded-4xl border border-slate-100 p-10 shadow-xl shadow-slate-200/50">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-blue-600" />
              <h2 className="text-2xl font-black tracking-tight whitespace-nowrap text-slate-800">
                근무 환경
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-4">
              <div>
                <label className="mb-2.5 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  고용 형태
                </label>
                <input
                  ref={(el) => {
                    inputRefs.current.employment_type = el;
                  }}
                  type="text"
                  name="employment_type"
                  value={form.employment_type}
                  onChange={handleChange}
                  placeholder="예) 정규직"
                  className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                    errors.employment_type
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-100 focus:border-blue-600 focus:bg-white'
                  }`}
                />
                <ErrorDisplay name="employment_type" errors={errors} isShaking={isShaking} />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  급여 조건
                </label>
                <input
                  ref={(el) => {
                    inputRefs.current.salary = el;
                  }}
                  type="text"
                  name="salary"
                  value={form.salary}
                  onChange={handleChange}
                  placeholder="예) 면접 후 결정"
                  className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                    errors.salary
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-100 focus:border-blue-600 focus:bg-white'
                  }`}
                />
                <ErrorDisplay name="salary" errors={errors} isShaking={isShaking} />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  근무 지역
                </label>
                <input
                  ref={(el) => {
                    inputRefs.current.work_location = el;
                  }}
                  type="text"
                  name="work_location"
                  value={form.work_location}
                  onChange={handleChange}
                  placeholder="예) 서울 강남구"
                  className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                    errors.work_location
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-100 focus:border-blue-600 focus:bg-white'
                  }`}
                />
                <ErrorDisplay name="work_location" errors={errors} isShaking={isShaking} />
              </div>
              <div>
                <label className="mb-2.5 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  접수 마감일
                </label>
                <input
                  ref={(el) => {
                    inputRefs.current.deadline = el;
                  }}
                  type="date"
                  name="deadline"
                  value={form.deadline}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                    errors.deadline
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-100 focus:border-blue-600 focus:bg-white'
                  }`}
                />
                <ErrorDisplay name="deadline" errors={errors} isShaking={isShaking} />
              </div>
            </div>
          </section>

          <section className="bg-pure-white rounded-4xl border border-slate-100 p-10 shadow-xl shadow-slate-200/50">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-blue-600" />
              <h2 className="text-2xl font-black tracking-tight whitespace-nowrap text-slate-800">
                기술 스택
              </h2>
            </div>
            <div className="space-y-5">
              <input
                type="text"
                value={stackInput}
                onChange={(e) => setStackInput(e.target.value)}
                onKeyDown={handleAddStack}
                placeholder="스택 입력 후 Enter (예: React)"
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600 focus:bg-white"
              />
              <div className="flex flex-wrap gap-2.5">
                <AnimatePresence>
                  {form.required_stacks.map((stack) => (
                    <motion.span
                      key={stack}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black whitespace-nowrap text-blue-600"
                    >
                      {stack}
                      <button
                        onClick={() => removeStack(stack)}
                        className="text-blue-300 transition-colors hover:text-blue-600"
                      >
                        ×
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </section>

          <section className="bg-pure-white rounded-4xl border border-slate-100 p-10 shadow-xl shadow-slate-200/50">
            <div className="mb-8 flex items-center gap-3">
              <div className="h-6 w-1.5 rounded-full bg-blue-600" />
              <h2 className="text-2xl font-black tracking-tight whitespace-nowrap text-slate-800">
                상세 요강
              </h2>
            </div>
            <textarea
              ref={(el) => {
                inputRefs.current.requirement_text = el;
              }}
              name="requirement_text"
              value={form.requirement_text}
              onChange={handleChange}
              rows={12}
              placeholder="직무 소개, 자격 요건, 우대 사항 등을 상세히 적어주세요."
              className={`w-full rounded-2xl border bg-slate-50 px-6 py-6 leading-relaxed font-bold transition-all outline-none ${
                errors.requirement_text
                  ? 'border-red-500 bg-red-50/30'
                  : 'border-slate-100 focus:border-blue-600 focus:bg-white'
              }`}
            />
            <ErrorDisplay name="requirement_text" errors={errors} isShaking={isShaking} />
          </section>

          <div className="flex items-center justify-center gap-4 pt-12">
            <Button
              variant="outline"
              size="xl"
              onClick={() => navigate(-1)}
              className="w-48 shrink-0 rounded-[20px] py-5 text-xl font-black transition-all hover:bg-slate-100"
            >
              취소
            </Button>
            <Button
              variant="blue"
              size="xl"
              onClick={handleSubmit}
              className="w-64 shrink-0 rounded-[20px] py-5 text-xl font-black shadow-lg shadow-blue-600/20"
            >
              {isEdit ? '수정 완료' : '공고 등록하기'}
            </Button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-300 flex min-w-5xl items-center justify-center p-6">
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
                작성을 중단할까요?
              </h3>
              <p className="text-slate-gray text-lg font-bold">
                페이지를 벗어나면 입력하신 <br /> 공고 내용이 저장되지 않습니다.
              </p>
              <div className="mt-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={() => blocker.reset?.()}
                >
                  계속 작성하기
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
    </div>
  );
};

export default JobPostFormPage;
