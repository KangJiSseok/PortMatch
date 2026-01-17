import type { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  variant?: 'light' | 'dark' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

const Button = ({ 
  children, 
  variant = 'light', 
  size = 'md',
  onClick, 
  className = '' 
}: ButtonProps) => {
  const baseStyles = "font-medium rounded-xl border transition-all duration-300 active:scale-95 flex items-center justify-center";
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
  };

  const variants = {
    light: "bg-cloud-dancer text-midnight-ink border-cloud-dancer hover:bg-midnight-ink hover:text-pure-white hover:border-midnight-ink",
    dark: "bg-midnight-ink text-pure-white border-midnight-ink hover:bg-cloud-dancer hover:text-midnight-ink hover:border-cloud-dancer",
    outline: "bg-transparent text-midnight-ink border-soft-pebble hover:bg-pure-white hover:border-midnight-ink"
  };

  return (
    <button 
      onClick={onClick} 
      className={`${baseStyles} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;