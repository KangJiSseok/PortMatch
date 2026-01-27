interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  variant?: 'light' | 'dark';
  error?: boolean;
}

function Select({
  label,
  options,
  variant = 'light',
  error,
  className = '',
  id,
  ...props
}: SelectProps) {
  const labelStyles = variant === 'light' ? 'text-slate-gray' : 'text-cloud-dancer';

  const selectStyles =
    variant === 'light'
      ? `bg-pure-white ${error ? 'border-error' : 'border-soft-pebble'} text-midnight-ink focus:border-midnight-ink`
      : `bg-midnight-ink ${error ? 'border-error' : 'border-[#333]'} text-pure-white focus:border-pure-white`;

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label htmlFor={id} className={`text-sm font-bold ${labelStyles}`}>
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          className={`w-full cursor-pointer appearance-none rounded-xl border px-4 py-3 font-medium transition-all duration-300 outline-none ${selectStyles} ${className} `}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div
          className={`pointer-events-none absolute top-1/2 right-4 -translate-y-1/2 ${variant === 'light' ? 'text-slate-gray' : 'text-cloud-dancer'}`}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default Select;
