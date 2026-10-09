import React, { useState, useEffect } from 'react';
import { Clock, TimerReset } from 'lucide-react';

interface ManualTimeInputProps {
  initialSeconds?: number;
  maxMinutes?: number;
  onTimeChange: (seconds: number) => void;
  disabled?: boolean;
}

export const ManualTimeInput: React.FC<ManualTimeInputProps> = ({
  initialSeconds = 0,
  maxMinutes,
  onTimeChange,
  disabled = false
}) => {
  const [minutes, setMinutes] = useState<string>(String(Math.floor(initialSeconds / 60)));
  const [seconds, setSeconds] = useState<string>(String(initialSeconds % 60));

  useEffect(() => {
    setMinutes(String(Math.floor(initialSeconds / 60)));
    setSeconds(String(initialSeconds % 60));
  }, [initialSeconds]);

  const updateParent = (mStr: string, sStr: string) => {
    const m = Math.max(0, parseInt(mStr, 10) || 0);
    const s = Math.max(0, Math.min(59, parseInt(sStr, 10) || 0));
    const total = m * 60 + s;
    onTimeChange(total);
  };

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMinutes(val);
    updateParent(val, seconds);
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSeconds(val);
    updateParent(minutes, val);
  };

  const handleReset = () => {
    setMinutes('0');
    setSeconds('0');
    onTimeChange(0);
  };

  const currentTotalSeconds = (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);

  return (
    <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-white">Pencatatan Waktu Manual Peserta</h4>
            <span className="text-[11px] text-slate-400">Input durasi pengerjaan / penyelesaian lomba</span>
          </div>
        </div>

        {maxMinutes && (
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-amber-300 font-mono">
            Batas Maks: {maxMinutes}m
          </span>
        )}
      </div>

      <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-center">
          <div className="flex flex-col items-center">
            <label className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">Menit</label>
            <input
              type="number"
              min="0"
              max="999"
              disabled={disabled}
              value={minutes}
              onChange={handleMinutesChange}
              placeholder="0"
              className="w-20 sm:w-24 px-3 py-2 bg-slate-800 text-center font-mono font-bold text-lg sm:text-xl text-amber-400 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>

          <span className="font-mono text-2xl font-black text-slate-500 mt-4">:</span>

          <div className="flex flex-col items-center">
            <label className="text-[10px] text-slate-400 mb-1 font-semibold uppercase">Detik (0-59)</label>
            <input
              type="number"
              min="0"
              max="59"
              disabled={disabled}
              value={seconds}
              onChange={handleSecondsChange}
              placeholder="00"
              className="w-20 sm:w-24 px-3 py-2 bg-slate-800 text-center font-mono font-bold text-lg sm:text-xl text-amber-400 border border-slate-700 rounded-xl focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset Waktu ke 0"
          >
            <TimerReset className="w-3.5 h-3.5" />
            Reset
          </button>

          <div className="bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-right">
            <span className="text-[10px] text-slate-400 block">Total Detik</span>
            <span className="font-mono font-bold text-xs text-emerald-400">
              {currentTotalSeconds} dtk
            </span>
          </div>
        </div>
      </div>

      <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2.5 text-[11px] text-emerald-200/90 leading-relaxed">
        <strong className="text-emerald-300">PENENTU KEJUARAAN OTOMATIS (TIE-BREAKER):</strong> Apabila perolehan nilai akhir peserta seri (sama persis), peserta dengan catatan waktu penyelesaian paling cepat (durasi terpendek) otomatis berhak atas peringkat lebih tinggi.
      </div>
    </div>
  );
};
