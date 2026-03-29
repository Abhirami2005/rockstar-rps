import React from 'react';
import { motion } from 'motion/react';
import { Coins } from 'lucide-react';
import { GameStats } from '../types';

interface ScoreBoardProps {
  player1Name: string;
  player2Name: string;
  player1Score: number;
  player2Score: number;
  winLimit: number;
  stats: GameStats;
}

export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  player1Name,
  player2Name,
  player1Score,
  player2Score,
  winLimit,
  stats,
}) => {
  const winRate = stats.totalGames > 0 
    ? Math.round((stats.wins / stats.totalGames) * 100) 
    : 0;

  return (
    <div className="w-full max-w-md bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div className="text-center flex-1">
          <h3 className="text-white/60 text-xs uppercase tracking-widest mb-1">{player1Name}</h3>
          <motion.p 
            key={player1Score}
            initial={{ scale: 1.5, color: '#fff' }}
            animate={{ scale: 1, color: '#fff' }}
            className="text-5xl font-black text-white"
          >
            {player1Score}
          </motion.p>
        </div>
        
        <div className="px-4 text-white/30 font-bold text-xl">VS</div>

        <div className="text-center flex-1">
          <h3 className="text-white/60 text-xs uppercase tracking-widest mb-1">{player2Name}</h3>
          <motion.p 
            key={player2Score}
            initial={{ scale: 1.5, color: '#fff' }}
            animate={{ scale: 1, color: '#fff' }}
            className="text-5xl font-black text-white"
          >
            {player2Score}
          </motion.p>
        </div>
      </div>

      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden flex mb-4">
        <div 
          className="h-full bg-rose-500 transition-all duration-500" 
          style={{ width: `${(player1Score / winLimit) * 100}%` }}
        />
        <div 
          className="h-full bg-indigo-500 transition-all duration-500 ml-auto" 
          style={{ width: `${(player2Score / winLimit) * 100}%` }}
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-center border-t border-white/10 pt-4">
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">Total</p>
          <p className="text-white font-bold">{stats.totalGames}</p>
        </div>
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">Win Rate</p>
          <p className="text-white font-bold">{winRate}%</p>
        </div>
        <div>
          <p className="text-white/40 text-[10px] uppercase tracking-wider">Coins</p>
          <div className="flex items-center justify-center gap-1">
            <Coins size={10} className="text-amber-500" />
            <p className="text-white font-bold">{stats.coins || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
