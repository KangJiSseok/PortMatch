import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, FileText, Loader2 } from 'lucide-react';
import Button from '../../components/Button/Button';

import { getCompanyJobs, type JobPostingResponse } from '../../api/jobApi';

interface ModalConfig {
  isOpen: boolean;
  jobId: number | null;
}

const CompanyJobManagementPage = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();

  const [jobs, setJobs] = useState<JobPostingResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<ModalConfig>({
    isOpen: false,
    jobId: null,
  });

  useEffect(() => {
    if (!cid) {
      setIsLoading(false);
      return;
    }

    const loadJobs = async () => {
      try {
        setIsLoading(true);
        const data = await getCompanyJobs(cid);
        setJobs(data || []);
      } catch (error) {
        console.error('Failed to fetch jobs:', error);
        setJobs([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadJobs();
  }, [cid]);

  const openDeleteModal = (jobId: number) => {
    setModal({
      isOpen: true,
      jobId: jobId,
    });
  };

  const closeModal = () => setModal((prev) => ({ ...prev, isOpen: false }));

  const confirmDelete = async () => {
    if (modal.jobId) {
      try {
        const response = await fetch(`/api/job-postings/${modal.jobId}`, {
          method: 'DELETE',
        });
        if (response.ok) {
          setJobs((prev) => prev.filter((job) => job.id !== modal.jobId));
          closeModal();
        }
      } catch (error) {
        console.error('Delete failed:', error);
      }
    }
  };

  return (
    <div className="bg-pure-white min-h-screen min-w-350 pt-32 pb-32">
      <div className="mx-auto w-5xl px-6">
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
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-pure-white relative w-full max-w-100 overflow-hidden rounded-4xl p-8 text-center shadow-xl"
              >
                <h3 className="text-midnight-ink mb-3 text-2xl font-bold tracking-tight">
                  정말 삭제할까요?
                </h3>
                <p className="text-slate-gray mb-8 text-base font-medium opacity-70">
                  삭제된 데이터는 복구할 수 없습니다.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="border-slate-gray/30 text-slate-gray flex-1 rounded-xl font-bold hover:bg-gray-50"
                    onClick={closeModal}
                  >
                    취소
                  </Button>
                  <Button
                    variant="red"
                    size="lg"
                    className="flex-1 rounded-xl font-bold text-white transition-colors"
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
            className="text-midnight-ink text-4xl font-black tracking-tighter whitespace-nowrap uppercase"
          >
            Job Management
          </motion.h1>
          <p className="text-slate-gray mt-2 text-lg font-bold whitespace-nowrap italic opacity-40">
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
              <h2 className="text-midnight-ink text-2xl font-black tracking-tight whitespace-nowrap">
                공고 목록
              </h2>
            </div>
            <Button
              variant="dark"
              size="lg"
              className="flex shrink-0 items-center rounded-2xl px-8 shadow-xl"
              onClick={() => navigate('/company/jobs/new')}
            >
              <Plus size={20} className="mr-2" /> 새 공고 등록하기
            </Button>
          </div>

          <div className="grid gap-6">
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="text-point-blue animate-spin" size={48} />
              </div>
            ) : jobs.length > 0 ? (
              jobs.map((job) => (
                <div
                  key={job.id}
                  onClick={() => navigate(`/job-posts/${job.id}`)}
                  className="group border-silver-mist bg-pure-white flex min-w-full cursor-pointer items-center justify-between rounded-4xl border p-8 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50"
                >
                  <div className="flex min-w-0 flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <span
                        className={`shrink-0 rounded-full px-4 py-1 text-sm font-black tracking-tight ${
                          job.active === 1
                            ? 'bg-emerald-50 text-emerald-600'
                            : 'bg-cloud-dancer text-slate-gray'
                        }`}
                      >
                        {job.active === 1 ? '모집중' : '마감'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <h3
                        className="text-midnight-ink group-hover:text-point-blue group-has-[.no-title-hover:hover]:text-midnight-ink truncate text-2xl font-black tracking-tight transition-colors"
                        title={job.title}
                      >
                        {job.title}
                      </h3>
                      <p className="text-slate-gray mt-1.5 text-sm font-bold whitespace-nowrap opacity-40">
                        {job.startDate} ~ {job.endDate}
                      </p>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-10">
                    <Button
                      variant="outline"
                      className="group/btn no-title-hover text-midnight-ink hover:text-point-blue min-w-24 rounded-2xl border-2 py-3 transition-all hover:bg-slate-50"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/company/jobs/${job.id}/applicants`);
                      }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-midnight-ink group-hover/btn:text-point-blue text-sm font-black tracking-widest uppercase transition-colors">
                          지원자
                        </span>
                        <span className="text-2xl font-black tabular-nums">
                          {job.vcnt.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </Button>

                    <div className="bg-cloud-dancer h-12 w-px"></div>

                    <div className="no-title-hover flex gap-3">
                      <Button
                        variant="light"
                        size="md"
                        className="rounded-xl px-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/company/jobs/edit/${job.id}`);
                        }}
                      >
                        수정
                      </Button>
                      <Button
                        variant="destructive"
                        size="md"
                        className="rounded-xl px-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDeleteModal(job.id);
                        }}
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="border-silver-mist bg-pure-white rounded-[40px] border-2 border-dashed py-32 text-center">
                <FileText size={64} className="text-midnight-ink mx-auto mb-4 opacity-20" />
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
