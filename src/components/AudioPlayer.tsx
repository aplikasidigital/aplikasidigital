import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Music, Play, Pause } from 'lucide-react';
import { bgmManager } from '../utils/audio';

interface AudioPlayerProps {
  customAudioUrl?: string;
  defaultMuted?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  customAudioUrl,
  defaultMuted = false
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(defaultMuted);
  const [volume, setVolume] = useState<number>(0.35);
  const [isOpenVolume, setIsOpenVolume] = useState<boolean>(false);

  useEffect(() => {
    bgmManager.init(customAudioUrl, volume);
    // User interaction required by modern browsers to play audio
    const handleFirstGesture = () => {
      bgmManager.start();
      setIsPlaying(true);
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };

    window.addEventListener('click', handleFirstGesture, { once: true });
    window.addEventListener('keydown', handleFirstGesture, { once: true });

    return () => {
      window.removeEventListener('click', handleFirstGesture);
      window.removeEventListener('keydown', handleFirstGesture);
    };
  }, [customAudioUrl]);

  const togglePlay = () => {
    if (isPlaying) {
      bgmManager.pause();
      setIsPlaying(false);
    } else {
      bgmManager.start();
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    bgmManager.setMute(next);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    bgmManager.setVolume(val);
    if (val === 0) {
      setIsMuted(true);
      bgmManager.setMute(true);
    } else if (isMuted) {
      setIsMuted(false);
      bgmManager.setMute(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2 bg-slate-900/90 hover:bg-slate-900 backdrop-blur-md border border-amber-500/40 shadow-2xl rounded-full px-3 py-2 text-xs transition-all">
      <div className="flex items-center gap-1.5 pr-1 border-r border-slate-700">
        <div className={`w-2 h-2 rounded-full ${isPlaying && !isMuted ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
        <Music className="w-3.5 h-3.5 text-amber-400" />
        <span className="text-slate-300 font-medium hidden sm:inline">BGM Live</span>
      </div>

      <button
        type="button"
        onClick={togglePlay}
        className="p-1.5 rounded-full hover:bg-slate-800 text-amber-300 transition-colors cursor-pointer"
        title={isPlaying ? 'Jeda Musik' : 'Putar Musik'}
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
      </button>

      <button
        type="button"
        onClick={toggleMute}
        className="p-1.5 rounded-full hover:bg-slate-800 text-slate-200 transition-colors cursor-pointer"
        title={isMuted ? 'Nyalakan Suara (Unmute)' : 'Matikan Suara (Mute)'}
      >
        {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
      </button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpenVolume(!isOpenVolume)}
          className="text-[11px] text-slate-400 hover:text-slate-200 px-1 py-0.5 rounded cursor-pointer"
        >
          {Math.round(volume * 100)}%
        </button>

        {isOpenVolume && (
          <div className="absolute bottom-9 right-0 bg-slate-850 p-2 rounded-lg border border-slate-700 shadow-xl bg-slate-900 flex flex-col items-center w-28">
            <span className="text-[10px] text-slate-400 mb-1">Volume BGM</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>
        )}
      </div>
    </div>
  );
};
