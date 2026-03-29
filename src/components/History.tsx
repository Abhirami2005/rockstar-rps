import React from 'react';
import { GameHistoryItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HistoryProps {
  history: GameHistoryItem[];
}

const CHOICE_EMOJIS: Record<string, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

export const History: React.FC<HistoryProps> = ({ history }) => {
  return (
    <div className="w-full max-w-md bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10 mt-6">
      <h4 className="text-white/40 text-[10px] uppercase tracking-widest mb-3 font-bold">Match History</h4>
      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence initial={false}>
          {history.length === 0 ? (
            <p className="text-white/20 text-xs text-center py-4 italic">No games played yet</p>
          ) : (
            history.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{CHOICE_EMOJIS[item.player1]}</span>
                  <span className="text-white/30 text-[10px]">vs</span>
                  <span className="text-lg">{CHOICE_EMOJIS[item.player2]}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    item.result === 'win' ? 'bg-emerald-500/20 text-emerald-400' :
                    item.result === 'lose' ? 'bg-rose-500/20 text-rose-400' :
                    'bg-white/10 text-white/40'
                  }`}>
                    {item.result}
                  </span>
                  <span className="text-white/20 text-[8px]">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
