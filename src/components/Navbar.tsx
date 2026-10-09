import React, { useState, useEffect } from 'react';
import {
  User,
  AppSettings
} from '../types';
import {
  Trophy,
  Shield,
  User as UserIcon,
  LogOut,
  LogIn,
  Vote,
  Sparkles,
  Radio,
  Layers,
  Clock
} from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  settings: AppSettings;
  currentView: 'LANDING' | 'ADMIN' | 'JURY' | 'VOTER';
  onNavigate: (view: 'LANDING' | 'ADMIN' | 'JURY' | 'VOTER') => void;
  onOpenLogin: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  settings,
  currentView,
  onNavigate,
  onOpenLogin,
  onLogout
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Jakarta'
        }) + ' WIB'
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-amber-500/30 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div
          onClick={() => onNavigate('LANDING')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 p-0.5 shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform overflow-hidden">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center overflow-hidden">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.competitionTitle || 'Logo Aplikasi'}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Trophy className="w-6 h-6 text-amber-400" />
              )}
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-lg sm:text-xl tracking-tight text-white font-serif">
                S-IMPEL
              </span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500 text-slate-950 font-black tracking-widest uppercase">
                DIGITAL
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-amber-300/80 font-medium hidden sm:block">
              Sistem Penilaian Digital & Voting Berbayar
            </p>
          </div>
        </div>

        {/* Center Live Clock */}
        <div className="hidden lg:flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 px-3.5 py-1.5 rounded-full text-xs">
          <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '6s' }} />
          <span className="font-mono text-slate-200 font-bold">{currentTime}</span>
        </div>

        {/* Right Navigation & User Actions */}
        <div className="flex items-center gap-2.5">
          {/* Quick Tab to Public Landing Page */}
          {currentView !== 'LANDING' && (
            <button
              type="button"
              onClick={() => onNavigate('LANDING')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer transition-colors hidden sm:inline-flex items-center gap-1.5"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-400" />
              Beranda Publik
            </button>
          )}

          {/* User Logged In State */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Back to their role dashboard button if currently viewing landing */}
              {currentView === 'LANDING' && (
                <button
                  type="button"
                  onClick={() => {
                    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'SHADOW_ADMIN') {
                      onNavigate('ADMIN');
                    } else if (currentUser.role === 'JURY') {
                      onNavigate('JURY');
                    } else if (currentUser.role === 'VOTER') {
                      onNavigate('VOTER');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md shadow-amber-500/20 cursor-pointer transition-colors"
                >
                  Dashboard Saya
                </button>
              )}

              {/* User badge */}
              <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700 px-3 py-1.5 rounded-2xl">
                <div className="w-7 h-7 rounded-xl bg-slate-700 flex items-center justify-center text-amber-400 font-bold text-xs">
                  {currentUser.name.charAt(0)}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-bold text-white leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </div>
                  <span className="text-[10px] text-amber-400 font-semibold block uppercase">
                    {currentUser.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : currentUser.role === 'SHADOW_ADMIN'
                      ? 'Admin Bayangan'
                      : currentUser.role === 'JURY'
                      ? 'Dewan Juri'
                      : 'Akun Voter'}
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
                title="Keluar (Logout)"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Not logged in: Login Button */
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Portal</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
