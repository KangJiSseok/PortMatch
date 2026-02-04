import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  X,
  Download,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  User,
  FileText,
  CheckCircle2,
  Calendar,
  MessageSquare,
} from 'lucide-react';

import Button from '../../components/Button/Button';
import {
  fetchCompanyApplications,
  type CompanyApplicationView,
} from '../../api/company/applications';
import { getExtraInterviewViews } from '../../api/myPage';
import { useMessenger } from '../../hooks/useMessenger';

const EMPLOYMENT_STATUS_MAP: Record<string, string> = {
  FULL_TIME: '정규직',
  PART_TIME: '파트타임',
  CONTRACT: '계약직',
  FREELANCE: '프리랜서',
  INTERN: '인턴',
};

const DEGREE_MAP: Record<string, string> = {
  HIGH_SCHOOL: '고졸',
  ASSOCIATE: '전문학사',
  BACHELOR: '학사',
  MASTER: '석사',
  DOCTORATE: '박사',
};

const GRADUATION_STATUS_MAP: Record<string, string> = {
  ENROLLED: '재학',
  GRADUATED: '졸업',
  LEAVE: '휴학',
  DROPPED: '중퇴',
};

interface Career {
  id: number;
  resumeId: number;
  company: string;
  role: string;
  periodStart: string;
  periodEnd: string;
  employmentStatus: string;
  description: string;
  orderIndex: number;
}

interface Education {
  id: number;
  resumeId: number;
  school: string;
  major: string;
  degree: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  orderIndex: number;
}

interface SelfIntroduction {
  id: number;
  resumeId: number;
  title: string;
  answerText: string;
  orderIndex: number;
}

interface Portfolio {
  portfolioId: number;
  resumeId: number;
  fileUrl: string;
  originalFilename: string;
  contentType: string;
  fileSize: number;
}

interface UserProfile {
  id: number;
  resumeId: number;
  name: string;
  contact: string;
  email: string;
  address: string;
  profileImageId: number;
  profileImageUrl: string;
  profileImageName: string;
}

interface Resume {
  id: number;
  userId: number;
  title: string;
  isMain: boolean;
  profile: UserProfile;
  portfolio: Portfolio | null;
  careers: Career[];
  educations: Education[];
  selfIntroductions: SelfIntroduction[];
}

interface ApplicationDetailData {
  applicationId: number;
  jobPostingId: number;
  userId: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  resumeId: number;
  status: string;
  appliedAt: string;
  resume: Resume;
}

interface ApplicationDetailResponse {
  status: boolean;
  code: number;
  message: string;
  data: ApplicationDetailData;
}

