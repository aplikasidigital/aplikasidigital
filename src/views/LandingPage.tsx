import React, { useState, useEffect } from 'react';
import {
  AppSettings,
  CompetitionCategory,
  Participant,
  PublicEventInfo,
  RankingResult,
  VotingCategory
} from '../types';
import { calculateRankings, StorageService } from '../utils/storage';
import {
  Trophy,
  Calendar,
  MapPin,
  Clock,
  Vote,
  Award,
  Sparkles,
  Search,
  BookOpen,
  ChevronRight,
  Medal,
  Users,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Flame,
  Radio
} from 'lucide-react';

interface LandingPageProps {
  settings: AppSettings;
  publicInfo: PublicEventInfo;
  categories: CompetitionCategory[];
  participants: Participant[];
  votingCategories: VotingCategory[];
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  settings,
  publicInfo,
  categories,
  participants,
  votingCategories,
  onOpenLogin
}) => {
  const [activeTab, setActiveTab] = useState<'SCORE' | 'VOTING' | 'INFO' | 'RULES' | 'SCHEDULE'>('SCORE');
  const [selectedScoreCatId, setSelectedScoreCatId] = useState<string>(categories[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedVoteCatId, setSelectedVoteCatId] = useState<string>(votingCategories[0]?.id || '');
  const [syncTick, setSyncTick] = useState<number>(Date.now());

  useEffect(() => {
    const unsub = StorageService.subscribe(() => {
      setSyncTick(Date.now());
    });
    return unsub;
  }, []);

  const activeScoreCategory = categories.find(c => c.id === selectedScoreCatId) || categories[0];
  // Calculate rankings live, re-evaluating on syncTick
  const rankings: RankingResult[] = activeScoreCategory
    ? calculateRankings(activeScoreCategory.id, true)
    : [];

  const filteredRankings = rankings.filter(
    r =>
      r.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeVotingCategory =
    votingCategories.find(v => v.id === selectedVoteCatId) || votingCategories[0];

  const sortedCandidates = activeVotingCategory
    ? [...activeVotingCategory.candidates].sort((a, b) => b.votesCount - a.votesCount)
    : [];

  return (
    <div className="space-y-10">
      {/* ============================================================== */}
      {/* HERO SECTION WITH COLORFUL ACCENTS & PROFESSIONAL BADGES */}
      {/* ============================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-850 to-slate-950 border border-amber-500/30 p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Glow decor circles */}
        <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-5">
          {settings.logoUrl && (
            <div className="flex justify-center mb-2">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-slate-800/80 p-1 border-2 border-amber-500/50 shadow-2xl overflow-hidden">
                <img
                  src={settings.logoUrl}
                  alt={settings.competitionTitle}
                  className="w-full h-full object-cover rounded-2xl"
                />
              </div>
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-300 text-xs sm:text-sm font-bold tracking-wide">
            <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
            <span>PORTAL RESMI S-IMPEL DIGITAL 2026</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-[11px] text-emerald-400 font-mono font-medium">REAL-TIME SYNC</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight uppercase font-serif drop-shadow-sm">
            {settings.competitionTitle}
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-amber-200/90 font-medium max-w-2xl mx-auto">
            {settings.competitionSubtitle}
          </p>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl mx-auto leading-relaxed">
            {publicInfo.eventDescription || settings.competitionDescription}
          </p>

          {/* Key Event Badges: Location & Time */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 text-xs sm:text-sm">
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-xl text-slate-200">
              <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{settings.eventDateTime}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-xl text-slate-200">
              <MapPin className="w-4 h-4 text-red-400 shrink-0" />
              <span>{settings.location}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/80 px-4 py-2 rounded-xl text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Sistem Penjurian & Pakta Integritas</span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setActiveTab('SCORE')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <Trophy className="w-4 h-4" />
              Pantau Live Score Penilaian
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('VOTING')}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-extrabold text-sm shadow-xl shadow-blue-600/20 cursor-pointer transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <Vote className="w-4 h-4" />
              Papan Skor Voting Publik
            </button>
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-5 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-sm cursor-pointer transition-colors"
            >
              Portal Masuk Juri & Admin
            </button>
          </div>
        </div>
      </section>

      {/* ============================================================== */}
      {/* NAVIGATION TABS */}
      {/* ============================================================== */}
      <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-xl max-w-3xl mx-auto">
        {[
          { id: 'SCORE' as const, label: 'Live Score Penilaian', icon: Trophy, color: 'text-amber-400' },
          { id: 'VOTING' as const, label: 'Papan Skor Voting', icon: Flame, color: 'text-red-400' },
          { id: 'SCHEDULE' as const, label: 'Jadwal & Agenda', icon: Calendar, color: 'text-blue-400' },
          { id: 'RULES' as const, label: 'Peraturan Lomba', icon: BookOpen, color: 'text-emerald-400' },
          { id: 'INFO' as const, label: 'Informasi Kegiatan', icon: Sparkles, color: 'text-purple-400' }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-105'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : tab.color}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: LIVE SCORE PENILAIAN JURI */}
      {/* ============================================================== */}
      {activeTab === 'SCORE' && (
        <div className="space-y-6">
          {/* Category Picker & Search Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-850 p-4 rounded-2xl border border-slate-800 bg-slate-900">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <span className="text-xs font-semibold text-slate-400 mr-1">Cabang Lomba:</span>
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedScoreCatId(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    c.id === activeScoreCategory?.id
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Cari peserta / instansi..."
                className="w-full pl-9 pr-3 py-2 bg-slate-800 text-white rounded-xl text-xs border border-slate-700 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* Podiums / Top 3 Highlight Cards */}
          {rankings.length >= 3 && !searchQuery && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* JUARA 2 */}
              <div className="bg-slate-900/90 border border-slate-700 rounded-2xl p-5 shadow-xl relative flex flex-col justify-between order-2 md:order-1">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-slate-300/20 text-slate-200 border border-slate-300/40 text-xs font-extrabold uppercase">
                    JUARA 2 (PERAK)
                  </span>
                  <Medal className="w-7 h-7 text-slate-300" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {rankings[1]?.registrationNumber}
                  </span>
                  <h3 className="text-lg font-black text-white">{rankings[1]?.participantName}</h3>
                  <p className="text-xs text-slate-400">{rankings[1]?.institution}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Nilai Rata-rata:</span>
                  <span className="text-2xl font-black font-mono text-slate-200">
                    {rankings[1]?.averageScore.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* JUARA 1 (EMAS) */}
              <div className="bg-gradient-to-b from-amber-950/60 via-slate-900 to-slate-900 border-2 border-amber-500 rounded-3xl p-6 shadow-2xl relative flex flex-col justify-between order-1 md:order-2 md:-translate-y-3">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 font-black text-xs px-4 py-1 rounded-full shadow-lg">
                  PERINGKAT TERTINGGI
                </div>
                <div className="flex items-center justify-between mb-3 mt-1">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs font-extrabold uppercase">
                    JUARA 1 (EMAS)
                  </span>
                  <Trophy className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-amber-400">
                    {rankings[0]?.registrationNumber}
                  </span>
                  <h3 className="text-xl font-black text-white">{rankings[0]?.participantName}</h3>
                  <p className="text-xs text-amber-200/80">{rankings[0]?.institution}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-500/30 flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Nilai Rata-rata:</span>
                  <span className="text-3xl font-black font-mono text-amber-400">
                    {rankings[0]?.averageScore.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* JUARA 3 */}
              <div className="bg-slate-900/90 border border-amber-700/50 rounded-2xl p-5 shadow-xl relative flex flex-col justify-between order-3">
                <div className="flex items-center justify-between mb-3">
                  <span className="px-3 py-1 rounded-full bg-amber-800/20 text-amber-500 border border-amber-700/40 text-xs font-extrabold uppercase">
                    JUARA 3 (PERUNGGU)
                  </span>
                  <Medal className="w-7 h-7 text-amber-600" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold text-amber-600">
                    {rankings[2]?.registrationNumber}
                  </span>
                  <h3 className="text-lg font-black text-white">{rankings[2]?.participantName}</h3>
                  <p className="text-xs text-slate-400">{rankings[2]?.institution}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-baseline">
                  <span className="text-xs text-slate-400">Nilai Rata-rata:</span>
                  <span className="text-2xl font-black font-mono text-amber-500">
                    {rankings[2]?.averageScore.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-white">
                  Papan Peringkat Resmi: {activeScoreCategory?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Nilai terverifikasi dan disetujui resmi oleh Panitia Pelaksana.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Live Update</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-300 border-b border-slate-800 font-bold">
                    <th className="p-3 text-center w-14">Rank</th>
                    <th className="p-3 w-28">Gelar Juara</th>
                    <th className="p-3 w-28">No. Reg</th>
                    <th className="p-3">Nama Peserta / Tim</th>
                    <th className="p-3">Asal Sekolah / Kontingen</th>
                    <th className="p-3 text-center">Waktu Tugas (Tie-Breaker)</th>
                    <th className="p-3 text-center">Juri Menilai</th>
                    <th className="p-3 text-right">Rata-Rata Nilai</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredRankings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 italic">
                        Belum ada data nilai terpublikasi pada cabang lomba ini.
                      </td>
                    </tr>
                  ) : (
                    filteredRankings.map(r => (
                      <tr
                        key={r.participantId}
                        className={`hover:bg-slate-850 transition-colors ${
                          r.rank === 1
                            ? 'bg-amber-950/20 font-bold'
                            : r.rank <= 3
                            ? 'bg-slate-800/30 font-semibold'
                            : ''
                        }`}
                      >
                        <td className="p-3 text-center">
                          <span
                            className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-black font-mono text-xs ${
                              r.rank === 1
                                ? 'bg-amber-500 text-slate-950 shadow'
                                : r.rank === 2
                                ? 'bg-slate-300 text-slate-950'
                                : r.rank === 3
                                ? 'bg-amber-700 text-white'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {r.rank}
                          </span>
                        </td>
                        <td className="p-3 font-bold">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[11px] ${
                              r.rank <= 3
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : r.rank <= 6
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : 'text-slate-400'
                            }`}
                          >
                            {r.awardTitle || '-'}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-amber-400">{r.registrationNumber}</td>
                        <td className="p-3 text-white font-semibold">{r.participantName}</td>
                        <td className="p-3 text-slate-300">{r.institution}</td>
                        <td className="p-3 text-center font-mono text-emerald-400 text-xs">
                          {r.averageTimeSeconds > 0
                            ? `${Math.floor(r.averageTimeSeconds / 60)}m ${r.averageTimeSeconds % 60}s`
                            : '-'}
                        </td>
                        <td className="p-3 text-center text-xs text-slate-400">
                          {r.juriesCount} Juri
                        </td>
                        <td className="p-3 text-right font-black font-mono text-base text-amber-400">
                          {r.averageScore.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="text-[11px] text-slate-400 mt-4 italic">
              *Penentuan Peringkat: Berdasarkan Rata-Rata Nilai Tertinggi. Jika nilai sama, peserta dengan waktu penyelesaian tercepat otomatis berada di peringkat lebih atas.
            </p>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: PAPAN SKOR VOTING PUBLIK */}
      {/* ============================================================== */}
      {activeTab === 'VOTING' && (
        <div className="space-y-6">
          {/* Category Tabs for Voting */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <span className="text-xs font-semibold text-slate-400 mr-2">Kategori Voting:</span>
            {votingCategories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedVoteCatId(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  cat.id === activeVotingCategory?.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Voting Banner */}
          <div className="bg-gradient-to-r from-red-950/60 via-slate-900 to-amber-950/60 border border-red-500/30 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-400/30 text-xs font-bold uppercase">
                POLLING & VOTING BERBAYAR LIVE
              </span>
              <h3 className="text-xl font-black text-white mt-1">{activeVotingCategory?.name}</h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                {activeVotingCategory?.description}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenLogin}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98] shrink-0"
            >
              <Vote className="w-4 h-4" />
              Beri Vote (Login Voter)
            </button>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedCandidates.map((cand, idx) => {
              // Calculate percentage based on leader
              const leaderVotes = sortedCandidates[0]?.votesCount || 1;
              const percent = Math.round((cand.votesCount / (leaderVotes || 1)) * 100);

              return (
                <div
                  key={cand.id}
                  className={`bg-slate-900/90 rounded-3xl border overflow-hidden shadow-xl flex flex-col transition-all hover:scale-[1.01] ${
                    idx === 0
                      ? 'border-amber-500 shadow-amber-500/10'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="relative h-48 bg-slate-950 overflow-hidden">
                    <img
                      src={cand.photoUrl}
                      alt={cand.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-black text-white border border-slate-700">
                      Peringkat #{idx + 1}
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        Terdepan
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-extrabold text-base text-white">{cand.name}</h4>
                      <p className="text-xs text-amber-300 font-medium">{cand.subtitle}</p>
                      <p className="text-xs text-slate-400 mt-1">{cand.institution}</p>
                    </div>

                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <span className="text-xs text-slate-400">Perolehan Suara:</span>
                        <span className="text-xl font-black font-mono text-amber-400">
                          {cand.votesCount} <span className="text-xs text-slate-400 font-sans">Votes</span>
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-red-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={onOpenLogin}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <span>Dukung Kandidat Ini</span>
                      <ChevronRight className="w-4 h-4 text-amber-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: AGENDA & JADWAL KEGIATAN */}
      {/* ============================================================== */}
      {activeTab === 'SCHEDULE' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Susunan Jadwal & Agenda Rangkaian Kegiatan
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Jadwal pelaksanaan terpadu untuk seluruh cabang pertandingan dan babak final.
            </p>
          </div>

          <div className="space-y-4">
            {publicInfo.scheduleOverview.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-850 border border-slate-800 hover:border-slate-700 transition-colors bg-slate-800/50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-sm shrink-0">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono text-xs font-bold text-amber-400">{item.time}</span>
                    <h4 className="font-bold text-sm sm:text-base text-white">{item.activity}</h4>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-700 shrink-0">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{item.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: PERATURAN & TATA TERTIB */}
      {/* ============================================================== */}
      {activeTab === 'RULES' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Peraturan, Tata Tertib & Ketentuan Penilaian
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Seluruh peserta, ofisial, dan dewan juri tunduk pada ketentuan resmi panitia pusat.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {publicInfo.rulesOverview.map((rule, idx) => {
              const ruleText = typeof rule === 'string' ? rule : rule.rule;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 flex items-start gap-3"
                >
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{ruleText}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: INFORMASI KEGIATAN & KONTAK */}
      {/* ============================================================== */}
      {activeTab === 'INFO' && (
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" />
                Profil Lengkap &amp; Informasi Pelaksanaan Kegiatan
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Rangkaian pelaksanaan Festival &amp; Penilaian Digital Terintegrasi.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[11px] self-start sm:self-auto">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Supabase Real-Time Aktif</span>
            </div>
          </div>

          <div className="prose prose-invert max-w-none text-xs sm:text-sm text-slate-300 leading-relaxed space-y-4">
            <p>{publicInfo.eventDescription}</p>
            <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Lokasi Perlombaan:</span>
                <strong className="text-white text-sm">{publicInfo.location}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Tanggal Kegiatan:</span>
                <strong className="text-white text-sm">{publicInfo.eventDate}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Pusat Bantuan & WhatsApp:</span>
                <strong className="text-amber-400 text-sm">{publicInfo.contactPerson}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Integrasi Pembayaran:</span>
                <strong className="text-emerald-400 text-sm">QRIS DANA ({settings.danaTargetNumber || '081314420312'})</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
