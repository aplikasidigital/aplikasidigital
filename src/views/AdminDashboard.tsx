import React, { useState, useEffect, useRef } from 'react';
import {
  AppSettings,
  CompetitionCategory,
  JuryScoreSubmission,
  Participant,
  PublicEventInfo,
  ScoreCriteria,
  User,
  VoteTransaction,
  VotingCategory
} from '../types';
import { StorageService } from '../utils/storage';
import { bgmManager } from '../utils/audio';
import {
  downloadParticipantTemplate,
  downloadUserTemplate,
  parseParticipantFile,
  parseUserFile
} from '../utils/excel';
import { PrintReports } from '../components/PrintReports';
import { ConfirmModal } from '../components/ConfirmModal';
import { ProofModal } from '../components/ProofModal';
import { AdminApprovalTab } from '../components/admin/AdminApprovalTab';
import { AdminVotingTab } from '../components/admin/AdminVotingTab';
import { AdminScheduleRulesTab } from '../components/admin/AdminScheduleRulesTab';
import {
  Trophy,
  Users,
  Layers,
  Vote,
  Settings,
  Printer,
  ShieldAlert,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  ToggleRight,
  Sparkles,
  Music,
  ShieldCheck,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RefreshCw,
  QrCode
} from 'lucide-react';

