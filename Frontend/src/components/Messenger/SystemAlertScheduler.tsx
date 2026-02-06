import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useMessenger } from '../../hooks/useMessenger';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

interface Interview {
  id: number;
  time: string;
  status: string;
  userId: number;
  jobPosting: {
    company: {
      cid: string | number;
      corpName: string;
    };
  };
}

const SystemAlertScheduler = () => {
  const { user } = useAuth();
  const { rooms } = useMessenger();

  useEffect(() => {
    // 1. 기본 조건 체크
    if (!user?.userId) return;
    if (!rooms) return;

    const checkAndSendSystemMessages = async () => {
      try {
        console.log(`[Scheduler] 🕒 알림 스케줄러 실행 중... (User ID: ${user.userId})`);

        const res = await fetch(`/api/interviews/user/${user.userId}`);
        if (!res.ok) {
          console.error('[Scheduler] ❌ 면접 리스트 API 조회 실패');
          return;
        }

        const interviews: Interview[] = await res.json();
        const now = new Date().getTime();

        if (interviews.length === 0) {
          console.log('[Scheduler] 잡힌 면접 일정이 없습니다.');
          return;
        }

        for (const interview of interviews) {
          // 2. 상태 체크 (확정된 면접만)
          if (interview.status !== 'CONFIRMED') continue;

          const interviewTime = new Date(interview.time).getTime();
          const diffMs = interviewTime - now;
          const diffMins = Math.floor(diffMs / 1000 / 60);

          console.log(`[Scheduler] 면접(ID:${interview.id}) 남은 시간: ${diffMins}분`);

          const key60 = `sys_msg_${interview.id}_60min`;
          const key10 = `sys_msg_${interview.id}_10min`;

          let messageToSend = '';
          let storageKey = '';

          // 3. 시간 조건 체크
          if (diffMins >= 59 && diffMins <= 61) {
            if (localStorage.getItem(key60)) {
              console.log(`[Scheduler] 1시간 전 알림 - 이미 전송됨 (Skip)`);
            } else {
              messageToSend = `[시스템 알림] ⏰ 면접이 약 1시간 뒤에 시작됩니다.\n\n일시: ${new Date(interview.time).toLocaleString()}`;
              storageKey = key60;
            }
          } else if (diffMins >= 9 && diffMins <= 11) {
            if (localStorage.getItem(key10)) {
              console.log(`[Scheduler] 10분 전 알림 - 이미 전송됨 (Skip)`);
            } else {
              messageToSend = `[시스템 알림] 🚨 면접이 10분 뒤 시작됩니다! 늦지 않게 준비해주세요.`;
              storageKey = key10;
            }
          }

          // 4. 메시지 발송 로직
          if (messageToSend && storageKey) {
            console.log(`[Scheduler] ✅ 알림 조건 충족! 채팅방 찾는 중...`);

            const targetRoom = rooms.find((r) => {
              if (user.role !== 'COMPANY') {
                return String(r.companyId) === String(interview.jobPosting.company.cid);
              } else {
                return String(r.applicantId) === String(interview.userId);
              }
            });

            if (targetRoom) {
              console.log(`[Scheduler] 🚀 채팅방 찾음 (ID: ${targetRoom.id}) -> 메시지 전송 시도`);

              await addDoc(collection(db, 'chats', targetRoom.id, 'messages'), {
                text: messageToSend,
                senderId: 'system',
                createdAt: serverTimestamp(),
                type: 'text',
                isRead: false,
                systemType: 'alert',
              });

              console.log(`[Scheduler] ✨ 전송 완료!`);
              localStorage.setItem(storageKey, 'sent');
            } else {
              console.warn(`[Scheduler] ❌ 경고: 알림을 보낼 채팅방을 찾지 못했습니다.`);
              console.log(' - 내 역할:', user.role);
              console.log(
                ' - 찾는 대상 ID:',
                user.role === 'COMPANY' ? interview.userId : interview.jobPosting.company.cid,
              );
            }
          }
        }
      } catch (error) {
        console.error('[Scheduler] 에러 발생:', error);
      }
    };

    checkAndSendSystemMessages();
    const intervalId = setInterval(checkAndSendSystemMessages, 60000);

    return () => clearInterval(intervalId);
  }, [user?.userId, rooms, user?.role]);

  return null;
};

export default SystemAlertScheduler;
