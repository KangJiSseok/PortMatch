import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, AlertTriangle, X } from 'lucide-react';
import axios from 'axios';
import Button from '../../components/Button/Button';
import { useAuthStore } from '../../store/authStore';

interface StackItem {
  stackId: number;
  stackName: string;
}

interface RawStackItem {
  stackId?: number;
  id?: number;
  stackName?: string;
  name?: string;
  stack_name?: string;
  stack?: {
    stackId?: number;
    id?: number;
    stackName?: string;
    name?: string;
  };
}

interface JobPostingRequest {
  id: number;
  cid: string;
  title: string;
  detail: string;
  startDate: string;
  endDate: string;
  active: number;
  stackIds: number[];
  jobType: number;
  vcnt: number;
  company: {
    cid: string;
    corpName: string;
    totPsncnt: string;
    busiSize: string;
    yrSalesAmt: string;
    corpAddr: string;
    homePg: string;
    busiCont: string;
    logo: string;
  };
}

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
  required_stacks: StackItem[];
}

interface ParsedDetail {
  career?: string;
  education?: string;
  employment_type?: string;
  salary?: string;
  work_location?: string;
  work_days?: string;
  work_hours?: string;
  requirement_text?: string;
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
  <div className="mt-2 min-h-7 overflow-hidden">
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
  const user = useAuthStore((state) => state.user);
  const isEdit = !!id;
  const isSubmitSuccess = useRef(false);

