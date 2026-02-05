import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useBlocker } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  AlertTriangle,
  X,
  Plus,
  Trash2,
  Layers,
  Upload,
  Image as ImageIcon,
  Save,
  ArrowLeft,
  Edit,
} from 'lucide-react';
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
}

interface ProjectItem {
  id?: number;
  name: string;
  domain: string;
  problem: string;
  solution: string;
  tech: string[];
}

interface CompanyForm {
  corpName: string;
  logo: string | File;
  logoPreview: string;
  busiSize: string;
  totPsncnt: string;
  corpAddr: string;
  homePg: string;
  busiCont: string;
  projects: ProjectItem[];
}

interface CompanyBackendData {
  cid: string;
  corpName: string;
  totPsncnt: string;
  busiSize: string;
  yrSalesAmt: string;
  corpAddr: string;
  homePg: string;
  busiCont: string;
  logo: string;
  projects?: ProjectItem[];
}

type FormErrors = Record<string, string | undefined>;

const LIMITS = {
  CORP_NAME: 30,
  HOME_PG: 200,
  BUSI_SIZE: 20,
  TOT_PSNCNT: 20,
  CORP_ADDR: 100,
  PROJ_NAME: 50,
  PROJ_DOMAIN: 30,
};

const ErrorDisplay = ({ error, isShaking }: { error?: string; isShaking: boolean }) => (
  <div className="mt-2 min-h-6 overflow-hidden">
    <AnimatePresence>
      {error && (
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
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

const CompanyEditForm = ({
  initialData,
  companyId,
}: {
  initialData: CompanyBackendData;
  companyId: string;
}) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isSubmitSuccess = useRef(false);
  const inputRefs = useRef<Record<string, HTMLElement | null>>({});
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState<CompanyForm>({
    corpName: initialData.corpName || '',
    logo: initialData.logo || '',
    logoPreview: initialData.logo || '',
    busiSize: initialData.busiSize || '',
    totPsncnt: initialData.totPsncnt || '',
    corpAddr: initialData.corpAddr || '',
    homePg: initialData.homePg || '',
    busiCont: initialData.busiCont || '',
    projects: initialData.projects || [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isShaking, setIsShaking] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [techSearchInputs, setTechSearchInputs] = useState<Record<number, string>>({});
  const [activeProjectIndex, setActiveProjectIndex] = useState<number | null>(null);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && !isSubmitSuccess.current && currentLocation.pathname !== nextLocation.pathname,
  );

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

  const currentSearchKeyword =
    activeProjectIndex !== null ? techSearchInputs[activeProjectIndex] : '';
  const { data: stackSearchResults } = useQuery({
    queryKey: ['stacks', currentSearchKeyword],
    queryFn: async () => {
      if (!currentSearchKeyword || !currentSearchKeyword.trim()) return [];
      const response = await axios.get(`/api/stacks/name/${currentSearchKeyword}`);
      const rawData = response.data.data || [];

      return rawData
        .map((item: RawStackItem) => ({
          stackId: item.stackId || item.id || 0,
          stackName: item.stackName || item.name || item.stack_name || '',
        }))
        .filter((item: StackItem) => item.stackId !== 0);
    },
    enabled: !!currentSearchKeyword,
    staleTime: 1000 * 60,
  });

  const mutation = useMutation({
    mutationFn: async (formData: CompanyForm) => {
      const response = await axios.put(`/api/companies/${companyId}`, formData, {
        withCredentials: true,
      });
      return response.data;
    },
    onSuccess: () => {
      isSubmitSuccess.current = true;
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
      navigate(`/companies/${companyId}`);
    },
    onError: (error) => {
      console.error('Update failed:', error);
      alert('저장에 실패했습니다. 입력을 확인해주세요.');
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

    if (!form.corpName.trim()) newErrors.corpName = '기업명을 입력해주세요.';
    if (!form.busiSize.trim()) newErrors.busiSize = '산업군을 입력해주세요.';
    if (!form.busiCont.trim()) newErrors.busiCont = '기업 소개를 입력해주세요.';

    form.projects.forEach((proj, index) => {
      if (!proj.name.trim()) newErrors[`projects.${index}.name`] = '프로젝트명을 입력해주세요.';
      if (!proj.problem.trim())
        newErrors[`projects.${index}.problem`] = '문제 정의를 입력해주세요.';
      if (!proj.solution.trim())
        newErrors[`projects.${index}.solution`] = '해결 방안을 입력해주세요.';
    });

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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleLogoUploadClick = () => {
    logoInputRef.current?.click();
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setForm((prev) => ({
        ...prev,
        logo: file,
        logoPreview: previewUrl,
      }));
      setIsDirty(true);
    }
  };

  const handleAddProject = () => {
    setForm((prev) => ({
      ...prev,
      projects: [...prev.projects, { name: '', domain: '', problem: '', solution: '', tech: [] }],
    }));
    setIsDirty(true);
  };

  const initiateRemoveProject = (index: number) => {
    setDeleteTargetIndex(index);
  };

  const confirmRemoveProject = () => {
    if (deleteTargetIndex === null) return;

    setForm((prev) => ({
      ...prev,
      projects: prev.projects.filter((_, i) => i !== deleteTargetIndex),
    }));

    const newInputs = { ...techSearchInputs };
    delete newInputs[deleteTargetIndex];
    setTechSearchInputs(newInputs);

    setIsDirty(true);
    setDeleteTargetIndex(null);
  };

  const cancelRemoveProject = () => {
    setDeleteTargetIndex(null);
  };

  const handleProjectChange = (
    index: number,
    field: keyof ProjectItem,
    value: string | string[],
  ) => {
    setForm((prev) => {
      const newProjects = [...prev.projects];
      newProjects[index] = { ...newProjects[index], [field]: value };
      return { ...prev, projects: newProjects };
    });
    setIsDirty(true);

    const errorKey = `projects.${index}.${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: undefined }));
    }
  };

  const handleTechInputChange = (index: number, value: string) => {
    setTechSearchInputs((prev) => ({ ...prev, [index]: value }));
    setActiveProjectIndex(index);
  };

  const handleSelectStack = (index: number, stack: StackItem) => {
    const currentTechs = form.projects[index].tech || [];
    if (!currentTechs.includes(stack.stackName)) {
      handleProjectChange(index, 'tech', [...currentTechs, stack.stackName]);
    }
    setTechSearchInputs((prev) => ({ ...prev, [index]: '' }));
    setIsDirty(true);
  };

  const removeProjectTech = (index: number, techToRemove: string) => {
    const currentTechs = form.projects[index].tech || [];
    handleProjectChange(
      index,
      'tech',
      currentTechs.filter((t) => t !== techToRemove),
    );
  };

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -120;
      const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-pure-white text-midnight-ink min-h-screen min-w-7xl pb-20">
      <section className="relative flex min-h-80 w-full flex-col justify-end overflow-hidden pb-12">
        <div className="absolute inset-0 bg-slate-900">
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff33_1px,transparent_1px)] bg-size-[20px_20px] opacity-30" />
          <div className="absolute inset-0 bg-linear-to-b from-transparent to-slate-950/80" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-end gap-6"
          >
            <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-md">
              <Edit size={48} className="text-white" />
            </div>
            <div>
              <h1 className="text-pure-white mb-2 text-5xl font-black tracking-tight">
                Edit Profile
              </h1>
              <p className="text-lg font-bold text-slate-400">기업 정보를 매력적으로 꾸며보세요</p>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto mt-12 w-full max-w-7xl px-8">
        <div className="grid grid-cols-12 gap-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-8 space-y-12"
          >
            <section
              id="section-basic"
              className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                기본 정보
              </h2>

              <div className="space-y-8">
                <div>
                  <label className="mb-3 block text-sm font-black tracking-wider text-slate-500 uppercase">
                    기업 로고
                  </label>
                  <div
                    onClick={handleLogoUploadClick}
                    className="group relative flex w-full cursor-pointer items-center gap-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 transition-all hover:border-blue-500 hover:bg-blue-50/50"
                  >
                    <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-transform group-hover:scale-105">
                      {form.logoPreview ? (
                        <img
                          src={form.logoPreview}
                          alt="Logo Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="text-slate-300" size={32} />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-lg font-bold text-slate-700">
                        {form.logoPreview ? '로고 변경하기' : '로고 이미지 업로드'}
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-400">
                        클릭하여 파일을 선택하세요 (JPG, PNG)
                      </p>
                    </div>
                    <div className="mr-3 rounded-full border border-slate-100 bg-white p-4 text-slate-400 shadow-sm group-hover:text-blue-500">
                      <Upload size={24} />
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      hidden
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-500">
                      기업명{' '}
                      <span className="ml-1 text-xs font-medium text-slate-300">
                        ({form.corpName.length}/{LIMITS.CORP_NAME})
                      </span>
                    </label>
                    <input
                      ref={(el) => {
                        inputRefs.current.corpName = el;
                      }}
                      type="text"
                      name="corpName"
                      value={form.corpName}
                      maxLength={LIMITS.CORP_NAME}
                      onChange={handleChange}
                      placeholder="기업명을 입력해주세요"
                      className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                        errors.corpName
                          ? 'border-red-500 bg-red-50/30'
                          : 'border-slate-200 focus:border-blue-600 focus:bg-white'
                      }`}
                    />
                    <ErrorDisplay error={errors.corpName} isShaking={isShaking} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-500">홈페이지</label>
                    <input
                      type="text"
                      name="homePg"
                      value={form.homePg}
                      maxLength={LIMITS.HOME_PG}
                      onChange={handleChange}
                      placeholder="URL을 입력해주세요"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-500">
                      산업군{' '}
                      <span className="ml-1 text-xs font-medium text-slate-300">
                        ({form.busiSize.length}/{LIMITS.BUSI_SIZE})
                      </span>
                    </label>
                    <input
                      ref={(el) => {
                        inputRefs.current.busiSize = el;
                      }}
                      type="text"
                      name="busiSize"
                      value={form.busiSize}
                      maxLength={LIMITS.BUSI_SIZE}
                      onChange={handleChange}
                      placeholder="예: IT, 금융"
                      className={`w-full rounded-2xl border bg-slate-50 px-5 py-4 font-bold transition-all outline-none ${
                        errors.busiSize
                          ? 'border-red-500 bg-red-50/30'
                          : 'border-slate-200 focus:border-blue-600 focus:bg-white'
                      }`}
                    />
                    <ErrorDisplay error={errors.busiSize} isShaking={isShaking} />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-black text-slate-500">
                      사원수{' '}
                      <span className="ml-1 text-xs font-medium text-slate-300">
                        ({form.totPsncnt.length}/{LIMITS.TOT_PSNCNT})
                      </span>
                    </label>
                    <input
                      type="text"
                      name="totPsncnt"
                      value={form.totPsncnt}
                      maxLength={LIMITS.TOT_PSNCNT}
                      onChange={handleChange}
                      placeholder="예: 50명"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-sm font-black text-slate-500">
                    주소{' '}
                    <span className="ml-1 text-xs font-medium text-slate-300">
                      ({form.corpAddr.length}/{LIMITS.CORP_ADDR})
                    </span>
                  </label>
                  <input
                    type="text"
                    name="corpAddr"
                    value={form.corpAddr}
                    maxLength={LIMITS.CORP_ADDR}
                    onChange={handleChange}
                    placeholder="기업 상세 주소"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold transition-all outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            </section>

            <section
              id="section-detail"
              className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
            >
              <h2 className="border-point-blue text-midnight-ink mb-10 border-l-8 pl-6 text-3xl font-black tracking-tighter">
                기업 상세 소개
              </h2>
              <textarea
                ref={(el) => {
                  inputRefs.current.busiCont = el;
                }}
                name="busiCont"
                value={form.busiCont}
                onChange={handleChange}
                rows={8}
                placeholder="기업의 비전, 미션, 문화 등을 자유롭게 작성해주세요."
                className={`w-full rounded-3xl border bg-slate-50 px-6 py-6 text-lg leading-relaxed font-medium transition-all outline-none ${
                  errors.busiCont
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-slate-200 focus:border-blue-600 focus:bg-white'
                }`}
              />
              <ErrorDisplay error={errors.busiCont} isShaking={isShaking} />
            </section>

            <section
              id="section-projects"
              className="border-silver-mist bg-pure-white rounded-[40px] border p-12 shadow-sm"
            >
              <div className="mb-10 flex items-center justify-between">
                <h2 className="border-point-blue text-midnight-ink border-l-8 pl-6 text-3xl font-black tracking-tighter">
                  기업 프로젝트 내역
                </h2>
                <Button
                  variant="light"
                  size="sm"
                  onClick={handleAddProject}
                  className="rounded-xl bg-blue-50 px-4 text-blue-600 hover:bg-blue-100"
                >
                  <Plus size={16} className="mr-2" /> 프로젝트 추가
                </Button>
              </div>

              <div className="space-y-8">
                {form.projects.length === 0 ? (
                  <div className="rounded-[30px] border-2 border-dashed border-slate-200 bg-slate-50/50 py-16 text-center">
                    <Layers size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-lg font-bold text-slate-400">등록된 프로젝트가 없습니다.</p>
                  </div>
                ) : (
                  form.projects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-silver-mist overflow-hidden rounded-[30px] border bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-8 py-4">
                        <span className="text-sm font-black tracking-widest text-slate-500 uppercase">
                          Project #{index + 1}
                        </span>
                        <button
                          onClick={() => initiateRemoveProject(index)}
                          className="group rounded-xl p-2 text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>

                      <div className="space-y-6 p-8">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="mb-2 block text-xs font-black text-slate-400">
                              프로젝트명{' '}
                              <span className="font-medium text-slate-300">
                                ({project.name.length}/{LIMITS.PROJ_NAME})
                              </span>
                            </label>
                            <input
                              ref={(el) => {
                                inputRefs.current[`projects.${index}.name`] = el;
                              }}
                              value={project.name}
                              maxLength={LIMITS.PROJ_NAME}
                              onChange={(e) => handleProjectChange(index, 'name', e.target.value)}
                              placeholder="프로젝트명을 입력해주세요"
                              className={`w-full rounded-xl border px-4 py-3 font-bold transition-all outline-none ${
                                errors[`projects.${index}.name`]
                                  ? 'border-red-500 bg-red-50'
                                  : 'border-slate-200 focus:border-blue-600'
                              }`}
                            />
                          </div>
                          <div>
                            <label className="mb-2 block text-xs font-black text-slate-400">
                              Domain{' '}
                              <span className="font-medium text-slate-300">
                                ({project.domain.length}/{LIMITS.PROJ_DOMAIN})
                              </span>
                            </label>
                            <input
                              value={project.domain}
                              maxLength={LIMITS.PROJ_DOMAIN}
                              onChange={(e) => handleProjectChange(index, 'domain', e.target.value)}
                              placeholder="분야 (ex: FinTech)"
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 font-bold outline-none focus:border-blue-600"
                            />
                          </div>
                        </div>

                        <div className="relative">
                          <label className="mb-2 block text-xs font-black text-slate-400">
                            Tech Stack
                          </label>
                          <div className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 font-bold transition-all focus-within:border-blue-600">
                            {project.tech.length > 0 && (
                              <div className="mb-3 flex flex-wrap gap-2">
                                {project.tech.map((t, tIndex) => (
                                  <span
                                    key={tIndex}
                                    className="inline-flex items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2.5 py-1 text-sm font-bold text-blue-600"
                                  >
                                    {t}
                                    <button
                                      onClick={() => removeProjectTech(index, t)}
                                      className="ml-1 rounded-full p-0.5 text-blue-800 hover:bg-blue-100"
                                    >
                                      <X size={12} />
                                    </button>
                                  </span>
                                ))}
                              </div>
                            )}
                            <input
                              type="text"
                              value={techSearchInputs[index] || ''}
                              onChange={(e) => handleTechInputChange(index, e.target.value)}
                              onFocus={() => setActiveProjectIndex(index)}
                              placeholder="사용된 기술 스택을 검색하여 추가해주세요 (ex: React)"
                              className="w-full font-bold outline-none placeholder:text-slate-400"
                            />
                          </div>
                          <AnimatePresence>
                            {activeProjectIndex === index &&
                              techSearchInputs[index] &&
                              stackSearchResults &&
                              stackSearchResults.length > 0 && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0 }}
                                  className="absolute top-full right-0 left-0 z-20 mt-2 max-h-60 overflow-y-auto rounded-xl border border-slate-100 bg-white shadow-xl"
                                >
                                  {stackSearchResults.map((stack: StackItem) => (
                                    <button
                                      key={stack.stackId}
                                      onClick={() => handleSelectStack(index, stack)}
                                      className="w-full px-5 py-3 text-left font-bold text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                                    >
                                      {stack.stackName}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                          </AnimatePresence>
                        </div>

                        <div>
                          <label className="mb-2 block text-xs font-black text-slate-400 uppercase">
                            Problem
                          </label>
                          <textarea
                            ref={(el) => {
                              inputRefs.current[`projects.${index}.problem`] = el;
                            }}
                            value={project.problem}
                            onChange={(e) => handleProjectChange(index, 'problem', e.target.value)}
                            rows={3}
                            placeholder="프로젝트에서 해결하고자 했던 핵심 문제를 작성해주세요"
                            className={`w-full resize-none rounded-xl border px-4 py-3 font-bold outline-none ${
                              errors[`projects.${index}.problem`]
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 focus:border-blue-600'
                            }`}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-xs font-black text-slate-400 uppercase">
                            Solution
                          </label>
                          <textarea
                            ref={(el) => {
                              inputRefs.current[`projects.${index}.solution`] = el;
                            }}
                            value={project.solution}
                            onChange={(e) => handleProjectChange(index, 'solution', e.target.value)}
                            rows={3}
                            placeholder="문제를 해결하기 위해 도입한 기술적/논리적 해결 방안을 작성해주세요"
                            className={`w-full resize-none rounded-xl border px-4 py-3 font-bold outline-none ${
                              errors[`projects.${index}.solution`]
                                ? 'border-red-500 bg-red-50'
                                : 'border-slate-200 focus:border-blue-600'
                            }`}
                          />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </motion.div>

          <aside className="col-span-4">
            <div className="sticky top-24 space-y-6">
              <div className="bg-pure-white rounded-[40px] border border-zinc-100 p-8 shadow-sm">
                <h3 className="text-midnight-ink mb-6 text-sm font-black tracking-widest uppercase opacity-40">
                  Actions
                </h3>
                <div className="space-y-4">
                  <Button
                    variant="blue"
                    fullWidth
                    size="xl"
                    onClick={handleSubmit}
                    disabled={mutation.isPending}
                    className="rounded-2xl py-4 text-lg font-black shadow-lg shadow-blue-600/20"
                  >
                    <Save size={20} className="mr-2" />
                    {mutation.isPending ? '저장 중...' : '변경사항 저장'}
                  </Button>
                  <Button
                    variant="outline"
                    fullWidth
                    size="xl"
                    onClick={() => navigate(-1)}
                    className="rounded-2xl py-4 text-lg font-bold hover:bg-slate-100"
                  >
                    <ArrowLeft size={20} className="mr-2" />
                    취소하고 돌아가기
                  </Button>
                </div>
              </div>

              <div className="bg-pure-white rounded-[40px] border border-zinc-100 p-8 shadow-sm">
                <h3 className="text-midnight-ink mb-6 text-sm font-black tracking-widest uppercase opacity-40">
                  Quick Menu
                </h3>
                <nav className="space-y-2">
                  {[
                    { id: 'section-basic', label: '기본 정보' },
                    { id: 'section-detail', label: '기업 상세 소개' },
                    { id: 'section-projects', label: '프로젝트 내역' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => scrollToId(item.id)}
                      className="group flex w-full items-center rounded-xl p-3 transition-all hover:bg-slate-50"
                    >
                      <div className="h-2 w-2 rounded-full bg-slate-300 transition-colors group-hover:bg-blue-600" />
                      <span className="ml-4 font-bold text-slate-500 transition-colors group-hover:text-blue-600">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <AnimatePresence>
        {blocker.state === 'blocked' && (
          <div className="fixed inset-0 z-50 flex min-w-7xl items-center justify-center p-6">
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
              className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white p-10 text-center shadow-2xl"
            >
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
                <AlertTriangle size={32} />
              </div>
              <h3 className="mb-2 text-2xl font-black tracking-tight whitespace-nowrap text-slate-900">
                작성을 중단할까요?
              </h3>
              <p className="text-lg font-bold text-slate-500">
                페이지를 벗어나면 입력하신 <br /> 정보가 저장되지 않습니다.
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

      <AnimatePresence>
        {deleteTargetIndex !== null && (
          <div className="fixed inset-0 z-50 flex min-w-7xl items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={cancelRemoveProject}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md overflow-hidden rounded-[40px] bg-white p-10 text-center shadow-2xl"
            >
              <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Trash2 size={32} />
              </div>
              <h3 className="mb-2 text-2xl font-black tracking-tight whitespace-nowrap text-slate-900">
                프로젝트 삭제
              </h3>
              <p className="text-lg font-bold text-slate-500">
                해당 프로젝트 내역을 <br />
                정말 삭제하시겠습니까?
              </p>
              <div className="mt-8 flex gap-4">
                <Button
                  variant="outline"
                  size="lg"
                  className="flex-1 rounded-2xl"
                  onClick={cancelRemoveProject}
                >
                  취소
                </Button>
                <Button
                  variant="red"
                  size="lg"
                  className="flex-1 rounded-2xl shadow-lg"
                  onClick={confirmRemoveProject}
                >
                  삭제하기
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CompanyEditPage = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user && user.role === 'COMPANY' && user.cid && companyId) {
      if (String(user.cid) !== String(companyId)) {
        alert('수정 권한이 없습니다.');
        navigate(`/companies/${companyId}`);
      }
    }
  }, [user, companyId, navigate]);

  const { data: companyData, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const response = await axios.get(`/api/companies/${companyId}`);
      return response.data.data as CompanyBackendData;
    },
    enabled: !!companyId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  if (isLoading || !companyData) {
    return (
      <div className="bg-pure-white flex min-h-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      </div>
    );
  }

  return <CompanyEditForm initialData={companyData} companyId={companyId!} />;
};

export default CompanyEditPage;
