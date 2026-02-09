import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useMessenger } from '../../hooks/useMessenger';

interface Interview {
  id: number;
  time: string;
  status: string;
  userId: number;
  jobPosting: {
    id: number;
    title: string;
    company: {
      cid: string | number;
      corpName: string;
    };
  };
}

const SystemAlertScheduler = () => {
  const { user } = useAuthStore();
  const { sendSystemNotification } = useMessenger();
  const processedAlerts = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.userId) return;

    const checkAndSendSystemMessages = async () => {
      try {
        const res = await fetch(`/api/interviews/user/${user.userId}`);
        if (!res.ok) return;

        const interviews: Interview[] = await res.json();
        const now = new Date().getTime();

        if (interviews.length === 0) return;

        for (const interview of interviews) {
          if (interview.status !== 'CONFIRMED') continue;

          const interviewTime = new Date(interview.time).getTime();
          const diffMs = interviewTime - now;
          const diffMins = Math.floor(diffMs / 1000 / 60);

          let userMsg = '';
          let companyMsg = '';
          let alertKey = '';

          if (diffMins >= 50 && diffMins <= 70) {
            alertKey = `sys_msg_${interview.id}_60min`;

            if (!localStorage.getItem(alertKey) && !processedAlerts.current.has(alertKey)) {
              userMsg = `[시스템 알림] ⏰ 면접이 약 1시간 뒤에 시작됩니다.\n\n기업: ${interview.jobPosting.company.corpName}\n일시: ${new Date(interview.time).toLocaleString()}`;
              companyMsg = `[시스템 알림] ⏰ 면접이 약 1시간 뒤에 시작됩니다.\n\n지원자: ${user.name} 님\n일시: ${new Date(interview.time).toLocaleString()}`;
            }
          }
          else if (diffMins >= 5 && diffMins <= 15) {
            alertKey = `sys_msg_${interview.id}_10min`;

            if (!localStorage.getItem(alertKey) && !processedAlerts.current.has(alertKey)) {
              userMsg = `[시스템 알림] 🚨 면접이 10분 뒤 시작됩니다! 늦지 않게 준비해주세요.\n기업: ${interview.jobPosting.company.corpName}`;
              companyMsg = `[시스템 알림] 🚨 면접이 10분 뒤 시작됩니다!\n지원자: ${user.name} 님`;
            }
          }

          if (alertKey && (userMsg || companyMsg)) {
            const promises = [];

            if (userMsg) {
              promises.push(
                sendSystemNotification(
                  user.userId,
                  userMsg,
                  interview.jobPosting.id,
                  'USER'
                )
              );
            }

            if (companyMsg && interview.jobPosting.company.cid) {
              promises.push(
                sendSystemNotification(
                  interview.jobPosting.company.cid,
                  companyMsg,
                  interview.jobPosting.id,
                  'COMPANY'
                )
              );
            }

            await Promise.all(promises);

            localStorage.setItem(alertKey, 'sent');
            processedAlerts.current.add(alertKey);
          }
        }
      } catch (error) {
        console.error('[Scheduler] 에러 발생:', error);
      }
    };

    checkAndSendSystemMessages();
    const intervalId = setInterval(checkAndSendSystemMessages, 60000);

    return () => clearInterval(intervalId);
  }, [user?.userId, user?.name, sendSystemNotification]);

  return null;
};

export default SystemAlertScheduler;