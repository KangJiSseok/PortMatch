import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users } from 'lucide-react';

import Button from '../../components/Button/Button';
import {
  fetchCompanyApplications,
  type CompanyApplicationView,
} from '../../api/company/applications';
import { getExtraInterviewViews } from '../../api/myPage';

function formatYmdDot(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
}

const JobApplicationManagementPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const jobPostId = Number(id);
  const safeJobPostId = Number.isFinite(jobPostId) && jobPostId > 0 ? jobPostId : 1001;

  const [sortBy, setSortBy] = useState<'최신순' | '경력순' | '이름순'>('최신순');
  const [applications, setApplications] = useState<CompanyApplicationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const data = await fetchCompanyApplications(safeJobPostId);
        if (cancelled) return;
        setApplications(data);
      } catch (e) {
        if (cancelled) return;
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

  const postingTitle = applications[0]?.postingTitle ?? '지원자 관리';

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
  }, [applications]);

  const toggleScrap = (applicationId: number) => {
    setApplications((prev) =>
      prev.map((app) =>
        app.applicationId === applicationId ? { ...app, isScrapped: !app.isScrapped } : app,
      ),
    );
  };

  const goResume = (resumeId: string) => {
    navigate(`/resumes/${resumeId}`);
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
                        onClick={() => goResume(app.resumeId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') goResume(app.resumeId);
                        }}
                      >
                        <div className="flex min-w-0 flex-1 items-center gap-8">
                          <motion.button
                            whileTap={{ scale: 1.3 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleScrap(app.applicationId);
                            }}
                            className={`shrink-0 transition-colors ${
                              app.isScrapped
                                ? 'text-yellow-400'
                                : 'text-cloud-dancer group-hover:text-silver-mist'
                            }`}
                          >
                            <Star size={28} fill={app.isScrapped ? 'currentColor' : 'none'} />
                          </motion.button>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-4">
                              <span className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap">
                                {app.applicantName}
                              </span>

                              <span
                                className={`shrink-0 rounded-full px-4 py-1 text-[11px] font-black tracking-widest whitespace-nowrap uppercase ${
                                  app.status === '미열람'
                                    ? 'text-point-blue bg-blue-50'
                                    : app.status === '합격'
                                      ? 'bg-emerald-50 text-emerald-600'
                                      : app.status === '불합격'
                                        ? 'text-error bg-red-50'
                                        : 'bg-cloud-dancer text-slate-gray'
                                }`}
                              >
                                {app.status}
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
                          <Button
                            variant="light"
                            size="md"
                            className="w-32 rounded-xl whitespace-nowrap"
                            onClick={(e) => {
                              e.stopPropagation();
                              goResume(app.resumeId);
                            }}
                          >
                            이력서 보기
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
    </div>
  );
};

export default JobApplicationManagementPage;
