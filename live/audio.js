// Locally synthesized ambience/chimes; Thai speech arrives from the opt-in TTS service.
export class SceneAudio {
  constructor({ preview = false } = {}) { this.preview = preview; this.settings = {}; this.queue = []; this.playing = null; }
  async start() {
    if (this.preview) return;
    if (!this.ctx) {
      this.ctx = new AudioContext(); this.master = this.ctx.createGain(); this.master.connect(this.ctx.destination);
      this.ambient = this.ctx.createGain(); this.ambient.connect(this.master);
      for (const [i, f] of [130.81, 196, 261.63, 392].entries()) {
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = 'sine'; osc.frequency.value = f; osc.detune.value = i % 2 ? 2 : -2;
        gain.gain.value = .022 / (1 + i * .3); osc.connect(gain); gain.connect(this.ambient); osc.start();
        const lfo = this.ctx.createOscillator(), depth = this.ctx.createGain(); lfo.frequency.value = .07 + i * .014; depth.gain.value = .008;
        lfo.connect(depth); depth.connect(gain.gain); lfo.start();
      }
    }
    await this.ctx.resume(); this.configure(this.settings); this.pump();
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
    for (const [i, f] of (kind === 'aarti' ? [196, 392, 588, 784] : [523.25, 783.99, 1046.5]).entries()) {
      const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(); osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.18 / (i + 1), now + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, now + 3 + i * .2);
      osc.connect(gain); gain.connect(this.master); osc.start(now); osc.stop(now + 4);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); };
    }
  }
  speech(url) {
    // Do not build a stale speech backlog while sound is disabled.
    if (this.preview || this.ctx?.state !== 'running' || this.queue.length >= 5) return;
    this.queue.push(url); this.pump();
  }
  pump() {
    if (this.playing || !this.queue.length || this.ctx?.state !== 'running') return;
    const el = new Audio(this.queue.shift()); this.playing = el;
    const source = this.ctx.createMediaElementSource(el); this.playingSource = source; source.connect(this.master); this.configure({});
    const finish = () => { if (this.playing !== el) return; source.disconnect(); this.playingSource = null; this.playing = null; this.configure({}); this.pump(); };
    el.onended = finish; el.onerror = finish; el.play().catch(finish);
  }
  clear() { this.queue.length = 0; if (this.playing) { this.playing.pause(); this.playing.onended = null; this.playing.onerror = null; this.playing = null; } this.playingSource?.disconnect(); this.playingSource = null; this.configure({}); }
}
