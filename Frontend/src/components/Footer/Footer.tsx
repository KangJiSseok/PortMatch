function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-midnight-ink text-cloud-dancer min-w-[1024px] pt-20 pb-10">
      <div className="mx-auto w-[1024px] px-6">
        <div className="mb-16 grid grid-cols-4 gap-12">
          <div className="col-span-1">
            <h2 className="text-pure-white mb-6 text-2xl font-black tracking-tighter">PORTMATCH</h2>
            <p className="text-sm leading-relaxed whitespace-nowrap opacity-60">
              AI 기반 입체 역량 분석을 통해
              <br />
              최적의 인재와 기업을 연결합니다.
            </p>
          </div>

          <div>
            <h4 className="text-pure-white mb-6 font-bold">Service</h4>
            <ul className="space-y-4 text-sm opacity-60">
              <li>
                <button className="hover:text-pure-white whitespace-nowrap">개인 서비스</button>
              </li>
              <li>
                <button className="hover:text-pure-white whitespace-nowrap">기업 서비스</button>
              </li>
              <li>
                <button className="hover:text-pure-white whitespace-nowrap">
                  역량 분석 리포트
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-pure-white mb-6 font-bold">Support</h4>
            <ul className="space-y-4 text-sm opacity-60">
              <li>
                <button className="hover:text-pure-white whitespace-nowrap">공지사항</button>
              </li>
              <li>
                <button className="hover:text-pure-white whitespace-nowrap">자주 묻는 질문</button>
              </li>
              <li>
                <button className="hover:text-pure-white whitespace-nowrap">1:1 문의</button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-pure-white mb-6 font-bold">Contact</h4>
            <ul className="space-y-4 text-sm opacity-60">
              <li className="whitespace-nowrap">✉️ support@portmatch.com</li>
              <li className="whitespace-nowrap">📞 02-1234-5678</li>
              <li className="whitespace-nowrap">📍 서울특별시 강남구 테헤란로</li>
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-10 text-xs font-medium opacity-40">
          <p>© {currentYear} PORTMATCH. All rights reserved.</p>
          <div className="flex gap-8">
            <button className="hover:text-pure-white whitespace-nowrap">이용약관</button>
            <button className="hover:text-pure-white font-bold whitespace-nowrap">
              개인정보처리방침
            </button>
            <button className="hover:text-pure-white whitespace-nowrap">쿠키 정책</button>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
