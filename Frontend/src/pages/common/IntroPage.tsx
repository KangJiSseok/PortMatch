import { useRef, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  MotionValue,
  type Variants,
} from 'framer-motion';
import { ArrowRight, User, Building2, Cpu, FileSearch, Share2, ChevronsDown } from 'lucide-react';

import imgApplicant from '../../assets/images/intro/applicant.avif';
import imgCompany from '../../assets/images/intro/company.avif';

const PARTICLE_COUNT = 240;

interface Point {
  x: number;
  y: number;
}

interface ParticleData {
  id: number;
  s0: Point;
  s1: Point;
  s2: Point;
  s3: Point;
  s4: Point;
}

const getLayoutConstants = (width: number, height: number) => {
  const isMobile = width < 768;

  if (isMobile) {
    const pt = 80;
    const pb = 24;
    const px = 24;
    const gap = 16;

    const availableHeight = height - pt - pb;
    const panelWidth = width - px * 2;
    const panelHeight = (availableHeight - gap) / 2;

    const offsetY = (panelHeight + gap) / 2;
    const centerShiftY = (pt - pb) / 2;

    return { panelWidth, panelHeight, offsetX: 0, offsetY, isMobile, centerShiftY };
  }

  const padding = 80;
  const gap = 32;
  const availableWidth = width - padding * 2;
  const panelWidth = (availableWidth - gap) / 2;
  const panelHeight = height - padding * 2;
  const offsetX = (panelWidth + gap) / 2;

  return { panelWidth, panelHeight, offsetX, offsetY: 0, isMobile, centerShiftY: 0 };
};

const getBorderPoint = (index: number, isFirstGroup: boolean, width: number, height: number) => {
  const { panelWidth, panelHeight, offsetX, offsetY, isMobile, centerShiftY } = getLayoutConstants(
    width,
    height,
  );
  const halfCount = PARTICLE_COUNT / 2;
  const pIndex = index % halfCount;

  const w = panelWidth;
  const h = panelHeight;
  const totalPerimeter = (w + h) * 2;

  const nTop = Math.floor((w / totalPerimeter) * halfCount);
  const nRight = Math.floor((h / totalPerimeter) * halfCount);
  const nBottom = Math.floor((w / totalPerimeter) * halfCount);
  const nLeft = halfCount - nTop - nRight - nBottom;

  let x = 0;
  let y = 0;

  if (pIndex < nTop) {
    x = -w / 2 + w * (pIndex / nTop);
    y = -h / 2;
  } else if (pIndex < nTop + nRight) {
    x = w / 2;
    y = -h / 2 + h * ((pIndex - nTop) / nRight);
  } else if (pIndex < nTop + nRight + nBottom) {
    x = w / 2 - w * ((pIndex - (nTop + nRight)) / nBottom);
    y = h / 2;
  } else {
    const processed = nTop + nRight + nBottom;
    x = -w / 2;
    y = h / 2 - h * ((pIndex - processed) / nLeft);
  }

  if (isMobile) {
    return { x, y: y + (isFirstGroup ? -offsetY : offsetY) + centerShiftY };
  } else {
    return { x: x + (isFirstGroup ? -offsetX : offsetX), y };
  }
};

const charVariants: Variants = {
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { delay: i * 0.1, duration: 0.8, ease: [0.215, 0.61, 0.355, 1] },
  }),
  hidden: (i: number) => ({
    opacity: 0,
    y: -20,
    filter: 'blur(10px)',
    transition: { delay: i * 0.05, duration: 0.5, ease: 'easeInOut' },
  }),
};

function IntroPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });
  const navigate = useNavigate();

  const [logoKey, setLogoKey] = useState(0);
  const logoPart1 = 'PORT'.split('');
  const logoPart2 = 'MATCH'.split('');
  const charDuration = 0.05;
  const groupPause = 0.4;

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handleResize);
    window.scrollTo(0, 0);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const particles = useMemo(() => {
    const { width, height } = windowSize;
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
      const isFirstGroup = i < PARTICLE_COUNT / 2;
      const screenMin = Math.min(width, height);
      const screenMax = Math.max(width, height);

      const s0 = {
        x: Math.cos((i / PARTICLE_COUNT) * Math.PI * 2) * (screenMin * 0.4),
        y: Math.sin((i / PARTICLE_COUNT) * Math.PI * 2) * (screenMin * 0.4),
      };

      const cols = 20;
      const rows = Math.ceil(PARTICLE_COUNT / cols);
      const s1 = {
        x: ((i % cols) - cols / 2 + 0.5) * (width / (cols + 5)),
        y: (Math.floor(i / cols) - rows / 2 + 0.5) * (height / (rows + 5)),
      };

      const brainAngle = (i % (PARTICLE_COUNT / 2)) * 0.15;
      const brainBaseRadius = screenMin * 0.25;
      const s2 = {
        x:
          (isFirstGroup ? -screenMin * 0.15 : screenMin * 0.15) +
          Math.cos(brainAngle) * (brainBaseRadius + Math.sin(i * 0.8) * 25),
        y: Math.sin(brainAngle) * (brainBaseRadius + Math.sin(i * 0.8) * 25) * 1.2,
      };

      const idxInGroup = i % (PARTICLE_COUNT / 2);
      const splitPoint = Math.floor((PARTICLE_COUNT / 2) * 0.65);
      const arrowTotalLength = screenMax * 0.5;
      const arrowHeadLength = arrowTotalLength * 0.3;
      const arrowShaftLength = arrowTotalLength - arrowHeadLength;
      const centerYOffset = screenMax * 0.12;
      let s3x = 0;
      let s3y = 0;

      const getOffset = (idx: number, max: number) => (((idx % 5) - 2) / 2) * max;

      if (isFirstGroup) {
        const joinX = -screenMin * 0.05 + arrowHeadLength;
        if (idxInGroup < splitPoint) {
          s3x = joinX + arrowShaftLength - (idxInGroup / splitPoint) * arrowShaftLength;
          s3y = -centerYOffset + getOffset(idxInGroup, 10);
        } else {
          const prog = (idxInGroup - splitPoint) / (PARTICLE_COUNT / 2 - splitPoint);
          s3x = joinX - prog * arrowHeadLength;
          s3y = -centerYOffset + getOffset(idxInGroup, 35 * (1 - prog));
        }
      } else {
        const joinX = screenMin * 0.05 - arrowHeadLength;
        if (idxInGroup < splitPoint) {
          s3x = joinX - arrowShaftLength + (idxInGroup / splitPoint) * arrowShaftLength;
          s3y = centerYOffset + getOffset(idxInGroup, 10);
        } else {
          const prog = (idxInGroup - splitPoint) / (PARTICLE_COUNT / 2 - splitPoint);
          s3x = joinX + prog * arrowHeadLength;
          s3y = centerYOffset + getOffset(idxInGroup, 35 * (1 - prog));
        }
      }

      return {
        id: i,
        s0,
        s1,
        s2,
        s3: { x: s3x, y: s3y },
        s4: getBorderPoint(i, isFirstGroup, width, height),
      };
    });
  }, [windowSize]);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });
  const smoothProgress = useSpring(scrollYProgress, { stiffness: 45, damping: 30 });
  useMotionValueEvent(smoothProgress, 'change', (latest) =>
    setActiveSection(Math.min(Math.floor(latest * 5), 4)),
  );
  const finalReveal = useTransform(smoothProgress, [0.82, 0.9], [0, 1]);

  const handleScrollToSection = (index: number) => {
    if (!containerRef.current) return;
    const targets = [0.0, 0.25, 0.45, 0.65, 1];
    window.scrollTo({
      top: (containerRef.current.scrollHeight - window.innerHeight) * targets[index],
      behavior: 'smooth',
    });
    if (index === 0) setLogoKey((prev) => prev + 1);
  };

  return (
    <div ref={containerRef} className="relative w-full bg-[#020205]" style={{ height: '700vh' }}>
      <style>{`@keyframes logo-appear { from { opacity: 0; transform: translateY(20px); filter: blur(10px); } to { opacity: 1; transform: translateY(0); filter: blur(0); } }`}</style>
      <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,#121225_0%,#020205_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-10">
          {particles.map((p) => (
            <Particle key={p.id} data={p} progress={smoothProgress} />
          ))}
        </div>

        <nav className="absolute top-0 left-0 z-50 flex w-full items-center justify-between p-6 mix-blend-difference md:p-10">
          <div
            onClick={() => handleScrollToSection(0)}
            className="flex cursor-pointer text-2xl font-black tracking-tighter text-white uppercase md:text-3xl"
          >
            <div key={logoKey} className="flex">
              {logoPart1.map((char, idx) => (
                <span
                  key={`nav-p1-${idx}`}
                  style={{
                    opacity: 0,
                    animation: `logo-appear 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards`,
                    animationDelay: `${idx * charDuration}s`,
                  }}
                >
                  {char}
                </span>
              ))}
              {logoPart2.map((char, idx) => (
                <span
                  key={`nav-p2-${idx}`}
                  style={{
                    opacity: 0,
                    animation: `logo-appear 0.6s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards`,
                    animationDelay: `${logoPart1.length * charDuration + groupPause + idx * charDuration}s`,
                  }}
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
          <button
            onClick={() => navigate('/main')}
            className="rounded-full border border-white/10 bg-white/5 px-6 py-2 text-[10px] font-bold tracking-[0.2em] text-white/80 uppercase backdrop-blur-md md:text-xs"
          >
            Skip
          </button>
        </nav>

        <div className="absolute top-1/2 right-2 z-50 flex -translate-y-1/2 flex-col gap-4 md:right-10">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              onClick={() => handleScrollToSection(idx)}
              className="group relative flex cursor-pointer items-center justify-center p-2"
            >
              <div
                className={`w-1 transition-all duration-500 ${activeSection === idx ? 'h-8 bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'h-3 bg-white/20'}`}
              />
            </div>
          ))}
        </div>

        <div className="pointer-events-none relative z-30 flex flex-1 items-center justify-center">
          <SectionWrapper show={activeSection === 0}>
            <div className="flex flex-col items-center text-center">
              <div className="flex text-[15vw] leading-none font-black tracking-tighter text-white uppercase md:text-[12vw]">
                {logoPart1.map((char, idx) => (
                  <motion.span
                    key={`m1-${idx}`}
                    custom={idx}
                    variants={charVariants}
                    initial="hidden"
                    animate={activeSection === 0 ? 'visible' : 'hidden'}
                  >
                    {char}
                  </motion.span>
                ))}
                {logoPart2.map((char, idx) => (
                  <motion.span
                    key={`m2-${idx}`}
                    custom={logoPart1.length + idx}
                    variants={charVariants}
                    initial="hidden"
                    animate={activeSection === 0 ? 'visible' : 'hidden'}
                  >
                    {char}
                  </motion.span>
                ))}
              </div>
              <motion.p
                initial={{ opacity: 0 }}
                animate={activeSection === 0 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.2 }}
                className="mt-4 text-xs font-medium tracking-[0.3em] text-indigo-400 uppercase md:text-xl"
              >
                AI Portfolio Matching Hub
              </motion.p>
              <motion.div
                initial={{ opacity: 0 }}
                animate={activeSection === 0 ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.8 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2 text-white/30"
              >
                <ChevronsDown size={24} className="animate-bounce" />
              </motion.div>
            </div>
          </SectionWrapper>

          {[1, 2, 3].map((i) => (
            <SectionWrapper key={i} show={activeSection === i}>
              <div className="max-w-5xl px-6 text-center break-keep">
                {i === 1 && <FileSearch size={40} className="mx-auto mb-6 text-indigo-400" />}
                {i === 2 && <Cpu size={40} className="mx-auto mb-6 text-purple-400" />}
                {i === 3 && <Share2 size={40} className="mx-auto mb-6 text-emerald-400" />}
                <h2 className="text-3xl font-bold text-white md:text-6xl">
                  {i === 1 && '포트폴리오 역량 추출'}
                  {i === 2 && '프로젝트 기반 매칭'}
                  {i === 3 && '양방향성 매칭 시스템'}
                </h2>
                <p className="mt-6 text-sm text-white/90 md:text-xl">
                  {i === 1 &&
                    '이미지와 텍스트가 섞인 비정형 데이터를 벡터화하여\n포트폴리오의 잠재 역량을 추출합니다.'}
                  {i === 2 &&
                    '단순 키워드 일치가 아닌, 프로젝트 수행 과정과\n문제 해결의 논리적 흐름을 분석해 매칭합니다.'}
                  {i === 3 &&
                    '구직자의 역량과 기업의 니즈를 교차 검증하여\n한쪽이 아닌, 서로에게 가장 필요한 연결을 제공합니다.'}
                </p>
              </div>
            </SectionWrapper>
          ))}

          <motion.div
            style={{ opacity: finalReveal }}
            className={`absolute inset-0 z-40 flex flex-col items-stretch gap-4 overflow-hidden px-6 pt-20 pb-6 md:flex-row md:gap-8 md:p-20 ${activeSection === 4 ? 'pointer-events-auto' : 'pointer-events-none'}`}
          >
            <Panel
              type="APPLICANT"
              title="Individual"
              desc="나의 역량을 데이터로 증명하고 취업의 기회를 찾으세요"
              img={imgApplicant}
              onClick={() => navigate('/login', { state: { userType: 'APPLICANT' } })}
            />
            <Panel
              type="COMPANY"
              title="Business"
              desc="고도화된 추천 기능으로 팀에 가장 필요한 인재를 만나세요"
              img={imgCompany}
              onClick={() => navigate('/login', { state: { userType: 'COMPANY' } })}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

const Particle = ({ data, progress }: { data: ParticleData; progress: MotionValue<number> }) => {
  const isFirstGroup = data.id < PARTICLE_COUNT / 2;
  const range = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
  const x = useTransform(progress, range, [
    data.s0.x,
    data.s0.x,
    data.s1.x,
    data.s1.x,
    data.s2.x,
    data.s2.x,
    data.s3.x,
    data.s3.x,
    data.s4.x,
    data.s4.x,
    data.s4.x,
  ]);
  const y = useTransform(progress, range, [
    data.s0.y,
    data.s0.y,
    data.s1.y,
    data.s1.y,
    data.s2.y,
    data.s2.y,
    data.s3.y,
    data.s3.y,
    data.s4.y,
    data.s4.y,
    data.s4.y,
  ]);
  const color = useTransform(
    progress,
    [0.8, 0.9],
    ['#ffffff', isFirstGroup ? '#6366f1' : '#a855f7'],
  );
  const opacity = useTransform(progress, [0.8, 0.9], [0.3, 0.8]);

  return (
    <motion.div
      style={{
        x,
        y,
        opacity,
        backgroundColor: color,
        borderRadius: '50%',
        left: '50%',
        top: '50%',
      }}
      className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2"
    />
  );
};

const SectionWrapper = ({ children, show }: { children: React.ReactNode; show: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: -20 }}
    transition={{ duration: 0.6 }}
    className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center whitespace-pre-line"
  >
    {children}
  </motion.div>
);

