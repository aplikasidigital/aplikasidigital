import React, { useState, useEffect } from 'react';
import {
  User,
  CompetitionCategory,
  Participant,
  JuryScoreSubmission,
  ScoreCriteria,
  PenaltyRecord
} from '../types';
import { StorageService } from '../utils/storage';
import { ManualTimeInput } from '../components/ManualTimeInput';
import { SignaturePad } from '../components/SignaturePad';
import {
  Award,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Send,
  Eye,
  CheckSquare,
  ListFilter,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface JuryDashboardProps {
  currentUser: User;
}

export const JuryDashboard: React.FC<JuryDashboardProps> = ({ currentUser }) => {
  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submissions, setSubmissions] = useState<JuryScoreSubmission[]>([]);

  // Selected Category
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  // Mode: Single Participant Detailed OR Bulk Overall Grid
  const [viewMode, setViewMode] = useState<'SINGLE' | 'BULK'>('SINGLE');
  const [selectedPartId, setSelectedPartId] = useState<string>('');

  // Form State for Single Evaluation
  const [criteriaScores, setCriteriaScores] = useState<{ [critId: string]: number }>({});
  const [penalties, setPenalties] = useState<PenaltyRecord[]>([]);
  const [penaltyReason, setPenaltyReason] = useState<string>('');
  const [penaltyPoints, setPenaltyPoints] = useState<number>(5);
  const [timeSeconds, setTimeSeconds] = useState<number>(0);
  const [signatureData, setSignatureData] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [alertSuccess, setAlertSuccess] = useState<string>('');
  const [alertError, setAlertError] = useState<string>('');

  // Reload data
  const loadData = () => {
    const allCats = StorageService.getCategories();
    // Filter categories assigned to this jury or show all if assigned is empty
    const juryCats = currentUser.assignedCategoryIds && currentUser.assignedCategoryIds.length > 0
      ? allCats.filter(c => currentUser.assignedCategoryIds?.includes(c.id))
      : allCats;

    setCategories(juryCats);
    if (juryCats.length > 0 && !selectedCatId) {
      setSelectedCatId(juryCats[0].id);
    }

    const allParts = StorageService.getParticipants();
    setParticipants(allParts);

    const allSubs = StorageService.getSubmissions();
    setSubmissions(allSubs);
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time changes
    const unsub = StorageService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [currentUser]);

  const activeCategory = categories.find(c => c.id === selectedCatId) || categories[0];
  const categoryParticipants = participants.filter(p => p.categoryId === activeCategory?.id);

  // When participant or category changes in single mode, populate existing scores if any
  useEffect(() => {
    if (!activeCategory) return;
    if (categoryParticipants.length > 0 && !selectedPartId) {
      setSelectedPartId(categoryParticipants[0].id);
    }

    const currentSub = submissions.find(
      s =>
        s.categoryId === activeCategory.id &&
        s.participantId === selectedPartId &&
        s.juryId === currentUser.id
    );

    if (currentSub) {
      setCriteriaScores(currentSub.criteriaScores || {});
      setPenalties(currentSub.penalties || []);
      setTimeSeconds(currentSub.timeCompletionSeconds || 0);
      setSignatureData(currentSub.signatureDataUrl || '');
      setNotes(currentSub.notes || '');
    } else {
      // Initialize zero scores
      const initialScores: { [critId: string]: number } = {};
      activeCategory.criteria.forEach(c => {
        initialScores[c.id] = 0;
      });
      setCriteriaScores(initialScores);
      setPenalties([]);
      setTimeSeconds(0);
      setSignatureData('');
      setNotes('');
    }
    setAlertSuccess('');
    setAlertError('');
  }, [selectedPartId, activeCategory?.id]);

  // Handle Score Change for Single Mode
  const handleScoreChange = (critId: string, val: number, maxScore: number) => {
    const clamped = Math.max(0, Math.min(maxScore, val));
    setCriteriaScores(prev => ({ ...prev, [critId]: clamped }));
  };

  const handleAddPenalty = () => {
    if (!penaltyReason.trim()) {
      setAlertError('Harap tuliskan alasan pelanggaran.');
      return;
    }
    const newPen: PenaltyRecord = {
      id: `pen-${Date.now()}`,
      reason: penaltyReason.trim(),
      pointsDeducted: Math.max(1, Number(penaltyPoints) || 1)
    };
    setPenalties(prev => [...prev, newPen]);
    setPenaltyReason('');
    setPenaltyPoints(5);
    setAlertError('');
  };

  const handleRemovePenalty = (id: string) => {
    setPenalties(prev => prev.filter(p => p.id !== id));
  };

  // Calculations for Single Mode
  const sumCriteria = Object.values(criteriaScores).reduce((acc, curr) => acc + (Number(curr) || 0), 0);
  const totalPenalties = penalties.reduce((acc, curr) => acc + (Number(curr.pointsDeducted) || 0), 0);
  const netTotalScore = Math.max(0, sumCriteria - totalPenalties);

  // Submit Single Evaluation
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError('');
    setAlertSuccess('');

    if (!selectedPartId) {
      setAlertError('Pilih peserta terlebih dahulu.');
      return;
    }
    if (!signatureData) {
      setAlertError('Juri WAJIB menandatangani Pakta Integritas sebelum mengirimkan nilai!');
      return;
    }

    const newSub: JuryScoreSubmission = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      categoryId: activeCategory.id,
      participantId: selectedPartId,
      juryId: currentUser.id,
      juryName: currentUser.name,
      criteriaScores,
      penalties,
      totalScore: netTotalScore,
      timeCompletionSeconds: timeSeconds,
      signatureDataUrl: signatureData,
      integrityPactAccepted: true,
      notes,
      submittedAt: new Date().toISOString(),
      status: 'PENDING'
    };

    const allSubs = StorageService.getSubmissions();
    // Replace if this jury already graded this participant in this category
    const filtered = allSubs.filter(
      s =>
        !(
          s.categoryId === activeCategory.id &&
          s.participantId === selectedPartId &&
          s.juryId === currentUser.id
        )
    );
    const updated = [...filtered, newSub];
    StorageService.saveSubmissions(updated);
    setSubmissions(updated);

    setAlertSuccess(
      `Nilai peserta berhasil dikirim! Status saat ini: "Pending Approval Admin". Total Nilai: ${netTotalScore}`
    );
  };

  // Clear Single Evaluation Draft
  const handleClearSingle = () => {
    if (window.confirm('Bersihkan formulir penilaian peserta ini kembali ke awal?')) {
      const initialScores: { [critId: string]: number } = {};
      activeCategory?.criteria.forEach(c => {
        initialScores[c.id] = 0;
      });
      setCriteriaScores(initialScores);
      setPenalties([]);
      setTimeSeconds(0);
      setSignatureData('');
      setNotes('');
      setAlertSuccess('');
      setAlertError('Formulir berhasil dibersihkan.');
    }
  };

  // Existing Submission info for active participant
  const existingSub = submissions.find(
    s =>
      s.categoryId === activeCategory?.id &&
      s.participantId === selectedPartId &&
      s.juryId === currentUser.id
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Jury Info */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-850 to-slate-900 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              PANEL KHUSUS DEWAN JURI
            </span>
            <span className="text-xs text-slate-400">| S-IMPEL DIGITAL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Selamat Bertugas, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Penilaian Anda bersifat rahasia, independen, dan langsung terhubung dengan sistem kalkulasi perangkingan otomatis.
          </p>
        </div>

        {/* View Mode Toggle: Single vs Bulk Overall */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-700">
          <button
            type="button"
            onClick={() => setViewMode('SINGLE')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              viewMode === 'SINGLE'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            Mode Per Peserta
          </button>
          <button
            type="button"
            onClick={() => setViewMode('BULK')}
            className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors ${
              viewMode === 'BULK'
                ? 'bg-amber-500 text-slate-950 shadow'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Mode Keseluruhan Peserta
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/80 pb-3">
        <span className="text-xs font-semibold text-slate-400 mr-2 flex items-center gap-1">
          <ListFilter className="w-3.5 h-3.5" /> Mata Lomba:
        </span>
        {categories.map(c => {
          const isSelected = c.id === activeCategory?.id;
          return (
            <button
              key={c.id}
              onClick={() => {
                setSelectedCatId(c.id);
                setSelectedPartId('');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-[1.02]'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {c.name}
            </button>
          );
        })}
      </div>

      {/* Notifications */}
      {alertSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-sm flex items-center gap-2 shadow">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{alertSuccess}</span>
        </div>
      )}
      {alertError && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-500/50 text-red-200 text-sm flex items-center gap-2 shadow">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{alertError}</span>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 1: SINGLE PARTICIPANT DETAILED EVALUATION */}
      {/* ============================================================== */}
      {viewMode === 'SINGLE' && activeCategory && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Participant Picker & Details */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-4 shadow-lg">
              <h3 className="font-bold text-white text-sm mb-3 flex items-center justify-between">
                <span>Daftar Peserta Lomba</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-amber-300 font-mono">
                  {categoryParticipants.length} Peserta
                </span>
              </h3>

              <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                {categoryParticipants.map(p => {
                  const sub = submissions.find(
                    s =>
                      s.categoryId === activeCategory.id &&
                      s.participantId === p.id &&
                      s.juryId === currentUser.id
                  );
                  const isSelected = p.id === selectedPartId;

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPartId(p.id)}
                      className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-400'
                          : 'bg-slate-900/70 border-slate-700/80 hover:border-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-amber-400">
                          {p.registrationNumber}
                        </span>
                        {sub ? (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              sub.status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {sub.status === 'APPROVED' ? 'Disetujui' : 'Menunggu Approval'} (Skor: {sub.totalScore})
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Belum Dinilai
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-sm text-white">{p.name}</p>
                      <p className="text-xs text-slate-400 truncate">{p.institution}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Manual Time Input Component in Left Column */}
            <ManualTimeInput
              initialSeconds={timeSeconds}
              maxMinutes={activeCategory.maxDurationMinutes}
              onTimeChange={setTimeSeconds}
            />
          </div>

          {/* Right Column: Scoring Form */}
          <div className="lg:col-span-8 space-y-6">
            <form onSubmit={handleSubmitSingle} className="space-y-6">
              {/* Participant Profile Banner */}
              {selectedPartId && (
                <div className="bg-slate-850 p-4 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-800/80">
                  <div>
                    <span className="text-xs text-amber-400 font-mono font-bold">
                      Sedang Menilai: [
                      {categoryParticipants.find(p => p.id === selectedPartId)?.registrationNumber}
                      ]
                    </span>
                    <h3 className="text-lg font-extrabold text-white">
                      {categoryParticipants.find(p => p.id === selectedPartId)?.name}
                    </h3>
                    <p className="text-xs text-slate-300">
                      {categoryParticipants.find(p => p.id === selectedPartId)?.institution}
                    </p>
                  </div>
                  {existingSub && (
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block">Status Nilai Tersimpan</span>
                      <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 text-xs font-bold">
                        {existingSub.status}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Criteria List */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-amber-400" />
                    Kriteria Penilaian & Penentuan Skor
                  </h4>
                  <span className="text-xs text-slate-400">
                    Otomatis menyesuaikan jumlah ceklis sesuai Nilai Maksimal
                  </span>
                </div>

                <div className="space-y-4">
                  {activeCategory.criteria.map((crit, index) => {
                    const currentScore = criteriaScores[crit.id] || 0;
                    const max = crit.maxScore || 10;

                    return (
                      <div
                        key={crit.id}
                        className="bg-slate-900/90 p-4 rounded-xl border border-slate-700/80 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-center">
                                {index + 1}
                              </span>
                              <span className="font-bold text-sm text-white">{crit.name}</span>
                            </div>
                            {crit.description && (
                              <p className="text-xs text-slate-400 mt-1 ml-8">{crit.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            <span className="text-xs text-slate-400">Skor:</span>
                            <span className="font-mono text-base font-extrabold text-amber-400 bg-slate-800 px-3 py-1 rounded-lg border border-slate-700">
                              {currentScore} / {max}
                            </span>
                          </div>
                        </div>

                        {/* TYPE 1: CHECKBOX (Dynamic boxes matching Max Score) */}
                        {crit.type === 'CHECKBOX' ? (
                          <div className="pt-2">
                            <p className="text-xs text-slate-400 mb-2">
                              Klik kotak ceklis (Jumlah kolom menyesuaikan nilai maksimal: {max}):
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {Array.from({ length: max }).map((_, boxIdx) => {
                                const boxVal = boxIdx + 1;
                                const isChecked = currentScore >= boxVal;
                                return (
                                  <button
                                    key={boxVal}
                                    type="button"
                                    onClick={() => {
                                      // If clicking current score, toggle off by 1 or select this level
                                      handleScoreChange(
                                        crit.id,
                                        isChecked && currentScore === boxVal ? boxVal - 1 : boxVal,
                                        max
                                      );
                                    }}
                                    className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-mono font-bold text-xs sm:text-sm flex items-center justify-center transition-all cursor-pointer ${
                                      isChecked
                                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-black scale-105 ring-2 ring-amber-300'
                                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                                    }`}
                                  >
                                    {isChecked ? '✓' : boxVal}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ) : (
                          /* TYPE 2: NUMBER INPUT */
                          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                            <input
                              type="range"
                              min="0"
                              max={max}
                              value={currentScore}
                              onChange={e => handleScoreChange(crit.id, Number(e.target.value), max)}
                              className="flex-1 accent-amber-500 cursor-pointer w-full"
                            />
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                min="0"
                                max={max}
                                value={currentScore}
                                onChange={e => handleScoreChange(crit.id, Number(e.target.value), max)}
                                className="w-20 px-2 py-1.5 bg-slate-800 text-white font-mono font-bold text-sm text-center rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
                              />
                              <span className="text-xs text-slate-400">/ {max}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pelanggaran & Pengurangan Nilai (Penalties) */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                    Pencatatan Pelanggaran & Penalti Poin
                  </h4>
                  <span className="text-xs text-red-300">
                    Otomatis mengurangi perolehan nilai total
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <input
                    type="text"
                    value={penaltyReason}
                    onChange={e => setPenaltyReason(e.target.value)}
                    placeholder="Contoh: Keterlambatan waktu, atribut tidak lengkap..."
                    className="flex-1 px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-red-400"
                  />
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-xs text-slate-300">Potong:</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={penaltyPoints}
                      onChange={e => setPenaltyPoints(Number(e.target.value))}
                      className="w-16 px-2 py-2 bg-slate-900 text-red-400 font-mono font-bold text-center rounded-xl border border-slate-700 text-sm"
                    />
                    <span className="text-xs text-slate-300">Poin</span>
                    <button
                      type="button"
                      onClick={handleAddPenalty}
                      className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Tambah
                    </button>
                  </div>
                </div>

                {penalties.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {penalties.map(p => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-200"
                      >
                        <div>
                          <span className="font-semibold">{p.reason}</span>
                          <span className="font-mono font-bold text-red-400 ml-2">
                            (-{p.pointsDeducted} Poin)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemovePenalty(p.id)}
                          className="text-red-400 hover:text-red-200 p-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Catatan Juri */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Catatan Evaluasi / Ulasan Dewan Juri (Opsional):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Berikan masukan konstruktif untuk peserta..."
                  className="w-full px-3 py-2 bg-slate-900 text-white rounded-xl border border-slate-700 text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                />
              </div>

              {/* Total Summary Box */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-950 border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">
                    Kalkulasi Skor Bersih Peserta
                  </span>
                  <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-300">
                    <span>
                      Total Kriteria: <strong className="text-white">{sumCriteria}</strong>
                    </span>
                    <span>-</span>
                    <span>
                      Penalti Pelanggaran: <strong className="text-red-400">{totalPenalties}</strong>
                    </span>
                    <span>|</span>
                    <span>
                      Waktu:{' '}
                      <strong className="text-emerald-400 font-mono">
                        {Math.floor(timeSeconds / 60)}m {timeSeconds % 60}s
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="text-center sm:text-right">
                  <span className="text-xs text-amber-400 block font-semibold">TOTAL NILAI AKHIR</span>
                  <div className="text-3xl sm:text-4xl font-mono font-black text-amber-400 tracking-wider">
                    {netTotalScore}
                  </div>
                </div>
              </div>

              {/* Signature Pad */}
              <SignaturePad
                onSave={dataUrl => setSignatureData(dataUrl)}
                onClear={() => setSignatureData('')}
                juryName={currentUser.name}
              />

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleClearSingle}
                  className="px-4 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs sm:text-sm font-semibold cursor-pointer transition-colors"
                >
                  Bersihkan Form (Clear)
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <Send className="w-4 h-4" />
                    Kirim Nilai Resmi ke Admin
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODE 2: BULK OVERALL PARTICIPANTS TABLE VIEW */}
      {/* ============================================================== */}
      {viewMode === 'BULK' && activeCategory && (
        <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-700 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Matriks Penilaian Cepat Keseluruhan Peserta ({activeCategory.name})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Nilai seluruh peserta dalam satu tampilan tabel ringkas untuk memudahkan komparasi dewan juri.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm border-collapse text-left">
              <thead>
                <tr className="bg-slate-900 text-slate-300 border-b border-slate-700">
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3 w-28">No. Registrasi</th>
                  <th className="p-3">Nama Peserta / Instansi</th>
                  <th className="p-3 text-center">Waktu Tugas</th>
                  <th className="p-3 text-center">Skor Kriteria</th>
                  <th className="p-3 text-center">Penalti</th>
                  <th className="p-3 text-center">Total Skor</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/60">
                {categoryParticipants.map((p, idx) => {
                  const sub = submissions.find(
                    s =>
                      s.categoryId === activeCategory.id &&
                      s.participantId === p.id &&
                      s.juryId === currentUser.id
                  );

                  return (
                    <tr key={p.id} className="hover:bg-slate-750 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-amber-400">{p.registrationNumber}</td>
                      <td className="p-3">
                        <p className="font-bold text-white">{p.name}</p>
                        <p className="text-xs text-slate-400">{p.institution}</p>
                      </td>
                      <td className="p-3 text-center font-mono text-emerald-400">
                        {sub?.timeCompletionSeconds
                          ? `${Math.floor(sub.timeCompletionSeconds / 60)}m ${sub.timeCompletionSeconds % 60}s`
                          : '-'}
                      </td>
                      <td className="p-3 text-center font-mono font-semibold text-slate-300">
                        {sub
                          ? Object.values(sub.criteriaScores).reduce((a, b) => a + b, 0)
                          : '-'}
                      </td>
                      <td className="p-3 text-center font-mono text-red-400">
                        {sub && sub.penalties.length > 0
                          ? `-${sub.penalties.reduce((a, b) => a + b.pointsDeducted, 0)}`
                          : '0'}
                      </td>
                      <td className="p-3 text-center font-mono font-extrabold text-amber-400 text-base">
                        {sub ? sub.totalScore : '-'}
                      </td>
                      <td className="p-3 text-center">
                        {sub ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              sub.status === 'APPROVED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                                : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                            }`}
                          >
                            {sub.status === 'APPROVED' ? 'Disetujui' : 'Pending'}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-400">
                            Kosong
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPartId(p.id);
                            setViewMode('SINGLE');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors w-full"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          {sub ? 'Edit Nilai' : 'Beri Nilai'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
