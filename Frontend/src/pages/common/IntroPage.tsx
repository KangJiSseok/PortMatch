import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
  MotionValue,
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

const getLayoutConstants = () => {
  const isMobile = window.innerWidth < 768;
  const padding = isMobile ? 48 : 96;
  const gap = 48;
  const availableWidth = window.innerWidth - padding * 2;
  const panelWidth = (availableWidth - gap) / 2;
  const panelHeight = window.innerHeight - padding * 2;
  const offsetX = panelWidth / 2 + gap / 2;

  return { panelWidth, panelHeight, offsetX };
};

const getBorderPoint = (index: number, isLeft: boolean) => {
  const { panelWidth, panelHeight, offsetX } = getLayoutConstants();
  const halfCount = PARTICLE_COUNT / 2;
  const pIndex = index % halfCount;

  const w = panelWidth;
  const h = panelHeight;
  const totalPerimeter = (w + h) * 2;
  const step = totalPerimeter / (halfCount - 1);
  const dist = pIndex * step;

  let x = 0,
    y = 0;
  if (dist <= w) {
    x = dist - w / 2;
    y = -h / 2;
  } else if (dist <= w + h) {
    x = w / 2;
    y = dist - w - h / 2;
  } else if (dist <= w * 2 + h) {
    x = w / 2 - (dist - (w + h));
    y = h / 2;
  } else {
    x = -w / 2;
    y = h / 2 - (dist - (w * 2 + h));
  }
  return { x: x + (isLeft ? -offsetX : offsetX), y };
};

const STATIC_PARTICLES: ParticleData[] = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
  const isLeft = i < PARTICLE_COUNT / 2;
  const screenMin = Math.min(window.innerWidth, window.innerHeight);
  const screenMax = Math.max(window.innerWidth, window.innerHeight);

  const s0Radius = screenMin * 0.4;
  const s0 = {
    x: Math.cos((i / PARTICLE_COUNT) * Math.PI * 2) * s0Radius,
    y: Math.sin((i / PARTICLE_COUNT) * Math.PI * 2) * s0Radius,
  };

  const cols = 20;
  const rows = Math.ceil(PARTICLE_COUNT / cols);
  const col = i % cols;
  const row = Math.floor(i / cols);
  const gridSpacingX = window.innerWidth / (cols + 5);
  const gridSpacingY = window.innerHeight / (rows + 5);
  const s1 = {
    x: (col - cols / 2 + 0.5) * gridSpacingX,
    y: (row - rows / 2 + 0.5) * gridSpacingY,
  };

  const brainAngle = (i % (PARTICLE_COUNT / 2)) * 0.15;
  const brainRadiusVar = Math.sin(i * 0.8) * 25;
  const brainBaseRadius = screenMin * 0.25;
  const brainBaseX = isLeft ? -screenMin * 0.15 : screenMin * 0.15;
  const s2 = {
    x: brainBaseX + Math.cos(brainAngle) * (brainBaseRadius + brainRadiusVar),
    y: Math.sin(brainAngle) * (brainBaseRadius + brainRadiusVar) * 1.2,
  };

  let s3x = 0;
  let s3y = 0;
  const arrowGroupSize = PARTICLE_COUNT / 2;
  const idxInGroup = i % arrowGroupSize;
  const splitPoint = Math.floor(arrowGroupSize * 0.65);

  const arrowTotalLength = screenMax * 0.5;
  const arrowHeadLength = arrowTotalLength * 0.3;
  const arrowShaftLength = arrowTotalLength - arrowHeadLength;
  const shaftHalfWidth = 10;
  const headBaseHalfWidth = 35;
  const centerYOffset = screenMax * 0.12;

  const getPerpendicularOffset = (idx: number, maxHalfWidth: number) => {
    const lane = idx % 5;
    const normalizedPos = (lane - 2) / 2;
    return normalizedPos * maxHalfWidth;
  };

  if (isLeft) {
    const axisY = -centerYOffset;
    const tipX = -screenMin * 0.05;
    const joinX = tipX + arrowHeadLength;
    const endX = joinX + arrowShaftLength;

    if (idxInGroup < splitPoint) {
      const progress = idxInGroup / splitPoint;
      s3x = endX - progress * arrowShaftLength;
      s3y = axisY + getPerpendicularOffset(idxInGroup, shaftHalfWidth);
    } else {
      const headProgress = (idxInGroup - splitPoint) / (arrowGroupSize - splitPoint);
      s3x = joinX - headProgress * arrowHeadLength;
      const currentHalfWidth = headBaseHalfWidth * (1 - headProgress);
      s3y = axisY + getPerpendicularOffset(idxInGroup, currentHalfWidth);
    }
  } else {
    const axisY = centerYOffset;
    const tipX = screenMin * 0.05;
    const joinX = tipX - arrowHeadLength;
    const startX = joinX - arrowShaftLength;

    if (idxInGroup < splitPoint) {
      const progress = idxInGroup / splitPoint;
      s3x = startX + progress * arrowShaftLength;
      s3y = axisY + getPerpendicularOffset(idxInGroup, shaftHalfWidth);
    } else {
      const headProgress = (idxInGroup - splitPoint) / (arrowGroupSize - splitPoint);
      s3x = joinX + headProgress * arrowHeadLength;
      const currentHalfWidth = headBaseHalfWidth * (1 - headProgress);
      s3y = axisY + getPerpendicularOffset(idxInGroup, currentHalfWidth);
    }
  }
  const s3 = { x: s3x, y: s3y };

  return {
    id: i,
    s0,
    s1,
    s2,
    s3,
    s4: getBorderPoint(i, isLeft),
  };
});

function IntroPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeSection, setActiveSection] = useState(0);
  const navigate = useNavigate();

  const [logoKey, setLogoKey] = useState(0);
  const logoPart1 = 'PORT'.split('');
  const logoPart2 = 'MATCH'.split('');
  const charDuration = 0.05;
  const groupPause = 0.4;

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);

    return () => {
      if ('scrollRestoration' in window.history) {
        window.history.scrollRestoration = 'auto';
      }
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const smoothProgress = useSpring(scrollYProgress, { stiffness: 45, damping: 30 });

  useMotionValueEvent(smoothProgress, 'change', (latest) => {
    const section = Math.min(Math.floor(latest * 5), 4);
    setActiveSection(section);
  });

  const finalReveal = useTransform(smoothProgress, [0.82, 0.9], [0, 1]);

  const handleScrollToSection = (index: number) => {
    if (!containerRef.current) return;
    const targets = [0.1, 0.3, 0.5, 0.7, 0.9];
    window.scrollTo({
      top: (containerRef.current.scrollHeight - window.innerHeight) * targets[index],
      behavior: 'smooth',
    });
    if (index === 0) setLogoKey((prev) => prev + 1);
  };

  return (
    <div ref={containerRef} className="relative w-full bg-[#020205]" style={{ height: '700vh' }}>
      <style>{`
        @keyframes logo-appear {
          from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>

      <div className="sticky top-0 flex h-screen w-full flex-col overflow-hidden">
        <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,#121225_0%,#020205_100%)]" />

        <div className="pointer-events-none absolute inset-0 z-10">
          {STATIC_PARTICLES.map((p) => (
            <Particle key={p.id} data={p} progress={smoothProgress} />
          ))}
        </div>

        <nav className="absolute top-0 left-0 z-50 flex w-full items-center justify-between p-10 mix-blend-difference">
          <div
            onClick={() => handleScrollToSection(0)}
            className="flex cursor-pointer text-3xl font-black tracking-tighter text-white uppercase"
          >
            <div key={logoKey} className="flex">
              <span className="flex">
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
              </span>
              <span className="flex">
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
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/main')}
              className="rounded-full border border-white/20 bg-white/10 px-8 py-3 text-xs font-bold tracking-widest text-white uppercase backdrop-blur-xl transition-all hover:bg-white hover:text-black"
            >
              Skip
            </button>
          </div>
        </nav>

        <div className="absolute top-1/2 right-10 z-50 flex -translate-y-1/2 flex-col gap-6">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              onClick={() => handleScrollToSection(idx)}
              className={`w-1 cursor-pointer transition-all duration-500 ${activeSection === idx ? 'h-10 bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'h-4 bg-white/20 hover:bg-white/50'}`}
            />
          ))}
        </div>

        <div className="pointer-events-none relative z-30 flex flex-1 items-center justify-center">
          <SectionWrapper show={activeSection === 0}>
            <div className="flex flex-col items-center text-center">
              <div
                key={activeSection === 0 ? `main-logo-${logoKey}` : 'main-logo-hidden'}
                className="flex text-[12vw] leading-none font-black tracking-tighter text-white uppercase"
              >
                <span className="flex">
                  {logoPart1.map((char, idx) => (
                    <span
                      key={`main-p1-${idx}`}
                      style={{
                        opacity: 0,
                        animation:
                          activeSection === 0
                            ? `logo-appear 1s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards`
                            : 'none',
                        animationDelay: `${idx * 0.1}s`,
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
                <span className="flex">
                  {logoPart2.map((char, idx) => (
                    <span
                      key={`main-p2-${idx}`}
                      style={{
                        opacity: 0,
                        animation:
                          activeSection === 0
                            ? `logo-appear 1s cubic-bezier(0.215, 0.610, 0.355, 1.000) forwards`
                            : 'none',
                        animationDelay: `${logoPart1.length * 0.1 + 0.3 + idx * 0.1}s`,
                      }}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              </div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={activeSection === 0 ? { opacity: 1, y: 0 } : { opacity: 0 }}
                transition={{ delay: 1.2, duration: 0.8 }}
                className="mt-4 text-xl font-medium tracking-[0.4em] text-indigo-400 uppercase"
              >
                AI Portfolio Matching Hub
              </motion.p>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={activeSection === 0 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="absolute bottom-12 left-1/2 flex -translate-x-1/2 flex-col items-center gap-3 text-white/50"
            >
              <span className="text-sm font-bold tracking-[0.3em] uppercase">Scroll Down</span>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronsDown size={36} />
              </motion.div>
            </motion.div>
          </SectionWrapper>

          <SectionWrapper show={activeSection === 1}>
            <div className="max-w-5xl px-6 text-center break-keep">
              <FileSearch size={48} className="mx-auto mb-8 text-indigo-400" />
              <h2 className="text-5xl font-bold tracking-tight text-white md:text-6xl">
                포트폴리오 속 잠재력을 데이터로
              </h2>
              <p className="mt-8 text-xl leading-relaxed text-white/90">
                포트폴리오 속 이미지와 텍스트를 분석하여
                <br />
                단순 스펙이 아닌 실제 역량 프로필을 추출합니다.
              </p>
            </div>
          </SectionWrapper>

          <SectionWrapper show={activeSection === 2}>
            <div className="max-w-4xl px-6 text-center break-keep">
              <Cpu size={48} className="mx-auto mb-8 text-purple-400" />
              <h2 className="text-5xl font-bold tracking-tight text-white md:text-6xl">
                조건을 넘어선 정밀 매칭
              </h2>
              <p className="mt-8 text-xl leading-relaxed text-white/90">
                AI 엔진이 도메인 관심사와 문제 해결 방식을 분석하여
                <br />
                당신에게 최적화된 공고와 인재를 연결합니다.
              </p>
            </div>
          </SectionWrapper>

          <SectionWrapper show={activeSection === 3}>
            <div className="max-w-4xl px-6 text-center break-keep">
              <Share2 size={48} className="mx-auto mb-8 text-emerald-400" />
              <h2 className="text-5xl font-bold tracking-tight text-white md:text-6xl">
                양방향 채용의 새로운 기준
              </h2>
              <p className="mt-8 text-xl leading-relaxed text-white/90">
                구직자에게는 맞춤형 큐레이션을,
                <br />
                기업에게는 고도화된 인재 필터링을 제공합니다.
              </p>
            </div>
          </SectionWrapper>

          <motion.div
            style={{ opacity: finalReveal }}
            className={`absolute inset-0 z-40 flex items-stretch gap-12 p-12 md:p-24 ${activeSection === 4 ? 'pointer-events-auto' : 'pointer-events-none'}`}
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
              desc="고도화된 필터링으로 팀에 가장 필요한 인재를 만나세요"
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
  const isLeft = data.id < PARTICLE_COUNT / 2;

  const inputRange = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

  const x = useTransform(progress, inputRange, [
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

  const y = useTransform(progress, inputRange, [
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

  const scale = useTransform(progress, [0.8, 0.9, 1], [1, 1.2, 1]);
  const baseColor = isLeft ? '#6366f1' : '#a855f7';
  const color = useTransform(progress, [0.8, 0.9], ['#ffffff', baseColor]);
  const opacity = useTransform(progress, [0.8, 0.9], [0.3, 0.8]);

  return (
    <motion.div
      style={{
        x,
        y,
        scale,
        opacity,
        backgroundColor: color,
        borderRadius: '50%',
        left: '50%',
        top: '50%',
      }}
      className="absolute h-1 w-1"
    />
  );
};

const SectionWrapper = ({ children, show }: { children: React.ReactNode; show: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
    animate={
      show
        ? { opacity: 1, y: 0, filter: 'blur(0px)' }
        : { opacity: 0, y: -20, filter: 'blur(10px)' }
    }
    transition={{ duration: 0.6 }}
    className="pointer-events-none absolute inset-0 flex w-full flex-col items-center justify-center"
  >
    {children}
  </motion.div>
);

interface PanelProps {
  title: string;
  desc: string;
  img: string;
  onClick: () => void;
  type: 'APPLICANT' | 'COMPANY';
}

const Panel = ({ title, desc, img, onClick, type }: PanelProps) => (
  <div
    onClick={onClick}
    className="group relative flex-1 cursor-pointer overflow-hidden rounded-none bg-white/2 transition-all duration-700 hover:bg-white/5"
  >
    <div
      className="absolute inset-0 bg-cover bg-center opacity-0 brightness-50 grayscale transition-all duration-1000 group-hover:scale-110 group-hover:opacity-20"
      style={{ backgroundImage: `url(${img})` }}
    />
    <div className="relative z-10 flex h-full flex-col items-center justify-end p-16 text-center break-keep">
      <div
        className={`mb-10 rounded-2xl bg-white/5 p-5 transition-all duration-500 group-hover:scale-110 ${type === 'APPLICANT' ? 'text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white' : 'text-purple-400 group-hover:bg-purple-500 group-hover:text-white'}`}
      >
        {type === 'APPLICANT' ? <User size={48} /> : <Building2 size={48} />}
      </div>
      <h3 className="mb-6 text-5xl font-black tracking-tighter text-white uppercase transition-transform group-hover:-translate-y-2">
        {title}
      </h3>
      <p className="max-w-70 text-lg leading-relaxed font-medium text-white/60">{desc}</p>
      <div className="mt-12 flex translate-y-4 items-center gap-4 rounded-full bg-white/10 px-8 py-4 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
        <span className="text-xs font-black tracking-widest text-white uppercase">Get Started</span>
        <ArrowRight size={18} className="text-white" />
      </div>
    </div>
  </div>
);

export default IntroPage;
