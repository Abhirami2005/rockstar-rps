import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface CountdownProps {
  count: number | null;
  onComplete: () => void;
}

export const Countdown: React.FC<CountdownProps> = ({ count, onComplete }) => {
  return (
    <AnimatePresence mode="wait">
      {count !== null && (
        <motion.div
          key={count}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1.5, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
        >
          <span className="text-8xl font-black text-white drop-shadow-2xl">
            {count === 0 ? 'GO!' : count}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
