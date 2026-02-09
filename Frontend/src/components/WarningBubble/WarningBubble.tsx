import { motion } from 'framer-motion';

interface WarningBubbleProps {
  message: string;
  isVisible: boolean;
}

const WarningBubble = ({ message, isVisible }: WarningBubbleProps) => {
  if (!isVisible || !message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute top-full left-4 z-50 mt-1"
    >
      <div className="flex flex-col items-start">
        <div className="ml-4 h-0 w-0 border-x-[5px] border-b-[6px] border-x-transparent border-b-red-500/80" />
        <div className="rounded-lg bg-red-500/80 px-3 py-1.5 text-[11px] font-bold text-white shadow-lg backdrop-blur-md">
          {message}
        </div>
      </div>
    </motion.div>
  );
};

export default WarningBubble;
