// Locally synthesized ambience/chimes; Thai speech arrives from Edge TTS.
export class SceneAudio {
  constructor({ preview = false, onState = () => {} } = {}) {
    this.preview = preview; this.onState = onState; this.settings = {}; this.queue = []; this.playing = null;
  }
  async start() {
    if (this.preview) return;
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.ctx.onstatechange = () => this.onState(this.ctx.state);
      this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.ambient = this.ctx.createGain(); this.ambient.connect(this.master);
      for (const [i, f] of [130.81, 196, 261.63, 392].entries()) {
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = f; osc.detune.value = i % 2 ? 2 : -2;
        gain.gain.value = .022 / (1 + i * .3); osc.connect(gain); gain.connect(this.ambient); osc.start();
        const lfo = this.ctx.createOscillator(), depth = this.ctx.createGain(); lfo.frequency.value = .07 + i * .014; depth.gain.value = .008;
        lfo.connect(depth); depth.connect(gain.gain); lfo.start();
      }
    }
    this.onState(this.ctx.state);
    await this.ctx.resume(); this.configure(this.settings); this.pump(); this.onState(this.ctx.state);
    return this.ctx.state === 'running';
  }
  configure(s) {
    this.settings = { ...this.settings, ...s };
    if (!this.ctx) return;
    this.master.gain.setTargetAtTime((this.settings.volume ?? 35) / 100, this.ctx.currentTime, .3);
    this.ambient.gain.setTargetAtTime(this.settings.music ? (this.playing ? .2 : 1) : 0, this.ctx.currentTime, .5);
  }
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
    this.queue = this.queue.filter(item => item.tag !== 'idle');
    if (this.playingTag === 'idle') this.stopPlaying();
  }
  speech(url, tag = 'gift') {
    // Do not build a stale speech backlog while sound is disabled.
    if (this.preview || !this.settings.voiceEnabled || this.ctx?.state !== 'running') return;
    if (tag === 'idle' && (this.playing || this.queue.length)) return;
    if (tag !== 'idle') this.giftPriority();
    if (this.queue.length >= 5) return;
    this.queue.push({ url, tag }); this.pump();
  }
  pump() {
    if (this.playing || !this.queue.length || this.ctx?.state !== 'running') return;
    const job = this.queue.shift(), el = new Audio(job.url); this.playing = el; this.playingTag = job.tag;
    const source = this.ctx.createMediaElementSource(el); this.playingSource = source; source.connect(this.master); this.configure({});
    const finish = () => { if (this.playing !== el) return; source.disconnect(); this.playingSource = null; this.playing = null; this.playingTag = ''; this.configure({}); this.pump(); };
    el.onended = finish; el.onerror = finish; el.play().catch(finish);
  }
  stopPlaying() { if (this.playing) { this.playing.pause(); this.playing.onended = null; this.playing.onerror = null; this.playing = null; } this.playingTag = ''; this.playingSource?.disconnect(); this.playingSource = null; this.configure({}); }
  clear() { this.queue.length = 0; this.stopPlaying(); }
}
