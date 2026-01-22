import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../components/Button/Button';

interface JobPosting {
  id: string;
  title: string;
  createdAt: string;
  applicantCount: number;
  status: '모집중' | '마감';
  category: string;
}

interface ModalConfig {
  isOpen: boolean;
  jobId: string | null;
  title: string;
  message: string;
}

const CompanyJobManagementPage = () => {
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobPosting[]>([
    {
      id: '1',
      title: '시니어 프론트엔드 개발자 채용 (React)',
      createdAt: '2024.03.20',
      applicantCount: 12,
      status: '모집중',
      category: '개발',
    },
    {
      id: '2',
      title: '서비스 UI/UX 디자이너 신입/경력',
      createdAt: '2024.03.18',
      applicantCount: 8,
      status: '모집중',
      category: '디자인',
    },
    {
      id: '3',
      title: '플랫폼 운영 매니저 채용',
      createdAt: '2024.03.10',
      applicantCount: 24,
      status: '마감',
      category: '기획',
    },
  ]);

  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    jobId: null,
    title: '',
    message: '',
  });

  const openDeleteModal = (job: JobPosting) => {
    setModal({
      isOpen: true,
      jobId: job.id,
      title: '공고 삭제',
      message: `[${job.title}] 공고를 삭제하시겠습니까?\n삭제된 공고는 복구할 수 없습니다.`,
    });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const confirmDelete = () => {
    if (modal.jobId) {
      setJobs((prev) => prev.filter((job) => job.id !== modal.jobId));
      closeModal();
    }
  };

  return (
    <div className="bg-pure-white min-h-screen pt-32 pb-32">
      <div className="mx-auto max-w-5xl px-6">
        <AnimatePresence>
          {modal.isOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={closeModal}
                className="bg-midnight-ink/60 fixed inset-0 backdrop-blur-sm"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="bg-pure-white relative w-full max-w-md overflow-hidden rounded-[40px] p-10 text-center shadow-2xl"
              >
                <div className="text-error mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </div>
                <h3 className="text-midnight-ink mb-2 text-2xl font-black tracking-tight">
                  {modal.title}
                </h3>
                <p className="text-slate-gray mb-10 leading-relaxed font-bold whitespace-pre-wrap opacity-60">
                  {modal.message}
                </p>
                <div className="flex gap-4">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 rounded-2xl"
                    onClick={closeModal}
                  >
                    취소
                  </Button>
                  <Button
                    variant="red"
                    size="lg"
                    className="flex-1 rounded-2xl shadow-lg"
                    onClick={confirmDelete}
                  >
                    삭제하기
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <header className="border-point-blue mb-12 border-l-4 pl-6">
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-midnight-ink text-4xl font-black tracking-tighter uppercase"
          >
            Job Management
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold italic opacity-40">
            등록된 공고를 관리하고 인재 채용 현황을 실시간으로 확인하세요.
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-point-blue h-6 w-1.5 rounded-full" />
              <h2 className="text-midnight-ink text-2xl font-black tracking-tight">공고 목록</h2>
            </div>
            <Button
              variant="dark"
              size="lg"
              className="rounded-2xl px-8 shadow-xl"
              onClick={() => navigate('/company/jobs/new')}
            >
              <span className="mr-2 text-xl">+</span> 새 공고 등록하기
            </Button>
          </div>

          <div className="grid gap-6">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div
                  key={job.id}
                  className="border-silver-mist bg-pure-white flex items-center justify-between rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-4 py-1 text-xs font-black tracking-tight ${
                          job.status === '모집중'
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-cloud-dancer text-slate-gray'
                        }`}
                      >
                        {job.status}
                      </span>
                      <span className="text-soft-pebble text-sm font-black tracking-widest uppercase">
                        {job.category}
                      </span>
                    </div>
                    <div>
                      <h3
                        onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                        className="text-midnight-ink hover:text-point-blue cursor-pointer text-2xl font-black tracking-tight transition-colors"
                      >
                        {job.title}
                      </h3>
                      <p className="text-slate-gray mt-1.5 text-sm font-bold opacity-40">
                        {job.createdAt} 등록됨
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-10">
                    <div
                      onClick={() => navigate(`/company/jobs/${job.id}/applicants`)}
                      className="group flex cursor-pointer flex-col items-center gap-1"
                    >
                      <span className="text-soft-pebble group-hover:text-slate-gray text-xs font-black tracking-widest uppercase">
                        지원자
                      </span>
                      <span className="text-midnight-ink group-hover:text-point-blue text-3xl font-black tabular-nums">
                        {job.applicantCount.toString().padStart(2, '0')}
                      </span>
                    </div>

                    <div className="bg-cloud-dancer h-12 w-px"></div>

                    <div className="flex gap-3">
                      <Button
                        variant="light"
                        size="md"
                        className="rounded-xl px-6"
                        onClick={() => navigate(`/company/jobs/edit/${job.id}`)}
                      >
                        수정
                      </Button>
                      <Button
                        variant="destructive"
                        size="md"
                        className="rounded-xl px-6"
                        onClick={() => openDeleteModal(job)}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="border-silver-mist bg-pure-white rounded-[40px] border-2 border-dashed py-32 text-center">
                <div className="mb-4 text-6xl opacity-20">📄</div>
                <p className="text-soft-pebble text-xl font-black italic">
                  아직 등록된 공고가 없습니다.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CompanyJobManagementPage;