interface AdminDashboardProps {
  currentUser: User;
  settings: AppSettings;
  onSettingsUpdate: (newSettings: AppSettings) => void;
  publicInfo: PublicEventInfo;
  onPublicInfoUpdate: (newInfo: PublicEventInfo) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentUser,
  settings,
  onSettingsUpdate,
  publicInfo,
  onPublicInfoUpdate
}) => {
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const [activeTab, setActiveTab] = useState<
    'APPROVAL' | 'CATEGORIES' | 'PARTICIPANTS' | 'VOTING' | 'USERS' | 'SCHEDULE_RULES' | 'REPORTS' | 'SETTINGS'
  >('APPROVAL');

  const [categories, setCategories] = useState<CompetitionCategory[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [submissions, setSubmissions] = useState<JuryScoreSubmission[]>([]);
  const [votingCategories, setVotingCategories] = useState<VotingCategory[]>([]);
  const [transactions, setTransactions] = useState<VoteTransaction[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [alertSuccess, setAlertSuccess] = useState<string>('');
  const [alertError, setAlertError] = useState<string>('');
  const [selectedCatFilter, setSelectedCatFilter] = useState<string>('');

  // Confirm Modal state (Replaces window.confirm)
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

  // Proof Modal state
  const [proofModalTx, setProofModalTx] = useState<VoteTransaction | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState<boolean>(false);

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [catEditingId, setCatEditingId] = useState<string | null>(null);
  const [catFormName, setCatFormName] = useState<string>('');
  const [catFormDesc, setCatFormDesc] = useState<string>('');
  const [catFormLocation, setCatFormLocation] = useState<string>('');
  const [catFormSchedule, setCatFormSchedule] = useState<string>('');
  const [catFormDuration, setCatFormDuration] = useState<number>(180);
  const [catFormCriteria, setCatFormCriteria] = useState<ScoreCriteria[]>([]);

  // Participant Modal State
  const [isPartModalOpen, setIsPartModalOpen] = useState<boolean>(false);
  const [partEditingId, setPartEditingId] = useState<string | null>(null);
  const [partRegNo, setPartRegNo] = useState<string>('');
  const [partName, setPartName] = useState<string>('');
  const [partInst, setPartInst] = useState<string>('');
  const [partCatId, setPartCatId] = useState<string>('');
  const [partContact, setPartContact] = useState<string>('');

  // User Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [userEditingId, setUserEditingId] = useState<string | null>(null);
  const [userFormUsername, setUserFormUsername] = useState<string>('');
  const [userFormPassword, setUserFormPassword] = useState<string>('123#');
  const [userFormName, setUserFormName] = useState<string>('');
  const [userFormRole, setUserFormRole] = useState<User['role']>('JURY');
  const [userFormPhone, setUserFormPhone] = useState<string>('');

  // Settings Temp Form & Upload States
  const [tempSettings, setTempSettings] = useState<AppSettings>(settings);
  const [isSavingSettings, setIsSavingSettings] = useState<boolean>(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState<string>('');
  const [previewAudioPlaying, setPreviewAudioPlaying] = useState<boolean>(false);
  const [previewAudioMuted, setPreviewAudioMuted] = useState<boolean>(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const loadAllData = () => {
    const cats = StorageService.getCategories();
    setCategories(cats);
    if (cats.length > 0 && !selectedCatFilter) {
      setSelectedCatFilter(cats[0].id);
    }
    setParticipants(StorageService.getParticipants());
    setSubmissions(StorageService.getSubmissions());
    setVotingCategories(StorageService.getVotingCategories());
    setTransactions(StorageService.getVoteTransactions());
    setUsers(StorageService.getUsers());
    setTempSettings(StorageService.getSettings());
  };

  useEffect(() => {
    loadAllData();

    // Subscribe to real-time events across all tabs and features
    const unsub = StorageService.subscribe(() => {
      loadAllData();
    });
    return unsub;
  }, []);

  // Sync tempSettings if parent settings change
  useEffect(() => {
    if (settings) {
      setTempSettings(settings);
    }
  }, [settings]);

  const showNotification = (msg: string, isErr = false) => {
    if (isErr) {
      setAlertError(msg);
      setAlertSuccess('');
    } else {
      setAlertSuccess(msg);
      setAlertError('');
    }
    setTimeout(() => {
      setAlertSuccess('');
      setAlertError('');
    }, 5000);
  };

  // ==========================================
  // APPROVAL HANDLERS
  // ==========================================
  const handleApproveSubmission = (subId: string) => {
    const all = StorageService.getSubmissions();
    const updated = all.map(s => (s.id === subId ? { ...s, status: 'APPROVED' as const } : s));
    StorageService.saveSubmissions(updated);
    setSubmissions(updated);
    showNotification('Nilai juri berhasil disetujui (Approved) & terbit ke Live Score!');
  };

  const handleRejectSubmission = (subId: string, notes?: string) => {
    const all = StorageService.getSubmissions();
    const updated = all.map(s =>
      s.id === subId
        ? {
            ...s,
            status: 'REJECTED' as const,
            adminNotes: notes || 'Nilai dikembalikan untuk pemeriksaan ulang oleh juri.'
          }
        : s
    );
    StorageService.saveSubmissions(updated);
    setSubmissions(updated);
    showNotification('Nilai juri berhasil dikembalikan (Rejected) dengan catatan penolakan!', true);
  };

  // ==========================================
  // FITUR UPLOAD: PHOTO PROFIL, BACKGROUND & MUSIK DARI PERANGKAT
  // ==========================================
  // Helper kompresi gambar otomatis agar muat di localStorage dan rendering ringan
  const compressImage = (file: File, maxWidth = 1200, maxHeight = 800, quality = 0.8): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } else {
            resolve((event.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((event.target?.result as string) || '');
        img.src = (event.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newLogo = await compressImage(file, 400, 400, 0.85);
      if (newLogo) {
        setTempSettings(prev => {
          const next = { ...prev, logoUrl: newLogo };
          // Pratinjau langsung pada aplikasi
          onSettingsUpdate(next);
          return next;
        });
        showNotification('Foto Profil / Logo aplikasi berhasil dimuat & diterapkan! Klik "Simpan Seluruh Pengaturan Sistem".');
      }
    } catch {
      showNotification('Gagal memproses file foto logo.', true);
    }
  };

  const handleRemoveLogo = () => {
    setTempSettings(prev => {
      const next = { ...prev, logoUrl: '' };
      onSettingsUpdate(next);
      return next;
    });
    showNotification('Foto Profil aplikasi dikembalikan ke default.');
  };

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const newBg = await compressImage(file, 1440, 900, 0.75);
      if (newBg) {
        setTempSettings(prev => {
          const next = { ...prev, backgroundImageUrl: newBg };
          // Pratinjau langsung pada aplikasi secara realtime
          onSettingsUpdate(next);
          return next;
        });
        showNotification('Gambar Latar Belakang berhasil dimuat & langsung diterapkan! Klik "Simpan Seluruh Pengaturan Sistem".');
      }
    } catch {
      showNotification('Gagal memproses file gambar latar belakang.', true);
    }
  };

  const handleRemoveBackground = () => {
    setTempSettings(prev => {
      const next = { ...prev, backgroundImageUrl: '' };
      onSettingsUpdate(next);
      return next;
    });
    showNotification('Latar Belakang aplikasi dikembalikan ke tema gelap default.');
  };

  // Upload Musik dari Perangkat Lokal (.mp3, .wav, .ogg, dll)
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showNotification('Ukuran file audio terlalu besar (maksimal 15MB). Silakan gunakan file musik yang lebih ringkas.', true);
      return;
    }
    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      const audioDataUrl = reader.result as string;
      setTempSettings(prev => ({
        ...prev,
        bgmAudioUrl: audioDataUrl,
        bgmFileName: fileName,
        bgmEnabled: true
      }));
      if (previewAudioRef.current) {
        previewAudioRef.current.src = audioDataUrl;
        previewAudioRef.current.load();
      }
      showNotification(`File musik "${fileName}" berhasil dimuat! Sedia untuk diputar & disimpan.`);
    };
    reader.onerror = () => {
      showNotification('Gagal membaca file audio dari perangkat.', true);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAudio = () => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current.src = '';
    }
    setPreviewAudioPlaying(false);
    setTempSettings(prev => ({
      ...prev,
      bgmAudioUrl: '',
      bgmFileName: '',
      bgmEnabled: true
    }));
    showNotification('Musik latar dikembalikan ke melodi seremonial bawaan.');
  };

  const togglePreviewAudio = () => {
    if (!previewAudioRef.current) return;
    if (previewAudioPlaying) {
      previewAudioRef.current.pause();
      setPreviewAudioPlaying(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setPreviewAudioPlaying(true);
      }).catch(() => {});
    }
  };

  const togglePreviewMute = () => {
    if (!previewAudioRef.current) return;
    const nextMute = !previewAudioMuted;
    previewAudioRef.current.muted = nextMute;
    setPreviewAudioMuted(nextMute);
  };

  const handlePreviewVolumeChange = (vol: number) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.volume = vol;
    }
    setTempSettings(prev => ({ ...prev, bgmVolume: vol }));
  };

  const handleDeleteSubmission = (sub: JuryScoreSubmission) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Nilai Juri?',
      message: `Hapus rekaman nilai juri ${sub.juryName} untuk peserta ini? Tindakan ini tidak dapat dibatalkan.`,
      confirmLabel: 'Hapus Nilai',
      isDestructive: true,
      onConfirm: () => {
        const all = StorageService.getSubmissions();
        const updated = all.filter(s => s.id !== sub.id);
        StorageService.saveSubmissions(updated);
        setSubmissions(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showNotification('Nilai juri berhasil dihapus.');
      }
    });
  };

  const handleUpdateSubmission = (updatedSub: JuryScoreSubmission) => {
    const all = StorageService.getSubmissions();
    const updated = all.map(s => (s.id === updatedSub.id ? updatedSub : s));
    StorageService.saveSubmissions(updated);
    setSubmissions(updated);
    showNotification('Nilai dan waktu pengerjaan berhasil diperbarui!');
  };

  const handleBulkApproveCategory = (catId: string) => {
    const all = StorageService.getSubmissions();
    const updated = all.map(s =>
      s.categoryId === catId && s.status === 'PENDING' ? { ...s, status: 'APPROVED' as const } : s
    );
    StorageService.saveSubmissions(updated);
    setSubmissions(updated);
    showNotification('Seluruh nilai pending pada cabang lomba ini berhasil disetujui!');
  };

  // ==========================================
  // TRANSAKSI DANA HANDLERS
  // ==========================================
  const handleApproveTransaction = (tx: VoteTransaction) => {
    const allTx = StorageService.getVoteTransactions();
    const updatedTx = allTx.map(t =>
      t.id === tx.id
        ? { ...t, status: 'APPROVED' as const, verifiedAt: new Date().toISOString() }
        : t
    );
    StorageService.saveVoteTransactions(updatedTx);
    setTransactions(updatedTx);

    // Tambah saldo voter
    const allUsers = StorageService.getUsers();
    const userIdx = allUsers.findIndex(u => u.id === tx.userId);
    if (userIdx !== -1) {
      allUsers[userIdx].voteBalance = (allUsers[userIdx].voteBalance || 0) + tx.amountVotes;
      StorageService.saveUsers(allUsers);
      setUsers(allUsers);
    }
    showNotification(`Transaksi berhasil disetujui! Saldo voter bertambah +${tx.amountVotes} vote.`);
  };

  const handleRejectTransaction = (txId: string) => {
    const allTx = StorageService.getVoteTransactions();
    const updatedTx = allTx.map(t =>
      t.id === txId
        ? { ...t, status: 'REJECTED' as const, verifiedAt: new Date().toISOString() }
        : t
    );
    StorageService.saveVoteTransactions(updatedTx);
    setTransactions(updatedTx);
    showNotification('Transaksi dibatalkan / ditolak.', true);
  };

  const handleDeleteTransaction = (tx: VoteTransaction) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Transaksi Pembayaran?',
      message: `Hapus rekaman transaksi ref: ${tx.referenceCode} dari ${tx.userName}?`,
      confirmLabel: 'Hapus Transaksi',
      isDestructive: true,
      onConfirm: () => {
        const allTx = StorageService.getVoteTransactions();
        const updated = allTx.filter(t => t.id !== tx.id);
        StorageService.saveVoteTransactions(updated);
        setTransactions(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showNotification('Transaksi berhasil dihapus.');
      }
    });
  };

  const handleUpdateTransaction = (updatedTx: VoteTransaction) => {
    const allTx = StorageService.getVoteTransactions();
    const updated = allTx.map(t => (t.id === updatedTx.id ? updatedTx : t));
    StorageService.saveVoteTransactions(updated);
    setTransactions(updated);
    showNotification('Rincian transaksi berhasil diperbarui!');
  };

  const handleSaveVotingCategories = (cats: VotingCategory[]) => {
    StorageService.saveVotingCategories(cats);
    setVotingCategories(cats);
    showNotification('Data kategori voting & nominal harga berhasil diperbarui!');
  };

  const handleSimulateWebhook = () => {
    const pendingTx = transactions.find(t => t.status === 'PENDING');
    if (!pendingTx) {
      showNotification('Tidak ada transaksi PENDING untuk di-verifikasi webhook saat ini.', true);
      return;
    }
    handleApproveTransaction(pendingTx);
    showNotification(`[WEBHOOK DANA] Transaksi ${pendingTx.referenceCode} terverifikasi otomatis!`);
  };

  // ==========================================
  // CATEGORIES CRUD
  // ==========================================
  const handleOpenNewCategory = () => {
    setCatEditingId(null);
    setCatFormName('');
    setCatFormDesc('');
    setCatFormLocation('Gedung Utama');
    setCatFormSchedule('14 Nov 2026, 09:00 WIB');
    setCatFormDuration(180);
    setCatFormCriteria([
      { id: `crit-${Date.now()}-1`, name: 'Kualitas & Ketepatan Hasil', type: 'CHECKBOX', maxScore: 10 },
      { id: `crit-${Date.now()}-2`, name: 'Kerapian & Kepatuhan Prosedur', type: 'NUMBER', maxScore: 100 }
    ]);
    setIsCatModalOpen(true);
  };

  const handleEditCategory = (cat: CompetitionCategory) => {
    setCatEditingId(cat.id);
    setCatFormName(cat.name);
    setCatFormDesc(cat.description);
    setCatFormLocation(cat.location);
    setCatFormSchedule(cat.scheduleTime);
    setCatFormDuration(cat.maxDurationMinutes || 180);
    setCatFormCriteria(cat.criteria || []);
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catFormName.trim()) return;

    const newCat: CompetitionCategory = {
      id: catEditingId || `cat-${Date.now()}`,
      name: catFormName.trim(),
      description: catFormDesc.trim(),
      location: catFormLocation.trim(),
      scheduleTime: catFormSchedule.trim(),
      maxDurationMinutes: Number(catFormDuration) || 180,
      rules: ['Patuhi instruksi dewan juri'],
      assignedJuryIds: users.filter(u => u.role === 'JURY').map(u => u.id),
      criteria: catFormCriteria
    };

    const currentCats = StorageService.getCategories();
    const updated = catEditingId
      ? currentCats.map(c => (c.id === catEditingId ? newCat : c))
      : [...currentCats, newCat];

    StorageService.saveCategories(updated);
    setCategories(updated);
    setIsCatModalOpen(false);
    showNotification('Cabang mata lomba berhasil disimpan!');
  };

  const handleDeleteCategory = (catId: string, catName: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Mata Lomba?',
      message: `Hapus cabang "${catName}" beserta seluruh kriteria di dalamnya? Data yang dihapus tidak dapat dipulihkan.`,
      confirmLabel: 'Hapus Cabang Lomba',
      isDestructive: true,
      onConfirm: () => {
        const updated = categories.filter(c => c.id !== catId);
        StorageService.saveCategories(updated);
        setCategories(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showNotification('Cabang mata lomba berhasil dihapus.');
      }
    });
  };

  const handleClearCategories = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Seluruh Mata Lomba?',
      message: 'PERINGATAN: Semua mata lomba dan kriteria akan dihapus bersih.',
      confirmLabel: 'Kosongkan Semua',
      isDestructive: true,
      onConfirm: () => {
        StorageService.saveCategories([]);
        setCategories([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showNotification('Seluruh data mata lomba telah dikosongkan.');
      }
    });
  };

  // ==========================================
  // PARTICIPANTS CRUD
  // ==========================================
  const handleOpenNewParticipant = () => {
    setPartEditingId(null);
    setPartRegNo(`REG-${Date.now().toString().slice(-4)}`);
    setPartName('');
    setPartInst('');
    setPartCatId(categories[0]?.id || '');
    setPartContact('');
    setIsPartModalOpen(true);
  };

  const handleEditParticipant = (p: Participant) => {
    setPartEditingId(p.id);
    setPartRegNo(p.registrationNumber);
    setPartName(p.name);
    setPartInst(p.institution);
    setPartCatId(p.categoryId);
    setPartContact(p.contact || '');
    setIsPartModalOpen(true);
  };

  const handleSaveParticipant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partName.trim() || !partRegNo.trim()) return;

    const newPart: Participant = {
      id: partEditingId || `part-${Date.now()}`,
      registrationNumber: partRegNo.trim(),
      name: partName.trim(),
      institution: partInst.trim(),
      categoryId: partCatId,
      contact: partContact.trim()
    };

    const currentParts = StorageService.getParticipants();
    const updated = partEditingId
      ? currentParts.map(p => (p.id === partEditingId ? newPart : p))
      : [...currentParts, newPart];

    StorageService.saveParticipants(updated);
    setParticipants(updated);
    setIsPartModalOpen(false);
    showNotification('Data peserta berhasil disimpan!');
  };

  const handleDeleteParticipant = (part: Participant) => {
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Data Peserta?',
      message: `Hapus peserta [${part.registrationNumber}] ${part.name} dari sistem?`,
      confirmLabel: 'Hapus Peserta',
      isDestructive: true,
      onConfirm: () => {
        const updated = participants.filter(p => p.id !== part.id);
        StorageService.saveParticipants(updated);
        setParticipants(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showNotification('Peserta berhasil dihapus.');
      }
    });
  };

  const handleClearParticipants = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Kosongkan Seluruh Peserta?',
      message: 'PERINGATAN: Semua data peserta lomba akan dihapus.',
      confirmLabel: 'Hapus Semua Peserta',
      isDestructive: true,
      onConfirm: () => {
        StorageService.saveParticipants([]);
        setParticipants([]);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showNotification('Seluruh data peserta telah dibersihkan.');
      }
    });
  };

  const handleUploadParticipantFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const targetCatId = selectedCatFilter || categories[0]?.id;
      if (!targetCatId) {
        showNotification('Pilih cabang mata lomba terlebih dahulu.', true);
        return;
      }
      const imported = await parseParticipantFile(file, targetCatId);
      if (imported.length === 0) {
        showNotification('Tidak ada data peserta yang valid pada file.', true);
        return;
      }
      const updated = [...participants, ...imported];
      StorageService.saveParticipants(updated);
      setParticipants(updated);
      showNotification(`Berhasil mengimpor ${imported.length} peserta secara masal!`);
    } catch (err: any) {
      showNotification(`Gagal membaca file: ${err.message}`, true);
    }
    e.target.value = '';
  };

  // ==========================================
  // USERS CRUD
  // ==========================================
  const handleOpenNewUser = () => {
    setUserEditingId(null);
    setUserFormUsername('');
    setUserFormPassword('123#');
    setUserFormName('');
    setUserFormRole('JURY');
    setUserFormPhone('');
    setIsUserModalOpen(true);
  };

  const handleEditUser = (u: User) => {
    setUserEditingId(u.id);
    setUserFormUsername(u.username);
    setUserFormPassword(u.password || '123#');
    setUserFormName(u.name);
    setUserFormRole(u.role);
    setUserFormPhone(u.phone || '');
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormUsername.trim() || !userFormName.trim()) return;

    const newUser: User = {
      id: userEditingId || `usr-${Date.now()}`,
      username: userFormUsername.trim(),
      password: userFormPassword.trim(),
      name: userFormName.trim(),
      role: userFormRole,
      phone: userFormPhone.trim(),
      voteBalance: userFormRole === 'VOTER' ? 10 : undefined,
      assignedCategoryIds: userFormRole === 'JURY' ? categories.map(c => c.id) : undefined
    };

    const currentUsers = StorageService.getUsers();
    const updated = userEditingId
      ? currentUsers.map(u => (u.id === userEditingId ? newUser : u))
      : [...currentUsers, newUser];

    StorageService.saveUsers(updated);
    setUsers(updated);
    setIsUserModalOpen(false);
    showNotification('Data pengguna berhasil disimpan!');
  };

  const handleDeleteUser = (u: User) => {
    if (u.id === currentUser.id) {
      showNotification('Tidak dapat menghapus akun Anda sendiri yang sedang aktif!', true);
      return;
    }
    setConfirmModal({
      isOpen: true,
      title: 'Hapus Akun Pengguna?',
      message: `Hapus akun ${u.name} (@${u.username}) role ${u.role}?`,
      confirmLabel: 'Hapus Pengguna',
      isDestructive: true,
      onConfirm: () => {
        const updated = users.filter(usr => usr.id !== u.id);
        StorageService.saveUsers(updated);
        setUsers(updated);
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        showNotification('Akun pengguna berhasil dihapus.');
      }
    });
  };

  const handleUploadUserFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const imported = await parseUserFile(file);
      if (imported.length === 0) {
        showNotification('File tidak memuat pengguna valid.', true);
        return;
      }
      const updated = [...users, ...imported];
      StorageService.saveUsers(updated);
      setUsers(updated);
      showNotification(`Berhasil mengimpor ${imported.length} akun pengguna masal!`);
    } catch (err: any) {
      showNotification(`Gagal membaca file: ${err.message}`, true);
    }
    e.target.value = '';
  };

  // ==========================================
  // SYSTEM SETTINGS (SUPER ADMIN)
  // ==========================================
  const handleSaveSystemSettings = async (e?: React.SyntheticEvent) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    if (!isSuperAdmin) {
      showNotification('Hanya Super Admin yang berwenang menyimpan konfigurasi sistem!', true);
      return;
    }
    setIsSavingSettings(true);
    try {
      // 1. Simpan ke database local storage & IndexedDB dengan fallback aman
      StorageService.saveSettings(tempSettings);

      // 2. Teruskan perubahan langsung ke state aplikasi pusat
      onSettingsUpdate(tempSettings);

      // 3. Sinkronisasi pemutar audio BGM jika musik latar kustom diatur
      try {
        if (tempSettings.bgmAudioUrl && !tempSettings.bgmAudioUrl.startsWith('idb:')) {
          bgmManager.setCustomAudio(tempSettings.bgmAudioUrl);
        }
        bgmManager.setVolume(tempSettings.bgmVolume !== undefined ? tempSettings.bgmVolume : 0.35);
      } catch (bgmErr) {
        console.warn('Sinkronisasi BGM notice:', bgmErr);
      }

      setIsSavingSettings(false);
      setSaveSuccessToast('Seluruh Pengaturan & Media Visual Berhasil Disimpan!');
      showNotification('Pengaturan Berhasil Disimpan! Seluruh identitas visual, musik, dan konfigurasi telah aktif.');
      setTimeout(() => {
        setSaveSuccessToast('');
      }, 5000);
    } catch (err: any) {
      setIsSavingSettings(false);
      showNotification(`Gagal menyimpan pengaturan: ${err?.message || 'Terjadi kesalahan saat menyimpan data'}`, true);
    }
  };

  const handleSaveScheduleAndRules = (updatedPublicInfo: PublicEventInfo) => {
    StorageService.savePublicInfo(updatedPublicInfo);
    onPublicInfoUpdate(updatedPublicInfo);
  };

  const handleSettingsUpdate = (newSettings: AppSettings) => {
    setTempSettings(newSettings);
    onSettingsUpdate(newSettings);
  };

  const pendingSubmissions = submissions.filter(s => s.status === 'PENDING');
  const pendingTransactions = transactions.filter(t => t.status === 'PENDING');

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                isSuperAdmin
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {isSuperAdmin ? 'SUPER ADMIN (PENGATUR SISTEM UTAMA)' : 'ADMIN BAYANGAN (OPERASIONAL)'}
            </span>
            <span className="text-xs text-slate-400">| S-IMPEL DIGITAL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Pusat Kendali Sistem & Evaluasi Digital
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            {isSuperAdmin
              ? 'Akses penuh ke approval, manajemen data, pengaturan jadwal/aturan, dan konfigurasi sistem.'
              : 'Hak akses terbatas operasional sistem. Pengaturan sistem hanya dapat diubah oleh Super Admin.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900/90 border border-amber-500/40 rounded-2xl p-3 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending Skor</span>
            <span className="text-xl font-mono font-black text-amber-400">{pendingSubmissions.length}</span>
          </div>
          <div className="bg-slate-900/90 border border-blue-500/40 rounded-2xl p-3 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Pending DANA</span>
            <span className="text-xl font-mono font-black text-blue-400">{pendingTransactions.length}</span>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {alertSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-950/70 border border-emerald-500/50 text-emerald-200 text-xs sm:text-sm flex items-center gap-2 shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{alertSuccess}</span>
        </div>
      )}
      {alertError && (
        <div className="p-4 rounded-2xl bg-red-950/70 border border-red-500/50 text-red-200 text-xs sm:text-sm flex items-center gap-2 shadow-lg">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{alertError}</span>
        </div>
      )}

      {/* Navigation Sub-tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl overflow-x-auto">
        {[
          { id: 'APPROVAL' as const, label: 'Approval Nilai Juri', icon: Trophy, count: pendingSubmissions.length },
          { id: 'CATEGORIES' as const, label: 'Mata Lomba & Kriteria', icon: Layers },
          { id: 'PARTICIPANTS' as const, label: 'Data Peserta & Impor', icon: Users, count: participants.length },
          { id: 'VOTING' as const, label: 'Voting Berbayar & DANA', icon: Vote, count: pendingTransactions.length },
          { id: 'SCHEDULE_RULES' as const, label: 'Jadwal & Aturan Lomba', icon: BookOpen },
          { id: 'USERS' as const, label: 'Pengguna & Juri', icon: ShieldCheck, count: users.length },
          { id: 'REPORTS' as const, label: 'Cetak & Ekspor A4', icon: Printer },
          { id: 'SETTINGS' as const, label: 'Pengaturan & Tema', icon: Settings, isLocked: !isSuperAdmin }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.isLocked) {
                  showNotification('Akses Dibatasi: Admin Bayangan TIDAK BISA membuka menu Pengaturan Sistem Utama!', true);
                  return;
                }
                setActiveTab(tab.id);
              }}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-[1.02]'
                  : tab.isLocked
                  ? 'text-slate-500 hover:text-slate-400 cursor-not-allowed opacity-60'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              {tab.isLocked && <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">Terkunci</span>}
              {tab.count !== undefined && tab.count > 0 && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: APPROVAL */}
      {activeTab === 'APPROVAL' && (
        <AdminApprovalTab
          categories={categories}
          participants={participants}
          submissions={submissions}
          selectedCatFilter={selectedCatFilter}
          onSelectCatFilter={setSelectedCatFilter}
          onApproveSubmission={handleApproveSubmission}
          onRejectSubmission={handleRejectSubmission}
          onDeleteSubmission={handleDeleteSubmission}
          onUpdateSubmission={handleUpdateSubmission}
          onBulkApproveCategory={handleBulkApproveCategory}
          onRefreshData={loadAllData}
        />
      )}

      {/* TAB 2: CATEGORIES */}
      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/90 p-5 rounded-3xl border border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Manajemen Cabang Mata Lomba & Kriteria Penilaian
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola mata lomba, kriteria ceklis/angka, durasi pengerjaan, dan juri penguji.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClearCategories}
                className="px-3 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-bold cursor-pointer"
              >
                Clear Data
              </button>
              <button
                type="button"
                onClick={handleOpenNewCategory}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Mata Lomba Baru
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories.map(cat => (
              <div
                key={cat.id}
                className="bg-slate-900/90 border border-slate-700 rounded-3xl p-5 shadow-xl flex flex-col justify-between space-y-4"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-extrabold text-base text-white">{cat.name}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-mono">
                      Maks: {cat.maxDurationMinutes || 180}m
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-2">{cat.description}</p>
                  <div className="text-xs text-slate-300 pt-1 space-y-0.5">
                    <p>Lokasi: <span className="text-white font-medium">{cat.location}</span></p>
                    <p>Jadwal: <span className="text-white font-medium">{cat.scheduleTime}</span></p>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-[11px] text-slate-400 font-bold block mb-1">
                      Kriteria Penilaian ({cat.criteria.length}):
                    </span>
                    <div className="space-y-1">
                      {cat.criteria.map(crit => (
                        <div
                          key={crit.id}
                          className="flex justify-between text-[11px] bg-slate-800/80 px-2.5 py-1 rounded-lg"
                        >
                          <span className="text-slate-300 truncate max-w-[180px]">{crit.name}</span>
                          <span className="font-mono font-bold text-amber-400">
                            {crit.type === 'CHECKBOX' ? 'Ceklis' : 'Angka'} (Maks: {crit.maxScore})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleEditCategory(cat)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-2 rounded-xl bg-red-950/70 hover:bg-red-900 text-red-300 text-xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PARTICIPANTS */}
      {activeTab === 'PARTICIPANTS' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/90 p-5 rounded-3xl border border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Pendaftaran & Impor Masal Peserta Lomba
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Daftarkan peserta manual atau unggah file Excel/CSV secara masal.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadParticipantTemplate('xlsx')}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Template Excel
              </button>

              <label className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                Impor Excel/CSV
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleUploadParticipantFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleOpenNewParticipant}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Peserta
              </button>

              <button
                type="button"
                onClick={handleClearParticipants}
                className="p-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 text-xs cursor-pointer"
                title="Hapus Semua Peserta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-5 shadow-xl overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3 w-28">No. Registrasi</th>
                  <th className="p-3">Nama Peserta / Tim</th>
                  <th className="p-3">Asal Sekolah / Kontingen</th>
                  <th className="p-3">Cabang Mata Lomba</th>
                  <th className="p-3">Kontak WA</th>
                  <th className="p-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {participants.map((p, idx) => {
                  const cat = categories.find(c => c.id === p.categoryId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-850 transition-colors">
                      <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono font-bold text-amber-400">{p.registrationNumber}</td>
                      <td className="p-3 font-semibold text-white">{p.name}</td>
                      <td className="p-3 text-slate-300">{p.institution}</td>
                      <td className="p-3 text-amber-300 text-xs">{cat?.name || 'Belum dipilih'}</td>
                      <td className="p-3 text-slate-400 font-mono text-xs">{p.contact || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEditParticipant(p)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteParticipant(p)}
                            className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: VOTING & DANA */}
      {activeTab === 'VOTING' && (
        <AdminVotingTab
          transactions={transactions}
          votingCategories={votingCategories}
          settings={tempSettings}
          onUpdateSettings={handleSettingsUpdate}
          onApproveTransaction={handleApproveTransaction}
          onRejectTransaction={handleRejectTransaction}
          onDeleteTransaction={handleDeleteTransaction}
          onUpdateTransaction={handleUpdateTransaction}
          onOpenProofModal={tx => {
            setProofModalTx(tx);
            setIsProofModalOpen(true);
          }}
          onSaveVotingCategories={handleSaveVotingCategories}
          onSimulateWebhook={handleSimulateWebhook}
          onRefreshData={loadAllData}
        />
      )}

      {/* TAB 5: SCHEDULE & RULES CRUD */}
      {activeTab === 'SCHEDULE_RULES' && (
        <AdminScheduleRulesTab
          publicInfo={publicInfo}
          onSavePublicInfo={handleSaveScheduleAndRules}
          onShowNotification={showNotification}
        />
      )}

      {/* TAB 6: USERS */}
      {activeTab === 'USERS' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-800/90 p-5 rounded-3xl border border-slate-700">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-400" />
                Role-Based Access Control (RBAC) & Otentikasi
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola hak akses Super Admin, Admin Bayangan, Juri, dan Voter.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => downloadUserTemplate('xlsx')}
                className="px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                Template Pengguna
              </button>

              <label className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer">
                <Upload className="w-4 h-4" />
                Impor Pengguna Masal
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleUploadUserFile}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleOpenNewUser}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Tambah Pengguna Baru
              </button>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-700 rounded-3xl p-5 shadow-xl overflow-x-auto">
            <table className="w-full text-xs sm:text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-300 border-b border-slate-800">
                  <th className="p-3 w-12 text-center">No</th>
                  <th className="p-3 w-36">Username</th>
                  <th className="p-3">Nama Lengkap</th>
                  <th className="p-3">Peran (Role)</th>
                  <th className="p-3">Nomor Kontak</th>
                  <th className="p-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((u, idx) => (
                  <tr key={u.id} className="hover:bg-slate-850 transition-colors">
                    <td className="p-3 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-bold text-amber-400">{u.username}</td>
                    <td className="p-3 font-semibold text-white">{u.name}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          u.role === 'SUPER_ADMIN'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : u.role === 'SHADOW_ADMIN'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                            : u.role === 'JURY'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400 font-mono text-xs">{u.phone || '-'}</td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditUser(u)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-amber-400" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteUser(u)}
                          disabled={u.id === currentUser.id}
                          className="p-1.5 rounded-lg bg-red-950 hover:bg-red-900 text-red-300 disabled:opacity-30 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: REPORTS */}
      {activeTab === 'REPORTS' && (
        <PrintReports
          settings={settings}
          categories={categories}
          participants={participants}
          submissions={submissions}
        />
      )}

      {/* TAB 8: SETTINGS */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6">
          {!isSuperAdmin ? (
            <div className="p-6 rounded-3xl bg-red-950/80 border border-red-500/50 text-red-200">
              <h4 className="font-bold text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-red-400" />
                AKSES PENGATURAN TERBATAS
              </h4>
              <p className="text-xs mt-1">
                Admin Bayangan (Shadow Admin) tidak diizinkan mengubah konfigurasi sistem utama.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveSystemSettings} className="space-y-6">
              {/* Feature Toggles */}
              <div className="bg-slate-800/90 border border-amber-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
                  <ToggleRight className="w-5 h-5 text-amber-400" />
                  Menu Kontrol Fitur Utama (Toggle On / Off)
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">a. Fitur Voting Publik</h4>
                      <p className="text-xs text-slate-400">
                        {tempSettings.votingEnabled ? 'Aktif: Voter dapat memberikan suara' : 'Ditutup: Voting publik dinonaktifkan'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTempSettings(prev => ({ ...prev, votingEnabled: !prev.votingEnabled }))}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        tempSettings.votingEnabled ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {tempSettings.votingEnabled ? 'ON (Aktif)' : 'OFF (Ditutup)'}
                    </button>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-white">b. Transfer Dana DANA</h4>
                      <p className="text-xs text-slate-400">
                        {tempSettings.danaTransferEnabled ? 'Aktif: Beli kuota via DANA' : 'Ditutup: Pembelian vote dinonaktifkan'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setTempSettings(prev => ({ ...prev, danaTransferEnabled: !prev.danaTransferEnabled }))}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                        tempSettings.danaTransferEnabled ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                      }`}
                    >
                      {tempSettings.danaTransferEnabled ? 'ON (Aktif)' : 'OFF (Ditutup)'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Gateway DANA 081314420312 & Harga Vote Configuration */}
              <div className="bg-slate-800/90 border border-blue-500/30 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
                  <QrCode className="w-5 h-5 text-blue-400" />
                  Portal Resmi Gateway DANA 081314420312 &amp; Pengaturan Tarif Voting
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nomor Akun Gateway DANA Penerima:
                    </label>
                    <input
                      type="text"
                      value={tempSettings.danaTargetNumber || '081314420312'}
                      onChange={e => setTempSettings(prev => ({ ...prev, danaTargetNumber: e.target.value }))}
                      placeholder="081314420312"
                      className="w-full px-3 py-2 bg-slate-900 text-white font-mono font-bold text-xs sm:text-sm rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Tampil di QRIS, instruksi pembayaran, dan WhatsApp.
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nama Akun DANA (Merchant / NMK):
                    </label>
                    <input
                      type="text"
                      value={tempSettings.danaTargetName || 'PANITIA S-IMPEL DIGITAL (OFFICIAL)'}
                      onChange={e => setTempSettings(prev => ({ ...prev, danaTargetName: e.target.value }))}
                      placeholder="PANITIA S-IMPEL DIGITAL"
                      className="w-full px-3 py-2 bg-slate-900 text-white text-xs sm:text-sm rounded-xl border border-slate-700 focus:outline-none focus:border-blue-400"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Nominal Tarif Default per 1 Vote (Rupiah):
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-400 bg-slate-900 px-3 py-2 rounded-xl border border-slate-700">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={tempSettings.defaultPricePerVote || 1000}
                        onChange={e =>
                          setTempSettings(prev => ({
                            ...prev,
                            defaultPricePerVote: Math.max(100, parseInt(e.target.value, 10) || 100)
                          }))
                        }
                        className="w-full px-3 py-2 bg-slate-900 text-amber-400 font-mono font-bold text-xs sm:text-sm rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Event Metadata */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-3">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Kustomisasi Judul, Deskripsi & Lokasi Kegiatan
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Judul Perlombaan:</label>
                    <input
                      type="text"
                      value={tempSettings.competitionTitle}
                      onChange={e => setTempSettings(prev => ({ ...prev, competitionTitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 text-white text-xs sm:text-sm rounded-xl border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Subjudul Perlombaan:</label>
                    <input
                      type="text"
                      value={tempSettings.competitionSubtitle}
                      onChange={e => setTempSettings(prev => ({ ...prev, competitionSubtitle: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 text-white text-xs sm:text-sm rounded-xl border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Lokasi / Tempat:</label>
                    <input
                      type="text"
                      value={tempSettings.location}
                      onChange={e => setTempSettings(prev => ({ ...prev, location: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 text-white text-xs sm:text-sm rounded-xl border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal & Waktu:</label>
                    <input
                      type="text"
                      value={tempSettings.eventDateTime}
                      onChange={e => setTempSettings(prev => ({ ...prev, eventDateTime: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900 text-white text-xs sm:text-sm rounded-xl border border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Deskripsi Lengkap:</label>
                  <textarea
                    rows={3}
                    value={tempSettings.competitionDescription}
                    onChange={e => setTempSettings(prev => ({ ...prev, competitionDescription: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 text-white text-xs sm:text-sm rounded-xl border border-slate-700"
                  />
                </div>
              </div>

              {/* ========================================================================= */}
              {/* FITUR BARU: MODUL PENGATURAN / PROFIL APLIKASI (UPLOAD FOTO & BACKGROUND) */}
              {/* ========================================================================= */}
              <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
                <div className="border-b border-slate-700 pb-3">
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" />
                    Profil Visual Aplikasi: Foto Profil & Latar Belakang
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Unggah dan ganti identitas visual aplikasi dengan mekanisme pratinjau (preview) langsung.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 1. UPLOAD FOTO PROFIL / LOGO / AVATAR APLIKASI */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                          <Trophy className="w-4 h-4 text-amber-400" />
                          Photo Profil (Logo / Avatar):
                        </label>
                        {tempSettings.logoUrl ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                            Foto Terpasang
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                            Ikon Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Format didukung: PNG, JPG, WebP, SVG. Ditampilkan pada navbar dan kop laporan.
                      </p>

                      {/* Preview Langsung Logo */}
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                        <div className="w-16 h-16 rounded-2xl bg-slate-800 border-2 border-amber-500/50 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
                          {tempSettings.logoUrl ? (
                            <img
                              src={tempSettings.logoUrl}
                              alt="Preview Logo"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-center p-1">
                              <Trophy className="w-6 h-6 text-amber-400 mx-auto" />
                              <span className="text-[9px] text-slate-500 block">Default</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 text-xs">
                          <span className="font-semibold text-slate-200 block">Status Pratinjau:</span>
                          <span className="text-[11px] text-slate-400">
                            {tempSettings.logoUrl ? 'Foto kustom aktif.' : 'Menggunakan logo bawaan.'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <label className="flex-1 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all">
                        <Upload className="w-4 h-4" />
                        <span>Pilih & Upload Foto Profil</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          className="hidden"
                        />
                      </label>
                      {tempSettings.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Hapus Foto
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 2. UPLOAD LATAR BELAKANG APLIKASI (BACKGROUND IMAGE / THEME) */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          Latar Belakang (Background Theme):
                        </label>
                        {tempSettings.backgroundImageUrl ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                            Background Kustom
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                            Tema Gelap Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Ditampilkan menyeluruh di latar belakang web dengan efek gelap transparan.
                      </p>

                      {/* Preview Langsung Background */}
                      <div className="relative h-20 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex items-center justify-center">
                        {tempSettings.backgroundImageUrl ? (
                          <>
                            <img
                              src={tempSettings.backgroundImageUrl}
                              alt="Preview Background"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[1px] flex items-center justify-center">
                              <span className="text-[10px] font-bold text-amber-300 bg-slate-950/80 px-2 py-0.5 rounded-full border border-amber-500/40">
                                Background Aktif
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-slate-500 italic">
                            Latar belakang default aktif
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <label className="flex-1 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all">
                        <Upload className="w-4 h-4" />
                        <span>Pilih & Upload Background</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleBackgroundUpload}
                          className="hidden"
                        />
                      </label>
                      {tempSettings.backgroundImageUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveBackground}
                          className="px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Hapus Background
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 3. UPLOAD MUSIK DARI PERANGKAT (AUDIO / BGM) */}
                  <div className="p-4 rounded-2xl bg-slate-900 border border-slate-700 space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                          <Music className="w-4 h-4 text-emerald-400" />
                          Musik Latar (.mp3, .wav, audio):
                        </label>
                        {tempSettings.bgmAudioUrl ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/40 font-bold">
                            Musik Kustom Aktif
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-semibold">
                            Melodi Default
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Unggah file audio dari perangkat untuk diputar otomatis bagi semua pengguna.
                      </p>

                      {/* Kontrol Pemutar Audio Langsung */}
                      <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between gap-2 overflow-hidden">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${previewAudioPlaying ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-emerald-400'}`}>
                              <Music className="w-3.5 h-3.5" />
                            </div>
                            <div className="truncate">
                              <span className="text-xs font-bold text-slate-200 block truncate">
                                {tempSettings.bgmFileName || (tempSettings.bgmAudioUrl ? 'Audio Kustom Tersimpan' : 'Ambient Chime Harmoni (Bawaan)')}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                {tempSettings.bgmAudioUrl ? 'Siap diputar & disimpan' : 'Musik seremonial otomatis'}
                              </span>
                            </div>
                          </div>

                          {tempSettings.bgmAudioUrl && (
                            <audio
                              ref={previewAudioRef}
                              src={tempSettings.bgmAudioUrl}
                              loop
                              onEnded={() => setPreviewAudioPlaying(false)}
                            />
                          )}
                        </div>

                        {/* Kontrol Player Audio */}
                        {tempSettings.bgmAudioUrl && (
                          <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                            <button
                              type="button"
                              onClick={togglePreviewAudio}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                              title={previewAudioPlaying ? 'Pause Audio' : 'Play Audio'}
                            >
                              {previewAudioPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              <span>{previewAudioPlaying ? 'Jeda' : 'Putar'}</span>
                            </button>

                            <button
                              type="button"
                              onClick={togglePreviewMute}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer transition-colors"
                              title={previewAudioMuted ? 'Unmute' : 'Mute'}
                            >
                              {previewAudioMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
                            </button>

                            <div className="flex items-center gap-1.5 flex-1 min-w-[60px]">
                              <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={tempSettings.bgmVolume !== undefined ? tempSettings.bgmVolume : 0.35}
                                onChange={e => handlePreviewVolumeChange(parseFloat(e.target.value))}
                                className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                              />
                              <span className="text-[10px] font-mono text-slate-400 w-6 text-right">
                                {Math.round((tempSettings.bgmVolume !== undefined ? tempSettings.bgmVolume : 0.35) * 100)}%
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex flex-wrap items-center gap-2">
                      <label className="flex-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow transition-all">
                        <Upload className="w-4 h-4" />
                        <span>Pilih & Upload Musik</span>
                        <input
                          type="file"
                          accept="audio/*,.mp3,.wav,.ogg,.m4a"
                          onChange={handleAudioUpload}
                          className="hidden"
                        />
                      </label>
                      {tempSettings.bgmAudioUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveAudio}
                          className="px-3 py-2 rounded-xl bg-red-950/70 hover:bg-red-900 border border-red-500/40 text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                        >
                          Reset Musik
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skema Aksen Warna */}
                <div className="pt-2 border-t border-slate-700/60">
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Skema Aksen Warna Utama Aplikasi:
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { id: 'gold', label: 'Kuning Emas', bg: 'bg-amber-500' },
                      { id: 'red', label: 'Merah Semangat', bg: 'bg-red-500' },
                      { id: 'blue', label: 'Biru Profesional', bg: 'bg-blue-600' },
                      { id: 'green', label: 'Hijau Harmoni', bg: 'bg-emerald-600' },
                      { id: 'brown', label: 'Coklat Elegan', bg: 'bg-amber-800' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() =>
                          setTempSettings(prev => ({ ...prev, themeColor: t.id as any }))
                        }
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                          tempSettings.themeColor === t.id
                            ? 'border-amber-400 ring-2 ring-amber-400/50 bg-slate-800 text-white'
                            : 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-500'
                        }`}
                      >
                        <span className={`w-3 h-3 rounded-full ${t.bg}`} />
                        <span>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Alert Notifikasi Sukses Dalam Form */}
              {saveSuccessToast && (
                <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/60 text-emerald-200 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xl animate-fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{saveSuccessToast}</span>
                </div>
              )}

              {/* Tombol Simpan Seluruh Pengaturan Sistem */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-slate-700/60">
                <button
                  type="button"
                  onClick={() => handleSaveSystemSettings()}
                  disabled={isSavingSettings}
                  className={`px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl flex items-center justify-center gap-2.5 cursor-pointer transition-all active:scale-[0.98] ${
                    saveSuccessToast
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950'
                  } disabled:opacity-60`}
                >
                  {isSavingSettings ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Menyimpan Pengaturan...</span>
                    </>
                  ) : saveSuccessToast ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Pengaturan Berhasil Disimpan!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Simpan Seluruh Pengaturan Sistem</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* FLOATING TOAST NOTIFIKASI SUKSES (Tampil di Layar Bawah Selalu Terlihat) */}
      {saveSuccessToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-emerald-600 text-white font-extrabold px-6 py-3.5 rounded-2xl shadow-2xl shadow-emerald-950/80 border border-emerald-300 text-xs sm:text-sm animate-bounce">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{saveSuccessToast}</span>
        </div>
      )}

      {/* CONFIRM MODAL (Sweetalert style) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        isDestructive={confirmModal.isDestructive}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* PROOF MODAL (Lihat Bukti Transfer DANA) */}
      <ProofModal
        isOpen={isProofModalOpen}
        transaction={proofModalTx}
        onClose={() => {
          setIsProofModalOpen(false);
          setProofModalTx(null);
        }}
        onApprove={handleApproveTransaction}
        onReject={handleRejectTransaction}
      />

      {/* MODAL: CATEGORY EDIT/CREATE */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {catEditingId ? 'Edit Mata Lomba' : 'Tambah Mata Lomba Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Mata Lomba:</label>
                <input
                  type="text"
                  required
                  value={catFormName}
                  onChange={e => setCatFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Lokasi:</label>
                  <input
                    type="text"
                    value={catFormLocation}
                    onChange={e => setCatFormLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Batas Durasi (Menit):</label>
                  <input
                    type="number"
                    min="1"
                    value={catFormDuration}
                    onChange={e => setCatFormDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Deskripsi:</label>
                <textarea
                  rows={2}
                  value={catFormDesc}
                  onChange={e => setCatFormDesc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black"
                >
                  Simpan Mata Lomba
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PARTICIPANT EDIT/CREATE */}
      {isPartModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {partEditingId ? 'Edit Peserta' : 'Tambah Peserta'}
              </h3>
              <button
                type="button"
                onClick={() => setIsPartModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParticipant} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">No. Registrasi:</label>
                <input
                  type="text"
                  required
                  value={partRegNo}
                  onChange={e => setPartRegNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Peserta / Tim:</label>
                <input
                  type="text"
                  required
                  value={partName}
                  onChange={e => setPartName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Asal Sekolah / Kontingen:</label>
                <input
                  type="text"
                  value={partInst}
                  onChange={e => setPartInst(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Cabang Mata Lomba:</label>
                <select
                  value={partCatId}
                  onChange={e => setPartCatId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                >
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPartModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black"
                >
                  Simpan Peserta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: USER EDIT/CREATE */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {userEditingId ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Username:</label>
                <input
                  type="text"
                  required
                  value={userFormUsername}
                  onChange={e => setUserFormUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password:</label>
                <input
                  type="text"
                  required
                  value={userFormPassword}
                  onChange={e => setUserFormPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={userFormName}
                  onChange={e => setUserFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Peran (Role):</label>
                <select
                  value={userFormRole}
                  onChange={e => setUserFormRole(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                >
                  <option value="JURY">Juri / Penilai</option>
                  <option value="VOTER">Voter / Pendukung</option>
                  <option value="SHADOW_ADMIN">Admin Bayangan (Operasional)</option>
                  {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin (Utama)</option>}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 font-black"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
