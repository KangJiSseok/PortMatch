interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'light' | 'dark' | 'outline' | 'blue';
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
    'inline-flex items-center justify-center font-bold transition-all duration-300 rounded-md border outline-none';

  const sizes = {
    sm: 'px-4 py-1.5 text-xs',
    md: 'px-6 py-2.5 text-sm',
    lg: 'px-8 py-3.5 text-base',
    xl: 'px-10 py-5 text-2xl',
  };

  const variants = {
    light:
      'bg-cloud-dancer text-midnight-ink border-transparent hover:bg-slate-gray hover:text-pure-white ',
    dark: 'bg-slate-gray text-pure-white border-transparent hover:bg-cloud-dancer hover:text-midnight-ink ',
    blue: 'bg-point-blue text-white border-transparent hover:bg-cloud-dancer hover:text-midnight-ink',
    outline:
      colorTheme === 'light'
        ? 'bg-transparent text-midnight-ink border-soft-pebble hover:border-midnight-ink'
        : 'bg-transparent text-pure-white border-white/30 hover:border-pure-white',
  };

  return (
    <button className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export default Button;
