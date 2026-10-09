import React, { useState, useEffect } from 'react';
import {
  AppSettings,
  CompetitionCategory,
  Participant,
  PublicEventInfo,
  User,
  VotingCategory
} from './types';
import { StorageService } from './utils/storage';
import { Navbar } from './components/Navbar';
import { AudioPlayer } from './components/AudioPlayer';
import { LandingPage } from './views/LandingPage';
import { AdminDashboard } from './views/AdminDashboard';
import { JuryDashboard } from './views/JuryDashboard';
import { VoterDashboard } from './views/VoterDashboard';
import { LoginModal } from './views/LoginModal';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState<'LANDING' | 'ADMIN' | 'JURY' | 'VOTER'>('LANDING');
  const [isLoginOpen, setIsLoginOpen] = useState<boolean>(false);

  const [settings, setSettings] = useState<AppSettings>(StorageService.getSettings());
  const [publicInfo, setPublicInfo] = useState<PublicEventInfo>(StorageService.getPublicInfo());
  const [categories, setCategories] = useState<CompetitionCategory[]>(StorageService.getCategories());
  const [participants, setParticipants] = useState<Participant[]>(StorageService.getParticipants());
  const [votingCategories, setVotingCategories] = useState<VotingCategory[]>(
    StorageService.getVotingCategories()
  );

  useEffect(() => {
    // Hydrate persistent settings from IndexedDB if available (large media/audio)
    StorageService.initSettings((loaded) => {
      setSettings(loaded);
    });

    // Check if user session was stored
    const savedUser = StorageService.getCurrentUser();
    if (savedUser) {
      setCurrentUser(savedUser);
      // Route user to appropriate panel
      if (savedUser.role === 'SUPER_ADMIN' || savedUser.role === 'SHADOW_ADMIN') {
        setCurrentView('ADMIN');
      } else if (savedUser.role === 'JURY') {
        setCurrentView('JURY');
      } else if (savedUser.role === 'VOTER') {
        setCurrentView('VOTER');
      }
    }

    // Real-time synchronization listener: sync all views automatically
    const unsubscribe = StorageService.subscribe((key) => {
      setSettings(StorageService.getSettings());
      setPublicInfo(StorageService.getPublicInfo());
      setCategories(StorageService.getCategories());
      setParticipants(StorageService.getParticipants());
      setVotingCategories(StorageService.getVotingCategories());

      // If user session is active, refresh user data (e.g. updated voteBalance)
      const current = StorageService.getCurrentUser();
      if (current) {
        const latestInDb = StorageService.getUsers().find(u => u.id === current.id);
        if (latestInDb) {
          setCurrentUser(latestInDb);
        }
      }
    });

    // Periodic lightweight sync heartbeat (2.5 seconds) to ensure 100% sync reliability
    const intervalId = window.setInterval(() => {
      setCategories(StorageService.getCategories());
      setVotingCategories(StorageService.getVotingCategories());
      setParticipants(StorageService.getParticipants());
    }, 2500);

    return () => {
      unsubscribe();
      window.clearInterval(intervalId);
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'SUPER_ADMIN' || user.role === 'SHADOW_ADMIN') {
      setCurrentView('ADMIN');
    } else if (user.role === 'JURY') {
      setCurrentView('JURY');
    } else if (user.role === 'VOTER') {
      setCurrentView('VOTER');
    }
  };

  const handleLogout = () => {
    StorageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView('LANDING');
  };

  const handleSettingsUpdate = (newSettings: AppSettings) => {
    setSettings(newSettings);
    // Reload categories & voting categories in case they were updated
    setCategories(StorageService.getCategories());
    setVotingCategories(StorageService.getVotingCategories());
  };

  const handlePublicInfoUpdate = (newInfo: PublicEventInfo) => {
    setPublicInfo(newInfo);
  };

  const handleUserUpdate = (updated: User) => {
    setCurrentUser(updated);
  };

  // Background styling: custom image or rich gradient
  const backgroundStyle = settings.backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.92), rgba(15, 23, 42, 0.96)), url(${settings.backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }
    : {};

  return (
    <div
      style={backgroundStyle}
      className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500 selection:text-slate-950"
    >
      {/* Top Navbar */}
      <Navbar
        currentUser={currentUser}
        settings={settings}
        currentView={currentView}
        onNavigate={setCurrentView}
        onOpenLogin={() => setIsLoginOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {currentView === 'LANDING' && (
          <LandingPage
            settings={settings}
            publicInfo={publicInfo}
            categories={categories}
            participants={participants}
            votingCategories={votingCategories}
            onOpenLogin={() => setIsLoginOpen(true)}
          />
        )}

        {currentView === 'ADMIN' && currentUser && (
          <AdminDashboard
            currentUser={currentUser}
            settings={settings}
            onSettingsUpdate={handleSettingsUpdate}
            publicInfo={publicInfo}
            onPublicInfoUpdate={handlePublicInfoUpdate}
          />
        )}

        {currentView === 'JURY' && currentUser && (
          <JuryDashboard currentUser={currentUser} />
        )}

        {currentView === 'VOTER' && currentUser && (
          <VoterDashboard
            currentUser={currentUser}
            settings={settings}
            onUserUpdate={handleUserUpdate}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/90 py-6 text-center text-xs text-slate-400 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            © 2026 <strong className="text-amber-400">S-IMPEL DIGITAL</strong>. Hak Cipta Dilindungi Undang-Undang.
          </p>
          <p className="text-[11px] text-slate-400">
            Sistem Penilaian Digital &amp; Voting Berbayar Terpadu (DANA 081314420312)
          </p>
        </div>
      </footer>

      {/* Background Music Global Controller */}
      <AudioPlayer customAudioUrl={settings.bgmAudioUrl} />

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
