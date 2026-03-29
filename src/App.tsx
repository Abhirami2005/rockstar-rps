import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { Trophy, Users, User, RotateCcw, BarChart3, Home, Award, LogIn, LogOut, Globe, Hash, Play, CheckCircle2, Coins } from 'lucide-react';

// Firebase Imports
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut, 
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  setDoc, 
  doc, 
  getDoc, 
  serverTimestamp,
  updateDoc,
  deleteDoc,
  deleteField
} from 'firebase/firestore';
import { auth, db } from './firebase';

import { Choice, getResult, SmartAI, CHOICES } from './logic/game';
import { GameHistoryItem, GameStats, GameSettings, RoomState, PlayerState } from './types';
import { ChoiceButton } from './components/ChoiceButton';
import { ScoreBoard } from './components/ScoreBoard';
import { History } from './components/History';
import { Settings } from './components/Settings';
import { Countdown } from './components/Countdown';
import { ResultModal } from './components/ResultModal';
import { Leaderboard } from './components/Leaderboard';
import { cn } from './lib/utils';

const DEFAULT_SETTINGS: GameSettings = {
  difficulty: 'medium',
  soundEnabled: true,
  theme: 'dark',
  winLimit: 5,
};

const DEFAULT_STATS: GameStats = {
  totalGames: 0,
  wins: 0,
  losses: 0,
  draws: 0,
  coins: 0,
};

