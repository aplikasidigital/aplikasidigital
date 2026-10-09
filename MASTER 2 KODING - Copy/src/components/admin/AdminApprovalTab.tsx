import React, { useState } from 'react';
import {
  CompetitionCategory,
  JuryScoreSubmission,
  Participant,
  RankingResult
} from '../../types';
import { calculateRankings, StorageService } from '../../utils/storage';
import {
  Trophy,
  Award,
  CheckCircle2,
  X,
  Check,
  Edit2,
  Trash2,
  RefreshCw,
  Ban,
  Save,
  MessageSquare,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface AdminApprovalTabProps {
  categories: CompetitionCategory[];
  participants: Participant[];
  submissions: JuryScoreSubmission[];
  selectedCatFilter: string;
  onSelectCatFilter: (id: string) => void;
  onApproveSubmission: (subId: string) => void;
  onRejectSubmission: (subId: string, notes?: string) => void;
  onDeleteSubmission: (sub: JuryScoreSubmission) => void;
  onUpdateSubmission: (updatedSub: JuryScoreSubmission) => void;
  onBulkApproveCategory: (catId: string) => void;
  onRefreshData?: () => void;
}

export const AdminApprovalTab: React.FC<AdminApprovalTabProps> = ({
  categories,
  participants,
  submissions,
  selectedCatFilter,
  onSelectCatFilter,
  onApproveSubmission,
  onRejectSubmission,
  onDeleteSubmission,
  onUpdateSubmission,
  onBulkApproveCategory,
  onRefreshData
}) => {
  // =========================================================================
  // STATE: EDIT SUBMISSION MODAL
  // =========================================================================
  const [editingSub, setEditingSub] = useState<JuryScoreSubmission | null>(null);
  const [editScores, setEditScores] = useState<{ [critId: string]: number }>({});
  const [editMinutes, setEditMinutes] = useState<number>(0);
  const [editSeconds, setEditSeconds] = useState<number>(0);
  const [editNotes, setEditNotes] = useState<string>('');

  // =========================================================================
  // STATE BARU: MODAL TOLAK / KEMBALIKAN NILAI KE JURI
  // =========================================================================
  const [rejectingSub, setRejectingSub] = useState<JuryScoreSubmission | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  // =========================================================================
  // STATE BARU: MODUL KALKULASI PEMENANG & MEDALI (HASIL AKHIR)
  // Menampung penyesuaian manual (override) serta status finalisasi medali
  // =========================================================================
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [finalizedRankings, setFinalizedRankings] = useState<{ [participantId: string]: boolean }>({});
  const [editingRanking, setEditingRanking] = useState<RankingResult | null>(null);
  const [manualRankScore, setManualRankScore] = useState<number>(0);
  const [manualRankTime, setManualRankTime] = useState<number>(0);
  const [manualAwardTitle, setManualAwardTitle] = useState<string>('Juara 1');
  const [customRankingsList, setCustomRankingsList] = useState<RankingResult[] | null>(null);

  const activeCategory = categories.find(c => c.id === selectedCatFilter) || categories[0];
  const pendingSubmissions = submissions.filter(s => s.status === 'PENDING');

  // Kalkulasi dasar dari penyimpanan
  const baseRankings = activeCategory ? calculateRankings(activeCategory.id, true) : [];
  const currentRankings = customRankingsList || baseRankings;

  // Handler: Buka modal edit pengajuan juri
  const handleOpenEdit = (sub: JuryScoreSubmission) => {
    setEditingSub(sub);
    setEditScores({ ...sub.criteriaScores });
    setEditMinutes(Math.floor((sub.timeCompletionSeconds || 0) / 60));
    setEditSeconds((sub.timeCompletionSeconds || 0) % 60);
    setEditNotes(sub.notes || '');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    const totalTimeSec = editMinutes * 60 + editSeconds;
    const sumCriteria = Object.values(editScores).reduce((a, b) => a + (Number(b) || 0), 0);
    const sumPenalties = editingSub.penalties.reduce((a, b) => a + (Number(b.pointsDeducted) || 0), 0);
    const newTotal = Math.max(0, sumCriteria - sumPenalties);

    const updated: JuryScoreSubmission = {
      ...editingSub,
      criteriaScores: editScores,
      timeCompletionSeconds: totalTimeSec,
      totalScore: newTotal,
      notes: editNotes
    };

    onUpdateSubmission(updated);
    setEditingSub(null);
  };

  // Handler: Buka modal Tolak / Kembalikan dengan alasan
  const handleOpenReject = (sub: JuryScoreSubmission) => {
    setRejectingSub(sub);
    setRejectionReason('');
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingSub) return;
    onRejectSubmission(rejectingSub.id, rejectionReason.trim());
    setRejectingSub(null);
  };

  // Handler: Tarik Data (Refresh ulang data antrean dan hasil kalkulasi)
  const handleTriggerRefresh = () => {
    setIsRefreshing(true);
    setCustomRankingsList(null); // Reset manual overrides ke kalkulasi murni
    if (onRefreshData) {
      onRefreshData();
    }
    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  };

  // =========================================================================
  // HANDLER BARU: KONTROL PADA TABEL HASIL AKHIR & MEDALI
  // =========================================================================

  // 1. Edit Hasil Akhir / Medali Manual
  const handleOpenEditRanking = (item: RankingResult) => {
    setEditingRanking(item);
    setManualRankScore(item.averageScore);
    setManualRankTime(item.averageTimeSeconds);
    setManualAwardTitle(item.awardTitle || 'Juara 1');
  };

  const handleSaveEditRanking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRanking) return;

    const updatedList = currentRankings.map(r => {
      if (r.participantId === editingRanking.participantId) {
        return {
          ...r,
          averageScore: Number(manualRankScore),
          averageTimeSeconds: Number(manualRankTime),
          awardTitle: manualAwardTitle as any
        };
      }
      return r;
    });

    setCustomRankingsList(updatedList);
    setEditingRanking(null);
  };

  // 2. Terima (Finalisasi / Konfirmasi Sah Data Pemenang & Medali)
  const handleApproveRanking = (participantId: string) => {
    setFinalizedRankings(prev => ({ ...prev, [participantId]: true }));
  };

  // 3. Tolak / Kembalikan (Batalkan status sah pemenang)
  const handleRejectRanking = (participantId: string) => {
    setFinalizedRankings(prev => ({ ...prev, [participantId]: false }));
  };

  // 4. Hapus Pemenang dari Hasil Akhir
  const handleDeleteRanking = (participantId: string) => {
    const filtered = currentRankings.filter(r => r.participantId !== participantId);
    setCustomRankingsList(filtered);
  };

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. ANTREAN PERSETUJUAN NILAI (PENDING APPROVAL ADMIN) */}
      {/* ========================================================================= */}
      <div className="bg-slate-800/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              Antrean Persetujuan Nilai (Pending Approval Admin)
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Kelola nilai dewan juri: Edit, Hapus, Terima (Approve), Tolak/Kembalikan, dan Tarik Data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Baru: Tarik Data Antrean */}
            <button
              type="button"
              onClick={handleTriggerRefresh}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Tarik Data terbaru dari database"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Tarik Data</span>
            </button>

            {activeCategory && (
              <button
                type="button"
                onClick={() => onBulkApproveCategory(activeCategory.id)}
                disabled={pendingSubmissions.length === 0}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Setujui Semua di Cabang Ini
              </button>
            )}
          </div>
        </div>

        {pendingSubmissions.length === 0 ? (
          <div className="p-8 text-center bg-slate-900/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            Tidak ada data nilai yang menunggu persetujuan (Semua nilai juri telah terverifikasi).
          </div>
        ) : (
          <div className="space-y-3">
            {pendingSubmissions.map(sub => {
              const part = participants.find(p => p.id === sub.participantId);
              const cat = categories.find(c => c.id === sub.categoryId);

              return (
                <div
                  key={sub.id}
                  className="p-4 rounded-2xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-amber-400">
                        [{part?.registrationNumber}]
                      </span>
                      <span className="font-extrabold text-white text-sm sm:text-base">
                        {part?.name}
                      </span>
                      <span className="text-xs text-slate-400">({part?.institution})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300">
                      <span>
                        Cabang: <strong className="text-white">{cat?.name}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        Juri: <strong className="text-amber-300">{sub.juryName}</strong>
                      </span>
                      <span>|</span>
                      <span>
                        Waktu Pengerjaan:{' '}
                        <strong className="text-emerald-400 font-mono">
                          {Math.floor(sub.timeCompletionSeconds / 60)}m {sub.timeCompletionSeconds % 60}s
                        </strong>
                      </span>
                    </div>
                    {sub.penalties.length > 0 && (
                      <div className="text-[11px] text-red-300 font-semibold">
                        Penalti: {sub.penalties.map(p => `${p.reason} (-${p.pointsDeducted})`).join(', ')}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 self-end md:self-center">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                        Total Skor Juri
                      </span>
                      <span className="text-2xl font-black font-mono text-amber-400">
                        {sub.totalScore}
                      </span>
                    </div>

                    {/* Tombol Kontrol: Edit, Tolak/Kembalikan, Terima, Hapus */}
                    <div className="flex items-center gap-1.5">
                      {/* 1. Tombol Edit */}
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(sub)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors cursor-pointer"
                        title="Edit Data Nilai/Pengajuan"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {/* 2. Tombol Tolak / Kembalikan dengan Alasan */}
                      <button
                        type="button"
                        onClick={() => handleOpenReject(sub)}
                        className="p-2 rounded-xl bg-amber-950/80 hover:bg-amber-900 border border-amber-500/40 text-amber-300 transition-colors cursor-pointer"
                        title="Tolak / Kembalikan ke Juri dengan Catatan"
                      >
                        <Ban className="w-4 h-4" />
                      </button>

                      {/* 3. Tombol Terima (Approve) */}
                      <button
                        type="button"
                        onClick={() => onApproveSubmission(sub.id)}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow cursor-pointer transition-colors"
                        title="Terima / Setujui Nilai"
                      >
                        <Check className="w-4 h-4" />
                        Terima
                      </button>

                      {/* 4. Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => onDeleteSubmission(sub)}
                        className="p-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
                        title="Hapus Pengajuan Antrean"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. KALKULASI PEMENANG & PEROLEHAN MEDALI (HASIL AKHIR) */}
      {/* ========================================================================= */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" />
              Kalkulasi Pemenang & Perolehan Medali (Hasil Akhir)
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Tombol kontrol hasil akhir: Edit, Hapus, Terima (Konfirmasi Sah), Tolak/Kembalikan, dan Tarik Data.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Baru: Tarik Data Kalkulasi Ulang */}
            <button
              type="button"
              onClick={handleTriggerRefresh}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Kalkulasi ulang dan ambil data pemenang terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Tarik Data Medali</span>
            </button>

            <select
              value={selectedCatFilter}
              onChange={e => onSelectCatFilter(e.target.value)}
              className="px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-700 text-xs focus:outline-none focus:border-amber-400"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeCategory && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-700">
                  <th className="p-3 text-center w-12">Rank</th>
                  <th className="p-3 w-28">Gelar Juara</th>
                  <th className="p-3 w-28">No. Reg</th>
                  <th className="p-3">Nama Peserta / Instansi</th>
                  <th className="p-3 text-center">Waktu Tugas</th>
                  <th className="p-3 text-center">Nilai Rata-Rata</th>
                  <th className="p-3 text-center w-28">Status Medali</th>
                  <th className="p-3 text-center w-36">Aksi Kontrol</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-750">
                {currentRankings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-slate-500 italic">
                      Belum ada peserta atau nilai terverifikasi untuk cabang lomba ini.
                    </td>
                  </tr>
                ) : (
                  currentRankings.map(r => {
                    const isFinalSah = finalizedRankings[r.participantId];

                    return (
                      <tr
                        key={r.participantId}
                        className={`hover:bg-slate-750 transition-colors ${
                          isFinalSah
                            ? 'bg-emerald-950/20'
                            : r.rank <= 3
                            ? 'bg-amber-950/20 font-bold'
                            : 'bg-slate-800/30'
                        }`}
                      >
                        <td className="p-3 text-center font-bold font-mono">
                          <span
                            className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-xs ${
                              r.rank === 1
                                ? 'bg-amber-500 text-slate-950 font-black'
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
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded font-bold text-[11px] ${
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
                        <td className="p-3">
                          <p className="font-bold text-white">{r.participantName}</p>
                          <p className="text-xs text-slate-400">{r.institution}</p>
                        </td>
                        <td className="p-3 text-center font-mono text-emerald-400 text-xs">
                          {r.averageTimeSeconds > 0
                            ? `${Math.floor(r.averageTimeSeconds / 60)}m ${r.averageTimeSeconds % 60}s`
                            : '-'}
                        </td>
                        <td className="p-3 text-center font-black font-mono text-base text-amber-400">
                          {Number(r.averageScore).toFixed(2)}
                        </td>
                        <td className="p-3 text-center">
                          {isFinalSah ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/50 text-[10px] font-bold flex items-center justify-center gap-1">
                              <ShieldCheck className="w-3 h-3" />
                              Sah / Final
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-[10px] font-semibold">
                              Draft Review
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {/* 4 Tombol Kontrol: Edit, Terima, Tolak, Hapus */}
                          <div className="flex items-center justify-center gap-1">
                            {/* Tombol Edit Hasil */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditRanking(r)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors cursor-pointer"
                              title="Edit Data Hasil / Medali Manual"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Terima / Konfirmasi Sah */}
                            <button
                              type="button"
                              onClick={() => handleApproveRanking(r.participantId)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                                isFinalSah
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-800 hover:bg-emerald-600 text-emerald-400 hover:text-white'
                              }`}
                              title="Terima / Konfirmasi Sah Data Pemenang"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Tolak / Batalkan Sah */}
                            <button
                              type="button"
                              onClick={() => handleRejectRanking(r.participantId)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-amber-800 text-amber-400 hover:text-white transition-colors cursor-pointer"
                              title="Tolak / Kembalikan ke Tahap Sebelum Final"
                            >
                              <Ban className="w-3.5 h-3.5" />
                            </button>

                            {/* Tombol Hapus Hasil */}
                            <button
                              type="button"
                              onClick={() => handleDeleteRanking(r.participantId)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-800 text-red-400 hover:text-white transition-colors cursor-pointer"
                              title="Hapus Data Hasil Kalkulasi"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: EDIT NILAI PENGAJUAN JURI */}
      {/* ========================================================================= */}
      {editingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Edit Nilai & Catatan Juri</h3>
                <span className="text-xs text-amber-400">Juri: {editingSub.juryName}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-2">
                <span className="font-bold text-slate-300 block">Skor Per Kriteria:</span>
                {activeCategory?.criteria.map(crit => (
                  <div
                    key={crit.id}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800 border border-slate-700"
                  >
                    <span className="text-slate-200 truncate max-w-[200px]">{crit.name}</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max={crit.maxScore}
                        value={editScores[crit.id] !== undefined ? editScores[crit.id] : 0}
                        onChange={e => {
                          const val = Math.max(0, Math.min(crit.maxScore, Number(e.target.value)));
                          setEditScores(prev => ({ ...prev, [crit.id]: val }));
                        }}
                        className="w-16 px-2 py-1 bg-slate-900 text-center font-mono font-bold text-amber-400 rounded-lg border border-slate-600"
                      />
                      <span className="text-slate-400 text-[11px]">/ {crit.maxScore}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 space-y-2">
                <span className="font-bold text-slate-300 block">Pencatatan Waktu Pengerjaan:</span>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      value={editMinutes}
                      onChange={e => setEditMinutes(Math.max(0, Number(e.target.value)))}
                      className="w-16 px-2 py-1 bg-slate-900 text-center font-mono font-bold text-emerald-400 rounded-lg border border-slate-600"
                    />
                    <span className="text-slate-400">m</span>
                  </div>
                  <span>:</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      value={editSeconds}
                      onChange={e => setEditSeconds(Math.max(0, Math.min(59, Number(e.target.value))))}
                      className="w-16 px-2 py-1 bg-slate-900 text-center font-mono font-bold text-emerald-400 rounded-lg border border-slate-600"
                    />
                    <span className="text-slate-400">s</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Catatan Evaluasi:</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2 BARU: TOLAK / KEMBALIKAN PENGAJUAN KE JURI DENGAN ALASAN */}
      {/* ========================================================================= */}
      {rejectingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Ban className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Kembalikan Nilai ke Dewan Juri</h3>
              </div>
              <button
                type="button"
                onClick={() => setRejectingSub(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4 text-xs">
              <p className="text-slate-300 leading-relaxed">
                Nilai yang diajukan oleh <strong className="text-white">{rejectingSub.juryName}</strong> akan berstatus <strong className="text-amber-400">REJECTED</strong> untuk diperiksa atau diperbaiki kembali oleh juri bersangkutan.
              </p>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                  Alasan / Catatan Penolakan untuk Juri:
                </label>
                <textarea
                  rows={3}
                  required
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  placeholder="Contoh: Periksa kembali jumlah penalti keterlambatan atau kesesuaian skor kriteria..."
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRejectingSub(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold flex items-center gap-1.5 shadow"
                >
                  <Ban className="w-4 h-4" />
                  Kirim Penolakan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3 BARU: EDIT HASIL AKHIR / MEDALI PEMENANG SECARA MANUAL */}
      {/* ========================================================================= */}
      {editingRanking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-base text-white">Edit Hasil Akhir & Gelar Juara</h3>
                <span className="text-xs text-amber-400">{editingRanking.participantName}</span>
              </div>
              <button
                type="button"
                onClick={() => setEditingRanking(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditRanking} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Gelar Juara / Penghargaan:</label>
                <select
                  value={manualAwardTitle}
                  onChange={e => setManualAwardTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                >
                  <option value="Juara 1">Juara 1 (Emas)</option>
                  <option value="Juara 2">Juara 2 (Perak)</option>
                  <option value="Juara 3">Juara 3 (Perunggu)</option>
                  <option value="Harapan 1">Juara Harapan 1</option>
                  <option value="Harapan 2">Juara Harapan 2</option>
                  <option value="Harapan 3">Juara Harapan 3</option>
                  <option value="Peserta">Peserta / Partisipan</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nilai Rata-Rata Akhir:</label>
                <input
                  type="number"
                  step="0.01"
                  value={manualRankScore}
                  onChange={e => setManualRankScore(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 text-white font-mono font-bold text-amber-400 rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Waktu Pengerjaan (Detik):</label>
                <input
                  type="number"
                  min="0"
                  value={manualRankTime}
                  onChange={e => setManualRankTime(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 text-white font-mono rounded-xl border border-slate-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Setara: {Math.floor(manualRankTime / 60)} menit {manualRankTime % 60} detik
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingRanking(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black"
                >
                  Simpan Hasil
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
