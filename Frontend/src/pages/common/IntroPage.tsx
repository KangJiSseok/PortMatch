import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';

import imgS1Top from '../../assets/images/intro/s1-top.avif';
import imgS1Bottom from '../../assets/images/intro/s1-bottom.avif';
import imgS2 from '../../assets/images/intro/s2-ai.avif';
import imgS3Applicant from '../../assets/images/intro/s3-applicant.avif';
import imgS3Company from '../../assets/images/intro/s3-company.avif';

function IntroPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const navigate = useNavigate();

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    if (latest < 0.3) setActiveSection(0);
    else if (latest < 0.75) setActiveSection(1);
    else setActiveSection(2);
  });

  const section1Opacity = useTransform(smoothProgress, [0.2, 0.3], [1, 0]);
  const section1TopX = useTransform(smoothProgress, [0, 0.2, 0.3], ['0%', '0%', '-100%']);
  const section1BottomX = useTransform(smoothProgress, [0, 0.2, 0.3], ['0%', '0%', '100%']);

  const section2Opacity = useTransform(smoothProgress, [0.3, 0.4, 0.65, 0.75], [0, 1, 1, 0]);
  const section2Y = useTransform(smoothProgress, [0.3, 0.4, 0.65, 0.75], [80, 0, 0, -80]);

  const section3Opacity = useTransform(smoothProgress, [0.75, 0.85], [0, 1]);

  const handleScrollToSection = (index: number) => {
    if (!containerRef.current) return;
    const scrollHeight = containerRef.current.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollableHeight = scrollHeight - viewportHeight;
    const targets = [0, 0.52, 1];
    window.scrollTo({ top: scrollableHeight * targets[index], behavior: 'smooth' });
  };

  const handleLoginRedirect = (type: 'APPLICANT' | 'COMPANY') => {
    navigate('/login', { state: { userType: type } });
  };

  return (
    <div
      ref={containerRef}
      className="bg-midnight-ink relative h-[450vh] min-w-5xl snap-y snap-mandatory"
    >
      <div className="pointer-events-none absolute top-0 left-0 h-screen w-full snap-start" />
      <div className="pointer-events-none absolute top-[175vh] left-0 h-screen w-full snap-center" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-screen w-full snap-end" />

      <motion.button
        onClick={() => handleScrollToSection(2)}
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="group fixed bottom-10 left-1/2 z-100 flex -translate-x-1/2 flex-col items-center gap-2 text-white mix-blend-difference outline-none"
      >
        <span className="text-[15px] font-bold tracking-[0.3em] whitespace-nowrap uppercase opacity-60 group-hover:opacity-100">
          Scroll Down
        </span>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="opacity-60 group-hover:opacity-100"
        >
          <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
        </svg>
      </motion.button>

      <div className="fixed top-1/2 right-8 z-100 flex -translate-y-1/2 flex-col gap-8 rounded-full border border-white/10 bg-white/5 px-5 py-8 mix-blend-difference shadow-2xl backdrop-blur-xl">
        {[0, 1, 2].map((idx) => (
          <button
            key={idx}
            onClick={() => handleScrollToSection(idx)}
            className="group flex flex-col items-center gap-3 outline-none"
          >
            <span
              className={`text-sm font-black transition-all duration-300 ${activeSection === idx ? 'scale-110 text-white opacity-100' : 'scale-90 text-white/30 group-hover:text-white/60'}`}
            >
              0{idx + 1}
            </span>
            <div
              className={`rounded-full transition-all duration-500 ${activeSection === idx ? 'h-10 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'h-1.5 w-1.5 bg-white opacity-20 group-hover:opacity-40'}`}
            />
          </button>
        ))}
      </div>

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.section
          style={{ opacity: section1Opacity }}
          className={`absolute inset-0 flex flex-col transition-all duration-300 ${activeSection === 0 ? 'pointer-events-auto z-30' : 'pointer-events-none z-0'}`}
        >
          <motion.div
            style={{ x: section1TopX }}
            className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-6"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imgS1Top})` }}
            >
              <div className="bg-midnight-ink/85 absolute inset-0"></div>
            </div>
            <div className="relative z-10 text-center">
              <h2 className="text-cloud-dancer mb-4 text-sm font-bold tracking-[0.3em] whitespace-nowrap uppercase">
                Individual
              </h2>
              <p className="text-pure-white text-5xl leading-tight font-bold whitespace-nowrap">
                내 강점을 증명할 방법이
                <br />
                막막하신가요?
              </p>
            </div>
          </motion.div>
          <motion.div
            style={{ x: section1BottomX }}
            className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-6"
          >
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imgS1Bottom})` }}
            >
              <div className="bg-pure-white/90 absolute inset-0"></div>
            </div>
            <div className="relative z-10 text-center">
              <h2 className="text-slate-gray mb-4 text-sm font-bold tracking-[0.3em] whitespace-nowrap uppercase">
                Company
              </h2>
              <p className="text-midnight-ink text-5xl leading-tight font-bold whitespace-nowrap">
                수많은 포트폴리오 속에서
                <br />
                원하는 인재를 찾기 힘드신가요?
              </p>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          style={{ opacity: section2Opacity, y: section2Y }}
          className={`absolute inset-0 flex flex-col items-center justify-center overflow-hidden p-10 text-center transition-all duration-300 ${activeSection === 1 ? 'pointer-events-auto z-30' : 'pointer-events-none z-0'}`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imgS2})` }}
          >
            <div className="bg-midnight-ink/90 absolute inset-0"></div>
          </div>
          <div className="relative z-20">
            <span className="text-cloud-dancer mb-8 block text-xs font-bold tracking-[0.4em] whitespace-nowrap uppercase">
              The AI Solution
            </span>
            <h2 className="text-pure-white mb-10 text-7xl leading-tight font-bold whitespace-nowrap">
              Portmatch
              <br />
              입체 역량 분석
            </h2>
            <p className="text-silver-mist mx-auto max-w-3xl text-2xl leading-relaxed whitespace-nowrap">
              데이터 뒤에 숨겨진 당신의 진짜 가치를
              <br />
              AI가 정교하게 찾아내어 최적의 기회와 연결합니다.
            </p>
          </div>
        </motion.section>

        <motion.section
          style={{ opacity: section3Opacity }}
          className={`absolute inset-0 flex flex-row overflow-hidden transition-all duration-300 ${activeSection === 2 ? 'pointer-events-auto z-40' : 'pointer-events-none z-0'}`}
        >
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center text-white mix-blend-difference select-none">
            <h2 className="text-[10rem] leading-none font-black tracking-tighter whitespace-nowrap uppercase opacity-5">
              PORTMATCH
            </h2>
          </div>

          <motion.div
            layout
            initial={{ x: '-100%' }}
            animate={{ x: activeSection === 2 ? '0%' : '-100%' }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, mass: 1 }}
            whileHover={{ flexGrow: 1.5 }}
            className="group relative z-20 h-full flex-1 cursor-pointer overflow-hidden border-r border-white/5 bg-[#111111]"
            onClick={() => handleLoginRedirect('APPLICANT')}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20 transition-opacity duration-500 group-hover:opacity-100">
              <div
                className="h-full w-full bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${imgS3Applicant})` }}
              />
              <div className="absolute inset-0 bg-black/60"></div>
            </div>
            <div className="relative z-30 flex h-full flex-col items-center justify-center p-12 text-center">
              <h2 className="text-pure-white mb-6 text-5xl font-black transition-transform group-hover:-translate-y-2">
                개인
              </h2>
              <p className="text-cloud-dancer text-xl font-medium whitespace-nowrap opacity-40 transition-all group-hover:opacity-100">
                나만의 분석 레포트를 받고
                <br />
                맞춤형 공고에 지원하세요.
              </p>
            </div>
          </motion.div>

          <motion.div
            layout
            initial={{ x: '100%' }}
            animate={{ x: activeSection === 2 ? '0%' : '100%' }}
            transition={{ type: 'spring', stiffness: 100, damping: 20, mass: 1 }}
            whileHover={{ flexGrow: 1.5 }}
            className="group bg-pure-white relative z-20 h-full flex-1 cursor-pointer overflow-hidden"
            onClick={() => handleLoginRedirect('COMPANY')}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-20 transition-opacity duration-500 group-hover:opacity-100">
              <div
                className="h-full w-full bg-cover bg-center bg-no-repeat transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url(${imgS3Company})` }}
              />
              <div className="absolute inset-0 bg-white/60"></div>
            </div>
            <div className="text-midnight-ink relative z-30 flex h-full flex-col items-center justify-center p-12 text-center">
              <h2 className="mb-6 text-5xl font-black transition-transform group-hover:-translate-y-2">
                기업
              </h2>
              <p className="text-slate-gray text-xl font-medium whitespace-nowrap opacity-60 transition-all group-hover:opacity-100">
                AI가 필터링한 검증된 인재를
                <br />
                가장 먼저 만나보세요.
              </p>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

export default IntroPage;
