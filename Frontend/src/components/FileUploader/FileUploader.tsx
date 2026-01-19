import { useState, useRef } from 'react';

interface FileUploaderProps {
  label?: string;
  description?: string;
  variant?: 'light' | 'dark';
  onFileSelect?: (file: File) => void;
}

function FileUploader({
  label,
  description = 'PDF 또는 이미지 파일을 드래그하여 업로드하세요',
  variant = 'light',
  onFileSelect,
}: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setFileName(file.name);
      onFileSelect?.(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      onFileSelect?.(file);
    }
  };

  const boxStyles =
    variant === 'light'
      ? `bg-pure-white border-soft-pebble ${dragActive ? 'border-midnight-ink bg-cloud-dancer' : ''}`
      : `bg-midnight-ink border-[#333] ${dragActive ? 'border-pure-white bg-white/5' : ''}`;

  const textStyles = variant === 'light' ? 'text-slate-gray' : 'text-cloud-dancer opacity-60';

  return (
    <div className="flex w-full flex-col gap-2">
      {label && (
        <label
          className={`text-sm font-bold ${variant === 'light' ? 'text-slate-gray' : 'text-cloud-dancer'}`}
        >
          {label}
        </label>
      )}
      <div
        className={`relative flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition-all duration-300 ${boxStyles}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" className="hidden" onChange={handleChange} />
        <svg
          className={`mb-3 h-8 w-8 ${variant === 'light' ? 'text-midnight-ink' : 'text-pure-white'}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        <p
          className={`text-sm font-medium ${fileName ? (variant === 'light' ? 'text-midnight-ink' : 'text-pure-white') : textStyles}`}
        >
          {fileName || description}
        </p>
      </div>
    </div>
  );
}

export default FileUploader;
