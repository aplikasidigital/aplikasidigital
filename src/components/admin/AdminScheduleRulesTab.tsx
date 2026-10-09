import React, { useState } from 'react';
import { EventRuleItem, EventScheduleItem, PublicEventInfo } from '../../types';
import {
  Calendar,
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  Clock,
  MapPin,
  X,
  Save,
  CheckCircle2
} from 'lucide-react';

interface AdminScheduleRulesTabProps {
  publicInfo: PublicEventInfo;
  onSavePublicInfo: (info: PublicEventInfo) => void;
  onShowNotification: (msg: string, isErr?: boolean) => void;
}

export const AdminScheduleRulesTab: React.FC<AdminScheduleRulesTabProps> = ({
  publicInfo,
  onSavePublicInfo,
  onShowNotification
}) => {
  // Normalize schedule & rules
  const [scheduleItems, setScheduleItems] = useState<EventScheduleItem[]>(() => {
    return publicInfo.scheduleOverview.map((item, idx) => ({
      id: item.id || `sched-${idx + 1}`,
      time: item.time,
      activity: item.activity,
      location: item.location
    }));
  });

  const [ruleItems, setRuleItems] = useState<EventRuleItem[]>(() => {
    return publicInfo.rulesOverview.map((rule, idx) => {
      if (typeof rule === 'string') {
        return { id: `rule-${idx + 1}`, rule };
      }
      return { id: rule.id || `rule-${idx + 1}`, rule: rule.rule };
    });
  });

  // Schedule Modal State
  const [isSchedModalOpen, setIsSchedModalOpen] = useState<boolean>(false);
  const [editingSchedId, setEditingSchedId] = useState<string | null>(null);
  const [schedTime, setSchedTime] = useState<string>('');
  const [schedActivity, setSchedActivity] = useState<string>('');
  const [schedLocation, setSchedLocation] = useState<string>('');

  // Rule Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState<boolean>(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleText, setRuleText] = useState<string>('');

  const syncToParent = (
    newSchedule: EventScheduleItem[],
    newRules: EventRuleItem[]
  ) => {
    const updatedInfo: PublicEventInfo = {
      ...publicInfo,
      scheduleOverview: newSchedule,
      rulesOverview: newRules
    };
    onSavePublicInfo(updatedInfo);
  };

  // Schedule Handlers
  const handleOpenNewSched = () => {
    setEditingSchedId(null);
    setSchedTime('');
    setSchedActivity('');
    setSchedLocation('');
    setIsSchedModalOpen(true);
  };

  const handleOpenEditSched = (item: EventScheduleItem) => {
    setEditingSchedId(item.id);
    setSchedTime(item.time);
    setSchedActivity(item.activity);
    setSchedLocation(item.location);
    setIsSchedModalOpen(true);
  };

  const handleSaveSched = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedTime.trim() || !schedActivity.trim()) {
      onShowNotification('Waktu dan nama aktivitas agenda wajib diisi.', true);
      return;
    }

    let updated: EventScheduleItem[] = [];
    if (editingSchedId) {
      updated = scheduleItems.map(item =>
        item.id === editingSchedId
          ? { ...item, time: schedTime.trim(), activity: schedActivity.trim(), location: schedLocation.trim() }
          : item
      );
    } else {
      const newItem: EventScheduleItem = {
        id: `sched-${Date.now()}`,
        time: schedTime.trim(),
        activity: schedActivity.trim(),
        location: schedLocation.trim()
      };
      updated = [...scheduleItems, newItem];
    }

    setScheduleItems(updated);
    syncToParent(updated, ruleItems);
    setIsSchedModalOpen(false);
    onShowNotification('Jadwal & agenda kegiatan berhasil diperbarui!');
  };

  const handleDeleteSched = (id: string) => {
    const updated = scheduleItems.filter(item => item.id !== id);
    setScheduleItems(updated);
    syncToParent(updated, ruleItems);
    onShowNotification('Item jadwal berhasil dihapus.');
  };

  // Rule Handlers
  const handleOpenNewRule = () => {
    setEditingRuleId(null);
    setRuleText('');
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (item: EventRuleItem) => {
    setEditingRuleId(item.id);
    setRuleText(item.rule);
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleText.trim()) {
      onShowNotification('Teks peraturan wajib diisi.', true);
      return;
    }

    let updated: EventRuleItem[] = [];
    if (editingRuleId) {
      updated = ruleItems.map(item =>
        item.id === editingRuleId ? { ...item, rule: ruleText.trim() } : item
      );
    } else {
      const newItem: EventRuleItem = {
        id: `rule-${Date.now()}`,
        rule: ruleText.trim()
      };
      updated = [...ruleItems, newItem];
    }

    setRuleItems(updated);
    syncToParent(scheduleItems, updated);
    setIsRuleModalOpen(false);
    onShowNotification('Peraturan & tata tertib berhasil diperbarui!');
  };

  const handleDeleteRule = (id: string) => {
    const updated = ruleItems.filter(item => item.id !== id);
    setRuleItems(updated);
    syncToParent(scheduleItems, updated);
    onShowNotification('Peraturan berhasil dihapus.');
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: CRUD SUSUNAN JADWAL & AGENDA */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-400" />
              Susunan Jadwal & Agenda Rangkaian Kegiatan ({scheduleItems.length})
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Tambah, edit, dan perbarui data agenda perlombaan yang langsung tampil di Landing Page.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewSched}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Agenda Baru
          </button>
        </div>

        <div className="space-y-3">
          {scheduleItems.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-blue-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-blue-500/20 text-blue-400 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  {idx + 1}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400">{item.time}</span>
                    <span className="text-slate-500">|</span>
                    <span className="text-xs text-slate-300 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-400" />
                      {item.location}
                    </span>
                  </div>
                  <h5 className="font-bold text-sm text-white mt-0.5">{item.activity}</h5>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => handleOpenEditSched(item)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Edit Agenda"
                >
                  <Edit2 className="w-3.5 h-3.5 text-blue-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteSched(item.id)}
                  className="p-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 cursor-pointer"
                  title="Hapus Agenda"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: CRUD PERATURAN & TATA TERTIB */}
      <div className="bg-slate-800/90 border border-slate-700 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-700 pb-4">
          <div>
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Peraturan, Tata Tertib & Ketentuan Penilaian ({ruleItems.length})
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Atur poin-poin peraturan resmi kegiatan yang langsung terbaca oleh seluruh peserta.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewRule}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Tambah Peraturan
          </button>
        </div>

        <div className="space-y-3">
          {ruleItems.map((item, idx) => (
            <div
              key={item.id}
              className="p-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-emerald-500/50 flex items-start justify-between gap-3 transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">{item.rule}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleOpenEditRule(item)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                  title="Edit Aturan"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteRule(item.id)}
                  className="p-1.5 rounded-lg bg-red-950/70 hover:bg-red-900 text-red-300 cursor-pointer"
                  title="Hapus Aturan"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL: EDIT / CREATE SCHEDULE */}
      {isSchedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingSchedId ? 'Edit Agenda Kegiatan' : 'Tambah Agenda Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSchedModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSched} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Waktu Pelaksanaan:</label>
                <input
                  type="text"
                  required
                  value={schedTime}
                  onChange={e => setSchedTime(e.target.value)}
                  placeholder="Contoh: 08.00 - 10.30 WIB"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Nama Aktivitas / Kegiatan:</label>
                <input
                  type="text"
                  required
                  value={schedActivity}
                  onChange={e => setSchedActivity(e.target.value)}
                  placeholder="Contoh: Sesi Penjurian Babak Penyisihan"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Tempat / Lokasi:</label>
                <input
                  type="text"
                  value={schedLocation}
                  onChange={e => setSchedLocation(e.target.value)}
                  placeholder="Contoh: Auditorium Utama Gedung B"
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSchedModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black"
                >
                  Simpan Agenda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / CREATE RULE */}
      {isRuleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">
                {editingRuleId ? 'Edit Peraturan Lomba' : 'Tambah Peraturan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRuleModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRule} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Teks Peraturan / Tata Tertib:</label>
                <textarea
                  rows={3}
                  required
                  value={ruleText}
                  onChange={e => setRuleText(e.target.value)}
                  placeholder="Tuliskan butir aturan dengan jelas..."
                  className="w-full px-3 py-2 bg-slate-800 text-white rounded-xl border border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsRuleModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black"
                >
                  Simpan Peraturan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