const Panel = ({
  title,
  desc,
  img,
  onClick,
  type,
}: {
  title: string;
  desc: string;
  img: string;
  onClick: () => void;
  type: 'APPLICANT' | 'COMPANY';
}) => (
  <div
    onClick={onClick}
    className="group relative flex min-h-0 w-full flex-1 cursor-pointer flex-col overflow-hidden rounded-2xl bg-white/5 transition-all duration-700 hover:bg-white/10 md:w-auto"
  >
    <div
      className="absolute inset-0 bg-cover bg-center opacity-0 brightness-[0.4] transition-all duration-1000 group-hover:scale-110 group-hover:opacity-30"
      style={{ backgroundImage: `url(${img})` }}
    />
    <div className="relative z-10 flex h-full flex-col items-center justify-center p-4 text-center break-keep sm:p-8 md:justify-end md:p-12 md:text-left">
      <div
        className={`mb-2 rounded-lg bg-white/5 p-2 transition-all duration-500 group-hover:scale-110 sm:mb-4 sm:p-4 md:mb-8 ${type === 'APPLICANT' ? 'text-indigo-400' : 'text-purple-400'}`}
      >
        {type === 'APPLICANT' ? (
          <User className="size-6 md:size-12" />
        ) : (
          <Building2 className="size-6 md:size-12" />
        )}
      </div>
      <h3 className="mb-1 text-2xl font-black text-white uppercase sm:text-3xl md:mb-4 md:text-5xl">
        {title}
      </h3>
      <p className="max-w-[320px] text-xs font-medium text-white/70 sm:text-sm md:max-w-none md:text-lg">
        {desc}
      </p>
      <div className="mt-4 hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 opacity-0 transition-all duration-500 group-hover:opacity-100 sm:flex md:mt-8 md:px-8 md:py-4">
        <span className="text-[10px] font-black text-white uppercase md:text-xs">Start</span>
        <ArrowRight size={14} className="text-white" />
      </div>
    </div>
  </div>
);

export default IntroPage;
