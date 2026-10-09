import React, { useState, useEffect } from 'react';
import { VoteTransaction, VotingCategory, VotingCandidate, AppSettings } from '../../types';
import { StorageService } from '../../utils/storage';
import { ConfirmModal } from '../ConfirmModal';
import {
  Vote,
  Clock,
  Sparkles,
  Eye,
  Check,
  X,
  Edit2,
  Trash2,
  Plus,
  Ban,
  Tag,
  QrCode,
  RotateCcw,
  Settings,
  AlertTriangle,
  Users,
  Upload,
  CheckCircle2,
  Layers,
  Flame,
  Filter,
  Phone,
  RefreshCw
} from 'lucide-react';

interface AdminVotingTabProps {
  transactions: VoteTransaction[];
  votingCategories: VotingCategory[];
  settings?: AppSettings;
  onUpdateSettings?: (newSettings: AppSettings) => void;
  onApproveTransaction: (tx: VoteTransaction) => void;
  onRejectTransaction: (txId: string) => void;
  onDeleteTransaction: (tx: VoteTransaction) => void;
  onUpdateTransaction: (updatedTx: VoteTransaction) => void;
  onOpenProofModal: (tx: VoteTransaction) => void;
  onSaveVotingCategories: (cats: VotingCategory[]) => void;
  onSimulateWebhook: () => void;
  onRefreshData?: () => void;
}

