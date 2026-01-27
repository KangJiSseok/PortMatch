import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useLogout } from '@/hooks/useAuth';

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
  const location = useLocation();
  const { user, isLoggedIn, setAuth, clearAuth } = useAuthStore();
  const { mutate: performLogout } = useLogout();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [logoKey, setLogoKey] = useState(0);

  const [prevPath, setPrevPath] = useState(location.pathname + location.search);
  const currentPath = location.pathname + location.search;

  if (prevPath !== currentPath) {
    setPrevPath(currentPath);
    setSearchKeyword('');
    setIsMenuOpen(false);
  }

  const handleLogout = () => {
    performLogout();
    setIsMenuOpen(false);
  };

  const handleLogoClick = () => {
    setLogoKey((prev) => prev + 1);
  };

  const handleDevRoleSwitch = (role: 'GUEST' | 'APPLICANT' | 'COMPANY') => {
    if (role === 'GUEST') {
      clearAuth();
    } else {
      setAuth({
        userId: 999,
        email: 'test@portmatch.com',
        name: role === 'APPLICANT' ? '테스트개인' : '테스트기업',
        role: role,
      });
    }
    setIsMenuOpen(false);
  };

  const handleSearch = () => {
    const trimmed = searchKeyword.trim();
    if (!trimmed) {
      navigate('/job-postings');
      return;
    }

    navigate(`/job-postings?keyword=${encodeURIComponent(trimmed)}`);
  };

  const logoPart1 = 'PORT'.split('');
  const logoPart2 = 'MATCH'.split('');
  const charDuration = 0.05;
  const groupPause = 0.4;

  const searchPlaceholder = user?.role === 'COMPANY' ? '인재 검색' : '공고 검색';
  const isSearchActive = searchKeyword.trim().length > 0;

  return (
    <nav
      id="app-navbar"
      className="bg-pure-white/70 border-soft-pebble fixed top-0 z-100 w-full border-b backdrop-blur-xl transition-all duration-300"
    >
      <style>{`
        @keyframes logo-appear {
          from { opacity: 0; transform: translateY(10px); filter: blur(4px); }
          to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes search-pulse {
          0% { transform: translateY(-50%) scale(1); }
          50% { transform: translateY(-50%) scale(1.15); }
          100% { transform: translateY(-50%) scale(1.1); }
        }
        .animate-search-active {
          animation: search-pulse 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
      `}</style>

      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
        <div className="z-10 flex items-center gap-8 xl:gap-12">
          <Link
            to="/main"
            onClick={handleLogoClick}
            className="text-midnight-ink flex shrink-0 items-center text-2xl font-black tracking-tighter"
          >
            <div key={logoKey} className="flex">
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
            </div>
          </Link>

          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
            {user?.role === 'APPLICANT' && <NavAction to="/resumes/me">이력서 관리</NavAction>}
            {user?.role === 'COMPANY' && <NavAction to="/company/jobs">공고 관리</NavAction>}
          </div>
        </div>

        <div className="group absolute left-1/2 hidden w-full max-w-50 shrink-0 -translate-x-1/2 lg:block xl:max-w-sm">
          <input
            id="navbar-search-input"
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={searchPlaceholder}
            className="bg-cloud-dancer/50 border-soft-pebble focus:border-midnight-ink text-midnight-ink w-full rounded-xl border px-6 py-3 text-base transition-all outline-none"
          />
          <button
            onClick={handleSearch}
            className={`absolute top-1/2 right-5 transition-colors duration-300 ${
              isSearchActive
                ? 'text-point-blue animate-search-active'
                : 'text-slate-gray -translate-y-1/2'
            }`}
          >
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
            {!isLoggedIn ? (
              <>
                <NavAction to="/login" isError>
                  로그인
                </NavAction>
                <NavAction to="/signup">회원가입</NavAction>
              </>
            ) : (
              <>
                <NavAction onClick={handleLogout} isError>
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
            <div className="relative mb-2">
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={searchPlaceholder}
                className="bg-cloud-dancer/50 border-soft-pebble focus:border-midnight-ink text-midnight-ink w-full rounded-xl border px-6 py-3 text-base transition-all outline-none"
              />
              <button
                onClick={handleSearch}
                className={`absolute top-1/2 right-5 transition-colors duration-300 ${
                  isSearchActive
                    ? 'text-point-blue animate-search-active'
                    : 'text-slate-gray -translate-y-1/2'
                }`}
              >
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

            {user?.role === 'APPLICANT' && (
              <NavAction to="/resumes/me" mobile>
                이력서 관리
              </NavAction>
            )}
            {user?.role === 'COMPANY' && (
              <NavAction to="/company/jobs" mobile>
                공고 관리
              </NavAction>
            )}
            <hr className="border-soft-pebble my-2" />
            {!isLoggedIn ? (
              <>
                <NavAction to="/login" isError mobile>
                  로그인
                </NavAction>
                <NavAction to="/signup" mobile>
                  회원가입
                </NavAction>
              </>
            ) : (
              <>
                <NavAction onClick={handleLogout} isError mobile>
                  로그아웃
                </NavAction>
                <NavAction to="/mypage" mobile>
                  마이페이지
                </NavAction>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-midnight-ink/90 absolute top-20 left-6 flex items-center gap-1 rounded-b-md border border-white/10 p-1 shadow-lg backdrop-blur-md">
        <button
          onClick={() => handleDevRoleSwitch('GUEST')}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${!isLoggedIn ? 'bg-pure-white text-midnight-ink' : 'text-white/60 hover:text-white'}`}
        >
          GUEST
        </button>
        <button
          onClick={() => handleDevRoleSwitch('APPLICANT')}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${user?.role === 'APPLICANT' ? 'bg-pure-white text-midnight-ink' : 'text-white/60 hover:text-white'}`}
        >
          INDIVIDUAL
        </button>
        <button
          onClick={() => handleDevRoleSwitch('COMPANY')}
          className={`rounded px-2 py-0.5 text-[10px] font-bold transition-colors ${user?.role === 'COMPANY' ? 'bg-pure-white text-midnight-ink' : 'text-white/60 hover:text-white'}`}
        >
          CORPORATE
        </button>
        {isLoggedIn && (
          <span className="ml-2 text-[10px] font-bold text-white/80">{user?.name}</span>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
