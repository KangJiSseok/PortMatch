import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin } from 'lucide-react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-midnight-ink text-cloud-dancer w-full pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-16 grid grid-cols-1 gap-12 md:grid-cols-4">
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
              <li>
                <Link to="/intro" className="hover:text-pure-white block transition-colors">
                  서비스 소개
                </Link>
              </li>
              <li>
                <Link to="/job-postings" className="hover:text-pure-white block transition-colors">
                  채용 공고
                </Link>
              </li>
              <li>
                <Link
                  to="/support/speech-timer"
                  className="hover:text-pure-white block transition-colors"
                >
                  면접 스피치 타이머
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-pure-white mb-6 font-bold">Support</h4>
            <ul className="space-y-4 text-sm opacity-60">
              <li>
                <Link to="/notices" className="hover:text-pure-white block transition-colors">
                  공지사항
                </Link>
              </li>
              <li>
                <Link
                  to="/support/salary"
                  className="hover:text-pure-white block transition-colors"
                >
                  연봉 계산기
                </Link>
              </li>
              <li>
                <Link
                  to="/support/unit-converter"
                  className="hover:text-pure-white block transition-colors"
                >
                  경력 단위 변환기
                </Link>
              </li>
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
