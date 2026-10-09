import { createClient, RealtimeChannel } from '@supabase/supabase-js';

// Kredensial Supabase Resmi S-IMPEL DIGITAL
export const SUPABASE_URL =
  (import.meta.env?.VITE_SUPABASE_URL as string) || 'https://qixphlsusrcquqncnbma.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta.env?.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeHBobHN1c3JjcXVxbmNuYm1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE1NTYzMzksImV4cCI6MjEwNzEzMjMzOX0.ICBw1GUTFuI0vm0fVuB1nw0WofVy49V3wL5fGAmNmFg';

export const SUPABASE_SERVICE_ROLE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFpeHBobHN1c3JjcXVxbmNuYm1hIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTE3OTE1NTYzMzksImV4cCI6MjEwNzEzMjMzOX0.L1RPMzs8u5TzZ4eEDn_ek_iWFTYcbL6ld1YHD57Zkgg';

// Inisialisasi Klien Supabase
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Teks Deskripsi Default
export const DEFAULT_EVENT_DESCRIPTION =
  'Ajang bergengsi tingkat nasional yang mempertemukan talenta-talenta terbaik dari seluruh nusantara dalam berbagai bidang keahlian digital, vokasi, dan orasi kebangsaan. Seluruh proses penjurian menggunakan teknologi S-IMPEL DIGITAL demi menjamin transparansi, keadilan, dan kecepatan hasil.';

export interface SupabaseSyncStatus {
  isConnected: boolean;
  hasTable: boolean;
  lastSyncedAt: string | null;
  errorMessage?: string;
}

export class SupabaseService {
  private static realtimeChannel: RealtimeChannel | null = null;
  private static subscribers: Set<(text: string) => void> = new Set();
  private static statusSubscribers: Set<(status: SupabaseSyncStatus) => void> = new Set();
  private static currentStatus: SupabaseSyncStatus = {
    isConnected: true,
    hasTable: false,
    lastSyncedAt: null
  };

  /**
   * Mengambil teks deskripsi event dari Supabase.
   * Mendukung tabel app_content, event_info, atau app_settings secara adaptif.
   */
  static async fetchEventDescription(): Promise<{
    text: string;
    source: 'supabase' | 'local';
    tableFound: boolean;
    error?: string;
  }> {
    try {
      // 1. Coba baca dari tabel utama: app_content
      const { data: contentData, error: contentError } = await supabase
        .from('app_content')
        .select('key, value')
        .eq('key', 'event_description')
        .maybeSingle();

      if (!contentError && contentData && contentData.value) {
        this.updateStatus({ isConnected: true, hasTable: true, lastSyncedAt: new Date().toISOString() });
        return {
          text: contentData.value,
          source: 'supabase',
          tableFound: true
        };
      }

      // 2. Coba tabel alternatif jika ada: event_info
      const { data: infoData, error: infoError } = await supabase
        .from('event_info')
        .select('event_description')
        .limit(1)
        .maybeSingle();

      if (!infoError && infoData && (infoData as any).event_description) {
        this.updateStatus({ isConnected: true, hasTable: true, lastSyncedAt: new Date().toISOString() });
        return {
          text: (infoData as any).event_description,
          source: 'supabase',
          tableFound: true
        };
      }

      // 3. Coba tabel app_settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'event_description')
        .maybeSingle();

      if (!settingsError && settingsData && (settingsData as any).value) {
        this.updateStatus({ isConnected: true, hasTable: true, lastSyncedAt: new Date().toISOString() });
        return {
          text: (settingsData as any).value,
          source: 'supabase',
          tableFound: true
        };
      }

      // Jika tabel belum dibuat di Supabase
      const isTableMissing =
        contentError?.code === 'PGRST205' ||
        infoError?.code === 'PGRST205' ||
        contentError?.message?.includes('schema cache');

      this.updateStatus({
        isConnected: true,
        hasTable: !isTableMissing,
        lastSyncedAt: null,
        errorMessage: isTableMissing
          ? 'Tabel "app_content" belum dibuat di Supabase SQL Editor.'
          : contentError?.message
      });

      return {
        text: DEFAULT_EVENT_DESCRIPTION,
        source: 'local',
        tableFound: !isTableMissing,
        error: contentError?.message
      };
    } catch (err: any) {
      console.warn('[Supabase] Gagal fetch deskripsi:', err);
      this.updateStatus({
        isConnected: false,
        hasTable: false,
        lastSyncedAt: null,
        errorMessage: err?.message || 'Gagal tersambung ke Supabase'
      });
      return {
        text: DEFAULT_EVENT_DESCRIPTION,
        source: 'local',
        tableFound: false,
        error: err?.message
      };
    }
  }

