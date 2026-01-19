import { useState } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  variant?: 'light' | 'dark';
}

function Input({ label, error, variant = 'light', className = '', id, ...props }: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => setIsFocused(true);
  const handleBlur = () => setIsFocused(false);

  const baseContainerStyles = 'flex flex-col gap-2 w-full';
  const labelStyles = variant === 'light' ? 'text-slate-gray' : 'text-cloud-dancer';

  const inputBaseStyles =
    'w-full px-4 py-3 rounded-xl border transition-all duration-300 outline-none font-medium';

  const variants = {
    light: `bg-pure-white text-midnight-ink ${
      error
        ? 'border-error'
        : isFocused
          ? 'border-midnight-ink shadow-[0_0_0_1px_#1a1a1a]'
          : 'border-soft-pebble'
    }`,
    dark: `bg-midnight-ink text-pure-white ${
      error
        ? 'border-error'
        : isFocused
          ? 'border-pure-white shadow-[0_0_0_1px_#fcfcfc]'
          : 'border-[#333]'
    }`,
  };

  return (
    <div className={baseContainerStyles}>
      {label && (
        <label htmlFor={id} className={`text-sm font-bold ${labelStyles}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          className={`${inputBaseStyles} ${variants[variant]} ${className}`}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
      </div>
      {error && <span className="text-error mt-1 text-xs font-medium">{error}</span>}
    </div>
  );
}

export default Input;