function formatYmdDot(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

const JobApplicationManagementPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { startNewChat } = useMessenger(); // [추가] 훅 사용

  const jobPostId = Number(id);
  const safeJobPostId = Number.isFinite(jobPostId) && jobPostId > 0 ? jobPostId : 0;

  const [sortBy, setSortBy] = useState<'최신순' | '경력순' | '이름순'>('최신순');
  const [applications, setApplications] = useState<CompanyApplicationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const [selectedApplication, setSelectedApplication] = useState<ApplicationDetailData | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  // [추가] 채팅방 연결 핸들러
  const handleContactApplicant = async (
    userId: number | string,
    name: string,
    profileImg?: string,
  ) => {
    try {
      // 채팅방 생성 및 열기 (모달보다 Z-Index가 높은 메신저가 뜸)
      await startNewChat(String(userId), name, profileImg);
    } catch (err) {
      console.error('Failed to start chat:', err);
      alert('채팅방을 여는 데 실패했습니다.');
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (safeJobPostId === 0) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const data = await fetchCompanyApplications(safeJobPostId);
        if (cancelled) return;
        setApplications(data);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setError(e instanceof Error ? e.message : '지원자 목록을 불러오지 못했어요.');
        setApplications([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [safeJobPostId]);

  const postingTitle =
    applications[0]?.postingTitle && applications[0].postingTitle !== '공고 제목'
      ? applications[0].postingTitle
      : '지원자 관리';

  const sortedApplications = useMemo(() => {
    const list = [...applications];
    switch (sortBy) {
      case '최신순':
        return list.sort(
          (a, b) => new Date(b.appliedAt).getTime() - new Date(a.appliedAt).getTime(),
        );
      case '경력순':
        return list.sort((a, b) => b.experienceYears - a.experienceYears);
      case '이름순':
        return list.sort((a, b) => a.applicantName.localeCompare(b.applicantName, 'ko'));
      default:
        return list;
    }
  }, [applications, sortBy]);

  const interviewByApplicationId = useMemo(() => {
    const map = new Map<number, true>();
    const extras = getExtraInterviewViews();
    extras.forEach((it) => {
      map.set(it.application_id, true);
    });
    return map;
  }, []);

  const markAsRead = async (applicationId: number) => {
    try {
      await fetch(`/api/applications/${applicationId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: '열람' }),
      });
    } catch (error) {
      console.error('Failed to update application status:', error);
    }
  };

  const handleOpenResumeModal = async (applicationId: number) => {
    setIsDetailLoading(true);
    try {
      const response = await fetch(
        `/api/job-postings/${safeJobPostId}/applications/${applicationId}`,
      );
      if (!response.ok) {
        throw new Error('이력서 상세 정보를 불러오는데 실패했습니다.');
      }
      const json: ApplicationDetailResponse = await response.json();
      setSelectedApplication(json.data);
      setIsModalOpen(true);

      const targetApp = applications.find((app) => app.applicationId === applicationId);
      if (targetApp && (targetApp.status === '미열람' || targetApp.status === 'APPLIED')) {
        setApplications((prev) =>
          prev.map((app) =>
            app.applicationId === applicationId ? { ...app, status: '열람' } : app,
          ),
        );
        markAsRead(applicationId);
      }
    } catch (err) {
      console.error(err);
      alert('이력서 정보를 불러올 수 없습니다.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedApplication(null);
  };

  const goSchedule = (app: CompanyApplicationView) => {
    navigate(`/company/jobs/${safeJobPostId}/applicants/${app.applicationId}/schedule`, {
      state: {
        applicantName: app.applicantName,
        resumeId: app.resumeId,
        postingTitle: app.postingTitle,
        companyName: app.companyName,
        appliedAt: app.appliedAt,
        experience: app.experience,
        experienceYears: app.experienceYears,
      },
    });
  };

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
        <header className="border-point-blue mb-12 flex items-start justify-between border-l-4 pl-6">
          <div className="flex flex-col gap-1">
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap"
            >
              {postingTitle}
            </motion.h1>
            <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
              {loading
                ? '지원자 목록 불러오는 중…'
                : error
                  ? error
                  : applications.length > 0
                    ? `총 ${applications.length}명의 지원자가 합류를 기다리고 있습니다.`
                    : '아직 접수된 지원서가 없습니다.'}
            </p>
          </div>

          <Button
            isBack
            variant="outline"
            size="md"
            className="shrink-0 rounded-xl"
            onClick={() => navigate(-1)}
          />
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <h2 className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap">
                지원자 현황
              </h2>
            </div>

            {!loading && !error && applications.length > 0 && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as '최신순' | '경력순' | '이름순')}
                className="border-silver-mist text-slate-gray focus:border-point-blue bg-pure-white shrink-0 cursor-pointer rounded-xl border px-5 py-2.5 text-sm font-black shadow-sm transition-all focus:outline-none"
              >
                <option value="최신순">최신순 정렬</option>
                <option value="경력순">경력순 정렬</option>
                <option value="이름순">이름순 정렬</option>
              </select>
            )}
          </div>

          <div className="min-h-100">
            {!loading && !error && sortedApplications.length > 0 ? (
              <div className="border-silver-mist bg-pure-white overflow-hidden rounded-4xl border shadow-xl shadow-gray-200/50">
                <div className="divide-cloud-dancer divide-y">
                  {sortedApplications.map((app) => {
                    const hasInterview = interviewByApplicationId.has(app.applicationId);

                    return (
                      <div
                        key={app.applicationId}
                        className="group hover:bg-point-blue/5 flex cursor-pointer items-center justify-between gap-6 p-8 transition-colors"
                        onClick={() => handleOpenResumeModal(app.applicationId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ')
                            handleOpenResumeModal(app.applicationId);
                        }}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-8">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 transition-colors group-hover:bg-white group-hover:text-blue-600">
                            <User size={28} />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-4">
                              <span className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap">
                                {app.applicantName}
                              </span>

                              <span
                                className={`shrink-0 rounded-full px-4 py-1 text-[11px] font-black tracking-widest whitespace-nowrap uppercase ${
                                  app.status === '미열람' || app.status === 'APPLIED'
                                    ? 'text-point-blue bg-blue-50'
                                    : app.status === '합격'
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : app.status === '불합격'
                                        ? 'text-error bg-red-50'
                                        : 'bg-cloud-dancer text-slate-gray'
                                }`}
                              >
                                {app.status === 'APPLIED' ? '미열람' : app.status}
                              </span>

                              {hasInterview && (
                                <span className="bg-cloud-dancer text-slate-gray shrink-0 rounded-full px-4 py-1 text-[11px] font-black tracking-widest whitespace-nowrap uppercase">
                                  INTERVIEW SET
                                </span>
                              )}
                            </div>

                            <div className="text-slate-gray mt-2 flex flex-wrap items-center gap-3 text-[15px] font-bold opacity-40">
                              <span className="whitespace-nowrap">{app.experience}</span>
                              <span className="bg-cloud-dancer h-1.5 w-1.5 rounded-full" />
                              <span className="whitespace-nowrap">
                                지원일: {formatYmdDot(app.appliedAt)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContactApplicant(
                                (app as CompanyApplicationView & { userId: number }).userId || 0,
                                app.applicantName,
                              );
                            }}
                            className="hover:text-point-blue flex h-10 w-10 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-blue-50"
                            title="1:1 메시지 보내기"
                          >
                            <MessageSquare size={20} />
                          </button>

                          <Button
                            variant="light"
                            size="md"
                            className="w-32 rounded-xl whitespace-nowrap"
                            disabled={isDetailLoading}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenResumeModal(app.applicationId);
                            }}
                          >
                            {isDetailLoading ? '로딩 중...' : '이력서 보기'}
                          </Button>

                          {hasInterview ? (
                            <Button
                              variant="outline"
                              size="md"
                              className="w-40 rounded-xl whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                goSchedule(app);
                              }}
                            >
                              일정 수정
                            </Button>
                          ) : (
                            <Button
                              variant="blue"
                              size="md"
                              className="w-40 rounded-xl whitespace-nowrap"
                              onClick={(e) => {
                                e.stopPropagation();
                                goSchedule(app);
                              }}
                            >
                              면접 일정 잡기
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="border-silver-mist bg-pure-white flex flex-col items-center justify-center rounded-[40px] border-2 border-dashed py-32 text-center"
              >
                <div className="bg-cloud-dancer mb-6 flex h-24 w-24 items-center justify-center rounded-3xl">
                  <Users size={48} className="text-midnight-ink opacity-20" />
                </div>
                <h3 className="text-midnight-ink mb-2 text-2xl font-black whitespace-nowrap">
                  {loading ? '불러오는 중…' : '지원자가 없습니다'}
                </h3>
                <p className="text-soft-pebble text-lg font-bold whitespace-nowrap italic">
                  {loading
                    ? '지원자 목록을 가져오고 있어요.'
                    : '아직 이 공고에 지원한 인재가 없습니다.\n공고 홍보를 통해 더 많은 지원자를 모집해보세요.'}
                </p>
                <Button
                  variant="dark"
                  size="lg"
                  className="mt-10 rounded-2xl"
                  onClick={() => navigate('/company/jobs')}
                >
                  공고 목록으로 돌아가기
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isModalOpen && selectedApplication && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="fixed inset-0 z-400 bg-slate-900/70 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed inset-0 z-500 flex items-center justify-center p-4 sm:p-6"
              onClick={closeModal}
            >
              <div
                className="relative flex h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-slate-50 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md sm:px-8">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                      <FileText size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900">
                        {selectedApplication.userName}
                      </h3>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span>{selectedApplication.resume.title}</span>
                        <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                        <span>지원일: {formatYmdDot(selectedApplication.appliedAt)}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={closeModal}
                    className="rounded-full bg-slate-100 p-2 text-slate-400 transition-all hover:bg-slate-200 hover:text-slate-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                <div className="flex-1 space-y-8 overflow-y-auto p-6 sm:p-8">
                  <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                    <div className="flex flex-col gap-8 lg:flex-row">
                      <div className="flex shrink-0 justify-center lg:block">
                        <div className="h-48 w-40 overflow-hidden rounded-2xl bg-slate-100 ring-4 ring-slate-50">
                          {selectedApplication.resume.profile.profileImageUrl ? (
                            <img
                              src={selectedApplication.resume.profile.profileImageUrl}
                              alt="Profile"
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-slate-300">
                              <User size={64} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex-1 space-y-6">
                        <div>
                          <h1 className="text-3xl font-black text-slate-900">
                            {selectedApplication.resume.profile.name}
                          </h1>
                          <p className="mt-2 text-xl font-bold text-blue-600">
                            {selectedApplication.resume.title}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                              <Mail size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                Email
                              </p>
                              <p className="truncate text-sm font-bold text-slate-700">
                                {selectedApplication.resume.profile.email}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                            <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                              <Phone size={18} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                Contact
                              </p>
                              <p className="truncate text-sm font-bold text-slate-700">
                                {selectedApplication.resume.profile.contact}
                              </p>
                            </div>
                          </div>
                          {selectedApplication.resume.profile.address && (
                            <div className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4 md:col-span-2">
                              <div className="rounded-lg bg-white p-2 text-blue-600 shadow-sm">
                                <MapPin size={18} />
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">
                                  Address
                                </p>
                                <p className="truncate text-sm font-bold text-slate-700">
                                  {selectedApplication.resume.profile.address}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedApplication.resume.careers.length > 0 && (
                    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                      <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-slate-900">
                        <Briefcase size={24} className="text-blue-600" /> 경력 사항
                      </h2>
                      <div className="relative space-y-8 pl-2">
                        <div className="absolute top-2 bottom-2 left-6.75 w-0.5 bg-slate-100"></div>
                        {selectedApplication.resume.careers.map((career) => (
                          <div key={career.id} className="relative pl-10">
                            <div className="absolute top-1.5 left-4.75 z-10 h-4 w-4 rounded-full border-4 border-white bg-blue-600 shadow-sm"></div>

                            <div className="mb-2 flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                              <div>
                                <h3 className="text-lg font-black text-slate-900">
                                  {career.company}
                                </h3>
                                <p className="font-bold text-blue-600">{career.role}</p>
                              </div>
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">
                                <Calendar size={12} />
                                {career.periodStart} - {career.periodEnd}
                              </span>
                            </div>

                            <p className="mb-3 text-sm font-medium text-slate-500">
                              {EMPLOYMENT_STATUS_MAP[career.employmentStatus] ||
                                career.employmentStatus}
                            </p>

                            {career.description && (
                              <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                                {career.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplication.resume.educations.length > 0 && (
                    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                      <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-slate-900">
                        <GraduationCap size={24} className="text-blue-600" /> 학력 사항
                      </h2>
                      <div className="space-y-6">
                        {selectedApplication.resume.educations.map((edu) => (
                          <div
                            key={edu.id}
                            className="relative border-l-4 border-slate-100 py-1 pl-6"
                          >
                            <h3 className="text-lg font-black text-slate-900">{edu.school}</h3>
                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                              <p className="text-base font-bold text-slate-600">{edu.major}</p>
                              <span className="h-1 w-1 rounded-full bg-slate-300"></span>
                              <span className="text-sm font-medium text-slate-500">
                                {DEGREE_MAP[edu.degree] || edu.degree} (
                                {GRADUATION_STATUS_MAP[edu.status] || edu.status})
                              </span>
                            </div>
                            <p className="mt-2 flex items-center gap-1 text-sm text-slate-400">
                              <Calendar size={12} />
                              {edu.periodStart} - {edu.periodEnd}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplication.resume.selfIntroductions.length > 0 && (
                    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                      <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-slate-900">
                        <User size={24} className="text-blue-600" /> 자기소개
                      </h2>
                      <div className="space-y-8">
                        {selectedApplication.resume.selfIntroductions.map((intro) => (
                          <div
                            key={intro.id}
                            className="rounded-2xl border border-slate-100 bg-slate-50 p-6"
                          >
                            <div className="mb-4 flex items-start gap-3">
                              <CheckCircle2 size={24} className="shrink-0 text-blue-600" />
                              <h3 className="text-lg leading-snug font-black text-slate-900">
                                {intro.title}
                              </h3>
                            </div>
                            <div className="pl-9">
                              <p className="leading-relaxed font-medium whitespace-pre-wrap text-slate-700">
                                {intro.answerText}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedApplication.resume.portfolio && (
                    <div className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-100">
                      <h2 className="mb-6 flex items-center gap-2 text-xl font-black text-slate-900">
                        <FileText size={24} className="text-blue-600" /> 포트폴리오
                      </h2>
                      <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-6">
                        <div className="flex items-center gap-4">
                          <div className="rounded-xl border border-slate-100 bg-white p-3 text-red-500 shadow-sm">
                            <FileText size={24} />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-lg font-bold text-slate-800">
                              {selectedApplication.resume.portfolio.originalFilename}
                            </p>
                            <p className="text-sm font-bold text-slate-400">PDF Document</p>
                          </div>
                        </div>
                        <a
                          href={selectedApplication.resume.portfolio.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
                        >
                          <Download size={16} />
                          <span className="hidden sm:inline">다운로드</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="sticky bottom-0 z-20 flex justify-end gap-3 border-t border-slate-200 bg-white/90 px-6 py-4 backdrop-blur-md sm:px-8">
                  <Button
                    variant="light"
                    size="lg"
                    onClick={closeModal}
                    className="min-w-24 rounded-xl font-bold"
                  >
                    닫기
                  </Button>

                  <Button
                    variant="outline"
                    size="lg"
                    className="flex items-center gap-2 rounded-xl font-bold text-slate-600 hover:text-blue-600"
                    onClick={() => {
                      handleContactApplicant(
                        selectedApplication.userId,
                        selectedApplication.userName,
                        selectedApplication.resume.profile.profileImageUrl,
                      );
                    }}
                  >
                    <MessageSquare size={18} />
                    1:1 메시지
                  </Button>

                  <Button
                    variant="blue"
                    size="lg"
                    className="rounded-xl font-black shadow-lg shadow-blue-600/20"
                    onClick={() => {
                      const app = applications.find(
                        (a) => a.applicationId === selectedApplication.applicationId,
                      );
                      if (app) goSchedule(app);
                    }}
                  >
                    면접 일정 잡기
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JobApplicationManagementPage;
