import React from 'react';
import { motion } from 'framer-motion';
import { Choice } from '../logic/game';
import { cn } from '../lib/utils';

interface ChoiceButtonProps {
  choice: Choice;
  onClick: (choice: Choice) => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}

const CHOICE_EMOJIS: Record<Choice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

const CHOICE_COLORS: Record<Choice, string> = {
  rock: 'bg-rose-500 hover:bg-rose-600',
  paper: 'bg-amber-500 hover:bg-amber-600',
  scissors: 'bg-indigo-500 hover:bg-indigo-600',
};

export const ChoiceButton: React.FC<ChoiceButtonProps> = ({
  choice,
  onClick,
  disabled,
  className,
  label,
}) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      disabled={disabled}
      onClick={() => onClick(choice)}
      className={cn(
        'flex flex-col items-center justify-center p-6 rounded-2xl shadow-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px]',
        CHOICE_COLORS[choice],
        className
      )}
    >
      <span className="text-5xl mb-2">{CHOICE_EMOJIS[choice]}</span>
      <span className="text-white font-bold uppercase tracking-wider text-sm">
        {label || choice}
      </span>
    </motion.button>
  );
};
