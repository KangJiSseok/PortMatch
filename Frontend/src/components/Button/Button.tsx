interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'light' | 'dark' | 'outline';
  colorTheme?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

function Button({ 
  variant = 'light', 
  colorTheme = 'light', 
  size = 'md', 
  className = '', 
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 rounded-md border outline-none";
  
  const sizes = {
    sm: "px-4 py-1.5 text-xs",
    md: "px-6 py-2.5 text-sm",
    lg: "px-8 py-3.5 text-base"
  };

  const variants = {
    light: "bg-cloud-dancer text-midnight-ink border-cloud-dancer hover:bg-slate-gray hover:text-pure-white hover:border-midnight-ink",
    dark: "bg-slate-gray text-pure-white border-midnight-ink hover:bg-cloud-dancer hover:text-midnight-ink hover:border-cloud-dancer",
    outline: colorTheme === 'light' 
      ? "bg-transparent text-midnight-ink border-soft-pebble hover:bg-pure-white hover:border-midnight-ink"
      : "bg-transparent text-pure-white border-white/30 hover:border-pure-white" // 배경 변화(bg) 없음
  };

  return (
    <button 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;