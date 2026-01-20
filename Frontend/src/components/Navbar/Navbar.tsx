import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type UserState = 'guest' | 'individual' | 'corporate';

interface NavActionProps {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  isError?: boolean;
  mobile?: boolean;
}

const NavAction = ({ to, onClick, children, isError, mobile }: NavActionProps) => {
  const baseClassName = `group relative py-2 text-lg font-bold whitespace-nowrap transition-colors duration-300 cursor-pointer ${
    mobile ? 'w-full text-left px-4' : ''
  } ${isError ? 'hover:text-point-blue text-midnight-ink' : 'text-midnight-ink'}`;

  const underlineColor = isError ? 'bg-point-blue' : 'bg-midnight-ink';

  const content = (
    <>
      {children}
      {!mobile && (
        <span
          className={`${underlineColor} absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full`}
        />
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={baseClassName} onClick={onClick}>
        {content}
      </Link>
    );
  }

  return (
    <button onClick={onClick} className={baseClassName}>
      {content}
    </button>
  );
};

function Navbar() {
  const navigate = useNavigate();

  const [userState, setUserState] = useState<UserState>(() => {
    const role = localStorage.getItem('userRole') as UserState;
    const token = localStorage.getItem('accessToken');

    if (token && (role === 'individual' || role === 'corporate')) {
      return role;
    }
    return 'guest';
  });

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleStateChange = (state: UserState) => {
    if (state === 'guest') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('userRole');
      setUserState('guest');
      navigate('/main');
    } else {
      localStorage.setItem('accessToken', `mock-token-${state}`);
      localStorage.setItem('userRole', state);
      setUserState(state);
    }
    window.location.reload();
  };

  const handleLogoClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/main');
  };

  const logoPart1 = 'PORT'.split('');
  const logoPart2 = 'MATCH'.split('');
  const charDuration = 0.05;
  const groupPause = 0.4;

  return (
    <nav id="app-navbar" className="bg-pure-white/70 border-soft-pebble fixed top-0 z-100 w-full border-b backdrop-blur-xl transition-all duration-300">
      <style>{`
        @keyframes logo-appear {
          from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
      `}</style>

      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div className="z-10 flex items-center gap-8 xl:gap-12">
          <a
            href="/main"
            onClick={handleLogoClick}
            className="text-midnight-ink flex shrink-0 items-center text-2xl font-black tracking-tighter"
          >
            <span className="flex">
              {logoPart1.map((char, idx) => (
                <span
                  key={`p1-${idx}`}
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
                  key={`p2-${idx}`}
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
          </a>

          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
            <NavAction to="/main">홈</NavAction>
            {userState === 'individual' && <NavAction to="/resume">이력서 관리</NavAction>}
            {userState === 'corporate' && <NavAction to="/manage">공고 관리</NavAction>}
          </div>
        </div>

        <div className="group absolute left-1/2 hidden w-full max-w-50 shrink-0 -translate-x-1/2 lg:block xl:max-w-sm">
          <input
            type="text"
            placeholder={userState === 'corporate' ? '인재 검색' : '공고 검색'}
            className="bg-cloud-dancer/50 border-soft-pebble focus:border-midnight-ink text-midnight-ink w-full rounded-xl border px-6 py-3 text-base transition-all outline-none"
          />
          <button className="text-slate-gray absolute top-1/2 right-5 -translate-y-1/2">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </div>

        <div className="z-10 flex items-center gap-6 xl:gap-10">
          <div className="hidden items-center gap-6 lg:flex xl:gap-10">
            {userState === 'guest' ? (
              <>
                <NavAction to="/login" isError>
                  로그인
                </NavAction>
                <NavAction to="/signup">회원가입</NavAction>
              </>
            ) : (
              <>
                <NavAction onClick={() => handleStateChange('guest')} isError>
                  로그아웃
                </NavAction>
                <NavAction to="/mypage">마이페이지</NavAction>
              </>
            )}
          </div>

          <button
            className="text-midnight-ink block lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {isMenuOpen ? (
                <path d="M18 6L6 18M6 6l12 12" />
              ) : (
                <path d="M3 12h18M3 6h18M3 18h18" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="bg-pure-white border-soft-pebble absolute top-20 left-0 w-full border-b p-6 shadow-xl lg:hidden">
          <div className="flex flex-col gap-4">
            <div className="mb-4">
              <input
                type="text"
                placeholder={userState === 'corporate' ? '인재 검색' : '공고 검색'}
                className="bg-cloud-dancer/50 border-soft-pebble text-midnight-ink w-full rounded-xl border px-4 py-2 text-sm outline-none"
              />
            </div>
            <NavAction to="/main" mobile onClick={() => setIsMenuOpen(false)}>
              홈
            </NavAction>
            {userState === 'individual' && (
              <NavAction to="/resume" mobile onClick={() => setIsMenuOpen(false)}>
                이력서 관리
              </NavAction>
            )}
            {userState === 'corporate' && (
              <NavAction to="/manage" mobile onClick={() => setIsMenuOpen(false)}>
                공고 관리
              </NavAction>
            )}
            <hr className="border-soft-pebble my-2" />
            {userState === 'guest' ? (
              <>
                <NavAction to="/login" isError mobile onClick={() => setIsMenuOpen(false)}>
                  로그인
                </NavAction>
                <NavAction to="/signup" mobile onClick={() => setIsMenuOpen(false)}>
                  회원가입
                </NavAction>
              </>
            ) : (
              <>
                <NavAction
                  onClick={() => {
                    handleStateChange('guest');
                    setIsMenuOpen(false);
                  }}
                  isError
                  mobile
                >
                  로그아웃
                </NavAction>
                <NavAction to="/mypage" mobile onClick={() => setIsMenuOpen(false)}>
                  마이페이지
                </NavAction>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-midnight-ink/90 absolute top-20 left-6 flex gap-1 rounded-b-md border border-white/10 p-1 shadow-lg backdrop-blur-md">
        <button
          onClick={() => handleStateChange('guest')}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${userState === 'guest' ? 'bg-pure-white text-midnight-ink' : 'text-white/60 hover:text-white'}`}
        >
          GUEST
        </button>
        <button
          onClick={() => handleStateChange('individual')}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${userState === 'individual' ? 'bg-pure-white text-midnight-ink' : 'text-white/60 hover:text-white'}`}
        >
          INDIVIDUAL
        </button>
        <button
          onClick={() => handleStateChange('corporate')}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${userState === 'corporate' ? 'bg-pure-white text-midnight-ink' : 'text-white/60 hover:text-white'}`}
        >
          CORPORATE
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
