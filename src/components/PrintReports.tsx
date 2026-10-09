import React, { useState } from 'react';
import {
  Printer,
  FileSpreadsheet,
  Award,
  CheckSquare,
  Users,
  Eye,
  FileText
} from 'lucide-react';
import {
  AppSettings,
  CompetitionCategory,
  Participant,
  JuryScoreSubmission
} from '../types';
import { calculateRankings } from '../utils/storage';
import { exportDataToExcel } from '../utils/excel';

interface PrintReportsProps {
  settings: AppSettings;
  categories: CompetitionCategory[];
  participants: Participant[];
  submissions: JuryScoreSubmission[];
}

export type ReportType =
  | 'REKAP_PER_LOMBA'
  | 'REKAP_KESELURUHAN'
  | 'BLANGKO_PER_PESERTA_PER_LOMBA'
  | 'BLANGKO_PER_PESERTA_SEMUA_LOMBA'
  | 'BLANGKO_SEMUA_PESERTA_PER_LOMBA'
  | 'BLANGKO_SEMUA_PESERTA_SEMUA_LOMBA';

export const PrintReports: React.FC<PrintReportsProps> = ({
  settings,
  categories,
  participants,
  submissions
}) => {
  const [selectedReportType, setSelectedReportType] = useState<ReportType>('REKAP_PER_LOMBA');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>(participants[0]?.id || '');
  const [includeFilledScores, setIncludeFilledScores] = useState<boolean>(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const selectedCategory = categories.find(c => c.id === selectedCategoryId) || categories[0];
  const selectedParticipant = participants.find(p => p.id === selectedParticipantId) || participants[0];

  const handleTriggerPrint = () => {
    setIsPreviewOpen(true);
    const printableEl = document.getElementById('printable-document');
    if (!printableEl) {
      window.print();
      return;
    }

    try {
      const existingFrame = document.getElementById('hidden-print-iframe');
      if (existingFrame) existingFrame.remove();

      const iframe = document.createElement('iframe');
      iframe.id = 'hidden-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(`
          <!DOCTYPE html>
          <html lang="id">
          <head>
            <meta charset="UTF-8">
            <title>S-IMPEL DIGITAL - Cetak Dokumen A4</title>
            <style>
              @page {
                size: A4 portrait;
                margin: 12mm 10mm;
              }
              body {
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #0f172a;
                background: #ffffff;
                padding: 10px;
                margin: 0;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              table {
                border-collapse: collapse;
                width: 100%;
              }
              th, td {
                border: 1px solid #1e293b;
                padding: 6px 8px;
              }
              .page-break-after {
                page-break-after: always;
              }
            </style>
            <script src="https://cdn.tailwindcss.com"></script>
          </head>
          <body>
            ${printableEl.innerHTML}
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.focus();
                  window.print();
                }, 250);
              };
            </script>
          </body>
          </html>
        `);
        doc.close();
        return;
      }
    } catch {
      // Fallback
    }

    setTimeout(() => {
      window.print();
    }, 400);
  };

  const handleDownloadPdfStandard = () => {
    setIsPreviewOpen(true);
    const printableEl = document.getElementById('printable-document');
    if (!printableEl) return;

    const htmlDoc = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Dokumen_Resmi_A4_${selectedReportType}_${Date.now()}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm 10mm; }
    body { font-family: 'Plus Jakarta Sans', Arial, sans-serif; color: #0f172a; background: #ffffff; margin: 0; padding: 24px; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
    th, td { border: 1px solid #334155; padding: 6px 8px; }
    th { background-color: #f1f5f9; font-weight: bold; }
    .page-break-after { page-break-after: always; }
  </style>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  ${printableEl.innerHTML}
  <script>
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => window.print(), 600);
    });
  </script>
</body>
</html>`;

    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dokumen_Resmi_A4_${selectedReportType}_${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportExcel = () => {
    if (selectedReportType === 'REKAP_PER_LOMBA') {
      const rankings = calculateRankings(selectedCategoryId, true);
      const rows = rankings.map(r => ({
        'Peringkat': r.rank,
        'Gelar Juara': r.awardTitle || '-',
        'No Registrasi': r.registrationNumber,
        'Nama Peserta': r.participantName,
        'Asal Instansi': r.institution,
        'Rata-rata Nilai': r.averageScore,
        'Waktu Pengerjaan (Detik)': r.averageTimeSeconds,
        'Waktu Format': `${Math.floor(r.averageTimeSeconds / 60)}m ${r.averageTimeSeconds % 60}s`,
        'Jumlah Juri Menilai': r.juriesCount
      }));
      exportDataToExcel(`Rekap_${selectedCategory?.name || 'Lomba'}_SIMPEL_DIGITAL`, [
        { name: 'Hasil Perangkingan', data: rows }
      ]);
    } else {
      // Export all categories
      const sheets = categories.map(cat => {
        const rankings = calculateRankings(cat.id, true);
        return {
          name: cat.name.slice(0, 30),
          data: rankings.map(r => ({
            'Peringkat': r.rank,
            'Gelar Juara': r.awardTitle || '-',
            'No Registrasi': r.registrationNumber,
            'Nama Peserta': r.participantName,
            'Asal Instansi': r.institution,
            'Rata-rata Nilai': r.averageScore,
            'Waktu Pengerjaan (Detik)': r.averageTimeSeconds
          }))
        };
      });
      exportDataToExcel('Rekapitulasi_Seluruh_Lomba_SIMPEL_DIGITAL', sheets);
    }
  };

  const nowPrintString = new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'full',
    timeStyle: 'medium',
    timeZone: 'Asia/Jakarta'
  }).format(new Date());

  return (
    <div className="space-y-6">
      {/* Selector and Action Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-2xl p-5 sm:p-6 shadow-xl no-print">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-700">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Printer className="w-6 h-6 text-amber-400" />
              Pusat Cetak Dokumen & Ekspor Laporan Resmi (A4 Standar)
            </h3>
            <p className="text-sm text-slate-300 mt-1">
              Format cetak otomatis terstandarisasi A4 portrait/landscape simetris, terintegrasi langsung dengan printer fisik atau simpan PDF peramban (browser).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-1.5 shadow cursor-pointer transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Ekspor Excel</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadPdfStandard}
              className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
            >
              <FileText className="w-4 h-4" />
              <span>Download Ekspor PDF Standar</span>
            </button>
            <button
              type="button"
              onClick={handleTriggerPrint}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-lg shadow-amber-500/20 cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Langsung (A4)</span>
            </button>
          </div>
        </div>

        {/* Report Type Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {[
            {
              id: 'REKAP_PER_LOMBA' as ReportType,
              title: '1. Rekapan Nilai Per Mata Lomba',
              desc: 'Hasil akhir perangkingan lengkap & berita acara juara per kategori.',
              icon: Award,
              color: 'border-amber-500/50 text-amber-300'
            },
            {
              id: 'REKAP_KESELURUHAN' as ReportType,
              title: '2. Rekapan Nilai Semua Mata Lomba',
              desc: 'Rekapitulasi total seluruh cabang lomba dalam satu dokumen resmi.',
              icon: FileText,
              color: 'border-blue-500/50 text-blue-300'
            },
            {
              id: 'BLANGKO_PER_PESERTA_PER_LOMBA' as ReportType,
              title: '3. Blangko: Per Peserta Per Lomba',
              desc: 'Formulir penilaian spesifik satu peserta di satu mata lomba terpilih.',
              icon: CheckSquare,
              color: 'border-emerald-500/50 text-emerald-300'
            },
            {
              id: 'BLANGKO_PER_PESERTA_SEMUA_LOMBA' as ReportType,
              title: '4. Blangko: Per Peserta Semua Lomba',
              desc: 'Kumpulan formulir penilaian satu peserta di semua mata lomba.',
              icon: Users,
              color: 'border-purple-500/50 text-purple-300'
            },
            {
              id: 'BLANGKO_SEMUA_PESERTA_PER_LOMBA' as ReportType,
              title: '5. Blangko: Semua Peserta Per Lomba',
              desc: 'Seluruh lembar penilaian untuk semua peserta pada mata lomba ini.',
              icon: CheckSquare,
              color: 'border-red-500/50 text-red-300'
            },
            {
              id: 'BLANGKO_SEMUA_PESERTA_SEMUA_LOMBA' as ReportType,
              title: '6. Blangko: Semua Peserta Semua Lomba',
              desc: 'Kompilasi master seluruh blangko lomba dan peserta secara lengkap.',
              icon: FileSpreadsheet,
              color: 'border-cyan-500/50 text-cyan-300'
            }
          ].map(opt => {
            const Icon = opt.icon;
            const isSelected = selectedReportType === opt.id;
            return (
              <div
                key={opt.id}
                onClick={() => setSelectedReportType(opt.id)}
                className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-400'
                    : 'bg-slate-900/60 border-slate-700/80 hover:border-slate-500'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <Icon className={`w-5 h-5 ${opt.color}`} />
                  <span className="font-bold text-sm text-white">{opt.title}</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{opt.desc}</p>
              </div>
            );
          })}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-700">
          {(selectedReportType.includes('PER_LOMBA') || selectedReportType === 'REKAP_PER_LOMBA') && (
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-slate-300 mb-1">Pilih Cabang Mata Lomba:</label>
              <select
                value={selectedCategoryId}
                onChange={e => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 text-sm focus:outline-none focus:border-amber-400"
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedReportType.includes('PER_PESERTA') && (
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-slate-300 mb-1">Pilih Peserta:</label>
              <select
                value={selectedParticipantId}
                onChange={e => setSelectedParticipantId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 text-white rounded-lg border border-slate-600 text-sm focus:outline-none focus:border-amber-400"
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>
                    [{p.registrationNumber}] {p.name} - {p.institution}
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedReportType.startsWith('BLANGKO') && (
            <div className="flex items-center gap-2 pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={includeFilledScores}
                  onChange={e => setIncludeFilledScores(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 accent-amber-500 cursor-pointer"
                />
                <span>Cetak dengan Nilai yang Sudah Terisi (Jika ada)</span>
              </label>
            </div>
          )}

          <div className="flex items-end pt-5 ml-auto">
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="px-4 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-xs sm:text-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4 text-cyan-400" />
              Lihat Pratinjau Layar
            </button>
          </div>
        </div>
      </div>

      {/* RENDER TARGET PRINT DOCUMENT (Clean White Background for A4 Print & Preview) */}
      <div
        className={`bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-200 ${
          isPreviewOpen ? 'block' : 'hidden print:block'
        }`}
        id="printable-document"
      >
        {/* Render based on report type */}
        {selectedReportType === 'REKAP_PER_LOMBA' && selectedCategory && (
          <RenderRekapPerLomba
            category={selectedCategory}
            settings={settings}
            printDate={nowPrintString}
          />
        )}

        {selectedReportType === 'REKAP_KESELURUHAN' && (
          <RenderRekapKeseluruhan
            categories={categories}
            settings={settings}
            printDate={nowPrintString}
          />
        )}

        {selectedReportType === 'BLANGKO_PER_PESERTA_PER_LOMBA' && selectedCategory && selectedParticipant && (
          <RenderBlangkoSingle
            category={selectedCategory}
            participant={selectedParticipant}
            settings={settings}
            submissions={submissions}
            includeScores={includeFilledScores}
            printDate={nowPrintString}
          />
        )}

        {selectedReportType === 'BLANGKO_SEMUA_PESERTA_PER_LOMBA' && selectedCategory && (
          <div className="space-y-8">
            {participants
              .filter(p => p.categoryId === selectedCategory.id)
              .map((p, idx) => (
                <div key={p.id} className={idx > 0 ? 'page-break-after pt-8 border-t-2 border-slate-300' : ''}>
                  <RenderBlangkoSingle
                    category={selectedCategory}
                    participant={p}
                    settings={settings}
                    submissions={submissions}
                    includeScores={includeFilledScores}
                    printDate={nowPrintString}
                  />
                </div>
              ))}
          </div>
        )}

        {selectedReportType === 'BLANGKO_PER_PESERTA_SEMUA_LOMBA' && selectedParticipant && (
          <div className="space-y-8">
            {categories.map((c, idx) => (
              <div key={c.id} className={idx > 0 ? 'page-break-after pt-8 border-t-2 border-slate-300' : ''}>
                <RenderBlangkoSingle
                  category={c}
                  participant={selectedParticipant}
                  settings={settings}
                  submissions={submissions}
                  includeScores={includeFilledScores}
                  printDate={nowPrintString}
                />
              </div>
            ))}
          </div>
        )}

        {selectedReportType === 'BLANGKO_SEMUA_PESERTA_SEMUA_LOMBA' && (
          <div className="space-y-12">
            {categories.map(c => (
              <div key={c.id} className="space-y-8 page-break-after">
                <div className="bg-slate-100 p-3 rounded font-bold text-center text-lg uppercase border border-slate-300">
                  KUMPULAN BLANGKO: {c.name}
                </div>
                {participants
                  .filter(p => p.categoryId === c.id)
                  .map((p, pIdx) => (
                    <div key={p.id} className={pIdx > 0 ? 'page-break-after pt-6' : ''}>
                      <RenderBlangkoSingle
                        category={c}
                        participant={p}
                        settings={settings}
                        submissions={submissions}
                        includeScores={includeFilledScores}
                        printDate={nowPrintString}
                      />
                    </div>
                  ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Sub-component 1: Rekap Per Lomba
const RenderRekapPerLomba: React.FC<{
  category: CompetitionCategory;
  settings: AppSettings;
  printDate: string;
}> = ({ category, settings, printDate }) => {
  const rankings = calculateRankings(category.id, true);

  return (
    <div className="text-slate-900 font-sans">
      {/* KOP SURAT RESMI */}
      <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-wider text-slate-900">
          {settings.competitionTitle}
        </h2>
        <h3 className="text-base sm:text-lg font-bold text-amber-700">
          SISTEM INFORMASI PENILAIAN DIGITAL (S-IMPEL DIGITAL)
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          {settings.location} | Waktu Kegiatan: {settings.eventDateTime}
        </p>
      </div>

      <div className="text-center mb-6">
        <h4 className="text-lg font-extrabold uppercase underline underline-offset-4 tracking-wide text-slate-900">
          BERITA ACARA & REKAPITULASI HASIL PENILAIAN AKHIR
        </h4>
        <p className="text-sm font-semibold text-slate-700 mt-1">
          Cabang Mata Lomba: <span className="text-black font-black">{category.name}</span>
        </p>
      </div>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-xs sm:text-sm border-collapse border border-slate-800">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-bold border-b-2 border-slate-800">
              <th className="border border-slate-700 p-2 text-center w-12">Rank</th>
              <th className="border border-slate-700 p-2 text-center w-24">Gelar</th>
              <th className="border border-slate-700 p-2 text-center w-28">No. Reg</th>
              <th className="border border-slate-700 p-2 text-left">Nama Peserta / Tim</th>
              <th className="border border-slate-700 p-2 text-left">Asal Sekolah / Kontingen</th>
              <th className="border border-slate-700 p-2 text-center w-24">Waktu Selesai</th>
              <th className="border border-slate-700 p-2 text-center w-28">Rata-Rata Nilai</th>
              <th className="border border-slate-700 p-2 text-center w-16">Juri</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map(item => (
              <tr
                key={item.participantId}
                className={
                  item.rank <= 3
                    ? 'bg-amber-50/70 font-semibold'
                    : item.rank <= 6
                    ? 'bg-emerald-50/40'
                    : ''
                }
              >
                <td className="border border-slate-600 p-2 text-center font-bold">{item.rank}</td>
                <td className="border border-slate-600 p-2 text-center font-bold text-amber-800">
                  {item.awardTitle}
                </td>
                <td className="border border-slate-600 p-2 text-center font-mono">{item.registrationNumber}</td>
                <td className="border border-slate-600 p-2 font-medium">{item.participantName}</td>
                <td className="border border-slate-600 p-2 text-slate-700">{item.institution}</td>
                <td className="border border-slate-600 p-2 text-center font-mono">
                  {item.averageTimeSeconds > 0
                    ? `${Math.floor(item.averageTimeSeconds / 60)}m ${item.averageTimeSeconds % 60}s`
                    : '-'}
                </td>
                <td className="border border-slate-600 p-2 text-center font-black text-blue-900 text-base">
                  {item.averageScore.toFixed(2)}
                </td>
                <td className="border border-slate-600 p-2 text-center text-xs text-slate-600">
                  {item.juriesCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-600 italic mb-6">
        *Catatan Tie-Breaker: Apabila terdapat nilai rata-rata yang sama persis antar peserta, urutan kejuaraan resmi ditentukan berdasarkan pencatatan waktu penyelesaian tugas tercepat.
      </div>

      {/* SIGNATURE SECTION */}
      <div className="grid grid-cols-3 gap-6 text-center text-xs sm:text-sm mt-8 pt-4">
        <div>
          <p className="font-semibold text-slate-700">Koordinator Dewan Juri</p>
          <div className="h-16 flex items-center justify-center">
            <span className="text-slate-400 italic text-[11px]">[Tanda Tangan Terlampir]</span>
          </div>
          <p className="font-bold border-t border-slate-800 pt-1 text-slate-900">Dr. Ir. Ahmad Syahrul, M.Kom</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">Sekretaris Pertandingan</p>
          <div className="h-16 flex items-center justify-center">
            <span className="text-slate-400 italic text-[11px]">[Tanda Tangan Terlampir]</span>
          </div>
          <p className="font-bold border-t border-slate-800 pt-1 text-slate-900">Siti Nurhaliza, M.Ds</p>
        </div>

        <div>
          <p className="font-semibold text-slate-700">Ketua Panitia Pelaksana</p>
          <div className="h-16 flex items-center justify-center">
            <span className="text-slate-400 italic text-[11px]">[Stempel & Tanda Tangan]</span>
          </div>
          <p className="font-bold border-t border-slate-800 pt-1 text-slate-900">Muhamad Hidayatullah</p>
        </div>
      </div>

      {/* FOOTER PRINT METADATA */}
      <div className="border-t border-slate-300 mt-8 pt-3 flex items-center justify-between text-[10px] text-slate-500">
        <span>S-IMPEL DIGITAL | Sistem Penilaian Digital & Voting Berbayar</span>
        <span>Dicetak pada: {printDate} oleh Sistem Terpadu</span>
      </div>
    </div>
  );
};

// Sub-component 2: Rekapitulasi Keseluruhan
const RenderRekapKeseluruhan: React.FC<{
  categories: CompetitionCategory[];
  settings: AppSettings;
  printDate: string;
}> = ({ categories, settings, printDate }) => {
  return (
    <div className="text-slate-900 font-sans">
      <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-black uppercase text-slate-900">{settings.competitionTitle}</h2>
        <h3 className="text-base sm:text-lg font-bold text-amber-700">
          REKAPITULASI RESMI JUARA UMUM SELURUH CABANG MATA LOMBA
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          {settings.location} | Waktu Kegiatan: {settings.eventDateTime}
        </p>
      </div>

      {categories.map((cat, index) => {
        const rankings = calculateRankings(cat.id, true);
        const top3 = rankings.slice(0, 3);
        const harapan = rankings.slice(3, 6);

        return (
          <div key={cat.id} className="mb-6 p-4 border border-slate-400 rounded-lg bg-slate-50">
            <h4 className="font-bold text-base text-slate-900 mb-2 border-b border-slate-300 pb-1">
              {index + 1}. Cabang: {cat.name}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div className="bg-white p-3 rounded border border-amber-300">
                <span className="font-bold text-amber-800 uppercase block mb-1">Daftar Pemenang Utama:</span>
                {top3.length === 0 && <p className="text-slate-400 italic">Belum ada nilai terverifikasi</p>}
                {top3.map(w => (
                  <div key={w.participantId} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">
                      {w.awardTitle}: {w.participantName} ({w.institution})
                    </span>
                    <span className="font-bold text-blue-900">{w.averageScore.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="bg-white p-3 rounded border border-slate-300">
                <span className="font-bold text-slate-700 uppercase block mb-1">Daftar Juara Harapan:</span>
                {harapan.length === 0 && <p className="text-slate-400 italic">Tidak ada penerima harapan</p>}
                {harapan.map(w => (
                  <div key={w.participantId} className="flex justify-between py-1 border-b border-slate-100">
                    <span className="font-semibold text-slate-800">
                      {w.awardTitle}: {w.participantName} ({w.institution})
                    </span>
                    <span className="font-bold text-slate-700">{w.averageScore.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}

      <div className="border-t border-slate-300 mt-8 pt-3 flex items-center justify-between text-[10px] text-slate-500">
        <span>S-IMPEL DIGITAL | Rekapitulasi Keseluruhan</span>
        <span>Dicetak pada: {printDate}</span>
      </div>
    </div>
  );
};

// Sub-component 3: Blangko Penilaian Ceklis Dinamis (Auto-wrap & Page-break friendly)
const RenderBlangkoSingle: React.FC<{
  category: CompetitionCategory;
  participant: Participant;
  settings: AppSettings;
  submissions: JuryScoreSubmission[];
  includeScores: boolean;
  printDate: string;
}> = ({ category, participant, settings, submissions, includeScores, printDate }) => {
  // Find submission for this participant in this category if exists
  const existingSub = submissions.find(
    s => s.participantId === participant.id && s.categoryId === category.id
  );

  return (
    <div className="text-slate-900 font-sans leading-relaxed">
      {/* HEADER KOP */}
      <div className="text-center border-b-2 border-slate-800 pb-3 mb-4">
        <h3 className="text-lg font-black uppercase text-slate-900">{settings.competitionTitle}</h3>
        <h4 className="text-sm font-bold text-amber-800">
          LEMBAR BLANGKO FORMAT PENILAIAN JURI (CEKLIS & SKORING RESMI)
        </h4>
        <p className="text-[11px] text-slate-600">Sistem Penilaian Terpadu S-IMPEL DIGITAL</p>
      </div>

      {/* METADATA PESERTA & LOMBA */}
      <div className="grid grid-cols-2 gap-3 text-xs sm:text-sm bg-slate-100 p-3 rounded border border-slate-300 mb-4">
        <div>
          <p>
            <span className="text-slate-500">Mata Lomba:</span> <strong className="text-black">{category.name}</strong>
          </p>
          <p>
            <span className="text-slate-500">Jadwal / Lokasi:</span>{' '}
            <strong>
              {category.scheduleTime} | {category.location}
            </strong>
          </p>
          <p>
            <span className="text-slate-500">Batas Waktu Lomba:</span>{' '}
            <strong>{category.maxDurationMinutes || 180} Menit</strong>
          </p>
        </div>
        <div>
          <p>
            <span className="text-slate-500">Nomor Registrasi:</span>{' '}
            <strong className="font-mono text-blue-900 text-sm">{participant.registrationNumber}</strong>
          </p>
          <p>
            <span className="text-slate-500">Nama Peserta / Tim:</span> <strong className="text-black">{participant.name}</strong>
          </p>
          <p>
            <span className="text-slate-500">Asal Kontingen:</span> <strong>{participant.institution}</strong>
          </p>
        </div>
      </div>

      {/* TABEL BLANGKO DENGAN CHECKBOX OTOMATIS SESUAI NILAI MAKSIMAL */}
      <div className="overflow-x-auto mb-4">
        <table className="w-full text-xs border-collapse border border-slate-800">
          <thead>
            <tr className="bg-slate-200 text-slate-900 font-bold border-b border-slate-800">
              <th className="border border-slate-600 p-2 text-center w-8">No</th>
              <th className="border border-slate-600 p-2 text-left w-52">Kriteria Penilaian</th>
              <th className="border border-slate-600 p-2 text-center w-20">Tipe / Maks</th>
              <th className="border border-slate-600 p-2 text-left">
                Kolom Penilaian (Ceklis / Rentang Nilai) Sesuai Nilai Maksimal
              </th>
              <th className="border border-slate-600 p-2 text-center w-20">Skor Diperoleh</th>
            </tr>
          </thead>
          <tbody>
            {category.criteria.map((crit, idx) => {
              const max = crit.maxScore || 10;
              const givenScore = includeScores && existingSub ? existingSub.criteriaScores[crit.id] : undefined;

              return (
                <tr key={crit.id} className="border-b border-slate-400">
                  <td className="border border-slate-600 p-2 text-center font-bold">{idx + 1}</td>
                  <td className="border border-slate-600 p-2">
                    <p className="font-bold text-slate-900">{crit.name}</p>
                    {crit.description && <p className="text-[10px] text-slate-600 mt-0.5">{crit.description}</p>}
                  </td>
                  <td className="border border-slate-600 p-2 text-center font-semibold">
                    <span className="px-1.5 py-0.5 rounded bg-slate-200 text-[10px] block mb-1">
                      {crit.type === 'CHECKBOX' ? 'Ceklis' : 'Angka'}
                    </span>
                    <span className="text-slate-700">Maks: {max}</span>
                  </td>
                  <td className="border border-slate-600 p-2">
                    {crit.type === 'CHECKBOX' ? (
                      <div>
                        <div className="text-[10px] text-slate-600 mb-1">
                          Berikan tanda centang (✓) pada kotak di bawah (Total {max} opsi):
                        </div>
                        {/* Auto-wrapping flex row of checkboxes based on max score */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {Array.from({ length: max }).map((_, cIdx) => {
                            const val = cIdx + 1;
                            const isChecked = givenScore !== undefined && givenScore >= val;
                            return (
                              <div
                                key={val}
                                className={`w-6 h-6 border flex items-center justify-center rounded text-[10px] font-mono ${
                                  isChecked
                                    ? 'bg-slate-900 text-white font-bold border-slate-900'
                                    : 'border-slate-500 bg-white text-slate-600'
                                }`}
                              >
                                {isChecked ? '✓' : val}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] text-slate-600">Rentang nilai: 0 s/d {max}</span>
                        <div className="w-24 h-7 border border-slate-400 rounded bg-white flex items-center justify-center font-bold font-mono text-sm">
                          {givenScore !== undefined ? givenScore : ''}
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="border border-slate-600 p-2 text-center font-bold font-mono text-sm text-blue-900">
                    {givenScore !== undefined ? givenScore : '-'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* PELANGGARAN & WAKTU */}
      <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded border border-slate-300 mb-4">
        <div>
          <span className="font-bold text-slate-800">Catatan Pelanggaran & Pengurangan Nilai:</span>
          <div className="h-10 mt-1 border border-dashed border-slate-400 rounded bg-white p-1 text-[11px] text-slate-600">
            {includeScores && existingSub?.penalties?.length
              ? existingSub.penalties.map(p => `${p.reason} (-${p.pointsDeducted})`).join(', ')
              : 'Tidak ada catatan pelanggaran.'}
          </div>
        </div>
        <div>
          <span className="font-bold text-slate-800">Catatan Waktu Pengerjaan Lomba (Tie-Breaker):</span>
          <div className="h-10 mt-1 border border-slate-400 rounded bg-white p-1 flex items-center justify-center font-mono font-bold text-sm text-emerald-800">
            {includeScores && existingSub?.timeCompletionSeconds
              ? `${Math.floor(existingSub.timeCompletionSeconds / 60)} Menit ${existingSub.timeCompletionSeconds % 60} Detik`
              : '____ Menit ____ Detik'}
          </div>
        </div>
      </div>

      {/* TOTAL AKHIR & TANDA TANGAN */}
      <div className="flex justify-between items-end border-t border-slate-400 pt-3 text-xs">
        <div>
          <p className="font-semibold text-slate-700">Tanda Tangan & Nama Terang Juri:</p>
          <div className="h-14 flex items-center">
            {includeScores && existingSub?.signatureDataUrl ? (
              <img
                src={existingSub.signatureDataUrl}
                alt="Signature"
                className="max-h-12 border-b border-slate-800"
              />
            ) : (
              <span className="text-slate-400 italic text-[11px]">[Tanda Tangan Juri Penguji]</span>
            )}
          </div>
          <p className="font-bold text-slate-900 border-t border-slate-800 pt-1">
            {includeScores && existingSub?.juryName ? existingSub.juryName : '( .................................................... )'}
          </p>
        </div>

        <div className="text-right">
          <span className="text-slate-600 text-xs block mb-1">TOTAL NILAI AKHIR</span>
          <div className="text-2xl font-black font-mono text-slate-950 border-2 border-slate-900 px-4 py-1.5 rounded inline-block bg-slate-100">
            {includeScores && existingSub ? existingSub.totalScore : '__________'}
          </div>
        </div>
      </div>

      <div className="border-t border-slate-300 mt-6 pt-2 flex items-center justify-between text-[10px] text-slate-500">
        <span>S-IMPEL DIGITAL | Blangko Penilaian Ceklis Otomatis</span>
        <span>Dicetak pada: {printDate}</span>
      </div>
    </div>
  );
};
