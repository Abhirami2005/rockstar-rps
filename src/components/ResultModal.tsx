import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RefreshCw, Home, Coins } from 'lucide-react';
import { Choice } from '../logic/game';

interface ResultModalProps {
  roundResult: {
    player1: Choice;
    player2: Choice;
    outcome: 'win' | 'lose' | 'draw';
  } | null;
  matchWinner: string | null;
  onReset: () => void;
  onContinue: () => void;
}

const CHOICE_EMOJIS: Record<string, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

export const ResultModal: React.FC<ResultModalProps> = ({
  roundResult,
  matchWinner,
  onReset,
  onContinue,
}) => {
  return (
    <AnimatePresence>
      {(roundResult || matchWinner) && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-slate-900 rounded-3xl p-8 border border-white/10 shadow-2xl text-center"
          >
            {matchWinner ? (
              <>
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Trophy className="text-amber-500" size={40} />
                </div>
                <h2 className="text-3xl font-black text-white mb-2">Match Over!</h2>
                <div className="flex items-center justify-center gap-2 mb-6 bg-amber-500/10 py-2 px-4 rounded-full border border-amber-500/20 w-fit mx-auto">
                  <Coins size={16} className="text-amber-500" />
                  <span className="text-amber-500 font-black">+50 Match Bonus</span>
                </div>
                <p className="text-white/60 mb-8">
                  <span className="text-amber-500 font-bold">{matchWinner}</span> is the ultimate champion!
                </p>
                <button
                  onClick={onReset}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <RefreshCw size={20} /> Play Again
                </button>
              </>
            ) : roundResult && (
              <>
                <div className="flex justify-center items-center gap-8 mb-8">
                  <div className="text-center">
                    <span className="text-6xl block mb-2">{CHOICE_EMOJIS[roundResult.player1]}</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">You</span>
                  </div>
                  <div className="text-2xl font-black text-white/20">VS</div>
                  <div className="text-center">
                    <span className="text-6xl block mb-2">{CHOICE_EMOJIS[roundResult.player2]}</span>
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Opponent</span>
                  </div>
                </div>

                <h2 className={`text-4xl font-black mb-4 uppercase tracking-tighter ${
                  roundResult.outcome === 'win' ? 'text-emerald-400' :
                  roundResult.outcome === 'lose' ? 'text-rose-400' :
                  'text-white/60'
                }`}>
                  {roundResult.outcome === 'win' ? 'You Win!' :
                   roundResult.outcome === 'lose' ? 'You Lose' :
                   'Draw!'}
                </h2>

                {roundResult.outcome === 'win' && (
                  <div className="flex items-center justify-center gap-2 mb-6 text-amber-500 font-black animate-bounce">
                    <Coins size={16} />
                    <span>+10 Coins</span>
                  </div>
                )}

                <button
                  onClick={onContinue}
                  className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl transition-all"
                >
                  Next Round
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
