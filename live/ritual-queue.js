// A bounded visual queue. Accounting happens on the server independently.
export class RitualQueue {
  constructor({ limit = 8, maxAge = 40000 } = {}) {
    this.limit = limit; this.maxAge = maxAge; this.pending = []; this.active = null;
  }
  enqueue(message, now) {
    if (!['lotus', 'incense', 'garland', 'aarti'].includes(message.ritual?.kind)) return;
    this.pending = this.pending.filter(item => now - item.queuedAt < this.maxAge);
    const existing = this.pending.find(item => item.id === message.id && item.ritual.kind === message.ritual.kind);
    if (existing) { existing.count += message.count; existing.queuedAt = now; return; }
    if (this.pending.length >= this.limit) this.pending.shift();
    this.pending.push({ ...message, queuedAt: now });
  }
  tick(now) {
    if (this.active && now >= this.active.until) this.active = null;
    this.pending = this.pending.filter(item => now - item.queuedAt < this.maxAge);
    if (!this.active && this.pending.length) {
      const message = this.pending.shift();
      this.active = { ...message, beganAt: now, until: now + Math.min(6500, message.ritual.duration || 3200) };
    }
    return this.active;
  }
  clear() { this.pending.length = 0; this.active = null; }
}
