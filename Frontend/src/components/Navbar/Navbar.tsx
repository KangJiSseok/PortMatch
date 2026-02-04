import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useMessenger } from '@/hooks/useMessenger';
import { resumeApi } from '@/api/resumeApi';

interface NavActionProps {
  to?: string;
  onClick?: () => void;
  children: React.ReactNode;
  isError?: boolean;
  noDefaultUnderline?: boolean;
}

const NavAction = ({ to, onClick, children, isError, noDefaultUnderline }: NavActionProps) => {
  const baseClassName = `group relative py-2 text-lg font-bold transition-colors duration-300 cursor-pointer ${
    isError ? 'hover:text-point-blue text-midnight-ink' : 'text-midnight-ink'
  }`;

  const underlineColor = isError ? 'bg-point-blue' : 'bg-midnight-ink';

  const content = (
    <>
      <div className="flex items-center gap-1">{children}</div>
      {!noDefaultUnderline && (
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

const SearchBar = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [searchKeyword, setSearchKeyword] = useState('');

  const handleSearch = () => {
    const trimmed = searchKeyword.trim();
    const targetPath = user?.role === 'COMPANY' ? '/company/recommend/candidates' : '/job-postings';

    if (!trimmed) {
      navigate(targetPath);
      return;
    }
    navigate(`${targetPath}?keyword=${encodeURIComponent(trimmed)}`);
  };

  const searchPlaceholder = user?.role === 'COMPANY' ? '인재 검색' : '공고 검색';
  const isSearchActive = searchKeyword.trim().length > 0;

  return (
    <div className="absolute left-1/2 w-full max-w-sm -translate-x-1/2">
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
  );
};

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoggedIn } = useAuthStore();
  const { startNewChat } = useMessenger();
  const [logoKey, setLogoKey] = useState(0);

  const handleLogout = () => {
    navigate('/logout');
  };

  const handleResumeManagement = async () => {
    try {
      const resumes = await resumeApi.getResumes();

      if (resumes.length === 0) {
        navigate('/resumes/me');
        return;
      }

      const mainResume = resumes.find((r) => r.isMain);
      if (mainResume) {
        navigate(`/resumes/${mainResume.id}`);
      } else {
        navigate(`/resumes/${resumes[0].id}`);
      }
    } catch (error) {
      console.error('Failed to fetch resumes navigation info:', error);
      navigate('/resumes/me');
    }
  };

  const handleLogoClick = () => {
    setLogoKey((prev) => prev + 1);
  };

  const handleTestChat = async () => {
    const targetUid = window.prompt('대화할 상대방의 UID를 입력하세요:');
    if (!targetUid) return;

    try {
      await startNewChat(targetUid, '테스트 유저', '');
    } catch (error) {
      console.error(error);
      alert('채팅방 생성에 실패했습니다.');
    }
  };

  const logoPart1 = 'PORT'.split('');
  const logoPart2 = 'MATCH'.split('');
  const charDuration = 0.05;
  const groupPause = 0.4;

  return (
    <nav
      id="app-navbar"
      className="bg-pure-white/70 border-soft-pebble sticky top-0 z-100 -mb-20 w-full min-w-max border-b backdrop-blur-xl transition-all duration-300"
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

      <div className="relative mx-auto flex h-20 w-350 items-center justify-between px-6">
        <div className="z-10 ml-12 flex items-center gap-12">
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

          <div className="flex items-center gap-8">
            {user?.role === 'APPLICANT' && (
              <NavAction onClick={handleResumeManagement}>이력서 관리</NavAction>
            )}
            {user?.role === 'COMPANY' && (
              <>
                <NavAction to="/company/jobs">공고 관리</NavAction>
                <NavAction onClick={handleTestChat}>채팅 테스트</NavAction>
              </>
            )}
          </div>
        </div>

        <SearchBar key={location.pathname + location.search} />

        <div className="z-10 mr-12 flex items-center gap-10">
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
              <NavAction to="/mypage" noDefaultUnderline>
                <div className="flex items-center">
                  <span className="relative block max-w-20 truncate" title={user?.name}>
                    {user?.name}
                    <span className="bg-midnight-ink absolute bottom-0 left-0 h-0.5 w-0 transition-all duration-300 group-hover:w-full" />
                  </span>
                  <span className="ml-0.5 shrink-0">님</span>
                </div>
              </NavAction>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
