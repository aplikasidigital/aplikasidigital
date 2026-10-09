// Web Audio API ambient background music generator and HTML5 audio player

class BackgroundMusicManager {
  private audioElement: HTMLAudioElement | null = null;
  private audioCtx: AudioContext | null = null;
  private isSynthPlaying = false;
  private synthGainNode: GainNode | null = null;
  private synthInterval: any = null;
  private isMuted = false;
  private volume = 0.35;
  private currentUrl = '';
  private userStarted = false;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.loop = true;
  }

  public init(customUrl?: string, defaultVolume = 0.35) {
    this.volume = defaultVolume;
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (customUrl && customUrl.trim().length > 0) {
      this.currentUrl = customUrl;
      this.stopSynth();
      if (this.audioElement) {
        this.audioElement.src = customUrl;
      }
    }
  }

  public start() {
    this.userStarted = true;
    if (this.currentUrl && this.audioElement) {
      this.audioElement.play().catch(() => {
        // Auto-play might be blocked by browser until user gesture
      });
    } else {
      this.startSynth();
    }
  }

  public pause() {
    if (this.audioElement && this.currentUrl) {
      this.audioElement.pause();
    }
    this.stopSynth();
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.audioElement) {
      this.audioElement.muted = muted;
    }
    if (this.synthGainNode) {
      this.synthGainNode.gain.value = muted ? 0 : this.volume * 0.15;
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.audioElement) {
      this.audioElement.volume = this.volume;
    }
    if (this.synthGainNode && !this.isMuted) {
      this.synthGainNode.gain.value = this.volume * 0.15;
    }
  }

  public setCustomAudio(url: string) {
    this.currentUrl = url;
    if (this.audioElement) {
      this.audioElement.src = url;
      this.audioElement.loop = true;
      if (this.userStarted && !this.isMuted) {
        this.stopSynth();
        this.audioElement.play().catch(() => {});
      }
    }
  }

  // Gentle ambient ceremonial chime chords loop using Web Audio API
  private startSynth() {
    if (this.isSynthPlaying) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioCtx) {
        this.audioCtx = new AudioCtx();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      this.synthGainNode = this.audioCtx.createGain();
      this.synthGainNode.gain.value = this.isMuted ? 0 : this.volume * 0.15;
      this.synthGainNode.connect(this.audioCtx.destination);
      this.isSynthPlaying = true;

      // Harmony progression: peaceful pentatonic bell tones
      const notes = [261.63, 329.63, 392.0, 523.25, 587.33, 659.25, 783.99]; // C, E, G, C, D, E, G
      let noteIndex = 0;

      const playTone = () => {
        if (!this.isSynthPlaying || !this.audioCtx || !this.synthGainNode) return;
        try {
          const osc = this.audioCtx.createOscillator();
          const noteGain = this.audioCtx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(notes[noteIndex % notes.length], this.audioCtx.currentTime);

          noteGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
          noteGain.gain.linearRampToValueAtTime(0.3, this.audioCtx.currentTime + 0.3);
          noteGain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 3.0);

          osc.connect(noteGain);
          noteGain.connect(this.synthGainNode);

          osc.start();
          osc.stop(this.audioCtx.currentTime + 3.2);

          noteIndex = (noteIndex + 1) % notes.length;
        } catch {
          // Ignore audio node cleanup
        }
      };

      playTone();
      this.synthInterval = setInterval(playTone, 2200);
    } catch {
      // Audio context might fail in non-interactive state
    }
  }

  private stopSynth() {
    this.isSynthPlaying = false;
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    if (this.synthGainNode) {
      try {
        this.synthGainNode.disconnect();
      } catch {}
      this.synthGainNode = null;
    }
  }
}

export const bgmManager = new BackgroundMusicManager();
