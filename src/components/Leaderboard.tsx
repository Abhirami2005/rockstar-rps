import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, X, Coins } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

interface LeaderboardEntry {
  name: string;
  wins: number;
  coins?: number;
}

interface LeaderboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);
    const q = query(
      collection(db, 'leaderboard'),
      orderBy('wins', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => doc.data() as LeaderboardEntry);
      setEntries(data);
      setLoading(false);
    }, (error) => {
      console.error('Leaderboard sync error:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-xl"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm bg-slate-900 rounded-3xl p-8 border border-white/10 shadow-2xl relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/5 rounded-full text-white/40"
            >
              <X size={20} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="text-amber-500" size={32} />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Hall of Fame</h2>
              <p className="text-white/40 text-xs uppercase tracking-widest">Global Top 5 Players</p>
            </div>

            <div className="space-y-3">
              {loading ? (
                <div className="py-12 text-center text-white/20 animate-pulse">Syncing with Cloud...</div>
              ) : entries.length === 0 ? (
                <div className="py-12 text-center text-white/20 italic">No legends yet. Be the first!</div>
              ) : (
                entries.map((entry, index) => (
                  <div
                    key={entry.name}
                    className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/5"
                  >
                    <div className="flex items-center gap-4">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        index === 0 ? 'bg-amber-500 text-slate-950' :
                        index === 1 ? 'bg-slate-300 text-slate-950' :
                        index === 2 ? 'bg-amber-700 text-white' :
                        'bg-white/10 text-white/40'
                      }`}>
                        {index + 1}
                      </span>
                      <span className="text-white font-bold truncate max-w-[120px]">{entry.name}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-black text-lg">{entry.wins}</span>
                        <span className="text-[8px] text-white/20 uppercase font-bold">Wins</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Coins size={10} className="text-amber-500/40" />
                        <span className="text-[10px] text-amber-500/60 font-bold">{entry.coins || 0}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={onClose}
              className="w-full mt-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all"
            >
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