export default function App() {
  // Auth State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Game State
  const [gameMode, setGameMode] = useState<'single' | 'online' | null>(null);
  const [player1Score, setPlayer1Score] = useState(0);
  const [player2Score, setPlayer2Score] = useState(0);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [stats, setStats] = useState<GameStats>(DEFAULT_STATS);
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  
  // Online Multiplayer State
  const [room, setRoom] = useState<RoomState | null>(null);
  const [roomInput, setRoomInput] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  
  // UI State
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isCountingDown, setIsCountingDown] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [roundResult, setRoundResult] = useState<{
    player1: Choice;
    player2: Choice;
    outcome: 'win' | 'lose' | 'draw';
  } | null>(null);
  const [matchWinner, setMatchWinner] = useState<string | null>(null);
  
  // AI Instance
  const aiRef = useRef(new SmartAI());

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setIsAuthReady(true);
      
      if (u) {
        // Fetch user stats
        const userDoc = await getDoc(doc(db, 'leaderboard', u.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setStats({
            totalGames: data.totalGames || 0,
            wins: data.wins || 0,
            losses: data.losses || 0,
            draws: data.draws || 0,
            coins: data.coins || 0,
          });
        } else {
          // Initialize user in leaderboard
          await setDoc(doc(db, 'leaderboard', u.uid), {
            name: u.displayName || 'Player',
            wins: 0,
            coins: 0,
            lastUpdated: serverTimestamp(),
            totalGames: 0,
            losses: 0,
            draws: 0
          });
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const addCoins = useCallback(async (amount: number) => {
    if (!user) return;
    setStats(prev => ({ ...prev, coins: (prev.coins || 0) + amount }));
    try {
      await updateDoc(doc(db, 'leaderboard', user.uid), {
        coins: (stats.coins || 0) + amount,
        lastUpdated: serverTimestamp()
      });
    } catch (e) {
      console.error("Failed to update coins:", e);
    }
  }, [user, stats.coins]);

  // Online Round Reward Effect
  useEffect(() => {
    if (gameMode === 'online' && room?.status === 'result' && user) {
      const myResult = room.players[user.uid]?.lastResult;
      if (myResult === 'win') {
        addCoins(20);
      }
    }
  }, [room?.status, room?.lastMoveAt]);

  // Room Listener
  useEffect(() => {
    if (gameMode !== 'online' || !room?.id) return;

    const unsubscribe = onSnapshot(doc(db, 'rooms', room.id), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as RoomState;
        setRoom({ ...data, id: snapshot.id });
        
        // Host Logic: Calculate results if everyone has picked
        if (data.hostId === user?.uid && data.status === 'counting') {
          const players = Object.values(data.players) as PlayerState[];
          const allPicked = players.every(p => p.choice);
          
          if (allPicked) {
            calculateGroupResults(data);
          }
        }

        // Sync local scores for UI (Top 2 for ScoreBoard)
        const sortedPlayers = (Object.values(data.players) as PlayerState[]).sort((a, b) => b.score - a.score);
        setPlayer1Score(sortedPlayers[0]?.score || 0);
        setPlayer2Score(sortedPlayers[1]?.score || 0);

        // Check for match winner
        const winner = sortedPlayers.find(p => p.score >= settings.winLimit);
        if (winner && !matchWinner) {
          setMatchWinner(winner.name);
          if (winner.uid === user?.uid) {
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
            addCoins(100);
            
            // Update global wins
            updateDoc(doc(db, 'leaderboard', user.uid), {
              wins: (stats.wins || 0) + 1,
              lastUpdated: serverTimestamp()
            }).catch(console.error);
            
            setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
            playSound('match');
          }
        }
      } else {
        setGameMode(null);
        setRoom(null);
      }
    });

    return () => unsubscribe();
  }, [gameMode, room?.id, user?.uid, matchWinner, settings.winLimit]);

  const calculateGroupResults = async (roomData: RoomState) => {
    const players = Object.values(roomData.players) as PlayerState[];
    const choices = players.map(p => p.choice).filter(Boolean) as Choice[];
    const uniqueChoices = new Set(choices);
    
    let results: Record<string, 'win' | 'lose' | 'draw'> = {};
    
    if (uniqueChoices.size === 1 || uniqueChoices.size === 3) {
      // All same or all 3 types -> Draw
      players.forEach(p => results[p.uid] = 'draw');
    } else {
      // Exactly 2 types present
      const [c1, c2] = Array.from(uniqueChoices);
      const winner = getResult(c1, c2) === 'win' ? c1 : c2;
      players.forEach(p => {
        results[p.uid] = p.choice === winner ? 'win' : 'lose';
      });
    }

    const updates: any = {
      status: 'result',
      lastMoveAt: serverTimestamp(),
    };

    players.forEach(p => {
      updates[`players.${p.uid}.lastResult`] = results[p.uid];
      if (results[p.uid] === 'win') {
        updates[`players.${p.uid}.score`] = (roomData.players[p.uid].score || 0) + 1;
      }
    });

    await updateDoc(doc(db, 'rooms', roomData.id), updates);
  };

  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const createRoom = async () => {
    if (!user) return handleLogin();
    const roomId = Math.random().toString(36).substr(2, 6).toUpperCase();
    const newRoom: Partial<RoomState> = {
      hostId: user.uid,
      players: {
        [user.uid]: { uid: user.uid, name: user.displayName || 'Player 1', choice: null, score: 0, photoURL: user.photoURL || undefined }
      },
      status: 'lobby',
      round: 1,
      lastMoveAt: serverTimestamp(),
      winLimit: settings.winLimit
    };
    await setDoc(doc(db, 'rooms', roomId), newRoom);
    setRoom({ ...newRoom, id: roomId } as RoomState);
    setGameMode('online');
  };

  const joinRoom = async () => {
    if (!user) return handleLogin();
    if (!roomInput) return;
    setIsJoining(true);
    try {
      const roomRef = doc(db, 'rooms', roomInput.toUpperCase());
      const snapshot = await getDoc(roomRef);
      if (snapshot.exists()) {
        const data = snapshot.data() as RoomState;
        await updateDoc(roomRef, {
          [`players.${user.uid}`]: { uid: user.uid, name: user.displayName || 'Player', choice: null, score: 0, photoURL: user.photoURL || undefined },
          lastMoveAt: serverTimestamp()
        });
        setRoom({ ...data, id: snapshot.id } as RoomState);
        setGameMode('online');
      } else {
        alert('Room not found!');
      }
    } catch (error) {
      console.error('Join error:', error);
    } finally {
      setIsJoining(false);
    }
  };

  const startRound = async () => {
    if (!room || room.hostId !== user?.uid) return;
    const updates: any = {
      status: 'counting',
      lastMoveAt: serverTimestamp(),
    };
    // Clear previous choices
    Object.keys(room.players).forEach(uid => {
      updates[`players.${uid}.choice`] = null;
      updates[`players.${uid}.lastResult`] = null;
    });
    await updateDoc(doc(db, 'rooms', room.id), updates);
  };

  const playSound = useCallback((type: 'click' | 'win' | 'lose' | 'draw' | 'match') => {
    if (!settings.soundEnabled) return;
    const sounds = {
      click: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3',
      win: 'https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3',
      lose: 'https://assets.mixkit.co/active_storage/sfx/251/251-preview.mp3',
      draw: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3',
      match: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
    };
    const audio = new Audio(sounds[type]);
    audio.volume = 0.5;
    audio.play().catch(() => {});
  }, [settings.soundEnabled]);

  const handleChoice = async (choice: Choice) => {
    if (isCountingDown || matchWinner) return;

    playSound('click');
    
    if (gameMode === 'single') {
      setIsCountingDown(true);
      for (let i = 3; i >= 0; i--) {
        setCountdown(i);
        await new Promise(r => setTimeout(r, 600));
      }
      setCountdown(null);
      setIsCountingDown(false);

      const opponentChoice = aiRef.current.predictNextMove(settings.difficulty);
      aiRef.current.recordMove(choice);
      const outcome = getResult(choice, opponentChoice);
      setRoundResult({ player1: choice, player2: opponentChoice, outcome });
      
      if (outcome === 'win') {
        const nextScore = player1Score + 1;
        setPlayer1Score(nextScore);
        addCoins(10);
        
        if (nextScore >= settings.winLimit) {
          setMatchWinner(user?.displayName || 'You');
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          addCoins(50);
          
          if (user) {
            updateDoc(doc(db, 'leaderboard', user.uid), {
              wins: (stats.wins || 0) + 1,
              lastUpdated: serverTimestamp()
            }).catch(console.error);
            setStats(prev => ({ ...prev, wins: prev.wins + 1 }));
          }
          playSound('match');
        }
      } else if (outcome === 'lose') {
        const nextScore = player2Score + 1;
        setPlayer2Score(nextScore);
        if (nextScore >= settings.winLimit) {
          setMatchWinner(`CPU (${settings.difficulty})`);
          playSound('lose');
        }
      }
      
      setHistory(prev => [{ id: Date.now().toString(), player1: choice, player2: opponentChoice, result: outcome, timestamp: Date.now() }, ...prev].slice(0, 10));
    } else if (gameMode === 'online' && room) {
      await updateDoc(doc(db, 'rooms', room.id), {
        [`players.${user?.uid}.choice`]: choice,
        lastMoveAt: serverTimestamp()
      });
    }
  };

  const resetGame = async () => {
    if (gameMode === 'online' && room && room.hostId === user?.uid) {
      await deleteDoc(doc(db, 'rooms', room.id));
    }
    setPlayer1Score(0);
    setPlayer2Score(0);
    setRoundResult(null);
    setMatchWinner(null);
    setHistory([]);
    setStats(DEFAULT_STATS);
    setRoom(null);
    setGameMode(null);
    aiRef.current = new SmartAI();
  };

  const continueGame = () => {
    setRoundResult(null);
    if (gameMode === 'online' && room && room.hostId === user?.uid) {
      updateDoc(doc(db, 'rooms', room.id), { status: 'lobby' });
    }
  };

  if (!gameMode) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white overflow-hidden relative">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/20 blur-[120px] rounded-full" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center z-10 w-full max-w-sm"
        >
          <div className="flex justify-center gap-4 mb-8">
            <span className="text-6xl animate-bounce">✊</span>
            <span className="text-6xl animate-bounce [animation-delay:0.2s]">✋</span>
            <span className="text-6xl animate-bounce [animation-delay:0.4s]">✌️</span>
          </div>
          
          <h1 className="text-6xl font-black mb-2 tracking-tighter uppercase italic">
            Rockstar <span className="text-indigo-500">RPS</span>
          </h1>
          <p className="text-white/40 mb-12 text-sm">
            The ultimate smart Rock Paper Scissors experience.
          </p>

          <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            {user ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <img src={user.photoURL || ''} alt="" className="w-8 h-8 rounded-full border border-white/20" />
                  <div className="text-left">
                    <p className="text-[10px] text-white/40 uppercase font-bold">Logged in as</p>
                    <p className="text-sm font-bold truncate max-w-[120px]">{user.displayName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                    <Coins size={14} className="text-amber-500" />
                    <span className="text-sm font-black text-amber-500">{stats.coins || 0}</span>
                  </div>
                  <button onClick={handleLogout} className="p-2 text-white/40 hover:text-rose-400 transition-colors">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button 
                onClick={handleLogin}
                className="w-full py-3 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <LogIn size={18} /> Sign in to Play Online
              </button>
            )}
          </div>

          <div className="space-y-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setGameMode('single')}
              className="w-full py-4 bg-white text-slate-950 font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl"
            >
              <User size={20} /> Single Player (AI)
            </motion.button>
            
            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] text-white/20 uppercase tracking-widest mb-4 font-bold">Group Battle Royale</p>
              <div className="flex flex-col gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={createRoom}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-lg"
                >
                  <Globe size={20} /> Create Battle Room
                </motion.button>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={roomInput}
                    onChange={(e) => setRoomInput(e.target.value.toUpperCase())}
                    placeholder="ROOM ID"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-center text-white font-bold placeholder:text-white/10 focus:outline-none focus:border-indigo-500"
                  />
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={joinRoom}
                    disabled={isJoining}
                    className="px-6 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl border border-white/10 disabled:opacity-50"
                  >
                    {isJoining ? '...' : 'Join'}
                  </motion.button>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsLeaderboardOpen(true)}
            className="mt-8 flex items-center gap-2 text-white/40 hover:text-white transition-colors mx-auto text-xs font-bold uppercase tracking-widest"
          >
            <Award size={16} /> View Global Leaderboard
          </button>
        </motion.div>

        <Leaderboard isOpen={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      </div>
    );
  }

  const myPlayer = room?.players[user?.uid || ''];
  const playersList = room ? Object.values(room.players) as PlayerState[] : [];

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center p-6 transition-colors duration-500 overflow-x-hidden",
      settings.theme === 'dark' ? "bg-slate-950 text-white" : "bg-slate-50 text-slate-900"
    )}>
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-rose-600/10 blur-[120px] rounded-full pointer-events-none" />

      <Settings settings={settings} onUpdate={(s) => setSettings(prev => ({ ...prev, ...s }))} />

      <div className="w-full max-w-md flex justify-between items-center mb-8 z-10">
        <button 
          onClick={() => setGameMode(null)}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <Home className="text-white/40" size={20} />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
            <Coins size={14} className="text-amber-500" />
            <span className="text-xs font-black text-amber-500">{stats.coins || 0}</span>
          </div>
          {gameMode === 'online' && room && (
            <div className="flex items-center gap-1 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
              <Hash size={12} className="text-indigo-400" />
              <span className="text-[10px] font-black text-indigo-400">{room.id}</span>
            </div>
          )}
          <Trophy className="text-amber-500" size={16} />
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">
            First to {settings.winLimit}
          </span>
        </div>
        <button 
          onClick={resetGame}
          className="p-2 hover:bg-white/5 rounded-full transition-colors"
        >
          <RotateCcw className="text-white/40" size={20} />
        </button>
      </div>

      <ScoreBoard 
        player1Name={gameMode === 'online' ? (playersList[0]?.name || 'P1') : user?.displayName || "You"}
        player2Name={gameMode === 'online' ? (playersList[1]?.name || 'Waiting...') : `CPU (${settings.difficulty})`}
        player1Score={player1Score}
        player2Score={player2Score}
        winLimit={settings.winLimit}
        stats={stats}
      />

      <div className="flex-1 flex flex-col items-center justify-center w-full z-10 py-12">
        {gameMode === 'online' && room?.status === 'lobby' ? (
          <div className="text-center w-full max-w-sm">
            <h3 className="text-2xl font-black mb-6 uppercase tracking-tighter">Battle Lobby</h3>
            <div className="space-y-2 mb-8 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
              {playersList.map(p => (
                <div key={p.uid} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                  <div className="flex items-center gap-3">
                    <img src={p.photoURL || ''} className="w-6 h-6 rounded-full" alt="" />
                    <span className="text-sm font-bold">{p.name} {p.uid === user?.uid && '(You)'}</span>
                  </div>
                  {p.uid === room.hostId && <span className="text-[8px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full font-black uppercase">Host</span>}
                </div>
              ))}
            </div>
            {room.hostId === user?.uid ? (
              <button 
                onClick={startRound}
                disabled={playersList.length < 2}
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play size={20} /> Start Battle
              </button>
            ) : (
              <p className="text-white/40 text-xs animate-pulse">Waiting for host to start...</p>
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {isCountingDown || (room?.status === 'counting' && !myPlayer?.choice) ? (
              <motion.div
                key="choices"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-4"
              >
                <ChoiceButton choice="rock" onClick={handleChoice} />
                <ChoiceButton choice="paper" onClick={handleChoice} />
                <ChoiceButton choice="scissors" onClick={handleChoice} />
              </motion.div>
            ) : room?.status === 'counting' && myPlayer?.choice ? (
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                <p className="text-emerald-400 font-bold mb-2">Move Locked In!</p>
                <p className="text-white/40 text-xs">Waiting for others...</p>
              </div>
            ) : room?.status === 'result' ? (
              <div className="text-center w-full max-w-sm">
                <h3 className={`text-4xl font-black mb-8 uppercase tracking-tighter ${
                  myPlayer?.lastResult === 'win' ? 'text-emerald-400' :
                  myPlayer?.lastResult === 'lose' ? 'text-rose-400' : 'text-white/60'
                }`}>
                  {myPlayer?.lastResult === 'win' ? 'You Won!' :
                   myPlayer?.lastResult === 'lose' ? 'You Lost' : 'Draw'}
                </h3>
                {myPlayer?.lastResult === 'win' && (
                  <div className="flex items-center justify-center gap-2 mb-6 text-amber-500 font-black animate-bounce">
                    <Coins size={16} />
                    <span>+20 Coins</span>
                  </div>
                )}
                <div className="space-y-2 mb-8">
                  {playersList.map(p => (
                    <div key={p.uid} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/10">
                      <span className="text-sm font-bold">{p.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{CHOICES.includes(p.choice as any) ? (p.choice === 'rock' ? '✊' : p.choice === 'paper' ? '✋' : '✌️') : '?'}</span>
                        <span className={`text-[10px] font-black uppercase ${
                          p.lastResult === 'win' ? 'text-emerald-400' :
                          p.lastResult === 'lose' ? 'text-rose-400' : 'text-white/20'
                        }`}>{p.lastResult}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {room.hostId === user?.uid && (
                  <button 
                    onClick={continueGame}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl transition-all"
                  >
                    Next Round
                  </button>
                )}
              </div>
            ) : (
              <motion.div
                key="choices-single"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-3 gap-4"
              >
                <ChoiceButton choice="rock" onClick={handleChoice} />
                <ChoiceButton choice="paper" onClick={handleChoice} />
                <ChoiceButton choice="scissors" onClick={handleChoice} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>

      <History history={history} />

      <Countdown count={countdown} onComplete={() => {}} />
      
      <ResultModal 
        roundResult={roundResult}
        matchWinner={matchWinner}
        onReset={resetGame}
        onContinue={continueGame}
      />

      <div className="mt-8 flex items-center gap-2 text-white/20">
        <BarChart3 size={12} />
        <span className="text-[8px] uppercase font-bold tracking-widest">
          {gameMode === 'online' ? `Group Battle: ${playersList.length} Players` : 'Local AI Engine Active'}
        </span>
      </div>
    </div>
  );
}
