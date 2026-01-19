import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Button from '../components/Button/Button';
import { getMyInterviewViewById } from '../api/mockData';

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const mi = String(d.getMinutes()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd} ${hh}:${mi}`;
}

export default function InterviewLobbyPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const interviewId = Number(id);

  const session = useMemo(() => {
    if (!Number.isFinite(interviewId)) return undefined;
    return getMyInterviewViewById(interviewId);
  }, [interviewId]);

  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);

  // 세션 없을 때(잘못된 id) 방어
  if (!session) {
    return (
      <div className="min-h-screen bg-pure-white p-10">
        <header className="border-b border-soft-pebble pb-6">
          <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Lobby</h1>
          <p className="text-slate-gray mt-2">입장 전 대기실</p>
        </header>

        <div className="mt-10 rounded-2xl bg-cloud-dancer p-10 text-center shadow-sm">
          <p className="text-midnight-ink text-lg font-extrabold">유효하지 않은 면접 세션이에요.</p>
          <p className="text-slate-gray mt-2 text-sm">목록에서 다시 선택해 주세요.</p>

          <div className="mt-6 flex justify-center">
            <Button variant="dark" size="md" onClick={() => navigate('/interviews')}>
              면접 목록으로
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pure-white p-10">
      <header className="border-b border-soft-pebble pb-6">
        <h1 className="text-midnight-ink text-4xl font-black tracking-tighter uppercase">Lobby</h1>
        <p className="text-slate-gray mt-2">입장 전 대기실</p>
      </header>

      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* 왼쪽: 정보/설정 */}
        <div className="rounded-2xl bg-cloud-dancer p-8 shadow-sm lg:col-span-1">
          <p className="text-slate-gray text-sm font-bold tracking-widest uppercase">{session.companyName}</p>
          <p className="text-midnight-ink mt-2 text-2xl font-black">{session.postingTitle}</p>
          <p className="text-slate-gray mt-2 text-sm font-semibold">{formatDateTime(session.scheduledAt)}</p>

          {/* MVP지만 room_id도 보여주면 “진짜 연결되는 느낌” 남 */}
          <div className="mt-4 rounded-2xl bg-pure-white p-4">
            <p className="text-midnight-ink text-sm font-extrabold">Room ID</p>
            <p className="text-slate-gray mt-1 text-xs font-semibold break-all">{session.room_id}</p>
          </div>

          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between rounded-2xl bg-pure-white p-4">
              <p className="text-midnight-ink font-extrabold">마이크</p>
              <Button variant={micOn ? 'dark' : 'outline'} size="sm" onClick={() => setMicOn((v) => !v)}>
                {micOn ? 'ON' : 'OFF'}
              </Button>
            </div>

            <div className="flex items-center justify-between rounded-2xl bg-pure-white p-4">
              <p className="text-midnight-ink font-extrabold">카메라</p>
              <Button variant={camOn ? 'dark' : 'outline'} size="sm" onClick={() => setCamOn((v) => !v)}>
                {camOn ? 'ON' : 'OFF'}
              </Button>
            </div>
          </div>

          <div className="mt-8 flex gap-3">
            <Button variant="outline" size="md" onClick={() => navigate('/interviews')}>
              목록
            </Button>
            <Button variant="dark" size="md" onClick={() => navigate(`/interview/${session.interview_id}`)}>
              면접 입장
            </Button>
          </div>
        </div>

        {/* 오른쪽: 미리보기 */}
        <div className="rounded-2xl bg-cloud-dancer p-8 shadow-sm lg:col-span-2">
          <p className="text-midnight-ink text-lg font-extrabold">내 화면 미리보기</p>

          <div className="mt-6 flex h-[360px] items-center justify-center rounded-2xl bg-midnight-ink">
            <span className="text-cloud-dancer font-extrabold">{camOn ? 'CAM PREVIEW' : 'CAM OFF'}</span>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl bg-pure-white p-5">
            <p className="text-midnight-ink font-extrabold">현재 설정</p>
            <p className="text-slate-gray text-sm font-semibold">
              Mic: {micOn ? 'ON' : 'OFF'} / Cam: {camOn ? 'ON' : 'OFF'}
            </p>
          </div>

          {/* 면접 체크리스트 느낌(와이어프레임 보완용) */}
          <div className="mt-6 rounded-2xl bg-pure-white p-5">
            <p className="text-midnight-ink font-extrabold">입장 전 체크</p>
            <ul className="text-slate-gray mt-3 list-disc space-y-1 pl-5 text-sm font-semibold">
              <li>마이크/카메라 설정 확인</li>
              <li>네트워크 안정 확인</li>
              <li>입장 버튼 누르면 바로 면접방으로 이동</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
