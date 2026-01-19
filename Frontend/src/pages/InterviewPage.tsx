import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Button from '../components/Button/Button';

export default function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  return (
    <div className="min-h-screen bg-pure-white p-10">
      <header className="border-b border-soft-pebble pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Interview Room</h1>
        <p className="text-slate-gray mt-2">Session #{id}</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 메인: 기업 화면 */}
        <div className="rounded-2xl bg-cloud-dancer p-8 shadow-sm lg:col-span-2">
          <p className="text-midnight-ink text-lg font-extrabold">기업 화면</p>
          <div className="mt-6 flex h-[520px] items-center justify-center rounded-2xl bg-midnight-ink">
            <span className="text-cloud-dancer font-extrabold">COMPANY VIDEO</span>
          </div>
        </div>

        {/* 사이드: 내 화면 */}
        <div className="rounded-2xl bg-cloud-dancer p-8 shadow-sm lg:col-span-1">
          <p className="text-midnight-ink text-lg font-extrabold">내 화면</p>
          <div className="mt-6 flex h-[260px] items-center justify-center rounded-2xl bg-midnight-ink">
            <span className="text-cloud-dancer font-extrabold">{camOn ? 'MY VIDEO' : 'CAM OFF'}</span>
          </div>

          <div className="mt-6 rounded-2xl bg-pure-white p-5">
            <p className="text-midnight-ink font-extrabold">상태</p>
            <p className="text-slate-gray mt-2 text-sm font-semibold">
              Mic: {micOn ? 'ON' : 'OFF'} / Cam: {camOn ? 'ON' : 'OFF'}
            </p>
          </div>
        </div>
      </div>

      {/* 컨트롤 바 */}
      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-cloud-dancer p-6 shadow-sm">
        <div className="flex gap-3">
          <Button variant={!micOn ? 'dark' : 'outline'} size="md" onClick={() => setMicOn((v) => !v)}>
            마이크 {micOn ? 'OFF' : 'ON'}
          </Button>
          <Button variant={!camOn ? 'dark' : 'outline'} size="md" onClick={() => setCamOn((v) => !v)}>
            카메라 {camOn ? 'OFF' : 'ON'}
          </Button>
        </div>

        <Button
          variant="dark"
          size="md"
          onClick={() => {
            // MVP: 나가기 → 면접 목록으로
            navigate('/interviews');
          }}
        >
          나가기
        </Button>
      </div>
    </div>
  );
}
