import React, { useState } from 'react';
import { X, ZoomIn, ZoomOut, Check, Ban, ExternalLink, QrCode, User, Phone, Hash } from 'lucide-react';
import { VoteTransaction } from '../types';

interface ProofModalProps {
  isOpen: boolean;
  transaction: VoteTransaction | null;
  onClose: () => void;
  onApprove?: (tx: VoteTransaction) => void;
  onReject?: (txId: string) => void;
}

export const ProofModal: React.FC<ProofModalProps> = ({
  isOpen,
  transaction,
  onClose,
  onApprove,
  onReject
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  if (!isOpen || !transaction) return null;

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl text-white max-h-[92vh] flex flex-col relative overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div>
            <h3 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
              <QrCode className="w-5 h-5 text-amber-400" />
              Bukti Transfer & Verifikasi Pembayaran DANA
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ref: <span className="font-mono text-amber-400">{transaction.referenceCode}</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-850 p-3 rounded-2xl border border-slate-800 text-xs mb-4 bg-slate-800/60">
          <div>
            <span className="text-[11px] text-slate-400 block">Akun Pemesan</span>
            <strong className="text-white truncate block">{transaction.userName}</strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Nama Pengirim DANA</span>
            <strong className="text-amber-300 truncate block">
              {transaction.senderName || transaction.userName}
            </strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Nomor HP Voter</span>
            <strong className="text-slate-200 font-mono block">{transaction.userPhone}</strong>
          </div>
          <div>
            <span className="text-[11px] text-slate-400 block">Total Nominal</span>
            <strong className="text-emerald-400 font-mono text-sm block">
              {formatRupiah(transaction.totalPriceIdr)}
            </strong>
          </div>
        </div>

        {/* Image Viewer with Zoom Controls */}
        <div className="relative flex-1 min-h-[220px] max-h-[380px] bg-slate-950 rounded-2xl overflow-auto border border-slate-800 flex items-center justify-center p-2">
          {transaction.transferProofUrl ? (
            <img
              src={transaction.transferProofUrl}
              alt="Bukti Transfer"
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-full max-w-full object-contain transition-transform duration-200"
            />
          ) : (
            <div className="text-slate-500 text-xs italic">
              Tidak ada lampiran gambar bukti transfer.
            </div>
          )}

          {/* Floating Zoom Controls */}
          {transaction.transferProofUrl && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 p-1 rounded-xl shadow-lg">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
                title="Perkecil"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-[11px] font-mono font-bold text-slate-300 px-1">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-300"
                title="Perbesar"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="text-[10px] px-1.5 py-0.5 rounded hover:bg-slate-800 text-slate-400"
              >
                Reset
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Status Saat Ini:</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                transaction.status === 'APPROVED'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : transaction.status === 'REJECTED'
                  ? 'bg-red-950 text-red-300 border border-red-500/40'
                  : 'bg-amber-950 text-amber-300 border border-amber-500/40'
              }`}
            >
              {transaction.status}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onReject && transaction.status !== 'REJECTED' && (
              <button
                type="button"
                onClick={() => {
                  onReject(transaction.id);
                  onClose();
                }}
                className="px-3.5 py-2 rounded-xl bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-red-300 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Ban className="w-3.5 h-3.5" />
                Batal / Tolak
              </button>
            )}

            {onApprove && transaction.status !== 'APPROVED' && (
              <button
                type="button"
                onClick={() => {
                  onApprove(transaction);
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                Terima (Approve + Saldo)
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
