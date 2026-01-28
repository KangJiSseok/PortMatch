import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useMotionValueEvent, useSpring } from 'framer-motion';

import imgS1Top from '../../assets/images/intro/s1-top.avif';
import imgS1Bottom from '../../assets/images/intro/s1-bottom.avif';
import imgS2 from '../../assets/images/intro/s2-ai.avif';
import imgS3Applicant from '../../assets/images/intro/s3-applicant.avif';
import imgS3Company from '../../assets/images/intro/s3-company.avif';

const mockCodeSnippet = `function analyzePortfolio(data) {
  const skills = extractSkills(data.techStack);
  const contribution = calculateImpact(data.commits);
  const visualization = generateGraph(skills, contribution);
  return visualization;
}
// AI Parsing Engine Initiated...
// Extracting Nodes... Verifying Data...`;

const mockAnalysisData = [
  { skill: 'React/FE Architecture', score: 92 },
  { skill: 'Node.js Backend', score: 85 },
  { skill: 'System Design', score: 78 },
  { skill: 'Data Visualization', score: 88 },
];

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
    if (latest < 0.25) setActiveSection(0);
    else if (latest < 0.5) setActiveSection(1);
    else if (latest < 0.75) setActiveSection(2);
    else setActiveSection(3);
  });

  const section1Opacity = useTransform(smoothProgress, [0.2, 0.25], [1, 0]);
  const section1TopX = useTransform(smoothProgress, [0, 0.15, 0.25], ['0%', '0%', '-100%']);
  const section1BottomX = useTransform(smoothProgress, [0, 0.15, 0.25], ['0%', '0%', '100%']);

  const section2Opacity = useTransform(smoothProgress, [0.25, 0.35, 0.45, 0.5], [0, 1, 1, 0]);
  const section2Y = useTransform(smoothProgress, [0.25, 0.35, 0.45, 0.5], [80, 0, 0, -80]);

  const section3Opacity = useTransform(smoothProgress, [0.5, 0.6, 0.7, 0.75], [0, 1, 1, 0]);
  const section3Y = useTransform(smoothProgress, [0.5, 0.6, 0.7, 0.75], [80, 0, 0, -80]);

  const section4Opacity = useTransform(smoothProgress, [0.75, 0.85], [0, 1]);

  const bgScale = useTransform(smoothProgress, [0, 1], [1, 1.3]);

  const handleScrollToSection = (index: number) => {
    if (!containerRef.current) return;
    const scrollHeight = containerRef.current.scrollHeight;
    const viewportHeight = window.innerHeight;
    const scrollableHeight = scrollHeight - viewportHeight;
    const targets = [0, 0.38, 0.65, 1];
    window.scrollTo({ top: scrollableHeight * targets[index], behavior: 'smooth' });
  };

  const handleLoginRedirect = (type: 'APPLICANT' | 'COMPANY') => {
    navigate('/login', { state: { userType: type } });
  };

  return (
    <div ref={containerRef} className="bg-midnight-ink relative h-[500vh] min-w-5xl">
      <motion.button
        onClick={() => handleScrollToSection(activeSection + 1)}
        animate={{ y: [0, 10, 0], opacity: activeSection === 3 ? 0 : 1 }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
        className="group fixed bottom-10 left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 text-white mix-blend-difference outline-none"
      >
        <span className="text-[13px] font-bold tracking-[0.3em] uppercase opacity-60 group-hover:opacity-100">
          Scroll Down
        </span>
        <svg
          width="20"
          height="20"
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

      <div className="fixed top-1/2 right-8 z-[100] flex -translate-y-1/2 flex-col gap-8 rounded-full border border-white/10 bg-white/5 px-5 py-8 mix-blend-difference shadow-2xl backdrop-blur-xl">
        {[0, 1, 2, 3].map((idx) => (
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
          className={`absolute inset-0 flex flex-col ${activeSection === 0 ? 'pointer-events-auto z-30' : 'pointer-events-none'}`}
        >
          <motion.div
            style={{ x: section1TopX }}
            className="relative flex-1 overflow-hidden border-b border-white/10"
          >
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imgS1Top})`, scale: bgScale }}
            >
              <div className="bg-midnight-ink/80 absolute inset-0" />
            </motion.div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-cloud-dancer mb-4 text-sm font-bold tracking-[0.4em] uppercase"
              >
                Individual
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, filter: 'blur(20px)', y: 20 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                className="text-pure-white text-5xl leading-tight font-black"
              >
                내 강점을 증명할 방법이
                <br />
                막막하신가요?
              </motion.h2>
            </div>
          </motion.div>
          <motion.div style={{ x: section1BottomX }} className="relative flex-1 overflow-hidden">
            <motion.div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${imgS1Bottom})`, scale: bgScale }}
            >
              <div className="bg-pure-white/90 absolute inset-0" />
            </motion.div>
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
              <motion.span
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-slate-gray mb-4 text-sm font-bold tracking-[0.4em] uppercase"
              >
                Company
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, filter: 'blur(20px)', y: 20 }}
                animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }}
                className="text-midnight-ink text-5xl leading-tight font-black"
              >
                수많은 포트폴리오 속에서
                <br />
                원하는 인재를 찾기 힘드신가요?
              </motion.h2>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          style={{ opacity: section2Opacity, y: section2Y }}
          className={`absolute inset-0 flex items-center justify-center px-10 text-center ${activeSection === 1 ? 'pointer-events-auto z-30' : 'pointer-events-none'}`}
        >
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${imgS2})`, scale: bgScale }}
          >
            <div className="bg-midnight-ink/90 absolute inset-0" />
          </motion.div>
          <div className="relative z-20">
            <span className="text-cloud-dancer mb-6 block text-sm font-bold tracking-[0.5em] uppercase">
              AI-Powered Analysis
            </span>
            <h2 className="text-pure-white mb-8 text-8xl font-black tracking-tighter uppercase">
              Portmatch
            </h2>
            <p className="text-silver-mist text-2xl leading-relaxed font-light">
              숨겨진 잠재력까지 파악하는
              <br />
              <span className="font-semibold text-blue-400">입체적 역량 분석 솔루션</span>입니다.
            </p>
          </div>
        </motion.section>

        <motion.section
          style={{ opacity: section3Opacity, y: section3Y }}
          className={`absolute inset-0 flex items-center justify-center px-10 ${activeSection === 2 ? 'pointer-events-auto z-30' : 'pointer-events-none'}`}
        >
          <div className="relative z-20 flex w-full max-w-6xl flex-col items-stretch justify-center gap-10 md:flex-row">
            <div className="group relative flex-1 overflow-hidden rounded-3xl border border-white/10 bg-black/40 p-8 backdrop-blur-xl">
              <div className="animate-scan absolute top-0 left-0 z-30 h-1 w-full bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.6)]"></div>
              <div className="mb-6">
                <span className="text-xs font-bold tracking-widest text-blue-400 uppercase">
                  STEP 01
                </span>
                <h3 className="text-pure-white mt-2 text-3xl font-bold">Deep Parsing</h3>
              </div>
              <div className="relative h-64 overflow-hidden rounded-xl bg-[#111111] p-4 font-mono text-xs text-green-400/70 opacity-80">
                <motion.div
                  animate={{ y: ['0%', '-50%'] }}
                  transition={{ repeat: Infinity, duration: 10, ease: 'linear' }}
                  className="whitespace-pre"
                >
                  {mockCodeSnippet.repeat(5)}
                </motion.div>
              </div>
            </div>
            <div className="relative flex-1 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
              <div className="mb-8">
                <span className="text-xs font-bold tracking-widest text-green-400 uppercase">
                  STEP 02
                </span>
                <h3 className="text-pure-white mt-2 text-3xl font-bold">Insight Result</h3>
              </div>
              <div className="flex flex-col gap-6 pl-2">
                {mockAnalysisData.map((item, index) => (
                  <div key={index}>
                    <div className="mb-2 flex justify-between">
                      <span className="text-pure-white text-sm font-medium">{item.skill}</span>
                      <span className="text-sm font-bold text-blue-400">{item.score}%</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${item.score}%` }}
                        transition={{ duration: 1.2, delay: 0.5 + index * 0.1 }}
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        <motion.section
          style={{ opacity: section4Opacity }}
          className={`absolute inset-0 flex overflow-hidden ${activeSection === 3 ? 'pointer-events-auto z-40' : 'pointer-events-none'}`}
        >
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center text-white mix-blend-difference select-none">
            <h2 className="text-[10rem] font-black tracking-tighter uppercase opacity-5">
              PORTMATCH
            </h2>
          </div>

          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: activeSection === 3 ? '0%' : '-100%' }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            whileHover={{ flexGrow: 1.5 }}
            className="group relative z-20 h-full flex-1 cursor-pointer overflow-hidden border-r border-white/5 bg-[#111111]"
            onClick={() => handleLoginRedirect('APPLICANT')}
          >
            <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-100">
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${imgS3Applicant})` }}
              />
              <div className="absolute inset-0 bg-black/60"></div>
            </div>
            <div className="relative z-30 flex h-full flex-col items-center justify-center p-12 text-center">
              <h2 className="text-pure-white mb-6 text-6xl font-black transition-transform duration-500 group-hover:scale-110">
                개인
              </h2>
              <p className="text-cloud-dancer translate-y-4 text-xl opacity-40 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                분석 레포트 확인 및 맞춤형 공고 지원
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: activeSection === 3 ? '0%' : '100%' }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            whileHover={{ flexGrow: 1.5 }}
            className="group relative z-20 h-full flex-1 cursor-pointer overflow-hidden bg-white"
            onClick={() => handleLoginRedirect('COMPANY')}
          >
            <div className="absolute inset-0 opacity-20 transition-opacity duration-500 group-hover:opacity-100">
              <div
                className="h-full w-full bg-cover bg-center"
                style={{ backgroundImage: `url(${imgS3Company})` }}
              />
              <div className="absolute inset-0 bg-white/60"></div>
            </div>
            <div className="text-midnight-ink relative z-30 flex h-full flex-col items-center justify-center p-12 text-center">
              <h2 className="mb-6 text-6xl font-black transition-transform duration-500 group-hover:scale-110">
                기업
              </h2>
              <p className="text-slate-gray translate-y-4 text-xl opacity-60 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
                AI 검증 인재 서칭 및 채용
              </p>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

export default IntroPage;
