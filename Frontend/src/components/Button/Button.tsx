import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'light' | 'dark' | 'outline' | 'blue' | 'red' | 'destructive' | 'close';
  colorTheme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

function Button({
  variant = 'light',
  colorTheme = 'light',
  size = 'md',
  className = '',
  children,
  ...props
}: ButtonProps) {
  const baseStyles =
    'inline-flex items-center justify-center font-bold transition-all duration-300 border outline-none';

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
  };

  return (
    <button className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
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
        children
      )}
    </button>
  );
}

export default Button;
