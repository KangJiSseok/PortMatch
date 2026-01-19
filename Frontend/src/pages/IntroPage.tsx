import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

import imgS1Top from '../assets/images/intro/s1-top.avif';
import imgS1Bottom from '../assets/images/intro/s1-bottom.avif';
import imgS2 from '../assets/images/intro/s2-ai.avif';
import imgS3Applicant from '../assets/images/intro/s3-applicant.avif';
import imgS3Company from '../assets/images/intro/s3-company.avif';

function IntroPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    if (latest < 0.3) setActiveSection(0);
    else if (latest < 0.75) setActiveSection(1);
    else setActiveSection(2);
  });

  const section1Opacity = useTransform(scrollYProgress, [0.2, 0.3], [1, 0]);
  const section1TopX = useTransform(scrollYProgress, [0, 0.2, 0.3], ["0%", "0%", "-100%"]);
  const section1BottomX = useTransform(scrollYProgress, [0, 0.2, 0.3], ["0%", "0%", "100%"]);

  const section2Opacity = useTransform(scrollYProgress, [0.3, 0.4, 0.65, 0.75], [0, 1, 1, 0]);
  const section2Y = useTransform(scrollYProgress, [0.3, 0.4, 0.65, 0.75], [80, 0, 0, -80]);

  const section3Opacity = useTransform(scrollYProgress, [0.75, 0.85], [0, 1]);

  const handleScrollToSection = (index: number) => {
    if (!containerRef.current) return;
    const scrollHeight = containerRef.current.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollableHeight = scrollHeight - viewportHeight;
    const targets = [0, 0.52, 1];
    window.scrollTo({ top: scrollableHeight * targets[index], behavior: 'smooth' });
  };

  const handleLoginRedirect = (type: 'applicant' | 'company') => {
    console.log(`${type} 로그인 페이지로 이동`);
  };

  return (
    <div ref={containerRef} className="relative h-[450vh] bg-midnight-ink">
      <motion.button
        onClick={() => handleScrollToSection(2)}
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
        className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 mix-blend-difference text-white outline-none group"
      >
        <span className="text-[15px] uppercase tracking-[0.3em] font-bold opacity-60 group-hover:opacity-100">Scroll Down</span>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-60 group-hover:opacity-100">
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </motion.button>

      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-8 px-5 py-8 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full shadow-2xl mix-blend-difference">
        {[0, 1, 2].map((idx) => (
          <button key={idx} onClick={() => handleScrollToSection(idx)} className="flex flex-col items-center gap-3 group outline-none">
            <span className={`text-sm font-black transition-all duration-300 ${activeSection === idx ? 'scale-110 text-white opacity-100' : 'scale-90 text-white/30 group-hover:text-white/60'}`}>0{idx + 1}</span>
            <div className={`transition-all duration-500 rounded-full ${activeSection === idx ? 'h-10 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'h-1.5 w-1.5 bg-white opacity-20 group-hover:opacity-40'}`} />
          </button>
        ))}
      </div>

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.section style={{ opacity: section1Opacity }} className={`absolute inset-0 flex flex-col transition-all duration-300 ${activeSection === 0 ? 'z-30 pointer-events-auto' : 'z-0 pointer-events-none'}`}>
          <motion.div style={{ x: section1TopX }} className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imgS1Top})` }}><div className="absolute inset-0 bg-midnight-ink/85"></div></div>
            <div className="relative z-10 text-center">
              <h2 className="text-cloud-dancer text-sm tracking-[0.3em] uppercase mb-4 font-bold">Individual</h2>
              <p className="text-pure-white text-3xl md:text-5xl font-bold leading-tight">내 강점을 증명할 방법이<br />막막하신가요?</p>
            </div>
          </motion.div>
          <motion.div style={{ x: section1BottomX }} className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imgS1Bottom})` }}><div className="absolute inset-0 bg-pure-white/90"></div></div>
            <div className="relative z-10 text-center">
              <h2 className="text-slate-gray text-sm tracking-[0.3em] uppercase mb-4 font-bold">Company</h2>
              <p className="text-midnight-ink text-3xl md:text-5xl font-bold leading-tight">수많은 포트폴리오 속에서<br />원하는 인재를 찾기 힘드신가요?</p>
            </div>
          </motion.div>
        </motion.section>

        <motion.section style={{ opacity: section2Opacity, y: section2Y }} className={`absolute inset-0 flex flex-col items-center justify-center p-10 text-center overflow-hidden transition-all duration-300 ${activeSection === 1 ? 'z-30 pointer-events-auto' : 'z-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${imgS2})` }}><div className="absolute inset-0 bg-midnight-ink/90"></div></div>
          <div className="relative z-20">
            <span className="text-cloud-dancer tracking-[0.4em] uppercase text-xs font-bold block mb-8">The AI Solution</span>
            <h2 className="text-pure-white text-4xl md:text-7xl font-bold mb-10 leading-tight">Portmatch<br />입체 역량 분석</h2>
            <p className="text-silver-mist text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed">데이터 뒤에 숨겨진 당신의 진짜 가치를<br />AI가 정교하게 찾아내어 최적의 기회와 연결합니다.</p>
          </div>
        </motion.section>

        <motion.section
          style={{ opacity: section3Opacity }}
          className={`absolute inset-0 flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${activeSection === 2 ? 'z-40 pointer-events-auto' : 'z-0 pointer-events-none'}`}
        >
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none select-none mix-blend-difference text-white">
            <h2 className="text-[12vw] md:text-[10rem] font-black uppercase leading-none tracking-tighter opacity-5 whitespace-nowrap">PORTMATCH</h2>
          </div>

          <motion.div
            layout
            initial={{ x: "-100%" }}
            animate={{ x: activeSection === 2 ? "0%" : "-100%" }}
            transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
            whileHover={{ flexGrow: 1.5 }}
            className="h-full relative group overflow-hidden bg-[#111111] cursor-pointer z-20 border-r border-white/5 flex-1"
            onClick={() => handleLoginRedirect('applicant')}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity duration-500">
              <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${imgS3Applicant})` }} />
              <div className="absolute inset-0 bg-black/60"></div>
            </div>
            <div className="relative z-30 h-full flex flex-col items-center justify-center p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-black text-pure-white mb-6 group-hover:-translate-y-2 transition-transform">개인</h2>
              <p className="text-cloud-dancer text-lg md:text-xl font-medium opacity-40 group-hover:opacity-100 transition-all">나만의 분석 레포트를 받고<br />맞춤형 공고에 지원하세요.</p>
            </div>
          </motion.div>

          <motion.div
            layout
            initial={{ x: "100%" }}
            animate={{ x: activeSection === 2 ? "0%" : "100%" }}
            transition={{ type: "spring", stiffness: 100, damping: 20, mass: 1 }}
            whileHover={{ flexGrow: 1.5 }}
            className="h-full relative group overflow-hidden bg-pure-white cursor-pointer z-20 flex-1"
            onClick={() => handleLoginRedirect('company')}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-100 transition-opacity duration-500">
              <div className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${imgS3Company})` }} />
              <div className="absolute inset-0 bg-white/60"></div>
            </div>
            <div className="relative z-30 h-full flex flex-col items-center justify-center p-12 text-center text-midnight-ink">
              <h2 className="text-4xl md:text-5xl font-black mb-6 group-hover:-translate-y-2 transition-transform">기업</h2>
              <p className="text-slate-gray text-lg md:text-xl font-medium opacity-60 group-hover:opacity-100 transition-all">AI가 필터링한 검증된 인재를<br />가장 먼저 만나보세요.</p>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

export default IntroPage;