  /**
   * Menyimpan teks deskripsi baru ke Supabase & memancarkan secara Real-Time.
   */
  static async saveEventDescription(newText: string): Promise<{
    success: boolean;
    tableMissing?: boolean;
    message: string;
  }> {
    const trimmed = newText.trim();
    if (!trimmed) {
      return { success: false, message: 'Teks deskripsi tidak boleh kosong.' };
    }

    // Siarkan terlebih dahulu melalui Realtime Broadcast Channel (cepat & instan)
    this.broadcastRealtimeText(trimmed);

    try {
      // 1. Simpan/Upsert ke tabel app_content
      const { error } = await supabase
        .from('app_content')
        .upsert(
          {
            key: 'event_description',
            value: trimmed,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );

      if (error) {
        const isTableMissing =
          error.code === 'PGRST205' ||
          error.message?.includes('schema cache') ||
          error.message?.includes('not find the table');

        this.updateStatus({
          isConnected: true,
          hasTable: !isTableMissing,
          lastSyncedAt: null,
          errorMessage: error.message
        });

        if (isTableMissing) {
          return {
            success: false,
            tableMissing: true,
            message:
              'Tabel "app_content" belum dibuat di database Supabase. Jalankan script SQL di panel admin untuk mengaktifkan sinkronisasi database permanen.'
          };
        }

        return {
          success: false,
          tableMissing: false,
          message: `Gagal menyimpan ke database Supabase: ${error.message}`
        };
      }

      this.updateStatus({
        isConnected: true,
        hasTable: true,
        lastSyncedAt: new Date().toISOString(),
        errorMessage: undefined
      });

      return {
        success: true,
        message: 'Teks berhasil disimpan ke Supabase dan disiarkan Real-Time ke seluruh pengguna!'
      };
    } catch (err: any) {
      console.error('[Supabase] Gagal menyimpan deskripsi:', err);
      return {
        success: false,
        message: `Terjadi kendala koneksi ke Supabase: ${err?.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Mengatur langganan Real-Time (Real-Time Subscription) untuk seluruh client.
   * Setiap kali teks diubah di Admin, seluruh client menerima update otomatis.
   */
  static initRealtimeSubscription(onUpdate: (text: string) => void): () => void {
    this.subscribers.add(onUpdate);

    if (!this.realtimeChannel) {
      const channel = supabase.channel('simpel_event_realtime_channel', {
        config: {
          broadcast: { ack: false }
        }
      });

      // 1. Dengarkan pembaruan database Postgres (postgres_changes)
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'app_content'
        },
        (payload) => {
          const record = (payload.new || payload.old) as any;
          if (record && record.key === 'event_description' && record.value) {
            this.notifySubscribers(record.value);
          }
        }
      );

      // 2. Dengarkan juga tabel event_info jika ada
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_info'
        },
        (payload) => {
          const record = (payload.new || payload.old) as any;
          if (record && record.event_description) {
            this.notifySubscribers(record.event_description);
          }
        }
      );

      // 3. Dengarkan event broadcast langsung dari channel (sub-100ms ultra cepat)
      channel.on('broadcast', { event: 'event_description_updated' }, (msg) => {
        if (msg?.payload?.text) {
          this.notifySubscribers(msg.payload.text);
        }
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          this.updateStatus({ isConnected: true });
        }
      });

      this.realtimeChannel = channel;
    }

    return () => {
      this.subscribers.delete(onUpdate);
      if (this.subscribers.size === 0 && this.realtimeChannel) {
        supabase.removeChannel(this.realtimeChannel);
        this.realtimeChannel = null;
      }
    };
  }

  /**
   * Memancarkan event broadcast langsung lewat Supabase Realtime Channel
   */
  private static async broadcastRealtimeText(text: string) {
    // Siarkan ke seluruh subscriber lokal di tab ini
    this.notifySubscribers(text);

    // Siarkan ke seluruh subscriber di tab/perangkat lain via Supabase Realtime
    if (this.realtimeChannel) {
      try {
        await this.realtimeChannel.send({
          type: 'broadcast',
          event: 'event_description_updated',
          payload: { text, timestamp: Date.now() }
        });
      } catch (err) {
        console.warn('[Supabase Realtime] Gagal memancarkan broadcast:', err);
      }
    }
  }

  private static notifySubscribers(text: string) {
    this.subscribers.forEach((cb) => {
      try {
        cb(text);
      } catch (err) {
        console.error('Error in subscriber callback:', err);
      }
    });
  }

  /**
   * Mendaftarkan listener status koneksi Supabase
   */
  static subscribeStatus(cb: (status: SupabaseSyncStatus) => void): () => void {
    this.statusSubscribers.add(cb);
    cb(this.currentStatus);
    return () => {
      this.statusSubscribers.delete(cb);
    };
  }

  private static updateStatus(partial: Partial<SupabaseSyncStatus>) {
    this.currentStatus = { ...this.currentStatus, ...partial };
    this.statusSubscribers.forEach((cb) => cb(this.currentStatus));
  }

  static getStatus(): SupabaseSyncStatus {
    return this.currentStatus;
  }

  /**
   * Template script SQL yang siap disalin dan dijalankan di Supabase SQL Editor
   */
  static getSqlMigrationScript(): string {
    return `-- ========================================================
-- S-IMPEL DIGITAL: SKRIP MIGRASI SUPABASE REAL-TIME
-- Jalankan skrip ini di SQL Editor pada Dashboard Supabase Anda:
-- https://supabase.com/dashboard/project/qixphlsusrcquqncnbma/sql
-- ========================================================

-- 1. Buat tabel app_content untuk menyimpan teks dinamis
CREATE TABLE IF NOT EXISTS public.app_content (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS)
ALTER TABLE public.app_content ENABLE ROW LEVEL SECURITY;

-- 3. Berikan izin Akses Publik (SELECT, INSERT, UPDATE) untuk Anon Key & Service Role
DROP POLICY IF EXISTS "Public Read Access" ON public.app_content;
CREATE POLICY "Public Read Access" ON public.app_content 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Insert Access" ON public.app_content;
CREATE POLICY "Public Insert Access" ON public.app_content 
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public Update Access" ON public.app_content;
CREATE POLICY "Public Update Access" ON public.app_content 
  FOR UPDATE USING (true);

-- 4. Aktifkan Supabase Real-Time untuk tabel app_content
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_content;

-- 5. Masukkan teks deskripsi awal S-IMPEL DIGITAL
INSERT INTO public.app_content (key, value)
VALUES (
  'event_description',
  'Ajang bergengsi tingkat nasional yang mempertemukan talenta-talenta terbaik dari seluruh nusantara dalam berbagai bidang keahlian digital, vokasi, dan orasi kebangsaan. Seluruh proses penjurian menggunakan teknologi S-IMPEL DIGITAL demi menjamin transparansi, keadilan, dan kecepatan hasil.'
)
ON CONFLICT (key) DO UPDATE 
SET value = EXCLUDED.value, updated_at = NOW();

-- Selesai! Tabel siap digunakan dengan sinkronisasi Real-Time penuh.
`;
  }
}
