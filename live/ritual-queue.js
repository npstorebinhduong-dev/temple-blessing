// Accounting is independent of this visual queue. Basic gifts cannot evict ceremonies.
export class RitualQueue {
  constructor({ limit = 8, maxAge = 40000, premiumLimit = 64, premiumMaxAge = 1800000 } = {}) {
    this.limit = limit; this.maxAge = maxAge; this.premiumLimit = premiumLimit; this.premiumMaxAge = premiumMaxAge;
    this.pending = []; this.active = null; this.dropped = 0;
  }
  prune(now) {
    this.pending = this.pending.filter(item => now - item.queuedAt < (item.ritual.procession ? this.premiumMaxAge : this.maxAge));
  }
  enqueue(message, now) {
    if (!['lotus', 'incense', 'garland', 'aarti', 'marigold', 'royal'].includes(message.ritual?.kind)) return false;
    this.prune(now);
    const existing = this.pending.find(item => item.id === message.id && item.ritual.kind === message.ritual.kind);
    if (existing) { existing.count += message.count; existing.queuedAt = now; return true; }
    const premium = !!message.ritual.procession;
    const sameClass = this.pending.filter(item => !!item.ritual.procession === premium);
    if (sameClass.length >= (premium ? this.premiumLimit : this.limit)) {
      if (premium) { this.dropped++; return false; }
      this.pending.splice(this.pending.indexOf(sameClass[0]), 1); this.dropped++;
    }
    this.pending.push({ ...message, queuedAt: now }); return true;
  }
  tick(now, eligible = () => true) {
    if (this.active && now >= this.active.until) this.active = null;
    this.prune(now);
    if (!this.active && this.pending.length) {
      const firstPremium = this.pending.findIndex(item => item.ritual.procession && eligible(item));
      const index = firstPremium >= 0 ? firstPremium : this.pending.findIndex(eligible);
      if (index < 0) return null;
      const [message] = this.pending.splice(index, 1);
      this.active = { ...message, beganAt: now, until: now + Math.min(24000, message.ritual.duration || 3200) };
    }
    return this.active;
  }
  clear() { this.pending.length = 0; this.active = null; this.dropped = 0; }
}
