import React from 'react';
import { GameSettings } from '../types';
import { Settings as SettingsIcon, Volume2, VolumeX, Moon, Sun, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SettingsProps {
  settings: GameSettings;
  onUpdate: (settings: Partial<GameSettings>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className="fixed top-4 right-4 z-50">
      <motion.button
        whileHover={{ rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white shadow-xl"
      >
        <SettingsIcon size={20} />
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className="absolute top-16 right-0 w-64 bg-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl text-white"
          >
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
              <SettingsIcon size={18} /> Settings
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Difficulty</label>
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                  {['easy', 'medium', 'hard'].map((d) => (
                    <button
                      key={d}
                      onClick={() => onUpdate({ difficulty: d as any })}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                        settings.difficulty === d ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-white/40 uppercase tracking-widest mb-2 block">Win Limit</label>
                <div className="flex gap-1 bg-white/5 p-1 rounded-xl">
                  {[3, 5, 10].map((limit) => (
                    <button
                      key={limit}
                      onClick={() => onUpdate({ winLimit: limit })}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase rounded-lg transition-all ${
                        settings.winLimit === limit ? 'bg-rose-500 text-white shadow-lg' : 'text-white/40 hover:text-white/60'
                      }`}
                    >
                      {limit}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <span className="text-xs text-white/60">Sound Effects</span>
                <button
                  onClick={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
                  className={`p-2 rounded-lg transition-all ${
                    settings.soundEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'
                  }`}
                >
                  {settings.soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-white/60">Theme</span>
                <button
                  onClick={() => onUpdate({ theme: settings.theme === 'light' ? 'dark' : 'light' })}
                  className="p-2 bg-white/5 rounded-lg text-white/60"
                >
                  {settings.theme === 'light' ? <Sun size={16} /> : <Moon size={16} />}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
