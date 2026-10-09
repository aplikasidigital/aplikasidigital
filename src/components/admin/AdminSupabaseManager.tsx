import React, { useState, useEffect } from 'react';
import {
  Database,
  Radio,
  CheckCircle2,
  Copy,
  RefreshCw,
  Send,
  AlertCircle,
  ExternalLink,
  Code2,
  Sparkles,
  Zap
} from 'lucide-react';
import { SupabaseService, SupabaseSyncStatus, SUPABASE_URL } from '../../utils/supabase';
import { PublicEventInfo } from '../../types';

interface AdminSupabaseManagerProps {
  publicInfo: PublicEventInfo;
  onPublicInfoUpdate: (info: PublicEventInfo) => void;
  onShowNotification: (msg: string, isErr?: boolean) => void;
}

export const AdminSupabaseManager: React.FC<AdminSupabaseManagerProps> = ({
  publicInfo,
  onPublicInfoUpdate,
  onShowNotification
}) => {
  const [descriptionText, setDescriptionText] = useState<string>(
    publicInfo.eventDescription || ''
  );
  const [status, setStatus] = useState<SupabaseSyncStatus>(SupabaseService.getStatus());
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [showSqlModal, setShowSqlModal] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  useEffect(() => {
    // Sinkronisasi status Supabase
    const unsubStatus = SupabaseService.subscribeStatus(setStatus);
    return () => unsubStatus();
  }, []);

  useEffect(() => {
    if (publicInfo.eventDescription) {
      setDescriptionText(publicInfo.eventDescription);
    }
  }, [publicInfo.eventDescription]);

  const handleSaveToSupabase = async () => {
    if (!descriptionText.trim()) {
      onShowNotification('Teks deskripsi tidak boleh kosong!', true);
      return;
    }

    setIsSaving(true);
    try {
      // 1. Simpan ke Supabase & pancarkan real-time
      const result = await SupabaseService.saveEventDescription(descriptionText);

      // 2. Simpan juga ke state parent aplikasi lokal
      const updatedInfo: PublicEventInfo = {
        ...publicInfo,
        eventDescription: descriptionText.trim()
      };
      onPublicInfoUpdate(updatedInfo);

      if (result.success) {
        onShowNotification('✅ Teks berhasil disimpan ke Supabase & tersiar Real-Time ke seluruh pengguna!');
      } else {
        if (result.tableMissing) {
          onShowNotification(
            '⚠️ Teks tersimpan di lokal, namun tabel "app_content" di Supabase belum dibuat. Klik tombol "Lihat Skrip SQL" untuk mengaktifkan.',
            true
          );
        } else {
          onShowNotification(`Catatan Supabase: ${result.message}`, true);
        }
      }
    } catch (err: any) {
      onShowNotification(`Gagal menyimpan: ${err?.message || 'Error koneksi'}`, true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReloadFromSupabase = async () => {
    setIsFetching(true);
    try {
      const res = await SupabaseService.fetchEventDescription();
      if (res.text) {
        setDescriptionText(res.text);
        const updatedInfo: PublicEventInfo = {
          ...publicInfo,
          eventDescription: res.text
        };
        onPublicInfoUpdate(updatedInfo);
        onShowNotification(
          res.source === 'supabase'
            ? '✅ Berhasil memuat teks terbaru langsung dari database Supabase!'
            : 'ℹ️ Memuat teks default lokal (tabel Supabase belum tersedia).'
        );
      }
    } catch (err: any) {
      onShowNotification(`Gagal mengambil data dari Supabase: ${err?.message}`, true);
    } finally {
      setIsFetching(false);
    }
  };

  const handleCopySql = () => {
    const sql = SupabaseService.getSqlMigrationScript();
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSql(true);
      onShowNotification('Skrip SQL berhasil disalin ke clipboard!');
      setTimeout(() => setCopiedSql(false), 3000);
    });
  };

  const handleTestBroadcast = async () => {
    const testText = `${descriptionText.trim()} [Diperbarui Real-Time: ${new Date().toLocaleTimeString('id-ID')}]`;
    setDescriptionText(testText);
    await SupabaseService.saveEventDescription(testText);
    const updatedInfo: PublicEventInfo = {
      ...publicInfo,
      eventDescription: testText
    };
    onPublicInfoUpdate(updatedInfo);
    onShowNotification('⚡ Uji siaran Real-Time berhasil dikirim ke seluruh perangkat yang sedang membuka halaman!');
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 border border-emerald-500/30 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-5">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-750 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                Integrasi Database Supabase &amp; Konten Real-Time
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono text-[10px] uppercase font-bold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Sync
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Kelola teks deskripsi acara secara dinamis. Perubahan langsung tersinkronisasi ke sisi pengguna via <strong>Supabase Real-Time Subscription</strong> tanpa reload.
              </p>
            </div>
          </div>
        </div>

        {/* STATUS INDICATOR BADGE */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/80 border border-slate-700 text-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium font-mono text-[11px]">
              {SUPABASE_URL.replace('https://', '').split('.')[0]}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 font-bold text-[11px]">Online</span>
          </div>

          <button
            type="button"
            onClick={() => setShowSqlModal(true)}
            className="px-3 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/40 text-purple-300 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Code2 className="w-3.5 h-3.5" />
            Skrip SQL
          </button>
        </div>
      </div>

      {/* TEXT EDITOR FORM */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs">
          <label className="font-bold text-slate-200 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Teks Deskripsi Perlombaan (Dinamis dari Supabase):
          </label>
          <span className="text-slate-400 font-mono text-[11px]">
            {descriptionText.length} karakter
          </span>
        </div>

        <div className="relative">
          <textarea
            rows={4}
            value={descriptionText}
            onChange={(e) => setDescriptionText(e.target.value)}
            placeholder="Tuliskan teks deskripsi perlombaan resmi di sini..."
            className="w-full px-4 py-3 bg-slate-950/90 text-slate-100 text-xs sm:text-sm rounded-2xl border border-slate-700/80 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all leading-relaxed"
          />
        </div>

        {/* HELPER INFO BADGE */}
        <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            Teks ini tampil di <strong>Hero Banner</strong> dan <strong>Profil Kegiatan</strong> pada Landing Page. Saat Anda menekan tombol simpan, Supabase akan memancarkan event pembaruan secara <em>real-time</em> sehingga layar seluruh pengunjung akan langsung berubah secara otomatis.
          </p>
        </div>
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveToSupabase}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer transition-all disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Menyimpan &amp; Menyiarkan...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Simpan &amp; Siarkan Real-Time
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isFetching}
            onClick={handleReloadFromSupabase}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin' : ''}`} />
            Muat Ulang
          </button>
        </div>

        <button
          type="button"
          onClick={handleTestBroadcast}
          className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
          title="Uji kirim siaran langsung ke seluruh layar pengguna"
        >
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          Tes Siaran Real-Time
        </button>
      </div>

      {/* SQL MODAL / VIEWER */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-base text-white">
                  Skrip SQL Supabase (app_content)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSqlModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Jika tabel <code>app_content</code> belum dibuat di Supabase Anda, silakan salin skrip SQL di bawah ini dan jalankan sekali di menu <strong>SQL Editor</strong> pada Dashboard Supabase Anda:
            </p>

            <div className="relative">
              <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-x-auto max-h-60 leading-normal">
                {SupabaseService.getSqlMigrationScript()}
              </pre>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <a
                href="https://supabase.com/dashboard/project/qixphlsusrcquqncnbma/sql"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 underline underline-offset-4"
              >
                Buka SQL Editor Supabase <ExternalLink className="w-3 h-3" />
              </a>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSqlModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5"
                >
                  {copiedSql ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Salin Skrip SQL
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
