import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Check } from 'lucide-react';

interface StopwatchProps {
  initialSeconds?: number;
  maxMinutes?: number;
  onTimeChange: (seconds: number) => void;
  disabled?: boolean;
}

export const Stopwatch: React.FC<StopwatchProps> = ({
  initialSeconds = 0,
  maxMinutes,
  onTimeChange,
  disabled = false
}) => {
  const [seconds, setSeconds] = useState<number>(initialSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editMinutes, setEditMinutes] = useState<string>('');
  const [editSecs, setEditSecs] = useState<string>('');

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    let interval: any = null;
    if (isRunning && !disabled) {
      interval = setInterval(() => {
        setSeconds(prev => {
          const next = prev + 1;
          onTimeChange(next);
          return next;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning, disabled, onTimeChange]);

  const toggleRun = () => {
    if (disabled) return;
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    if (disabled) return;
    setIsRunning(false);
    setSeconds(0);
    onTimeChange(0);
  };

  const formatDisplay = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => String(n).padStart(2, '0');
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const handleStartManualEdit = () => {
    if (disabled) return;
    setIsRunning(false);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    setEditMinutes(String(mins));
    setEditSecs(String(secs));
    setIsEditing(true);
  };

  const handleSaveManualEdit = () => {
    const mins = parseInt(editMinutes, 10) || 0;
    const secs = parseInt(editSecs, 10) || 0;
    const total = Math.max(0, mins * 60 + secs);
    setSeconds(total);
    onTimeChange(total);
    setIsEditing(false);
  };

  return (
    <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 sm:p-4 shadow">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-300">
          <Clock className="w-4 h-4 text-emerald-400" />
          <span>Pencatat Waktu Penyelesaian Lomba</span>
        </div>
        {maxMinutes && (
          <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-mono">
            Batas Maks: {maxMinutes} Menit
          </span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/90 rounded-lg p-3 border border-slate-700/60">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={editMinutes}
                onChange={e => setEditMinutes(e.target.value)}
                placeholder="Menit"
                className="w-16 px-2 py-1 bg-slate-800 text-center font-mono font-bold text-amber-400 border border-amber-500/50 rounded focus:outline-none"
              />
              <span className="text-slate-400 text-xs">m</span>
            </div>
            <span className="text-slate-400">:</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="59"
                value={editSecs}
                onChange={e => setEditSecs(e.target.value)}
                placeholder="Detik"
                className="w-16 px-2 py-1 bg-slate-800 text-center font-mono font-bold text-amber-400 border border-amber-500/50 rounded focus:outline-none"
              />
              <span className="text-slate-400 text-xs">s</span>
            </div>
            <button
              type="button"
              onClick={handleSaveManualEdit}
              className="p-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer"
              title="Simpan"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span
              onClick={handleStartManualEdit}
              className={`font-mono text-2xl sm:text-3xl font-extrabold tracking-wider ${
                isRunning ? 'text-emerald-400 animate-pulse' : 'text-amber-400'
              } cursor-pointer hover:underline`}
              title="Klik untuk ubah manual waktu"
            >
              {formatDisplay(seconds)}
            </span>
            <button
              type="button"
              onClick={handleStartManualEdit}
              disabled={disabled}
              className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer ml-1"
            >
              Ubah Manual
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleRun}
            disabled={disabled}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
              isRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Jeda (Pause)' : 'Mulai (Start)'}
          </button>
          <button
            type="button"
            onClick={resetTimer}
            disabled={disabled}
            className="p-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 cursor-pointer"
            title="Reset ke 00:00"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mt-1.5 italic">
        *Waktu pengerjaan digunakan sebagai Tie-Breaker resmi jika perolehan nilai antar peserta sama (tercepat unggul).
      </p>
    </div>
  );
};
