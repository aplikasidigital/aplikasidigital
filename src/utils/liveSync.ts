import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { StorageService, STORAGE_KEYS } from './storage';

export interface LiveSyncStatus {
  isConnected: boolean;
  transport: 'supabase' | 'sse' | 'both' | 'offline';
  onlineCount: number;
  lastSyncedAt: string | null;
  lastEventKey?: string;
}

export type LiveSyncStatusListener = (status: LiveSyncStatus) => void;

class LiveSyncManager {
  private clientId: string = '';
  private supabaseChannel: RealtimeChannel | null = null;
  private eventSource: EventSource | null = null;
  private isInitialized = false;
  private statusListeners: Set<LiveSyncStatusListener> = new Set();

  private status: LiveSyncStatus = {
    isConnected: false,
    transport: 'offline',
    onlineCount: 1,
    lastSyncedAt: null
  };

  constructor() {
    if (typeof window !== 'undefined') {
      this.clientId =
        'client_' +
        Math.random().toString(36).substring(2, 10) +
        '_' +
        Date.now().toString(36);
    }
  }

  /**
   * Menginisialisasi koneksi live-sync ganda:
   * 1. Supabase Realtime Broadcast (Universal untuk seluruh hosting/Vercel/Netlify/mobile)
   * 2. Server-Sent Events (SSE) via Express server (/api/live-events jika ada backend Node.js)
   */
  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    this.initSupabaseRealtime();
    this.initServerSentEvents();
  }

  /**
   * 1. Supabase Realtime Broadcast Channel
   */
  private initSupabaseRealtime() {
    try {
      const channel = supabase.channel('simpel_global_sync', {
        config: {
          broadcast: { ack: false, self: false },
          presence: { key: this.clientId }
        }
      });

      channel.on('broadcast', { event: 'simpel_data_sync' }, (msg) => {
        const payload = msg?.payload;
        if (!payload || payload.senderId === this.clientId) return;

        this.applyIncomingData(payload.key, payload.data, 'supabase');
      });

      // Lacak jumlah pengguna aktif secara real-time via Supabase Presence
      channel.on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const count = Math.max(1, Object.keys(state).length);
        this.updateStatus({
          onlineCount: count,
          isConnected: true
        });
      });

      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          // Kirim status presence saya
          channel.track({ onlineAt: new Date().toISOString() }).catch(() => {});
          this.updateTransport('supabase', true);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          this.updateTransport('supabase', false);
        }
      });

      this.supabaseChannel = channel;
    } catch (err) {
      console.warn('[LiveSync] Supabase Realtime inisialisasi notice:', err);
    }
  }

  /**
   * 2. Server-Sent Events (SSE) untuk Node.js Express server
   */
  private initServerSentEvents() {
    try {
      // Hanya hubungkan jika berjalan pada origin yang mendukung API SSE
      if (typeof EventSource !== 'undefined') {
        const sse = new EventSource('/api/live-events');

        sse.onopen = () => {
          this.updateTransport('sse', true);
        };

        sse.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'connected') {
              if (parsed.onlineCount) {
                this.updateStatus({ onlineCount: parsed.onlineCount, isConnected: true });
              }
            } else if (parsed.type === 'sync') {
              if (parsed.senderId !== this.clientId) {
                this.applyIncomingData(parsed.key, parsed.data, 'sse');
              }
            }
          } catch (e) {
            // Heartbeat atau format teks non-JSON
          }
        };

        sse.onerror = () => {
          // SSE mungkin gagal jika di hosting statis seperti Vercel frontend saja (normal fallback ke Supabase)
          this.updateTransport('sse', false);
        };

        this.eventSource = sse;
      }
    } catch {
      // Normal fallback ke Supabase Realtime
    }
  }

  /**
   * Menerapkan data pembaruan yang datang dari server/pengguna lain
   */
  private applyIncomingData(key: string, data: any, source: string) {
    if (!key) return;

    this.updateStatus({
      isConnected: true,
      lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
      lastEventKey: key
    });

    // Delegasikan penanganan penyimpanan & pembaruan React ke StorageService
    StorageService.handleRemoteSync(key, data);
  }

  /**
   * Mempublikasikan pembaruan data lokal ke seluruh pengguna/server publik
   */
  public publish(key: string, data?: any) {
    if (typeof window === 'undefined') return;

    // Pastikan manager aktif
    if (!this.isInitialized) {
      this.init();
    }

    const payload = {
      key,
      data,
      senderId: this.clientId,
      timestamp: Date.now()
    };

    // 1. Publikasikan ke Supabase Realtime Broadcast (sub-50ms)
    if (this.supabaseChannel) {
      try {
        this.supabaseChannel.send({
          type: 'broadcast',
          event: 'simpel_data_sync',
          payload
        });
      } catch (err) {
        console.warn('[LiveSync] Supabase broadcast kirim notice:', err);
      }
    }

    // 2. Publikasikan ke Server Express (SSE) jika tersedia
    try {
      fetch('/api/live-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).catch(() => {
        // Abaikan error jika berjalan di static hosting tanpa server.js
      });
    } catch {}

    this.updateStatus({
      lastSyncedAt: new Date().toLocaleTimeString('id-ID'),
      lastEventKey: key
    });
  }

  private updateTransport(type: 'supabase' | 'sse', connected: boolean) {
    let currentTransport = this.status.transport;

    if (type === 'supabase') {
      if (connected) {
        currentTransport = currentTransport === 'sse' ? 'both' : 'supabase';
      } else {
        currentTransport = currentTransport === 'both' ? 'sse' : 'offline';
      }
    } else if (type === 'sse') {
      if (connected) {
        currentTransport = currentTransport === 'supabase' ? 'both' : 'sse';
      } else {
        currentTransport = currentTransport === 'both' ? 'supabase' : 'offline';
      }
    }

    const isConnected = currentTransport !== 'offline';
    this.updateStatus({
      isConnected,
      transport: currentTransport
    });
  }

  private updateStatus(partial: Partial<LiveSyncStatus>) {
    this.status = { ...this.status, ...partial };
    this.statusListeners.forEach((cb) => {
      try {
        cb(this.status);
      } catch {}
    });
  }

  public getStatus(): LiveSyncStatus {
    return this.status;
  }

  public subscribeStatus(listener: LiveSyncStatusListener): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }
}

export const LiveSyncService = new LiveSyncManager();