  const { data: myInfo, isLoading: isAuthLoading } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const response = await axios.get('/api/auth/me');
      return response.data.data;
    },
    enabled: !user?.cid,
    staleTime: 1000 * 60 * 5,
  });

  const cid = user?.cid || myInfo?.cid;

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
  const [duplicateError, setDuplicateError] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isAlwaysOpen, setIsAlwaysOpen] = useState(false);
  const [dateParts, setDateParts] = useState({ year: '', month: '', day: '' });

  const inputRefs = useRef<Record<string, HTMLElement | null>>({});

  const { data: stackSearchResults } = useQuery({
    queryKey: ['stacks', stackInput],
    queryFn: async () => {
      if (!stackInput.trim()) return [];
      const response = await axios.get(`/api/stacks/name/${stackInput}`);
      const rawData = response.data.data || [];

      return rawData
        .map((item: RawStackItem) => ({
          stackId: item.stackId || item.id || 0,
          stackName: item.stackName || item.name || item.stack_name || '',
        }))
        .filter((item: StackItem) => item.stackId !== 0);
    },
    enabled: stackInput.length > 0,
    staleTime: 1000 * 60,
  });

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSubmitSuccess.current && currentLocation.pathname !== nextLocation.pathname,
  );

  const maxDays = useMemo(() => {
    if (!dateParts.year || !dateParts.month) return 31;
    return new Date(Number(dateParts.year), Number(dateParts.month), 0).getDate();
  }, [dateParts.year, dateParts.month]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitSuccess.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const { isLoading: isJobLoading } = useQuery({
    queryKey: ['jobPost', id],
    queryFn: async () => {
      const response = await axios.get(`/api/job-postings/${id}`);
      const data = response.data.data;

      let parsedDetail: ParsedDetail = {};
      try {
        parsedDetail = JSON.parse(data.detail) as ParsedDetail;
      } catch (error) {
        console.warn('Detail parsing error:', error);
        parsedDetail = { requirement_text: data.detail };
      }

      let loadedStacks: StackItem[] = [];

      if (data.stackIds && Array.isArray(data.stackIds) && data.stackIds.length > 0) {
        try {
          const stackResponses = await Promise.all(
            data.stackIds.map((stackId: number) =>
              axios.get(`/api/stacks/${stackId}`).then((res) => res.data.data),
            ),
          );

          loadedStacks = stackResponses
            .map((stackData: RawStackItem) => ({
              stackId: stackData.stackId || stackData.id || 0,
              stackName: stackData.stackName || stackData.name || '',
            }))
            .filter((s) => s.stackId !== 0);
        } catch (error) {
          console.error('스택 정보 로드 실패:', error);
        }
      } else if (data.jobPostingStacks) {
        loadedStacks = (data.jobPostingStacks as RawStackItem[])
          .map((item) => ({
            stackId: item.stackId || item.id || item.stack?.stackId || item.stack?.id || 0,
            stackName:
              item.stackName || item.name || item.stack?.stackName || item.stack?.name || '',
          }))
          .filter((s: StackItem) => s.stackId !== 0);
      }

      const jobData: JobPostForm = {
        title: data.title,
        deadline: data.endDate,
        required_stacks: loadedStacks,
        career: parsedDetail.career || '',
        education: parsedDetail.education || '',
        employment_type: parsedDetail.employment_type || '',
        salary: parsedDetail.salary || '',
        work_location: parsedDetail.work_location || '',
        work_days: parsedDetail.work_days || '',
        work_hours: parsedDetail.work_hours || '',
        requirement_text: parsedDetail.requirement_text || data.detail,
      };

      setForm(jobData);

      if (jobData.deadline === '상시채용') {
        setIsAlwaysOpen(true);
      } else if (jobData.deadline && jobData.deadline.includes('-')) {
        const [y, m, d] = jobData.deadline.split('-');
        setDateParts({ year: y, month: parseInt(m).toString(), day: parseInt(d).toString() });
      }
      return data;
    },
    enabled: isEdit,
  });

  const mutation = useMutation({
    mutationFn: async (formData: JobPostForm) => {
      if (!cid) {
        throw new Error('기업 정보를 확인할 수 없습니다. 다시 로그인해주세요.');
      }

      const detailObject = {
        career: formData.career,
        education: formData.education,
        employment_type: formData.employment_type,
        salary: formData.salary,
        work_location: formData.work_location,
        work_days: formData.work_days,
        work_hours: formData.work_hours,
        requirement_text: formData.requirement_text,
      };

      const stackIdsToSend = formData.required_stacks
        .map((stack) => Number(stack.stackId))
        .filter((id) => !isNaN(id));

      const companyObject = {
        cid: cid,
        corpName: myInfo?.corpName || 'string',
        totPsncnt: 'string',
        busiSize: 'string',
        yrSalesAmt: 'string',
        corpAddr: 'string',
        homePg: 'string',
        busiCont: 'string',
        logo: 'string',
      };

      const requestBody: JobPostingRequest = {
        id: isEdit ? Number(id) : 0,
        cid: cid,
        title: formData.title,
        detail: JSON.stringify(detailObject),
        startDate: new Date().toISOString().split('T')[0],
        endDate: formData.deadline || '9999-12-31',
        active: 0,
        vcnt: 0,
        jobType: 0,
        stackIds: stackIdsToSend,
        company: companyObject,
      };

      if (isEdit) {
        const response = await axios.put(`/api/job-postings/${id}`, requestBody);
        return response.data;
      } else {
        const response = await axios.post('/api/job-postings', requestBody);
        return response.data;
      }
    },
    onSuccess: () => {
      isSubmitSuccess.current = true;
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['companyJobs'] });
      navigate(-1);
    },
    onError: (error) => {
      console.error('Save failed:', error);
      alert('공고 저장에 실패했습니다. 입력 정보를 확인해주세요.');
    },
  });

  const getDeadlineString = (parts: typeof dateParts, alwaysOpen: boolean) => {
    if (alwaysOpen) return '상시채용';
    const { year, month, day } = parts;
    if (year && month && day) {
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    return '';
  };

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
    if (!form.education.trim()) newErrors.education = '학력 조건을 선택해주세요.';
    if (!form.employment_type.trim()) newErrors.employment_type = '고용 형태를 선택해주세요.';
    if (!form.salary.trim()) newErrors.salary = '급여 조건을 입력해주세요.';
    if (!form.work_location.trim()) newErrors.work_location = '근무 지역을 입력해주세요.';

    if (!form.deadline) {
      newErrors.deadline = '마감일을 선택하거나 상시채용을 체크해주세요.';
    } else if (form.deadline !== '상시채용') {
      const selectedDate = new Date(form.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.deadline = '마감일은 오늘 이후 날짜로 선택해주세요.';
      }
    }

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

  const handleAlwaysOpenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsAlwaysOpen(checked);
    setIsDirty(true);

    setForm((prev) => ({
      ...prev,
      deadline: getDeadlineString(dateParts, checked),
    }));

    if (errors.deadline) {
      setErrors((prev) => ({ ...prev, deadline: undefined }));
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setIsDirty(true);

    setDateParts((prev) => {
      const nextParts = { ...prev, [name]: value };

      if (nextParts.year && nextParts.month) {
        const currentMax = new Date(Number(nextParts.year), Number(nextParts.month), 0).getDate();
        if (Number(nextParts.day) > currentMax) {
          nextParts.day = currentMax.toString();
        }
      }

      setForm((prevForm) => ({
        ...prevForm,
        deadline: getDeadlineString(nextParts, isAlwaysOpen),
      }));

      return nextParts;
    });

    if (errors.deadline) {
      setErrors((prev) => ({ ...prev, deadline: undefined }));
    }
  };

  const handleSelectStack = (stack: StackItem) => {
    if (form.required_stacks.some((s) => s.stackId === stack.stackId)) {
      setDuplicateError(true);
      setTimeout(() => setDuplicateError(false), 1000);
      setStackInput('');
      return;
    }

    setForm((prev) => ({
      ...prev,
      required_stacks: [...prev.required_stacks, stack],
    }));
    setIsDirty(true);
    setStackInput('');
  };

  const removeStack = (stackId: number) => {
    setForm((prev) => ({
      ...prev,
      required_stacks: prev.required_stacks.filter((s) => s.stackId !== stackId),
    }));
    setIsDirty(true);
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => (currentYear + i).toString());
  const months = Array.from({ length: 12 }, (_, i) => (i + 1).toString());
  const days = Array.from({ length: maxDays }, (_, i) => (i + 1).toString());

  const isLoading = (isEdit && isJobLoading) || (!cid && isAuthLoading);

  if (isLoading) {
    return (
      <div className="bg-pure-white flex min-h-screen min-w-80 items-center justify-center pt-32">
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <Loader2 size={64} className="animate-spin text-blue-600" />
          </div>
          <p className="text-lg font-black whitespace-nowrap text-slate-400">
            데이터 불러오고 있습니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pure-white min-h-screen min-w-80 pt-32 pb-32">
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
                <label className="mb-2 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
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
                  <label className="mb-2 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                    경력 조건
                  </label>
                  <select
                    ref={(el) => {
                      inputRefs.current.career = el;
                    }}
                    name="career"
                    value={form.career}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">선택</option>
                    <option value="신입">신입</option>
                    <option value="경력">경력</option>
                    <option value="무관">무관</option>
                  </select>
                  <ErrorDisplay name="career" errors={errors} isShaking={isShaking} />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                    학력 조건
                  </label>
                  <select
                    ref={(el) => {
                      inputRefs.current.education = el;
                    }}
                    name="education"
                    value={form.education}
                    onChange={handleChange}
                    className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="">선택</option>
                    <option value="무관">무관</option>
                    <option value="고졸">고졸</option>
                    <option value="대졸(2,3년)">대졸(2,3년)</option>
                    <option value="대졸(4년)">대졸(4년)</option>
                    <option value="석박사">석박사</option>
                  </select>
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
                <label className="mb-2 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                  고용 형태
                </label>
                <select
                  ref={(el) => {
                    inputRefs.current.employment_type = el;
                  }}
                  name="employment_type"
                  value={form.employment_type}
                  onChange={handleChange}
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600 focus:bg-white"
                >
                  <option value="">선택</option>
                  <option value="정규직">정규직</option>
                  <option value="계약직">계약직</option>
                  <option value="인턴">인턴</option>
                  <option value="프리랜서">프리랜서</option>
                </select>
                <ErrorDisplay name="employment_type" errors={errors} isShaking={isShaking} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
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
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600"
                />
                <ErrorDisplay name="salary" errors={errors} isShaking={isShaking} />
              </div>
              <div>
                <label className="mb-2 block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
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
                  className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600"
                />
                <ErrorDisplay name="work_location" errors={errors} isShaking={isShaking} />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label className="block text-sm font-black tracking-wider whitespace-nowrap text-slate-500 uppercase">
                    접수 마감일
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-black text-slate-400 select-none">
                    <input
                      type="checkbox"
                      checked={isAlwaysOpen}
                      onChange={handleAlwaysOpenChange}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                    />
                    상시채용
                  </label>
                </div>
                <div className="flex gap-2">
                  <select
                    name="year"
                    value={dateParts.year}
                    onChange={handleDateChange}
                    disabled={isAlwaysOpen}
                    className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 font-bold outline-none focus:border-blue-600 disabled:opacity-50"
                  >
                    <option value="">년</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                  <select
                    name="month"
                    value={dateParts.month}
                    onChange={handleDateChange}
                    disabled={isAlwaysOpen}
                    className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 font-bold outline-none focus:border-blue-600 disabled:opacity-50"
                  >
                    <option value="">월</option>
                    {months.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                  <select
                    name="day"
                    value={dateParts.day}
                    onChange={handleDateChange}
                    disabled={isAlwaysOpen}
                    className="flex-1 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4 font-bold outline-none focus:border-blue-600 disabled:opacity-50"
                  >
                    <option value="">일</option>
                    {days.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
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
              <div className="relative">
                <motion.input
                  animate={duplicateError ? { x: [-4, 4, -4, 4, 0] } : {}}
                  type="text"
                  value={stackInput}
                  onChange={(e) => setStackInput(e.target.value)}
                  placeholder="스택 검색 (예: React)"
                  className={`w-full rounded-2xl border px-5 py-4 font-bold transition-all outline-none ${
                    duplicateError
                      ? 'border-red-500 bg-red-50/30'
                      : 'border-slate-100 bg-slate-50 focus:border-blue-600 focus:bg-white'
                  }`}
                />

                {stackInput && stackSearchResults && stackSearchResults.length > 0 && (
                  <div className="absolute top-full z-10 mt-2 w-full overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl">
                    {stackSearchResults.map((stack: StackItem) => (
                      <button
                        key={stack.stackId}
                        onClick={() => handleSelectStack(stack)}
                        className="w-full px-5 py-3 text-left font-bold text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      >
                        {stack.stackName}
                      </button>
                    ))}
                  </div>
                )}

                <AnimatePresence>
                  {duplicateError && (
                    <motion.p
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="absolute -bottom-7 left-2 text-xs font-black text-red-500"
                    >
                      이미 추가된 기술 스택입니다.
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex flex-wrap gap-3 pt-2">
                <AnimatePresence>
                  {form.required_stacks.map((stack) => (
                    <motion.span
                      key={stack.stackId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-sm font-black whitespace-nowrap text-blue-600"
                    >
                      {stack.stackName}
                      <button
                        onClick={() => removeStack(stack.stackId)}
                        className="text-blue-300 transition-colors hover:text-blue-600"
                      >
                        <X size={14} />
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
              className="w-48 shrink-0 rounded-3xl py-5 text-xl font-black transition-all hover:bg-slate-100"
            >
              취소
            </Button>
            <Button
              variant="blue"
              size="xl"
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="w-64 shrink-0 rounded-3xl py-5 text-xl font-black shadow-lg shadow-blue-600/20 disabled:opacity-50"
            >
              {mutation.isPending ? '저장 중...' : isEdit ? '수정 완료' : '공고 등록하기'}
            </Button>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-50 flex min-w-80 items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => blocker.reset?.()}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-4xl bg-white p-10 text-center shadow-2xl"
            >
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-2xl font-black tracking-tight whitespace-nowrap text-slate-900">
                작성을 중단할까요?
              </h3>
              <p className="text-lg font-bold text-slate-500">
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
