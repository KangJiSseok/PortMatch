import { useRef, useState } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';

const IMG_S1_TOP = "https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=2071&auto=format&fit=crop";
const IMG_S1_BOTTOM = "https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=2069&auto=format&fit=crop";
const IMG_S2 = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop";
const IMG_S3_OBJ_APPLICANT = "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop";
const IMG_S3_OBJ_COMPANY = "https://images.unsplash.com/photo-1497215728101-856f4ea42174?q=80&w=2070&auto=format&fit=crop";

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
  const section3LeftX = useTransform(scrollYProgress, [0.75, 0.85], ["-100%", "0%"]);
  const section3RightX = useTransform(scrollYProgress, [0.75, 0.85], ["100%", "0%"]);

  const handleSkip = () => {
    const totalHeight = document.documentElement.scrollHeight;
    window.scrollTo({ top: totalHeight, behavior: 'smooth' });
  };

  const handleLoginRedirect = (type: 'applicant' | 'company') => {
    console.log(`${type} 로그인 페이지로 이동`);
  };

  return (
    <div ref={containerRef} className="relative h-[450vh] bg-midnight-ink">
      <button
        onClick={handleSkip}
        className="fixed top-8 right-8 z-[100] px-7 py-2.5 bg-white/20 backdrop-blur-2xl border border-white/30 rounded-full text-sm font-bold shadow-2xl hover:bg-white/30 transition-all uppercase tracking-widest mix-blend-difference text-white"
      >
        Skip
      </button>

      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-8 px-5 py-8 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-full shadow-2xl mix-blend-difference text-white">
        {[0, 1, 2].map((idx) => (
          <div key={idx} className="flex flex-col items-center gap-3">
            <span className={`text-sm font-black transition-all duration-300 ${activeSection === idx ? 'scale-110 opacity-100' : 'scale-90 opacity-30'}`}>
              0{idx + 1}
            </span>
            <div
              className={`transition-all duration-500 rounded-full ${activeSection === idx ? 'h-10 w-1.5 bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'h-1.5 w-1.5 bg-white opacity-20'}`}
            />
          </div>
        ))}
      </div>

      <div className="sticky top-0 h-screen w-full overflow-hidden">
        <motion.section
          style={{ opacity: section1Opacity }}
          className={`absolute inset-0 flex flex-col transition-all duration-300 ${activeSection === 0 ? 'z-30 pointer-events-auto' : 'z-0 pointer-events-none'}`}
        >
          <motion.div
            style={{ x: section1TopX }}
            className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMG_S1_TOP})` }}>
              <div className="absolute inset-0 bg-midnight-ink/85"></div>
            </div>
            <div className="relative z-10 text-center">
              <h2 className="text-cloud-dancer text-sm tracking-[0.3em] uppercase mb-4 font-bold">Individual</h2>
              <p className="text-pure-white text-3xl md:text-5xl font-bold leading-tight">
                내 강점을 증명할 방법이<br />막막하신가요?
              </p>
            </div>
          </motion.div>

          <motion.div
            style={{ x: section1BottomX }}
            className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMG_S1_BOTTOM})` }}>
              <div className="absolute inset-0 bg-pure-white/90"></div>
            </div>
            <div className="relative z-10 text-center">
              <h2 className="text-slate-gray text-sm tracking-[0.3em] uppercase mb-4 font-bold">Company</h2>
              <p className="text-midnight-ink text-3xl md:text-5xl font-bold leading-tight">
                수많은 포트폴리오 속에서<br />원하는 인재를 찾기 힘드신가요?
              </p>
            </div>
          </motion.div>
        </motion.section>

        <motion.section
          style={{ opacity: section2Opacity, y: section2Y }}
          className={`absolute inset-0 flex flex-col items-center justify-center p-10 text-center overflow-hidden transition-all duration-300 ${activeSection === 1 ? 'z-30 pointer-events-auto' : 'z-0 pointer-events-none'}`}
        >
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${IMG_S2})` }}>
            <div className="absolute inset-0 bg-midnight-ink/90"></div>
          </div>
          <div className="relative z-20">
            <span className="text-cloud-dancer tracking-[0.4em] uppercase text-xs font-bold block mb-8">The AI Solution</span>
            <h2 className="text-pure-white text-4xl md:text-7xl font-bold mb-10 leading-tight">
              Port Match<br />입체 역량 분석
            </h2>
            <p className="text-silver-mist text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed">
              데이터 뒤에 숨겨진 당신의 진짜 가치를<br />
              AI가 정교하게 찾아내어 최적의 기회와 연결합니다.
            </p>
          </div>
        </motion.section>

        <motion.section
          style={{ opacity: section3Opacity }}
          className={`absolute inset-0 flex flex-col md:flex-row overflow-hidden transition-all duration-300 ${activeSection === 2 ? 'z-40 pointer-events-auto' : 'z-0 pointer-events-none'}`}
        >
          <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none select-none mix-blend-difference">
            <h2 className="text-[12vw] md:text-[10rem] font-black uppercase leading-none tracking-tighter text-white/10 whitespace-nowrap">
              PORT MATCH
            </h2>
          </div>

          <motion.div
            style={{ x: section3LeftX }}
            className="flex-1 h-full relative group overflow-hidden md:border-r border-white/10 cursor-pointer z-10 transition-[flex] duration-700 ease-in-out hover:flex-[1.5] bg-[#111111]"
            onClick={() => handleLoginRedirect('applicant')}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div
                className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: `url(${IMG_S3_OBJ_APPLICANT})` }}
              />
              <div className="absolute inset-0 bg-black/60"></div>
            </div>

            <div className="relative z-30 h-full flex flex-col items-center justify-center p-12 text-center">
              <h2 className="text-4xl md:text-5xl font-black text-pure-white mb-6 transform transition-all duration-700 group-hover:-translate-y-4">개인</h2>
              <p className="text-cloud-dancer text-lg md:text-xl font-medium max-w-xs opacity-60 group-hover:opacity-100 transition-all duration-700">
                나만의 분석 레포트를 받고<br />맞춤형 공고에 지원하세요.
              </p>
            </div>
          </motion.div>

          <motion.div
            style={{ x: section3RightX }}
            className="flex-1 h-full relative group overflow-hidden cursor-pointer z-10 transition-[flex] duration-700 ease-in-out hover:flex-[1.5] bg-pure-white"
            onClick={() => handleLoginRedirect('company')}
          >
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div
                className="w-full h-full bg-center bg-no-repeat bg-cover transition-transform duration-1000 group-hover:scale-110"
                style={{ backgroundImage: `url(${IMG_S3_OBJ_COMPANY})` }}
              />
              <div className="absolute inset-0 bg-white/60"></div>
            </div>

            <div className="relative z-30 h-full flex flex-col items-center justify-center p-12 text-center text-midnight-ink">
              <h2 className="text-4xl md:text-5xl font-black mb-6 transform transition-all duration-700 group-hover:-translate-y-4">기업</h2>
              <p className="text-slate-gray text-lg md:text-xl font-medium max-w-xs opacity-80 group-hover:opacity-100 transition-all duration-700">
                AI가 필터링한 검증된 인재를<br />가장 먼저 만나보세요.
              </p>
            </div>
          </motion.div>
        </motion.section>
      </div>
    </div>
  );
}

export default IntroPage;