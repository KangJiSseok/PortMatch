import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

function Footer() {
  const currentYear = new Date().getFullYear();
  const { user } = useAuthStore();
  const isCompany = user?.role === 'COMPANY';

  const serviceLinks = isCompany
    ? [
        { name: '서비스 소개', path: '/intro' },
        { name: '면접 평가지', path: '/support/interview-template' },
        { name: '인재 검색', path: '/company/recommend/candidates' },
      ]
    : [
        { name: '서비스 소개', path: '/intro' },
        { name: '채용 공고', path: '/job-postings' },
        { name: '면접 스피치 타이머', path: '/support/speech-timer' },
      ];

  const supportLinks = isCompany
    ? [
        { name: '공지사항', path: '/notices' },
        { name: '캐파 계산기', path: '/support/sprint-capacity' },
        { name: '인건비 계산기', path: '/support/employer-cost' },
      ]
    : [
        { name: '공지사항', path: '/notices' },
        { name: '연봉 계산기', path: '/support/salary' },
        { name: '글로벌 단위 변환기', path: '/support/unit-converter' },
      ];

  return (
    <footer className="bg-midnight-ink text-cloud-dancer w-full min-w-max pt-20 pb-10">
      <div className="mx-auto w-350 px-6">
        <div className="mb-16 grid grid-cols-4 gap-12">
          <div className="col-span-1">
            <h2 className="text-pure-white mb-6 text-2xl font-black tracking-tighter">
              <Link to="/">PORTMATCH</Link>
            </h2>
            <p className="text-sm leading-relaxed opacity-60">
              AI 기반 입체 역량 분석을 통해
              <br />
              최적의 인재와 기업을 연결합니다.
            </p>
          </div>

          <div>
            <h4 className="text-pure-white mb-6 font-bold">Service</h4>
            <ul className="space-y-4 text-sm opacity-60">
              {serviceLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-pure-white block transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-pure-white mb-6 font-bold">Support</h4>
            <ul className="space-y-4 text-sm opacity-60">
              {supportLinks.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="hover:text-pure-white block transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-pure-white mb-6 font-bold">Contact</h4>
            <div className="space-y-4 text-sm opacity-60">
              <div className="flex items-center gap-2">
                <Mail size={16} />
                <span>support@portmatch.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone size={16} />
                <span>02-1234-5678</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin size={16} className="mt-0.5" />
                <span>서울특별시 강남구 테헤란로</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end border-t border-white/10 pt-10 text-xs font-medium opacity-40">
          <p>© {currentYear} PORTMATCH. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
