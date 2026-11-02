// The same immutable sentence is used for TTS and the banner in every turn.
export const GANESHA_BLESSING = 'ขอให้เจ้ามีจิตใจที่สงบ มีปัญญาก้าวผ่านอุปสรรค และพบกับการเริ่มต้นที่ดี';
export const BLESSING_VOICE = Object.freeze({ voice: 'th-TH-NiwatNeural', rate: -12, pitch: -6 });
export const BANNER_HOLD_MS = 2500;
export const TEXT_READ_MS = 8500;
export class BlessingSession {
  constructor(active, now) {
    this.active = active; this.listeners = new Set(); this.anyStarted = false; this.requestedAt = now;
    active.speech = { id: `blessing-${active.turn}-${active.beganAt}`, text: active.blessing || GANESHA_BLESSING, state: 'loading', startedAt: null, endedAt: null, bannerUntil: null };
    // An actual onended receipt, or the explicit failure path, releases this hold.
    active.until = now + 150000;
  }
  get id() { return this.active.speech.id; }
  delivered(listeners, now) {
    if (this.active.speech.state !== 'loading') return false;
    this.listeners = new Set(listeners); this.deliveredAt = now;
    if (!this.listeners.size) this.fallback(now); else this.active.speech.state = 'ready';
    return true;
  }
  receipt(id, listener, state, now) {
    if (id !== this.id || !this.listeners.has(listener)) return false;
    if (state === 'started') {
      this.anyStarted = true; this.active.speech.state = 'playing'; this.active.speech.startedAt ??= now;
    } else if (['ended', 'cancelled', 'error', 'skipped'].includes(state)) {
      this.listeners.delete(listener);
      if (!this.listeners.size) this.anyStarted ? this.finish(now) : this.fallback(now);
    } else return false;
    return true;
  }
  remove(listener, now) { return this.receipt(this.id, listener, 'cancelled', now); }
  finish(now) {
    const s = this.active.speech;
    s.state = 'ended'; s.endedAt = now; s.bannerUntil = now + BANNER_HOLD_MS;
    this.active.until = Math.max(this.active.beganAt + 20000, s.bannerUntil + 3000);
  }
  fallback(now) {
    const s = this.active.speech;
    if (s.state === 'text' || s.state === 'ended') return;
    s.state = 'text'; s.startedAt ??= now; s.endedAt = now + TEXT_READ_MS; s.bannerUntil = s.endedAt + BANNER_HOLD_MS;
    this.active.until = Math.max(this.active.beganAt + 20000, s.bannerUntil + 3000); this.listeners.clear();
  }
  tick(now) {
    const s = this.active.speech;
    if ((s.state === 'loading' && now - this.requestedAt > 16000) || (s.state === 'ready' && now - this.deliveredAt > 16000)) { this.fallback(now); return true; }
    if (s.state === 'playing' && now - s.startedAt > 120000) { this.finish(now); this.listeners.clear(); return true; }
    return false;
  }
}
