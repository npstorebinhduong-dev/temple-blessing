export const MUSIC_TRACK = Object.freeze({
  id: 'eastern-serenity', title: 'Eastern Serenity · thiền Á Đông',
  url: '/assets/ganesha/music/eastern-serenity.mp3', duration: 280,
  artist: 'Kevin MacLeod', license: 'CC0 / Public Domain',
});

export class MusicBed {
  constructor(ctx, output, { onStatus = () => {}, fetcher = (...args) => globalThis.fetch(...args) } = {}) {
    this.ctx = ctx; this.output = output; this.onStatus = onStatus; this.fetcher = fetcher;
    this.enabled = false; this.loop = true; this.buffer = null; this.source = null; this.loading = null; this.ended = false;
    this.status = '';
  }
  report(state, message = '') {
    if (this.status === state && !message) return;
    this.status = state; this.onStatus({ state, message, track: MUSIC_TRACK.id });
  }
  configure(settings, ducking = false) {
    const wasEnabled = this.enabled, wasLoop = this.loop;
    this.enabled = !!settings.music; this.loop = settings.musicLoop !== false;
    const level = Math.max(0, Math.min(100, Number(settings.musicVolume ?? 60))) / 100;
    this.output.gain.setTargetAtTime(this.enabled ? level * (ducking ? .2 : 1) : 0, this.ctx.currentTime, ducking ? .2 : .6);
    if (this.source) this.source.loop = this.loop;
    if (!this.enabled) { this.report('off'); return; }
    if (!wasEnabled || (!wasLoop && this.loop)) this.ended = false;
    if (this.source) this.report('playing');
    else if (!this.ended) void this.ensurePlaying();
    else this.report('ended');
  }
  async ensurePlaying() {
    if (this.source || this.loading || !this.enabled) return;
    if (this.buffer) { this.startSource(); return; }
    this.report('loading');
    this.loading = this.load();
    try {
      this.buffer = await this.loading;
      if (this.enabled) this.startSource();
    } catch (error) {
      if (this.enabled) this.report('error', error.message);
    } finally { this.loading = null; }
  }
  async load() {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await this.fetcher(MUSIC_TRACK.url, { signal: controller.signal });
      if (!response.ok) throw new Error(`Không tải được nhạc (${response.status}).`);
      return await this.ctx.decodeAudioData(await response.arrayBuffer());
    } finally { clearTimeout(timer); }
  }
  startSource() {
    if (!this.enabled || this.source || !this.buffer) return;
    const source = this.ctx.createBufferSource(); source.buffer = this.buffer; source.loop = this.loop;
    source.connect(this.output); this.source = source; this.ended = false;
    source.onended = () => {
      if (this.source !== source) return;
      source.disconnect(); this.source = null; this.ended = true;
      this.report(this.enabled ? 'ended' : 'off');
    };
    source.start(); this.report('playing');
  }
  replay() {
    if (!this.enabled) return;
    if (this.source) { const source = this.source; this.source = null; source.onended = null; source.stop(); source.disconnect(); }
    this.ended = false; void this.ensurePlaying();
  }
}