export const AdminVotingTab: React.FC<AdminVotingTabProps> = ({
  transactions,
  votingCategories,
  settings,
  onUpdateSettings,
  onApproveTransaction,
  onRejectTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  onOpenProofModal,
  onSaveVotingCategories,
  onSimulateWebhook,
  onRefreshData
}) => {
  // Active Filter / Tab for Category view
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('ALL');

  // Portal Resmi Gateway DANA 081314420312 state
  const currentSettings = settings || StorageService.getSettings();
  const [danaTargetNumber, setDanaTargetNumber] = useState<string>(
    currentSettings.danaTargetNumber || '081314420312'
  );
  const [danaTargetName, setDanaTargetName] = useState<string>(
    currentSettings.danaTargetName || 'PANITIA S-IMPEL DIGITAL (OFFICIAL)'
  );
  const [isDanaTransferEnabled, setIsDanaTransferEnabled] = useState<boolean>(
    currentSettings.danaTransferEnabled ?? true
  );
  const [isSavingDana, setIsSavingDana] = useState<boolean>(false);

  // Pengaturan Harga Voter per Voting (Tarif per Suara) state
  const [globalPricePerVote, setGlobalPricePerVote] = useState<number>(
    currentSettings.defaultPricePerVote || (votingCategories[0]?.pricePerVote || 1000)
  );
  const [applyPriceToAll, setApplyPriceToAll] = useState<boolean>(true);
  const [isSavingPrice, setIsSavingPrice] = useState<boolean>(false);

  useEffect(() => {
    const s = settings || StorageService.getSettings();
    if (s) {
      setDanaTargetNumber(s.danaTargetNumber || '081314420312');
      setDanaTargetName(s.danaTargetName || 'PANITIA S-IMPEL DIGITAL (OFFICIAL)');
      setIsDanaTransferEnabled(s.danaTransferEnabled ?? true);
      if (s.defaultPricePerVote) {
        setGlobalPricePerVote(s.defaultPricePerVote);
      }
    }
  }, [settings]);

  // Edit Transaction state
  const [editingTx, setEditingTx] = useState<VoteTransaction | null>(null);
  const [editTxVotes, setEditTxVotes] = useState<number>(10);
  const [editTxPrice, setEditTxPrice] = useState<number>(10000);
  const [editTxSenderName, setEditTxSenderName] = useState<string>('');
  const [editTxStatus, setEditTxStatus] = useState<VoteTransaction['status']>('PENDING');

  // Voting Category Modal state (Add / Edit)
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [catName, setCatName] = useState<string>('');
  const [catDesc, setCatDesc] = useState<string>('');
  const [catPrice, setCatPrice] = useState<number>(1000);
  const [catActive, setCatActive] = useState<boolean>(true);

  // Candidate Modal state (Add / Edit)
  const [isCandidateModalOpen, setIsCandidateModalOpen] = useState<boolean>(false);
  const [candidateTargetCatId, setCandidateTargetCatId] = useState<string>('');
  const [editingCandidateId, setEditingCandidateId] = useState<string | null>(null);
  const [candName, setCandName] = useState<string>('');
  const [candSubtitle, setCandSubtitle] = useState<string>('');
  const [candInstitution, setCandInstitution] = useState<string>('');
  const [candPhotoUrl, setCandPhotoUrl] = useState<string>('');
  const [candVotesCount, setCandVotesCount] = useState<number>(0);

  // General Settings & Reset Polling Modal state
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  const showToast = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const pendingTransactions = transactions.filter(t => t.status === 'PENDING');
  const totalApprovedIncome = transactions
    .filter(t => t.status === 'APPROVED')
    .reduce((sum, t) => sum + (t.totalPriceIdr || 0), 0);
  const totalVotesCast = votingCategories.reduce(
    (sum, cat) => sum + cat.candidates.reduce((cSum, c) => cSum + (c.votesCount || 0), 0),
    0
  );
  const totalCandidatesCount = votingCategories.reduce(
    (sum, cat) => sum + cat.candidates.length,
    0
  );

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // ========================================================
  // CANDIDATE CRUD HANDLERS
  // ========================================================
  const handleOpenNewCandidate = (targetCatId?: string) => {
    const defaultCatId = targetCatId || (votingCategories[0]?.id || '');
    setCandidateTargetCatId(defaultCatId);
    setEditingCandidateId(null);
    setCandName('');
    setCandSubtitle('');
    setCandInstitution('');
    setCandPhotoUrl('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80');
    setCandVotesCount(0);
    setIsCandidateModalOpen(true);
  };

  const handleOpenEditCandidate = (catId: string, cand: VotingCandidate) => {
    setCandidateTargetCatId(catId);
    setEditingCandidateId(cand.id);
    setCandName(cand.name);
    setCandSubtitle(cand.subtitle);
    setCandInstitution(cand.institution);
    setCandPhotoUrl(cand.photoUrl);
    setCandVotesCount(cand.votesCount);
    setIsCandidateModalOpen(true);
  };

  const handleSaveCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!candName.trim() || !candidateTargetCatId) return;

    if (editingCandidateId) {
      // Edit Candidate
      const updated = votingCategories.map(cat => {
        if (cat.id === candidateTargetCatId) {
          return {
            ...cat,
            candidates: cat.candidates.map(c =>
              c.id === editingCandidateId
                ? {
                    ...c,
                    name: candName.trim(),
                    subtitle: candSubtitle.trim(),
                    institution: candInstitution.trim(),
                    photoUrl: candPhotoUrl.trim() || c.photoUrl,
                    votesCount: Math.max(0, candVotesCount)
                  }
                : c
            )
          };
        }
        return cat;
      });
      onSaveVotingCategories(updated);
      showToast(`Data kandidat "${candName}" berhasil diperbarui!`);
    } else {
      // Add Candidate
      const newCand: VotingCandidate = {
        id: `cand-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: candName.trim(),
        subtitle: candSubtitle.trim(),
        institution: candInstitution.trim(),
        photoUrl: candPhotoUrl.trim() || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
        votesCount: Math.max(0, candVotesCount)
      };

      const updated = votingCategories.map(cat => {
        if (cat.id === candidateTargetCatId) {
          return {
            ...cat,
            candidates: [...cat.candidates, newCand]
          };
        }
        return cat;
      });
      onSaveVotingCategories(updated);
      showToast(`Kandidat baru "${candName}" berhasil ditambahkan!`);
    }

    setIsCandidateModalOpen(false);
  };

  const handleDeleteCandidate = (catId: string, cand: VotingCandidate) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Data Kandidat Polling?',
      message: `Hapus kandidat "${cand.name}" dari polling? Tindakan ini akan menghapus kandidat dan seluruh suaranya.`,
      confirmLabel: 'Hapus Kandidat',
      isDestructive: true,
      onConfirm: () => {
        const updated = votingCategories.map(cat => {
          if (cat.id === catId) {
            return {
              ...cat,
              candidates: cat.candidates.filter(c => c.id !== cand.id)
            };
          }
          return cat;
        });
        onSaveVotingCategories(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast(`Kandidat "${cand.name}" telah dihapus.`);
      }
    });
  };

  const handleResetCandidateVotes = (catId: string, cand: VotingCandidate) => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset Hitungan Vote Kandidat ke 0?',
      message: `Kembalikan perolehan suara untuk kandidat "${cand.name}" dari ${cand.votesCount} menjadi 0 suara?`,
      confirmLabel: 'Reset ke 0',
      isDestructive: false,
      onConfirm: () => {
        const updated = votingCategories.map(cat => {
          if (cat.id === catId) {
            return {
              ...cat,
              candidates: cat.candidates.map(c =>
                c.id === cand.id ? { ...c, votesCount: 0 } : c
              )
            };
          }
          return cat;
        });
        onSaveVotingCategories(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast(`Hitungan vote untuk "${cand.name}" berhasil direset kembali ke 0!`);
      }
    });
  };

  // Handle Photo File Upload with compression
  const handleCandidatePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max = 400;
        if (width > max || height > max) {
          if (width > height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          setCandPhotoUrl(canvas.toDataURL('image/jpeg', 0.85));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // ========================================================
  // CATEGORY RESET & MANAGEMENT HANDLERS
  // ========================================================
  const handleResetCategoryVotes = (cat: VotingCategory) => {
    setConfirmModal({
      isOpen: true,
      title: `Reset Hitungan Vote: ${cat.name}?`,
      message: `PERINGATAN: Semua perolehan suara kandidat di dalam kategori "${cat.name}" akan dikembalikan ke 0 suara. Data profil kandidat tetap tersimpan.`,
      confirmLabel: 'Reset Suara Kategori ke 0',
      isDestructive: true,
      onConfirm: () => {
        const updated = votingCategories.map(c => {
          if (c.id === cat.id) {
            return {
              ...c,
              candidates: c.candidates.map(cand => ({ ...cand, votesCount: 0 }))
            };
          }
          return c;
        });
        onSaveVotingCategories(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast(`Semua hitungan vote pada kategori "${cat.name}" telah direset ke 0!`);
      }
    });
  };

  const handleResetAllVotesToZero = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Reset SELURUH Hitungan Vote ke 0?',
      message: 'PERINGATAN RESMI: Semua hitungan suara/poin seluruh kandidat pada SEMUA kategori polling akan dikembalikan ke 0. Data kandidat dan kategori tetap ada.',
      confirmLabel: 'Reset Semua ke 0',
      isDestructive: true,
      onConfirm: () => {
        const updated = votingCategories.map(cat => ({
          ...cat,
          candidates: cat.candidates.map(cand => ({ ...cand, votesCount: 0 }))
        }));
        onSaveVotingCategories(updated);
        // Also sync via StorageService
        StorageService.saveVoteCasts([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsSettingsModalOpen(false);
        showToast('Seluruh hitungan vote/poin pada semua kandidat berhasil dikembalikan ke 0!');
      }
    });
  };

  const handleClearAllCandidates = (catId?: string) => {
    const targetCat = catId ? votingCategories.find(c => c.id === catId) : null;
    setConfirmModal({
      isOpen: true,
      title: targetCat ? `Kosongkan Seluruh Kandidat di "${targetCat.name}"?` : 'Kosongkan Seluruh Kandidat di Semua Kategori?',
      message: 'Tindakan ini akan menghapus bersih data seluruh kandidat dalam polling. Tindakan tidak dapat dibatalkan.',
      confirmLabel: 'Kosongkan Kandidat',
      isDestructive: true,
      onConfirm: () => {
        const updated = votingCategories.map(cat => {
          if (!catId || cat.id === catId) {
            return { ...cat, candidates: [] };
          }
          return cat;
        });
        onSaveVotingCategories(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsSettingsModalOpen(false);
        showToast('Data kandidat telah dikosongkan.');
      }
    });
  };

  const handleResetAllVotingToDefault = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kembalikan Data Polling ke Default Bawaan?',
      message: 'Ini akan merestorasi kategori dan kandidat polling ke data awal aplikasi.',
      confirmLabel: 'Kembalikan Default',
      isDestructive: true,
      onConfirm: () => {
        StorageService.resetVotingScores();
        onSaveVotingCategories(StorageService.getVotingCategories());
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        setIsSettingsModalOpen(false);
        showToast('Data polling telah direstorasi ke setelan awal.');
      }
    });
  };

  // ========================================================
  // PORTAL RESMI GATEWAY DANA & PENGATURAN HARGA VOTE HANDLERS
  // ========================================================
  const handleSaveDanaAccount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!danaTargetNumber.trim()) {
      showToast('Nomor akun DANA tidak boleh kosong!', true);
      return;
    }
    setIsSavingDana(true);
    const updated = StorageService.updateDanaGateway(danaTargetNumber.trim(), danaTargetName.trim());
    if (onUpdateSettings) {
      onUpdateSettings(updated);
    }
    setTimeout(() => {
      setIsSavingDana(false);
      showToast(`Nomor Akun Gateway DANA berhasil diperbarui: ${danaTargetNumber.trim()} (Tersinkronisasi otomatis!)`);
    }, 250);
  };

  const handleToggleDanaTransfer = () => {
    const nextState = !isDanaTransferEnabled;
    setIsDanaTransferEnabled(nextState);
    const curr = StorageService.getSettings();
    const updated = { ...curr, danaTransferEnabled: nextState };
    StorageService.saveSettings(updated);
    if (onUpdateSettings) {
      onUpdateSettings(updated);
    }
    showToast(nextState ? 'Gateway Pembelian DANA telah DIAKTIFKAN.' : 'Gateway Pembelian DANA telah DINONAKTIFKAN.');
  };

  const handleSavePricePerVote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const numPrice = Math.max(100, Number(globalPricePerVote) || 1000);
    setIsSavingPrice(true);
    const res = StorageService.updatePricePerVote(numPrice, applyPriceToAll);
    if (onUpdateSettings) {
      onUpdateSettings(res.settings);
    }
    onSaveVotingCategories(res.categories);
    setTimeout(() => {
      setIsSavingPrice(false);
      showToast(
        `Harga per vote berhasil diperbarui: ${formatRupiah(numPrice)} / vote! ${
          applyPriceToAll ? 'Berlaku serentak untuk semua kategori.' : ''
        }`
      );
    }, 250);
  };

  // ========================================================
  // TRANSACTION CRUD HANDLERS
  // ========================================================
  const handleOpenEditTx = (tx: VoteTransaction) => {
    setEditingTx(tx);
    setEditTxVotes(tx.amountVotes);
    setEditTxPrice(tx.totalPriceIdr);
    setEditTxSenderName(tx.senderName || tx.userName);
    setEditTxStatus(tx.status);
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const updated: VoteTransaction = {
      ...editingTx,
      amountVotes: editTxVotes,
      totalPriceIdr: editTxPrice,
      senderName: editTxSenderName,
      status: editTxStatus
    };

    onUpdateTransaction(updated);
    setEditingTx(null);
    showToast('Data transaksi berhasil diperbarui!');
  };

  // Category Modal Handlers
  const handleOpenNewCat = () => {
    setEditingCatId(null);
    setCatName('');
    setCatDesc('');
    setCatPrice(1000);
    setCatActive(true);
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat: VotingCategory) => {
    setEditingCatId(cat.id);
    setCatName(cat.name);
    setCatDesc(cat.description);
    setCatPrice(cat.pricePerVote);
    setCatActive(cat.isActive);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCatId) {
      const updated = votingCategories.map(c =>
        c.id === editingCatId
          ? {
              ...c,
              name: catName.trim(),
              description: catDesc.trim(),
              pricePerVote: catPrice,
              isActive: catActive
            }
          : c
      );
      onSaveVotingCategories(updated);
      showToast(`Kategori "${catName}" berhasil diperbarui!`);
    } else {
      const newCat: VotingCategory = {
        id: `vote-cat-${Date.now()}`,
        name: catName.trim(),
        description: catDesc.trim(),
        pricePerVote: catPrice,
        isActive: catActive,
        candidates: []
      };
      onSaveVotingCategories([...votingCategories, newCat]);
      showToast(`Kategori voting baru "${catName}" berhasil ditambahkan!`);
    }
    setIsCatModalOpen(false);
  };

  const handleDeleteCat = (cat: VotingCategory) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Kategori Voting?',
      message: `Hapus kategori "${cat.name}" beserta ${cat.candidates.length} kandidat di dalamnya? Data yang dihapus tidak dapat dipulihkan.`,
      confirmLabel: 'Hapus Kategori',
      isDestructive: true,
      onConfirm: () => {
        const updated = votingCategories.filter(c => c.id !== cat.id);
        onSaveVotingCategories(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showToast(`Kategori "${cat.name}" telah dihapus.`);
      }
    });
  };

  // Filtered categories for candidate list
  const displayedCategories =
    selectedCatFilter === 'ALL'
      ? votingCategories
      : votingCategories.filter(c => c.id === selectedCatFilter);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl border text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xl animate-fade-in ${
            notification.isError
              ? 'bg-red-950/90 border-red-500/60 text-red-200'
              : 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
          }`}
        >
          {notification.isError ? (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* HEADER BANNER & STATS TOOLBAR */}
      <div className="bg-gradient-to-r from-blue-950/70 via-slate-900 to-amber-950/70 border border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30 text-xs font-bold uppercase tracking-wider">
                PORTAL RESMI GATEWAY DANA 081314420312
              </span>
              <span className="text-xs text-slate-400">| SINKRONISASI REAL-TIME</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white mt-1">
              Modul Manajemen Data Polling & Voting Berbayar Live
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Kelola data polling lengkap: Edit Data, Hapus Data, dan Reset Hitungan Vote/Poin kembali ke 0 dengan sinkronisasi langsung.
            </p>
          </div>

          {/* Quick Action Button Group */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Menu Pengaturan Data Polling */}
            <button
              type="button"
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-amber-500/50 text-amber-300 font-bold text-xs flex items-center gap-2 shadow-lg cursor-pointer transition-all"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span>Pengaturan &amp; Reset Data</span>
            </button>

            {/* Quick Button: Reset Seluruh Hitungan Vote ke 0 */}
            <button
              type="button"
              onClick={handleResetAllVotesToZero}
              className="px-4 py-2.5 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-all"
              title="Reset seluruh perolehan suara kembali ke 0"
            >
              <RotateCcw className="w-4 h-4 text-red-400" />
              <span>Reset Semua Vote ke 0</span>
            </button>

            <button
              type="button"
              onClick={onSimulateWebhook}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer transition-colors"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Uji Webhook DANA</span>
            </button>
          </div>
        </div>

        {/* 4-Column Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-800">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Kategori Polling</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-white">
                {votingCategories.length}
              </span>
              <span className="text-[10px] text-slate-400">Kategori</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Kandidat Terdaftar</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-amber-400">
                {totalCandidatesCount}
              </span>
              <span className="text-[10px] text-slate-400">Peserta</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Suara Masuk</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                {totalVotesCast}
              </span>
              <span className="text-[10px] text-slate-400">Vote</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-700/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Pemasukan DANA Terverifikasi</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm sm:text-base font-black font-mono text-emerald-300 truncate">
                {formatRupiah(totalApprovedIncome)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* FITUR BARU: PORTAL RESMI GATEWAY DANA 081314420312 & PENGATURAN HARGA VOTE */}
      {/* ========================================================================= */}
      <div className="bg-slate-800/90 border border-blue-500/40 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="border-b border-slate-700/80 pb-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <QrCode className="w-4 h-4" />
              </span>
              <h4 className="font-extrabold text-white text-base sm:text-lg">
                Portal Resmi Gateway DANA 081314420312 &amp; Pengaturan Tarif Voting Live
              </h4>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Konfigurasi langsung nomor akun DANA penerima/gateway dan harga per vote. Perubahan otomatis tersimpan secara dinamis dan tersinkronisasi real-time ke tampilan voter tanpa perlu refresh.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Gateway Aktif: <strong className="font-mono text-white">{danaTargetNumber}</strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-1">
          {/* MODUL 1: EDIT NOMOR AKUN DANA PENERIMA / GATEWAY */}
          <form
            onSubmit={handleSaveDanaAccount}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-blue-500/30 space-y-3 flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-blue-400" />
                  Menu Edit Nomor Akun DANA Gateway
                </label>
                <button
                  type="button"
                  onClick={handleToggleDanaTransfer}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all cursor-pointer ${
                    isDanaTransferEnabled
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}
                  title="Klik untuk mengaktifkan / menonaktifkan transaksi DANA"
                >
                  Status: {isDanaTransferEnabled ? 'Aktif Menerima' : 'Nonaktif'}
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nomor Akun DANA Penerima (Gateway Pembayaran):
                </label>
                <input
                  type="text"
                  required
                  value={danaTargetNumber}
                  onChange={e => setDanaTargetNumber(e.target.value)}
                  placeholder="Contoh: 081314420312"
                  className="w-full px-3 py-2 bg-slate-950 text-white font-mono font-bold text-sm rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400 shadow-inner"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Nomor ini langsung terhubung dengan QRIS, instruksi transfer voter, dan nomor WhatsApp admin otomatis.
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nama Akun DANA / Merchant NMK:
                </label>
                <input
                  type="text"
                  value={danaTargetName}
                  onChange={e => setDanaTargetName(e.target.value)}
                  placeholder="Contoh: PANITIA S-IMPEL DIGITAL (OFFICIAL)"
                  className="w-full px-3 py-2 bg-slate-950 text-white text-xs font-medium rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setDanaTargetNumber('081314420312');
                  setDanaTargetName('PANITIA S-IMPEL DIGITAL (OFFICIAL)');
                }}
                className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer"
              >
                Reset Default (081314420312)
              </button>
              <button
                type="submit"
                disabled={isSavingDana}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSavingDana ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Simpan Nomor Akun DANA</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* MODUL 2: PENGATURAN HARGA VOTER PER VOTING */}
          <form
            onSubmit={handleSavePricePerVote}
            className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-amber-500/30 space-y-3 flex flex-col justify-between shadow-lg"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-400" />
                  Pengaturan Harga Voter per Voting (Tarif per Suara)
                </label>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold">
                  {formatRupiah(globalPricePerVote)} / Vote
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Nominal / Harga Satuan per 1 Vote (Rupiah):
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 bg-slate-950 px-3 py-2 rounded-xl border border-slate-700">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    required
                    value={globalPricePerVote}
                    onChange={e => setGlobalPricePerVote(Math.max(100, parseInt(e.target.value, 10) || 100))}
                    className="flex-1 px-3 py-2 bg-slate-950 text-amber-400 font-mono font-black text-sm rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400 shadow-inner"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div>
                <span className="text-[10px] text-slate-400 block mb-1">Pilihan Cepat Nominal:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[500, 1000, 2000, 5000, 10000].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setGlobalPricePerVote(val)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border transition-all cursor-pointer ${
                        globalPricePerVote === val
                          ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                          : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-600'
                      }`}
                    >
                      {formatRupiah(val)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="applyAllCatsCheckbox"
                  checked={applyPriceToAll}
                  onChange={e => setApplyPriceToAll(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <label htmlFor="applyAllCatsCheckbox" className="text-[11px] text-slate-300 cursor-pointer">
                  Terapkan harga ini secara otomatis ke seluruh cabang / kategori voting aktif
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">
                Kalkulasi total harga voter akan langsung terintegrasi otomatis.
              </span>
              <button
                type="submit"
                disabled={isSavingPrice}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all disabled:opacity-50"
              >
                {isSavingPrice ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Menerapkan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Terapkan Harga Vote</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 1: MANAJEMEN DATA KANDIDAT POLLING & LIVE VOTES */}
      {/* ======================================================== */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-700 pb-4">
          <div>
            <h4 className="font-extrabold text-white text-base sm:text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Kelola Data Kandidat Polling &amp; Perolehan Suara
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola daftar nama kandidat, perbarui profil, edit perolehan suara, atau reset hitungan suara kembali ke 0.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-700">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCatFilter}
                onChange={e => setSelectedCatFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Kategori ({votingCategories.length})</option>
                {votingCategories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.candidates.length} kandidat)
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => handleOpenNewCandidate(selectedCatFilter !== 'ALL' ? selectedCatFilter : undefined)}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Tambah Kandidat Baru
            </button>
          </div>
        </div>

        {/* Candidate List Grouped by Category */}
        <div className="space-y-6">
          {displayedCategories.map(cat => (
            <div
              key={cat.id}
              className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-700/80 space-y-4"
            >
              {/* Category Subheader */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <Vote className="w-4 h-4" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="font-extrabold text-white text-sm sm:text-base">{cat.name}</h5>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono font-bold">
                        {formatRupiah(cat.pricePerVote)}/vote
                      </span>
                    </div>
                    <span className="text-xs text-slate-400">
                      {cat.candidates.length} Kandidat Terdaftar | Total Suara:{' '}
                      <strong className="text-amber-400 font-mono">
                        {cat.candidates.reduce((s, c) => s + (c.votesCount || 0), 0)}
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleResetCategoryVotes(cat)}
                    className="px-3 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Kembalikan suara semua kandidat di kategori ini ke 0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Suara Kategori (0)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenNewCandidate(cat.id)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    + Kandidat
                  </button>
                </div>
              </div>

              {/* Candidates Grid */}
              {cat.candidates.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400 italic bg-slate-950/60 rounded-xl border border-dashed border-slate-800">
                  Belum ada kandidat pada kategori ini.{' '}
                  <button
                    type="button"
                    onClick={() => handleOpenNewCandidate(cat.id)}
                    className="text-amber-400 underline font-bold ml-1 cursor-pointer"
                  >
                    Tambah Kandidat Sekarang
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {cat.candidates.map((cand, idx) => (
                    <div
                      key={cand.id}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/40 flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="relative shrink-0">
                          <img
                            src={cand.photoUrl}
                            alt={cand.name}
                            className="w-14 h-14 rounded-xl object-cover border border-amber-500/30 bg-slate-900"
                          />
                          <span className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black flex items-center justify-center shadow">
                            #{idx + 1}
                          </span>
                        </div>
                        <div className="overflow-hidden space-y-0.5">
                          <h6 className="font-bold text-white text-xs sm:text-sm truncate">
                            {cand.name}
                          </h6>
                          <p className="text-[11px] text-amber-300/90 truncate">{cand.subtitle}</p>
                          <p className="text-[10px] text-slate-400 truncate">{cand.institution}</p>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="text-xs font-mono font-extrabold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/30">
                              {cand.votesCount} Suara
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Candidate Action Buttons */}
                      <div className="flex flex-col sm:flex-row items-center gap-1.5 shrink-0">
                        {/* Edit Candidate */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditCandidate(cat.id, cand)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                          title="Edit Data Kandidat"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        </button>

                        {/* Reset Single Candidate Votes */}
                        <button
                          type="button"
                          onClick={() => handleResetCandidateVotes(cat.id, cand)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                          title="Reset Hitungan Suara Kandidat ke 0"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                        </button>

                        {/* Delete Candidate */}
                        <button
                          type="button"
                          onClick={() => handleDeleteCandidate(cat.id, cand)}
                          className="p-2 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 transition-colors cursor-pointer"
                          title="Hapus Kandidat"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 2: PENGATURAN KATEGORI VOTING & BESARAN NOMINAL */}
      {/* ======================================================== */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Tag className="w-5 h-5 text-amber-400" />
              Pengaturan Kategori Voting &amp; Besaran Nominal / Poin
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Atur tarif per-suara (Rupiah/Poin), aktif/non-aktifkan kategori, dan deskripsi polling.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewCat}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori Voting
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {votingCategories.map(cat => (
            <div
              key={cat.id}
              className="bg-slate-900/90 border border-slate-700 rounded-2xl p-4 flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <h5 className="font-bold text-white text-sm">{cat.name}</h5>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      cat.isActive
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {cat.isActive ? 'Aktif' : 'Non-Aktif'}
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
                <div className="mt-2 text-xs font-semibold text-amber-400 flex items-center justify-between">
                  <span>
                    Harga Per Vote: <span className="font-mono text-sm">{formatRupiah(cat.pricePerVote)}</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {cat.candidates.length} Kandidat
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => handleResetCategoryVotes(cat)}
                  className="px-2.5 py-1.5 rounded-xl bg-red-950/60 hover:bg-red-900 border border-red-500/30 text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  title="Reset suara kategori ini kembali ke 0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Reset Vote
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditCat(cat)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  Edit Kategori
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteCat(cat)}
                  className="p-1.5 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 cursor-pointer"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* SECTION 3: TRANSAKSI PEMBELIAN VOTE (APPROVAL DANA) */}
      {/* ======================================================== */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-3">
          <h4 className="font-bold text-white text-base flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            Daftar Transaksi Pembelian Vote ({transactions.length} Total, {pendingTransactions.length} Pending)
          </h4>
          <span className="text-xs text-slate-400">
            DANA Resmi: <strong className="text-amber-400">081314420312</strong>
          </span>
        </div>

        {transactions.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6 italic">
            Belum ada transaksi pembayaran vote tercatat.
          </p>
        ) : (
          <div className="space-y-3">
            {transactions.map(tx => (
              <div
                key={tx.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-extrabold text-white text-base">{tx.userName}</span>
                    <span className="text-xs text-slate-400 font-mono">({tx.userPhone})</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-mono">
                      Ref: {tx.referenceCode}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        tx.status === 'APPROVED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                          : tx.status === 'REJECTED'
                          ? 'bg-red-950 text-red-300 border border-red-500/40'
                          : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    Pengirim DANA:{' '}
                    <strong className="text-amber-300">{tx.senderName || tx.userName}</strong> |{' '}
                    Memesan: <strong className="text-white">{tx.amountVotes} Kuota Suara</strong> |{' '}
                    Nominal:{' '}
                    <strong className="text-emerald-400 font-mono">{formatRupiah(tx.totalPriceIdr)}</strong>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-end md:self-center">
                  {/* Button: Lihat Bukti Pembayaran */}
                  <button
                    type="button"
                    onClick={() => onOpenProofModal(tx)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Lihat Bukti
                  </button>

                  {/* Button: Edit */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditTx(tx)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                    title="Edit Transaksi"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                  </button>

                  {/* Button: Batal / Tolak */}
                  {tx.status !== 'REJECTED' && (
                    <button
                      type="button"
                      onClick={() => onRejectTransaction(tx.id)}
                      className="p-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 transition-colors cursor-pointer"
                      title="Batal / Tolak Transaksi"
                    >
                      <Ban className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Button: Terima (Approve) */}
                  {tx.status !== 'APPROVED' && (
                    <button
                      type="button"
                      onClick={() => onApproveTransaction(tx)}
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow cursor-pointer transition-colors"
                      title="Terima / Setujui (+Saldo)"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Terima
                    </button>
                  )}

                  {/* Button: Hapus */}
                  <button
                    type="button"
                    onClick={() => onDeleteTransaction(tx)}
                    className="p-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 transition-colors cursor-pointer"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL: PENGATURAN & RESET DATA POLLING TERPADU */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-base sm:text-lg text-white">
                  Pengaturan &amp; Reset Data Polling / Voting
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-300">
              <p>
                Pusat kendali data Polling &amp; Voting. Gunakan opsi di bawah ini untuk mengelola, mengedit, atau mereset data hitungan suara.
              </p>

              {/* Opsi 1: Reset Semua Hitungan Vote ke 0 */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-red-500/30 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <RotateCcw className="w-4 h-4 text-red-400" />
                    Reset/Clear Hitungan Vote ke 0
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Mengembalikan seluruh hitungan vote/poin semua kandidat kembali ke 0. Profil kandidat dan kategori tetap utuh.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetAllVotesToZero}
                  className="px-3.5 py-2 rounded-xl bg-red-950 hover:bg-red-900 border border-red-500/50 text-red-200 font-bold text-xs shrink-0 cursor-pointer transition-colors"
                >
                  Reset ke 0
                </button>
              </div>

              {/* Opsi 2: Kosongkan Seluruh Kandidat */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-400" />
                    Kosongkan Semua Kandidat
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Menghapus seluruh daftar kandidat dalam semua kategori agar Anda dapat menginput kandidat baru dari awal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleClearAllCandidates()}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs shrink-0 cursor-pointer transition-colors"
                >
                  Kosongkan
                </button>
              </div>

              {/* Opsi 3: Restorasi ke Bawaan Default */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h5 className="font-bold text-white text-sm flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Restorasi Data Demo Awal
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    Kembalikan kategori dan kandidat ke data simulasi bawaan sistem.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetAllVotingToDefault}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-blue-300 font-bold text-xs shrink-0 cursor-pointer transition-colors"
                >
                  Restorasi
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer"
              >
                Tutup Pengaturan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT / TAMBAH KANDIDAT POLLING */}
      {/* ======================================================== */}
      {isCandidateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingCandidateId ? 'Edit Data Kandidat Polling' : 'Tambah Kandidat Polling Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCandidateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Pilih Kategori Polling:</label>
                <select
                  value={candidateTargetCatId}
                  onChange={e => setCandidateTargetCatId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                >
                  {votingCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Nama Kandidat / Tim: <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={candName}
                  onChange={e => setCandName(e.target.value)}
                  placeholder="Contoh: Bintang Alamsyah (WEB-001)"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Karya / Subjudul / Proyek:
                </label>
                <input
                  type="text"
                  value={candSubtitle}
                  onChange={e => setCandSubtitle(e.target.value)}
                  placeholder="Contoh: Proyek: E-Smart Portal Siswa Terpadu"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Asal Sekolah / Kontingen / Instansi:
                </label>
                <input
                  type="text"
                  value={candInstitution}
                  onChange={e => setCandInstitution(e.target.value)}
                  placeholder="Contoh: SMKN 1 Jakarta Raya"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              {/* Foto Profil / Avatar Kandidat */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Foto Kandidat (URL atau Unggah File Langsung):
                </label>
                <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950 border border-slate-800 mb-2">
                  <img
                    src={candPhotoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80'}
                    alt="Preview Foto"
                    className="w-12 h-12 rounded-lg object-cover border border-amber-500/40 bg-slate-900 shrink-0"
                  />
                  <div className="flex-1">
                    <label className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      Pilih Foto dari Perangkat
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCandidatePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <input
                  type="url"
                  value={candPhotoUrl}
                  onChange={e => setCandPhotoUrl(e.target.value)}
                  placeholder="Atau tempel link URL foto (https://...)"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 text-xs font-mono"
                />
              </div>

              {/* Perolehan Suara (Vote Count) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Perolehan Suara Saat Ini (Votes / Poin):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    value={candVotesCount}
                    onChange={e => setCandVotesCount(parseInt(e.target.value, 10) || 0)}
                    className="w-full px-3 py-2 bg-slate-800 text-white font-mono font-bold text-amber-400 rounded-xl border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setCandVotesCount(0)}
                    className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-red-300 font-semibold shrink-0 cursor-pointer"
                    title="Set nilai ke 0"
                  >
                    Set 0
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCandidateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow"
                >
                  Simpan Kandidat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: EDIT TRANSACTION */}
      {/* ======================================================== */}
      {editingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Edit Rincian Transaksi DANA</h3>
              <button
                type="button"
                onClick={() => setEditingTx(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditTx} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Pengirim DANA:</label>
                <input
                  type="text"
                  required
                  value={editTxSenderName}
                  onChange={e => setEditTxSenderName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Jumlah Kuota Vote:</label>
                <input
                  type="number"
                  min="1"
                  value={editTxVotes}
                  onChange={e => setEditTxVotes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 text-white font-mono rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Total Nominal Rupiah:</label>
                <input
                  type="number"
                  min="0"
                  value={editTxPrice}
                  onChange={e => setEditTxPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 text-white font-mono rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Status Transaksi:</label>
                <select
                  value={editTxStatus}
                  onChange={e => setEditTxStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                >
                  <option value="PENDING">PENDING (Menunggu)</option>
                  <option value="APPROVED">APPROVED (Disetujui)</option>
                  <option value="REJECTED">REJECTED (Ditolak)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTx(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black cursor-pointer shadow"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CATEGORY EDIT / CREATE */}
      {/* ======================================================== */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingCatId ? 'Edit Kategori Voting' : 'Tambah Kategori Voting'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Kategori Voting:</label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={e => setCatName(e.target.value)}
                  placeholder="Contoh: Kandidat Inovasi Terfavorit"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi Singkat:</label>
                <textarea
                  rows={2}
                  value={catDesc}
                  onChange={e => setCatDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Atur Besaran Harga / Poin Per Vote (Rupiah):
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={catPrice}
                  onChange={e => setCatPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-800 text-white font-mono font-bold text-amber-400 rounded-xl border border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catActiveCheck"
                  checked={catActive}
                  onChange={e => setCatActive(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <label htmlFor="catActiveCheck" className="text-slate-300 font-semibold cursor-pointer">
                  Kategori Voting Aktif (Dapat dipilih publik)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black cursor-pointer shadow"
                >
                  Simpan Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRMATION DIALOG MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
