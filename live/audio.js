import { MusicBed } from './music.js';
// Bundled instrumental music and local chimes; Thai speech arrives from Edge TTS.
export class SceneAudio {
  constructor({ preview = false, onState = () => {}, onMusicStatus = () => {}, onSpeechState = () => {} } = {}) {
    this.preview = preview; this.onState = onState; this.settings = {}; this.queue = []; this.playing = null;
    this.onMusicStatus = onMusicStatus; this.onSpeechState = onSpeechState;
  }
  speechReady() { return !this.preview && !!this.settings.voiceEnabled && (this.settings.volume ?? 35) > 0 && this.ctx?.state === 'running'; }
  reportSpeech(id = '', state = 'ready', tag = '') {
    this.onSpeechState({ id, state, tag, ready: this.speechReady() });
  }
  async start() {
    if (this.preview) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.ctx.onstatechange = () => {
        if (this.ctx.state !== 'running') this.clear();
        this.onState(this.ctx.state); this.reportSpeech();
      };
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.ambient = this.ctx.createGain(); this.ambient.connect(this.master);
      this.ambient.gain.value = 0;
      this.music = new MusicBed(this.ctx, this.ambient, { onStatus: this.onMusicStatus });
    }
    this.onState(this.ctx.state);
    await this.ctx.resume(); this.configure(this.settings); this.pump(); this.onState(this.ctx.state);
    return this.ctx.state === 'running';
  }
  configure(s) {
    this.settings = { ...this.settings, ...s };
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime((this.settings.volume ?? 35) / 100, this.ctx.currentTime, .3);
    this.music?.configure(this.settings, !!this.playing);
    this.reportSpeech();
  }
  replayMusic() { this.music?.replay(); }
  bell(kind = 'lotus') {
    if (this.ctx?.state !== 'running') return;
    const now = this.ctx.currentTime;
    const notes = kind === 'royal' ? [130.81, 196, 261.63, 392, 523.25] : ['aarti', 'marigold'].includes(kind) ? [196, 392, 588, 784] : [523.25, 783.99, 1046.5];
    for (const [i, f] of notes.entries()) {
      const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(); osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.18 / (i + 1), now + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, now + 3 + i * .2);
      osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + 4);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }
  }
  giftPriority() {
    const removed = this.queue.filter(item => item.tag === 'idle');
    this.queue = this.queue.filter(item => item.tag !== 'idle');
    for (const job of removed) this.reportSpeech(job.id, 'cancelled', job.tag);
    if (this.playingTag === 'idle') this.stopPlaying();
  }
  speech(url, tag = 'gift', id = '') {
    // Do not build a stale speech backlog while sound is disabled.
    if (!this.speechReady() || (tag === 'idle' && (this.playing || this.queue.length))) {
      this.reportSpeech(id, 'skipped', tag); return;
    }
    if (tag !== 'idle') this.giftPriority();
    if (this.queue.length >= 5) { this.reportSpeech(id, 'skipped', tag); return; }
    this.queue.push({ url, tag, id }); this.pump();
  }
  pump() {
    if (this.playing || !this.queue.length || this.ctx?.state !== 'running') return;
    const job = this.queue.shift(), el = new Audio(job.url); this.playing = el; this.playingTag = job.tag; this.playingJob = job;
    const source = this.ctx.createMediaElementSource(el); this.playingSource = source; source.connect(this.master); this.configure({});
    const finish = state => { if (this.playing !== el) return; this.stopPlaying(state); this.pump(); };
    // Failed or stalled files must release the server's pending reminder too.
    this.speechTimer = setTimeout(() => finish('error'), 15000);
    el.onplaying = () => {
      if (this.playing !== el) return;
      clearTimeout(this.speechTimer); this.speechTimer = setTimeout(() => finish('error'), 120000);
      this.reportSpeech(job.id, 'started', job.tag);
    };
    el.onended = () => finish('ended'); el.onerror = () => finish('error'); el.play().catch(() => finish('error'));
  }
  stopPlaying(state = 'cancelled') {
    const job = this.playingJob;
    clearTimeout(this.speechTimer);
    if (this.playing) { this.playing.onended = this.playing.onerror = this.playing.onplaying = null; this.playing.pause(); this.playing = null; }
    this.playingJob = null; this.playingTag = ''; this.playingSource?.disconnect(); this.playingSource = null; this.configure({});
    if (job) this.reportSpeech(job.id, state, job.tag);
  }
  clear() {
    const removed = this.queue.splice(0);
    for (const job of removed) this.reportSpeech(job.id, 'cancelled', job.tag);
    this.stopPlaying();
  }
}
