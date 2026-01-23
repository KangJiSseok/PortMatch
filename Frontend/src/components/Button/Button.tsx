import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | 'light'
    | 'dark'
    | 'outline'
    | 'blue'
    | 'red'
    | 'destructive'
    | 'close'
    | 'filter'
    | 'filter-chip';
  colorTheme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isActive?: boolean;
  isBack?: boolean;
  icon?: React.ReactNode;
  badge?: number | string;
  fullWidth?: boolean;
}

function Button({
  variant = 'light',
  colorTheme = 'light',
  size = 'md',
  isActive = false,
  isBack = false,
  icon,
  badge,
  fullWidth = false,
  className = '',
  children,
  onClick,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-300 border outline-none relative group';

  const sizes = {
    sm: variant === 'close' ? 'w-8 h-8' : 'px-4 py-1.5 text-xs rounded-md',
    md: variant === 'close' ? 'w-10 h-10' : 'px-6 py-2.5 text-sm rounded-md',
    lg: variant === 'close' ? 'w-12 h-12' : 'px-8 py-3.5 text-base rounded-md',
    xl: variant === 'close' ? 'w-16 h-16' : 'px-10 py-5 text-2xl rounded-md',
  };

  const variants = {
    light:
      'bg-cloud-dancer text-midnight-ink border-transparent hover:bg-slate-gray hover:text-pure-white',
    dark: 'bg-slate-gray text-pure-white border-transparent hover:bg-cloud-dancer hover:text-midnight-ink',
    blue: 'bg-point-blue text-white border-transparent hover:bg-cloud-dancer hover:text-midnight-ink',
    red: 'bg-error text-white border-transparent hover:bg-cloud-dancer hover:text-midnight-ink',
    destructive: 'bg-error/10 text-error border-transparent hover:bg-error hover:text-white',
    close:
      'bg-error/10 text-error border-transparent hover:bg-error hover:text-white aspect-square rounded-xl p-0',
    outline:
      colorTheme === 'light'
        ? 'bg-transparent text-midnight-ink border-soft-pebble hover:border-midnight-ink'
        : 'bg-transparent text-pure-white border-white/30 hover:border-pure-white',
    filter: isActive
      ? 'bg-point-blue text-white shadow-sm border-transparent'
      : 'bg-zinc-100/50 text-zinc-600 border-zinc-100 hover:border-zinc-200',
    'filter-chip': isActive
      ? 'bg-point-blue text-white shadow-sm border-transparent'
      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-point-blue/30',
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
    } else if (isBack) {
      window.history.back();
    }
  };

  const renderIcon = () => {
    if (icon) return <span className="mr-2">{icon}</span>;
    if (isBack) {
      return (
        <svg
          className="mr-2 transform transition-transform duration-300 group-hover:-translate-x-1"
          width="1.2em"
          height="1.2em"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      );
    }
    return null;
  };

  return (
    <button
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      onClick={handleClick}
      {...props}
    >
      {variant === 'close' && !children ? (
        <svg
          width="50%"
          height="50%"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      ) : (
        <>
          {renderIcon()}
          {children || (isBack ? '뒤로가기' : '')}
          {badge !== undefined && (
            <span className="text-point-blue absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black shadow-sm">
              {badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export default Button;
