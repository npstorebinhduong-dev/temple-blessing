import { RITUAL_TIMING } from './ritual-timing.js';
import { RITUALS } from './gift-rituals.mjs';
// A finalized combo is ONE ceremony, labelled ×N. Separate final events remain
// separate turns, even for the same donor/kind. Intake deduplicates transport IDs.
// Data is retained; only the single active turn allocates animation objects.
export class RitualQueue {
  constructor() { this.pending = []; this.active = null; this.sequence = 0; this.dropped = 0; }
  prune() {} // Valid gifts never expire while waiting.
  enqueue(message, now = Date.now()) {
    if (!Object.hasOwn(RITUAL_TIMING, message.ritual?.kind || '')) return false;
    this.pending.push({ ...message, ritual:{...RITUALS[message.ritual.kind]}, turn: `turn-${++this.sequence}`, queuedAt: now }); return true;
  }
  tick(now, eligible = () => true) {
    if (this.active && now >= this.active.until) this.active = null;
    // Strict FIFO: a later seated donor cannot overtake the first waiting donor.
    if (!this.active && this.pending.length && eligible(this.pending[0])) {
      const message = this.pending.shift();
      this.active = { ...message, beganAt: now, until: now + RITUAL_TIMING[message.ritual.kind].duration };
    }
    return this.active;
  }
  pause() {
    if (this.active) {
      const { beganAt, until, speech, ...turn } = this.active;
      this.pending.unshift(turn); this.active = null;
    }
  }
  restore(saved) {
    for (const item of Array.isArray(saved) ? saved : []) {
      const { beganAt, until, speech, turn, ...pending } = item;
      this.enqueue(pending, item.queuedAt);
    }
  }
  serialize() { return [...(this.active ? [this.active] : []), ...this.pending]; }
  clear() { this.pending.length = 0; this.active = null; this.dropped = 0; }
}
