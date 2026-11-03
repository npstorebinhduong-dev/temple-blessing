import { MusicBed } from './music.js';
// Bundled instrumental music and local chimes; Thai speech arrives from Edge TTS.
export class SceneAudio {
  constructor({ preview = false, onState = () => {}, onMusicStatus = () => {}, onSpeechState = () => {} } = {}) {
    this.preview = preview; this.onState = onState; this.settings = {}; this.queue = []; this.playing = null;
    this.onMusicStatus = onMusicStatus; this.onSpeechState = onSpeechState;
    this.effects = new Set(); this.special = false;
  }
  speechReady() { return !this.preview && !!this.settings.voiceEnabled && (this.settings.voiceVolume ?? 100) > 0 && (this.settings.volume ?? 35) > 0 && this.ctx?.state === 'running'; }
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
      this.fxGain = this.ctx.createGain(); this.fxGain.connect(this.master);
      this.voiceGain = this.ctx.createGain(); this.voiceGain.connect(this.master);
      this.voiceEQ = this.ctx.createBiquadFilter(); this.voiceEQ.type = 'lowshelf'; this.voiceEQ.frequency.value = 150;
      this.voiceEQ.connect(this.voiceGain);
      this.reverb = this.ctx.createConvolver(); this.reverbWet = this.ctx.createGain();
      const impulse = this.ctx.createBuffer(2, Math.floor(this.ctx.sampleRate * .72), this.ctx.sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = impulse.getChannelData(ch);
        for (let i = 0; i < data.length; i++) data[i] = Math.sin(i * 12.9898 + ch * 78.233) * Math.pow(1 - i / data.length, 3.4) * .4;
      }
      this.reverb.buffer = impulse; this.voiceEQ.connect(this.reverb); this.reverb.connect(this.reverbWet); this.reverbWet.connect(this.voiceGain);
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
    this.fxGain?.gain.setTargetAtTime(this.settings.effectsEnabled === false ? 0 : (this.settings.effectsVolume ?? 75) / 100, this.ctx.currentTime, .15);
    this.voiceGain?.gain.setTargetAtTime(this.settings.voiceEnabled ? (this.settings.voiceVolume ?? 100) / 100 : 0, this.ctx.currentTime, .1);
    this.voiceEQ?.gain.setTargetAtTime(this.playingTag === 'blessing' ? 2 : 0, this.ctx.currentTime, .2);
    this.reverbWet?.gain.setTargetAtTime(this.playingTag === 'blessing' ? .065 : 0, this.ctx.currentTime, .2);
    this.music?.configure(this.settings, !!this.playing);
    if (!this.speechReady() && (this.playing || this.queue.length)) this.clearSpeech();
    this.reportSpeech();
  }
  replayMusic() { this.music?.replay(); }
  bell(kind = 'lotus') {
    if (this.ctx?.state !== 'running' || this.settings.effectsEnabled === false || this.effects.size>=12) return;
    const now = this.ctx.currentTime;
    const notes = kind==='lamp'?[880,1320]:['incense','fragrance'].includes(kind)?[220,330]:kind==='floral'?[440,660,880]:kind==='light'?[196,392,588]:kind === 'galaxy' ? [65.4, 130.81, 196, 261.63] : kind === 'stream' ? [392, 523.25, 783.99] : kind === 'royal' ? [130.81, 196, 261.63, 392, 523.25] : ['aarti', 'marigold', 'mushika'].includes(kind) ? [196, 392, 588, 784] : [523.25, 783.99, 1046.5];
    for (const [i, f] of notes.slice(0,12-this.effects.size).entries()) {
      const osc = this.ctx.createOscillator(), gain = this.ctx.createGain(); osc.frequency.value = f;
      gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.18 / (i + 1), now + .015);
      gain.gain.exponentialRampToValueAtTime(.0001, now + 3 + i * .2);
      if (kind === 'stream') osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + 2);
      osc.connect(gain); gain.connect(this.fxGain || this.master); this.effects.add(osc); osc.start(now); osc.stop(now + 4);
      osc.onended = () => { osc.disconnect(); gain.disconnect(); this.effects.delete(osc); };
    }
  }
  ritualCue(phase) {
    if (this.ctx?.state !== 'running' || this.settings.effectsEnabled === false || this.effects.size>=12) return;
    if (phase === 'receive') { this.bell('marigold'); return; }
    const notes = phase === 'gather' ? [392, 587.33, 783.99] : phase === 'reply' ? [523.25, 659.25, 783.99] : [261.63, 392, 523.25];
    for (const [i,f] of notes.slice(0,12-this.effects.size).entries()) {
      const at=this.ctx.currentTime+i*.09, duration=phase==='light-stream'?1.55:1.1;
      const osc=this.ctx.createOscillator(),g=this.ctx.createGain();osc.type=phase==='light-stream'?'triangle':'sine';
      osc.frequency.setValueAtTime(f,at);osc.frequency.exponentialRampToValueAtTime(f*(phase==='light-stream'?2.25:1.05),at+duration);
      g.gain.setValueAtTime(0,at);g.gain.linearRampToValueAtTime(.095/(i+1),at+.18);g.gain.exponentialRampToValueAtTime(.0001,at+duration);
      osc.connect(g);g.connect(this.fxGain||this.master);this.effects.add(osc);osc.start(at);osc.stop(at+duration+.05);
      osc.onended=()=>{osc.disconnect();g.disconnect();this.effects.delete(osc);};
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
    if (!this.speechReady() || (this.special && tag !== 'blessing') || (tag === 'idle' && (this.playing || this.queue.length))) {
      this.reportSpeech(id, 'skipped', tag); return;
    }
    if (tag === 'blessing') this.clearSpeech();
    else if (tag !== 'idle') this.giftPriority();
    if (this.queue.length >= 5) { this.reportSpeech(id, 'skipped', tag); return; }
    this.queue.push({ url, tag, id }); this.pump();
  }
  pump() {
    if (this.playing || !this.queue.length || this.ctx?.state !== 'running') return;
    const job = this.queue.shift(), el = new Audio(job.url); this.playing = el; this.playingTag = job.tag; this.playingJob = job;
    const source = this.ctx.createMediaElementSource(el); this.playingSource = source; source.connect(this.voiceEQ || this.master); this.configure({});
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
  clearSpeech() {
    const removed = this.queue.splice(0);
    for (const job of removed) this.reportSpeech(job.id, 'cancelled', job.tag);
    this.stopPlaying();
  }
  beginSpecial() { this.clearSpeech(); this.special = true; }
  endSpecial() { this.special = false; }
  clear() {
    this.special = false; this.clearSpeech();
    for (const osc of this.effects) { try { osc.stop(); } catch {} }
    this.effects.clear();
  }
}
