interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  variant?: 'light' | 'dark';
}

function Checkbox({ label, variant = 'light', className = '', id, ...props }: CheckboxProps) {
  const labelStyles = variant === 'light' ? 'text-slate-gray' : 'text-cloud-dancer';
  const boxStyles =
    variant === 'light'
      ? 'border-soft-pebble checked:bg-midnight-ink'
      : 'border-white/30 checked:bg-pure-white';

  return (
    <label className={`group flex cursor-pointer items-center gap-3 ${className}`}>
      <div className="relative flex items-center">
        <input
          type="checkbox"
          id={id}
          className={`peer h-5 w-5 cursor-pointer appearance-none rounded-md border-2 transition-all duration-200 ${boxStyles} `}
          {...props}
        />
        <svg
          className={`pointer-events-none absolute left-0.75 hidden h-3.5 w-3.5 peer-checked:block ${variant === 'light' ? 'text-pure-white' : 'text-midnight-ink'} `}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      {label && <span className={`text-sm font-medium select-none ${labelStyles}`}>{label}</span>}
    </label>
  );
}

export default Checkbox;
