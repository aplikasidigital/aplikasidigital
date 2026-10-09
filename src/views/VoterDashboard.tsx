import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  VotingCategory,
  VotingCandidate,
  VoteTransaction,
  VoteCast,
  AppSettings
} from '../types';
import { StorageService } from '../utils/storage';
import {
  Vote,
  QrCode,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  AlertCircle,
  History,
  Coins,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Edit2,
  MessageSquare,
  Send,
  RefreshCw,
  X,
  Lock,
  Copy,
  Check,
  FileCheck2,
  Phone
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VoterDashboardProps {
  currentUser: User;
  settings: AppSettings;
  onUserUpdate: (updatedUser: User) => void;
}

export const VoterDashboard: React.FC<VoterDashboardProps> = ({
  currentUser,
  settings,
  onUserUpdate
}) => {
  const [votingCategories, setVotingCategories] = useState<VotingCategory[]>([]);
  const [selectedVotingCatId, setSelectedVotingCatId] = useState<string>('');
  const [userBalance, setUserBalance] = useState<number>(currentUser.voteBalance || 0);
  const [transactions, setTransactions] = useState<VoteTransaction[]>([]);
  const [voteCasts, setVoteCasts] = useState<VoteCast[]>([]);

  // Step wizard for Purchasing Votes
  // Step 1: Choose votes & Calculate price
  // Step 2: QRIS Scan to DANA 081314420312
  // Step 3: Upload Proof of Transfer & Reference
  // Step 4: Dedicated Success Confirmation & Direct WhatsApp Gateway
  const [purchaseStep, setPurchaseStep] = useState<1 | 2 | 3 | 4>(1);
  const [buyAmount, setBuyAmount] = useState<number>(10);
  const [activeBuyingCategory, setActiveBuyingCategory] = useState<VotingCategory | null>(null);
  const [proofImage, setProofImage] = useState<string>('');
  const [proofRefCode, setProofRefCode] = useState<string>('');
  const [senderName, setSenderName] = useState<string>(currentUser.name);
  const [submittingTx, setSubmittingTx] = useState<boolean>(false);
  const [isProcessingProof, setIsProcessingProof] = useState<boolean>(false);
  const [hasCopiedWaMessage, setHasCopiedWaMessage] = useState<boolean>(false);
  const [alertSuccess, setAlertSuccess] = useState<string>('');
  const [alertError, setAlertError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [submittedTxSuccess, setSubmittedTxSuccess] = useState<{
    tx: VoteTransaction;
    waUrl: string;
    waMessageText?: string;
  } | null>(null);

  // Cast Vote state
  const [voteAllocations, setVoteAllocations] = useState<{ [candId: string]: number }>({});
  const [isSubmittingVote, setIsSubmittingVote] = useState<boolean>(false);

  const loadData = () => {
    const cats = StorageService.getVotingCategories();
    setVotingCategories(cats);
    if (cats.length > 0 && !selectedVotingCatId) {
      setSelectedVotingCatId(cats[0].id);
      setActiveBuyingCategory(cats[0]);
    } else if (selectedVotingCatId) {
      const active = cats.find(c => c.id === selectedVotingCatId) || cats[0];
      setActiveBuyingCategory(active);
    }

    const allTx = StorageService.getVoteTransactions().filter(t => t.userId === currentUser.id);
    setTransactions(allTx);

    const allCasts = StorageService.getVoteCasts().filter(v => v.userId === currentUser.id);
    setVoteCasts(allCasts);

    // Refresh balance from storage
    const latestUser = StorageService.getUsers().find(u => u.id === currentUser.id);
    if (latestUser) {
      setUserBalance(latestUser.voteBalance || 0);
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to real-time sync (balance updates, candidate vote counts, transactions)
    const unsub = StorageService.subscribe(() => {
      loadData();
    });
    return unsub;
  }, [currentUser, selectedVotingCatId]);

  const activeCategory = votingCategories.find(c => c.id === selectedVotingCatId) || votingCategories[0];
  const unitPrice = activeCategory ? activeCategory.pricePerVote : 1000;
  const totalPrice = buyAmount * unitPrice;

  // Format IDR Rupiah
  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  // Helper kompresi gambar otomatis agar screenshot smartphone ringan (< 80KB) dan instan disimpan
  const compressProofImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 900;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.8));
          } else {
            resolve((e.target?.result as string) || '');
          }
        };
        img.onerror = () => resolve((e.target?.result as string) || '');
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle proof upload dengan kompresi
  const handleProofFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAlertError('File yang dipilih harus berupa gambar (JPG, PNG, JPEG, WebP).');
      return;
    }

    setIsProcessingProof(true);
    setAlertError('');

    try {
      const compressedDataUrl = await compressProofImage(file);
      if (compressedDataUrl) {
        setProofImage(compressedDataUrl);
      } else {
        // Fallback baca murni
        const reader = new FileReader();
        reader.onload = () => {
          setProofImage(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.warn('[VoterDashboard] Gagal kompresi bukti transfer:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsProcessingProof(false);
    }
  };

  // Step 2 to Step 3 after QRIS scan confirmation
  const handleConfirmQrisScanned = () => {
    setPurchaseStep(3);
    setProofRefCode(`DANA-${Date.now().toString().slice(-6)}`);
  };

  // Submit Transaction for Admin Approval
  const handleSubmitPurchase = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertError('');
    setAlertSuccess('');
    setSubmittedTxSuccess(null);

    if (!settings.danaTransferEnabled) {
      setAlertError('Mohon maaf, transaksi pembelian vote melalui transfer DANA sedang dinonaktifkan oleh Panitia Pusat.');
      return;
    }

    if (!senderName.trim()) {
      setAlertError('Harap cantumkan Nama Pengirim Dana sesuai akun DANA yang digunakan.');
      return;
    }

    if (!proofImage) {
      setAlertError('Wajib mengunggah foto bukti transfer (Screenshot / Struk DANA) sebelum dapat mengirim!');
      return;
    }

    setSubmittingTx(true);

    try {
      const referenceCode = proofRefCode.trim() || `DANA-${Date.now().toString().slice(-6)}`;
      const newTx: VoteTransaction = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone || '081234567890',
        senderName: senderName.trim(),
        amountVotes: buyAmount,
        totalPriceIdr: totalPrice,
        danaAccountNumber: settings.danaTargetNumber || '081314420312',
        transferProofUrl: proofImage,
        referenceCode: referenceCode,
        status: 'PENDING',
        createdAt: new Date().toISOString()
      };

      // 1. Simpan ke sistem database (StorageService) yang langsung auto-sync real-time ke panel Admin
      const allTx = StorageService.getVoteTransactions();
      const updated = [newTx, ...allTx];
      StorageService.saveVoteTransactions(updated);
      setTransactions(updated.filter(t => t.userId === currentUser.id));

      // 2. Siapkan tautan WhatsApp resmi Admin (081314420312)
      const targetPhone = (settings.danaTargetNumber || '081314420312').replace(/\D/g, '');
      const waNumber = targetPhone.startsWith('0') ? '62' + targetPhone.slice(1) : targetPhone;
      const waRawMessage =
        `*KONFIRMASI PEMBELIAN VOTE (S-IMPEL DIGITAL)*\n\n` +
        `Halo Admin, saya telah mengirimkan bukti transfer via QRIS DANA:\n\n` +
        `• *No. Referensi*: ${referenceCode}\n` +
        `• *Akun Pemesan*: ${currentUser.name}\n` +
        `• *No. HP Voter*: ${currentUser.phone || '-'}\n` +
        `• *Nama Pengirim DANA*: ${senderName.trim()}\n` +
        `• *Pesanan Kuota*: ${buyAmount} Suara\n` +
        `• *Total Tagihan*: ${formatRupiah(totalPrice)}\n` +
        `• *DANA Tujuan*: ${settings.danaTargetNumber || '081314420312'}\n\n` +
        `Bukti transfer sudah saya unggah ke sistem. Mohon bantu dicek dan diverifikasi (Approved). Terima kasih!`;
      const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waRawMessage)}`;

      setSubmittedTxSuccess({
        tx: newTx,
        waUrl,
        waMessageText: waRawMessage
      });

      // Buka layar Step 4 (Konfirmasi & Tindakan WhatsApp Langsung)
      setPurchaseStep(4);
      setAlertSuccess(
        `Permintaan pembelian ${buyAmount} vote senilai ${formatRupiah(totalPrice)} (Ref: ${referenceCode}) BERHASIL diajukan ke Admin!`
      );

      // Trigger confetti perayaan
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 }
      });
    } catch (err: any) {
      console.error('[VoterDashboard] Gagal mengajukan transaksi:', err);
      setAlertError('Terjadi kendala saat menyimpan transaksi: ' + (err?.message || 'Silakan coba lagi.'));
    } finally {
      setSubmittingTx(false);
    }
  };

  // Handle Giving Votes
  const handleCastVote = (candidate: VotingCandidate) => {
    setAlertError('');
    setAlertSuccess('');

    if (!settings.votingEnabled) {
      setAlertError('Mohon maaf, sistem voting saat ini sedang dinonaktifkan/ditutup oleh Panitia Pusat.');
      return;
    }

    const voteAmount = voteAllocations[candidate.id] || 1;
    if (userBalance < voteAmount) {
      setAlertError(`Saldo suara Anda tidak mencukupi (${userBalance} vote). Silakan lakukan pembelian vote terlebih dahulu.`);
      return;
    }

    setIsSubmittingVote(true);

    setTimeout(() => {
      const newBalance = userBalance - voteAmount;
      setUserBalance(newBalance);

      // Update user in storage
      const allUsers = StorageService.getUsers();
      const userIndex = allUsers.findIndex(u => u.id === currentUser.id);
      if (userIndex !== -1) {
        allUsers[userIndex].voteBalance = newBalance;
        StorageService.saveUsers(allUsers);
        onUserUpdate(allUsers[userIndex]);
      }

      // Update candidate votes in category
      const allCats = StorageService.getVotingCategories();
      const catIdx = allCats.findIndex(c => c.id === activeCategory.id);
      if (catIdx !== -1) {
        const candIdx = allCats[catIdx].candidates.findIndex(cd => cd.id === candidate.id);
        if (candIdx !== -1) {
          allCats[catIdx].candidates[candIdx].votesCount += voteAmount;
          StorageService.saveVotingCategories(allCats);
          setVotingCategories(allCats);
        }
      }

      // Record Cast
      const newCast: VoteCast = {
        id: `cast-${Date.now()}`,
        userId: currentUser.id,
        userName: currentUser.name,
        candidateId: candidate.id,
        candidateName: candidate.name,
        votingCategoryId: activeCategory.id,
        votesGiven: voteAmount,
        createdAt: new Date().toISOString()
      };
      const allCasts = StorageService.getVoteCasts();
      StorageService.saveVoteCasts([newCast, ...allCasts]);
      setVoteCasts([newCast, ...voteCasts]);

      setIsSubmittingVote(false);
      setAlertSuccess(`Berhasil memberikan ${voteAmount} vote untuk kandidat: ${candidate.name}! Terima kasih atas partisipasi Anda.`);

      // Fire celebratory confetti!
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 }
      });
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Wallet Status */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold uppercase tracking-wider">
              PORTAL VOTING RESMI
            </span>
            <span className="text-xs text-slate-400">| S-IMPEL DIGITAL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            Halo, {currentUser.name}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Gunakan hak suara Anda untuk mendukung talenta dan karya favorit di ajang bergengsi ini.
          </p>
        </div>

        {/* Balance Card */}
        <div className="bg-slate-900/90 border border-amber-500/50 rounded-2xl p-4 shadow-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
              Saldo Suara (Vote Tiket)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-black font-mono text-amber-400">
                {userBalance}
              </span>
              <span className="text-xs text-slate-300 font-semibold">Suara Tersedia</span>
            </div>
          </div>
        </div>
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
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{alertError}</span>
        </div>
      )}

      {/* Warning if voting or transfer is disabled by Super Admin */}
      {(!settings.votingEnabled || !settings.danaTransferEnabled) && (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs sm:text-sm flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">PEMBERITAHUAN DARI PANITIA PUSAT: </span>
            {!settings.votingEnabled && <span>Fitur pemberian vote publik saat ini ditutup. </span>}
            {!settings.danaTransferEnabled && <span>Fitur pembelian & transfer dana DANA sedang dinonaktifkan sementara. </span>}
          </div>
        </div>
      )}

      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-700/80 pb-3">
        <span className="text-xs font-semibold text-slate-400 mr-2">Pilih Kategori Voting:</span>
        {votingCategories.map(cat => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedVotingCatId(cat.id);
              setActiveBuyingCategory(cat);
            }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              cat.id === activeCategory?.id
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {cat.name} ({formatRupiah(cat.pricePerVote)}/vote)
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ============================================================== */}
        {/* LEFT COLUMN: CANDIDATES LIST & CASTING VOTE */}
        {/* ============================================================== */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3 mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Vote className="w-5 h-5 text-amber-400" />
                  Kandidat Terdaftar ({activeCategory?.name})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{activeCategory?.description}</p>
              </div>
            </div>

            <div className="space-y-4">
              {activeCategory?.candidates.map((cand, idx) => {
                const currentAllocation = voteAllocations[cand.id] || 1;

                return (
                  <div
                    key={cand.id}
                    className="bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/50 rounded-2xl p-4 transition-all flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative">
                        <img
                          src={cand.photoUrl}
                          alt={cand.name}
                          className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl object-cover border border-amber-500/30"
                        />
                        <span className="absolute -top-2 -left-2 w-6 h-6 rounded-full bg-amber-500 text-slate-950 text-xs font-black flex items-center justify-center shadow">
                          #{idx + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm sm:text-base text-white">{cand.name}</h4>
                        <p className="text-xs text-amber-300/90">{cand.subtitle}</p>
                        <p className="text-[11px] text-slate-400">{cand.institution}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-amber-400">
                            {cand.votesCount} Total Suara
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Vote Action */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800">
                      <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button
                          type="button"
                          onClick={() => {
                            setVoteAllocations(prev => ({
                              ...prev,
                              [cand.id]: Math.max(1, currentAllocation - 1)
                            }));
                          }}
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={Math.max(1, userBalance)}
                          value={currentAllocation}
                          onChange={e => {
                            const val = Math.max(1, parseInt(e.target.value, 10) || 1);
                            setVoteAllocations(prev => ({ ...prev, [cand.id]: val }));
                          }}
                          className="w-10 text-center font-mono font-bold text-amber-400 text-xs bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setVoteAllocations(prev => ({
                              ...prev,
                              [cand.id]: currentAllocation + 1
                            }));
                          }}
                          className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCastVote(cand)}
                        disabled={isSubmittingVote || userBalance < 1 || !settings.votingEnabled}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-[0.98]"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Vote Sekarang
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voting History */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-amber-400" />
              Riwayat Suara yang Pernah Anda Berikan
            </h4>
            {voteCasts.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada riwayat pemberian vote.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {voteCasts.map(c => (
                  <div
                    key={c.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-between text-xs text-slate-300"
                  >
                    <div>
                      <span className="font-bold text-white">{c.candidateName}</span>
                      <span className="text-[10px] text-slate-400 block">
                        {new Date(c.createdAt).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-amber-400">+{c.votesGiven} Suara</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/* RIGHT COLUMN: BUY VOTES WIZARD VIA DANA QRIS 081314420312 */}
        {/* ============================================================== */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-800/90 border border-amber-500/40 rounded-2xl p-5 shadow-2xl space-y-5">
            <div className="border-b border-slate-700 pb-3">
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold uppercase">
                PEMBELIAN SUARA RESMI
              </span>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-amber-400" />
                Beli Kuota Vote via QRIS DANA
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Akun Tujuan Resmi DANA: <strong className="text-amber-400">{settings.danaTargetNumber || '081314420312'}</strong>
              </p>
            </div>

            {/* Stepper Header */}
            <div className="grid grid-cols-4 gap-1 text-center text-[10px] sm:text-[11px] font-semibold">
              <div
                className={`p-1.5 rounded-lg border transition-all ${
                  purchaseStep === 1
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                1. Kuota
              </div>
              <div
                className={`p-1.5 rounded-lg border transition-all ${
                  purchaseStep === 2
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                2. QRIS
              </div>
              <div
                className={`p-1.5 rounded-lg border transition-all ${
                  purchaseStep === 3
                    ? 'bg-amber-500 text-slate-950 font-bold border-amber-400'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                3. Bukti
              </div>
              <div
                className={`p-1.5 rounded-lg border transition-all ${
                  purchaseStep === 4
                    ? 'bg-emerald-500 text-slate-950 font-bold border-emerald-400'
                    : 'bg-slate-900 text-slate-400 border-slate-700'
                }`}
              >
                4. Konfirmasi
              </div>
            </div>

            {/* STEP 1: SELECT VOTE AMOUNT */}
            {purchaseStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    Pilih Paket Jumlah Vote:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 25, 50, 100, 250].map(qty => (
                      <button
                        key={qty}
                        type="button"
                        onClick={() => setBuyAmount(qty)}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          buyAmount === qty
                            ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md ring-1 ring-amber-300'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:border-slate-500'
                        }`}
                      >
                        <span className="block text-sm font-mono font-bold">{qty}</span>
                        <span className="block text-[10px] opacity-80">Suara</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Atau Masukkan Jumlah Kustom:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={buyAmount}
                      onChange={e => setBuyAmount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-2 bg-slate-900 text-white font-mono font-bold rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-xs text-slate-300 font-semibold shrink-0">Suara</span>
                  </div>
                </div>

                {/* Calculation breakdown */}
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Harga Satuan per Suara:</span>
                    <span className="text-white font-semibold">{formatRupiah(unitPrice)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Jumlah yang Dipesan:</span>
                    <span className="text-white font-semibold">{buyAmount} Suara</span>
                  </div>
                  <div className="border-t border-slate-800 pt-2 flex justify-between text-sm font-bold text-amber-400">
                    <span>Total Pembayaran:</span>
                    <span className="text-base font-mono">{formatRupiah(totalPrice)}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setPurchaseStep(2)}
                  disabled={!settings.danaTransferEnabled}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
                >
                  <span>Lanjut Scan QRIS DANA</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: SCAN QRIS TO DANA 081314420312 */}
            {purchaseStep === 2 && (
              <div className="space-y-4 text-center">
                <div className="bg-white p-4 rounded-2xl shadow-xl inline-block border-4 border-amber-500">
                  {/* Dynamic simulated QRIS standard presentation with genuine details */}
                  <div className="text-[11px] font-bold text-slate-900 mb-2 border-b border-slate-300 pb-1 uppercase">
                    QRIS PEMBAYARAN RESMI DANA
                  </div>
                  <div className="w-48 h-48 mx-auto bg-slate-950 p-2 rounded-xl flex flex-col items-center justify-center relative overflow-hidden">
                    {/* Visual QR Pattern representation */}
                    <svg viewBox="0 0 100 100" className="w-full h-full text-white fill-current">
                      <rect width="100" height="100" fill="white" />
                      {/* Top left finder */}
                      <rect x="10" y="10" width="25" height="25" fill="#111827" />
                      <rect x="15" y="15" width="15" height="15" fill="white" />
                      <rect x="18" y="18" width="9" height="9" fill="#111827" />
                      {/* Top right finder */}
                      <rect x="65" y="10" width="25" height="25" fill="#111827" />
                      <rect x="70" y="15" width="15" height="15" fill="white" />
                      <rect x="73" y="18" width="9" height="9" fill="#111827" />
                      {/* Bottom left finder */}
                      <rect x="10" y="65" width="25" height="25" fill="#111827" />
                      <rect x="15" y="70" width="15" height="15" fill="white" />
                      <rect x="18" y="73" width="9" height="9" fill="#111827" />
                      {/* Data dots */}
                      <rect x="42" y="12" width="6" height="6" fill="#111827" />
                      <rect x="52" y="12" width="6" height="6" fill="#111827" />
                      <rect x="42" y="24" width="6" height="6" fill="#111827" />
                      <rect x="12" y="42" width="6" height="6" fill="#111827" />
                      <rect x="24" y="42" width="6" height="6" fill="#111827" />
                      <rect x="36" y="36" width="28" height="28" fill="#111827" />
                      <rect x="40" y="40" width="20" height="20" fill="#10b981" />
                      <rect x="72" y="42" width="6" height="6" fill="#111827" />
                      <rect x="84" y="52" width="6" height="6" fill="#111827" />
                      <rect x="42" y="72" width="6" height="6" fill="#111827" />
                      <rect x="52" y="82" width="6" height="6" fill="#111827" />
                      <rect x="65" y="65" width="25" height="25" fill="#111827" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="bg-blue-600 text-white font-black text-[9px] px-2 py-0.5 rounded shadow">
                        DANA
                      </span>
                    </div>
                  </div>
                  <div className="mt-2 text-xs font-bold text-slate-800">
                    NMK: {settings.danaTargetName || 'PANITIA S-IMPEL DIGITAL'}
                  </div>
                  <div className="text-[11px] font-mono text-blue-700 font-extrabold">
                    Nomor DANA: {settings.danaTargetNumber || '081314420312'}
                  </div>
                </div>

                <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-700 text-left text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Total Transfer:</span>
                    <span className="font-mono font-bold text-amber-400 text-sm">
                      {formatRupiah(totalPrice)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    Buka aplikasi DANA Anda &gt; Pilih menu <strong>Scan QR</strong> atau transfer ke nomor DANA{' '}
                    <strong className="text-white">{settings.danaTargetNumber || '081314420312'}</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPurchaseStep(1)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmQrisScanned}
                    className="flex-2 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <span>Sudah Scan & Transfer</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: UPLOAD PROOF & SUBMIT */}
            {purchaseStep === 3 && (
              <form onSubmit={handleSubmitPurchase} className="space-y-4">
                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-700 text-xs space-y-2">
                  <div className="flex justify-between text-slate-300">
                    <span>Jumlah Vote Dipesan:</span>
                    <strong className="text-white">{buyAmount} Suara</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Total Tagihan:</span>
                    <strong className="text-amber-400 font-mono">{formatRupiah(totalPrice)}</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Rekening DANA Tujuan:</span>
                    <strong className="text-white font-mono">{settings.danaTargetNumber || '081314420312'}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Pengirim Dana (Sesuai Akun DANA Anda): <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    className="w-full px-3 py-2 bg-slate-900 text-white font-medium text-xs sm:text-sm rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                    <span>
                      Unggah Foto Bukti Transfer (Screenshot / Struk DANA): <span className="text-red-400">*</span>
                    </span>
                    {isProcessingProof ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold flex items-center gap-1">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Mengompresi...
                      </span>
                    ) : proofImage ? (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        ✓ Bukti Terunggah (Tombol Aktif)
                      </span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 font-bold animate-pulse">
                        Wajib Diunggah
                      </span>
                    )}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProofFileUpload}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-slate-950 hover:file:bg-amber-400 cursor-pointer"
                  />
                  {isProcessingProof && (
                    <div className="mt-2 p-2 rounded-xl bg-slate-950 border border-blue-500/40 text-blue-300 text-[11px] flex items-center gap-2">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-400 shrink-0" />
                      <span>Sedang mengoptimasi &amp; mengompresi gambar bukti transfer agar instan terkirim...</span>
                    </div>
                  )}
                  {proofImage && !isProcessingProof ? (
                    <div className="mt-2.5 p-2 rounded-xl bg-slate-950 border border-emerald-500/40 space-y-2">
                      <div className="relative rounded-lg overflow-hidden max-h-48 flex items-center justify-center bg-black">
                        <img src={proofImage} alt="Bukti Transfer" className="max-h-48 object-contain" />
                        <span className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">
                          Bukti Siap Dikirim
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] pt-1">
                        <span className="text-emerald-300 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> File bukti valid, tombol kirim telah aktif!
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setProofImage('');
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="text-red-400 hover:text-red-300 underline font-medium cursor-pointer"
                        >
                          Ganti / Hapus Foto
                        </button>
                      </div>
                    </div>
                  ) : !isProcessingProof && (
                    <div className="mt-2 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Penting: Tombol <strong>"Kirim Bukti ke Admin"</strong> di bawah terkunci (DISABLED) sampai Anda memilih dan mengunggah foto bukti transfer DANA.
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nomor Referensi Transaksi DANA:
                  </label>
                  <input
                    type="text"
                    value={proofRefCode}
                    onChange={e => setProofRefCode(e.target.value)}
                    placeholder="Contoh: DANA-12345678"
                    className="w-full px-3 py-2 bg-slate-900 text-white font-mono text-xs rounded-xl border border-slate-700 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPurchaseStep(2)}
                    className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold cursor-pointer transition-colors"
                  >
                    Kembali
                  </button>
                  <button
                    type="submit"
                    disabled={!proofImage || isProcessingProof || submittingTx}
                    className={`flex-2 py-2.5 rounded-xl font-black text-xs shadow-lg flex items-center justify-center gap-1.5 transition-all ${
                      !proofImage || isProcessingProof || submittingTx
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700 opacity-60'
                        : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 cursor-pointer shadow-amber-500/20 active:scale-[0.98]'
                    }`}
                    title={!proofImage ? 'Unggah bukti transfer untuk mengaktifkan tombol' : 'Kirim bukti pembayaran ke Admin'}
                  >
                    {submittingTx ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengirim Data ke Admin...</span>
                      </>
                    ) : isProcessingProof ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Memproses Foto...</span>
                      </>
                    ) : !proofImage ? (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Unggah Bukti Dahulu (Terkunci)</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Bukti ke Admin</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 4: DEDICATED SUCCESS CONFIRMATION & DIRECT WHATSAPP GATEWAY */}
            {purchaseStep === 4 && submittedTxSuccess && (
              <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/90 border-2 border-emerald-500 text-white space-y-4 shadow-2xl animate-fade-in">
                <div className="flex items-center justify-between border-b border-emerald-800/80 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/30">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm sm:text-base text-emerald-300">
                        Bukti Pembayaran Berhasil Dikirim!
                      </h4>
                      <p className="text-[11px] text-slate-300">
                        Data transaksi otomatis tersimpan di database Admin secara real-time.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold uppercase tracking-wider animate-pulse">
                    PENDING VERIFIKASI
                  </span>
                </div>

                <div className="bg-slate-900/90 p-3.5 rounded-xl border border-emerald-500/30 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-slate-300">
                    <span>No. Referensi Transaksi:</span>
                    <strong className="font-mono text-amber-300 font-bold">{submittedTxSuccess.tx.referenceCode}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Pesanan Kuota:</span>
                    <strong className="text-white">{submittedTxSuccess.tx.amountVotes} Suara</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300">
                    <span>Total Nominal Tagihan:</span>
                    <strong className="text-emerald-400 font-mono text-sm">{formatRupiah(submittedTxSuccess.tx.totalPriceIdr)}</strong>
                  </div>
                  <div className="flex justify-between items-center text-slate-300 border-t border-slate-800 pt-2">
                    <span>Gateway Rekening DANA:</span>
                    <strong className="text-white font-mono">{submittedTxSuccess.tx.danaAccountNumber}</strong>
                  </div>
                </div>

                {submittedTxSuccess.tx.transferProofUrl && (
                  <div className="p-2.5 rounded-xl bg-black/60 border border-slate-800 flex items-center gap-3">
                    <img
                      src={submittedTxSuccess.tx.transferProofUrl}
                      alt="Bukti Transfer"
                      className="w-14 h-14 object-cover rounded-lg border border-emerald-500/50 shrink-0"
                    />
                    <div className="text-xs">
                      <span className="font-semibold text-emerald-300 block">Struk Transfer Telah Terlampir</span>
                      <span className="text-[11px] text-slate-400">
                        Foto bukti Anda tersimpan dan langsung siap diperiksa oleh Admin di modul verifikasi.
                      </span>
                    </div>
                  </div>
                )}

                <div className="space-y-2 pt-1">
                  <a
                    href={submittedTxSuccess.waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>Kirim Konfirmasi ke WhatsApp Admin ({settings.danaTargetNumber || '081314420312'})</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (submittedTxSuccess.waMessageText) {
                          navigator.clipboard.writeText(submittedTxSuccess.waMessageText);
                          setHasCopiedWaMessage(true);
                          setTimeout(() => setHasCopiedWaMessage(false), 3000);
                        }
                      }}
                      className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700 cursor-pointer transition-colors"
                    >
                      {hasCopiedWaMessage ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-300">Format Chat Disalin!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Salin Format Chat WA</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPurchaseStep(1);
                        setProofImage('');
                        setProofRefCode('');
                        setSubmittedTxSuccess(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs cursor-pointer transition-colors"
                    >
                      Beli Kuota Lagi
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 text-center italic">
                  *Saldo suara Anda otomatis bertambah real-time segera setelah Admin memverifikasi bukti ini.
                </p>
              </div>
            )}
          </div>

          {/* Transaction History */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-2xl p-5 shadow-xl">
            <h4 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              Riwayat Pembelian & Verifikasi Admin
            </h4>
            {transactions.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada transaksi pembelian vote.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {transactions.map(t => (
                  <div
                    key={t.id}
                    className="p-2.5 rounded-lg bg-slate-900 border border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{t.amountVotes} Vote</span>
                        <span className="font-mono text-amber-400">({formatRupiah(t.totalPriceIdr)})</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Ref: {t.referenceCode}
                      </span>
                    </div>
                    <div>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          t.status === 'APPROVED'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                            : t.status === 'REJECTED'
                            ? 'bg-red-950 text-red-300 border border-red-500/40'
                            : 'bg-amber-950 text-amber-300 border border-amber-500/40'
                        }`}
                      >
                        {t.status === 'APPROVED'
                          ? 'Disetujui (+Saldo Masuk)'
                          : t.status === 'REJECTED'
                          ? 'Ditolak'
                          : 'Menunggu Verifikasi'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
