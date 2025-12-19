
import React, { useState, useEffect, useCallback, useRef } from 'react';

type TimerMode = 'work' | 'shortBreak' | 'longBreak';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
}

const MODES: Record<TimerMode, { label: string; minutes: number; color: string }> = {
  work: { label: 'Foco Total', minutes: 25, color: 'rgb(79, 70, 229)' }, // Brand 500
  shortBreak: { label: 'Pausa Curta', minutes: 5, color: 'rgb(16, 185, 129)' }, // Emerald 500
  longBreak: { label: 'Pausa Longa', minutes: 15, color: 'rgb(245, 158, 11)' }, // Amber 500
};

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<TimerMode>('work');
  const [timeLeft, setTimeLeft] = useState(MODES.work.minutes * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 0.1);
      gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.5);
    } catch (e) {
      console.log('Audio notification failed', e);
    }
  }, []);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      playNotificationSound();
      
      if (mode === 'work') {
        const nextSessions = sessionsCompleted + 1;
        setSessionsCompleted(nextSessions);
        setMode(nextSessions % 4 === 0 ? 'longBreak' : 'shortBreak');
      } else {
        setMode('work');
      }
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, mode, sessionsCompleted, playNotificationSound]);

  useEffect(() => {
    setTimeLeft(MODES[mode].minutes * 60);
    setIsActive(false);
  }, [mode]);

  const toggleTimer = () => setIsActive(!isActive);
  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(MODES[mode].minutes * 60);
  };
  const skipMode = () => {
    if (mode === 'work') setMode('shortBreak');
    else if (mode === 'shortBreak') setMode('longBreak');
    else setMode('work');
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - timeLeft / (MODES[mode].minutes * 60);

  if (!isOpen) return null;

  return (
    <div className="absolute bottom-16 right-0 mb-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl p-6 w-72 animate-in fade-in slide-in-from-bottom-4 duration-300 origin-bottom-right z-50">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-slate-400">Flow de Produção</span>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative flex items-center justify-center mb-6">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke={MODES[mode].color}
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={440}
                strokeDashoffset={440 * (1 - progress)}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1">{MODES[mode].label}</span>
            </div>
          </div>

          <div className="flex justify-center space-x-4 mb-6">
            <button 
              onClick={resetTimer}
              className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all"
              title="Resetar"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button 
              onClick={toggleTimer}
              className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transform active:scale-95 transition-all"
              style={{ backgroundColor: MODES[mode].color, color: 'white' }}
            >
              {isActive ? (
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
            <button 
              onClick={skipMode}
              className="p-3 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 transition-all"
              title="Pular"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex justify-center space-x-1">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className={`h-1.5 w-6 rounded-full transition-all ${i <= sessionsCompleted % 4 || (i === 4 && sessionsCompleted > 0 && sessionsCompleted % 4 === 0) ? 'bg-brand-500' : 'bg-slate-200 dark:bg-slate-800'}`} 
              />
            ))}
          </div>
          <p className="text-[10px] text-center text-slate-400 mt-2 font-bold uppercase tracking-tighter">Sessões: {sessionsCompleted}</p>
    </div>
  );
};

export default PomodoroTimer;
