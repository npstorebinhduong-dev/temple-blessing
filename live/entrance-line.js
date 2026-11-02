// All waiting data stays on the server. The broadcast receives at most 88
// avatars: ten stable front places plus rotating groups behind them.
export const ENTRANCE_SIZE = 88;
export const FRONT_SIZE = 10;
export const ENTRANCE_ROTATE_MS = 12000;
export const ENTRANCE_EXIT_MS = 900;
const seed = n => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
export function entrancePosition(slot) {
  const index = Math.max(0, Math.min(ENTRANCE_SIZE - 1, Number(slot) - 1 || 0));
  if (index < FRONT_SIZE) return { x: 55 + index * 108 + (seed(index) - .5) * 9, y: 1847 + (seed(index + 6) - .5) * 10, radius: 32, height: 128, layer: 3 };
  const i = index - FRONT_SIZE, row = Math.floor(i / 26), col = i % 26;
  return { x: Math.max(27, Math.min(1053, 24 + col * 41 + (row % 2 ? 15 : 0) + (seed(i + 20) - .5) * 11)),
    y: 1744 + row * 32 + (seed(i + 90) - .5) * 13, radius: 19 + row * 3, height: 100, layer: row };
}
export class EntranceLine {
  constructor(saved = []) {
    this.people = new Map(); this.waiting = new Map(); this.revision = 0; this.lastRotation = 0; this.arrivalSlot = FRONT_SIZE + 1;
    for (const p of Array.isArray(saved) ? saved : []) if (typeof p?.id === 'string') this.waiting.set(p.id, { ...p });
    this.fill(Date.now());
  }
  find(id) { return this.people.get(String(id)) || this.waiting.get(String(id)); }
  update(id, changes) {
    const p = this.find(id); if (!p) return false;
    let changed = false;
    for (const k of ['name', 'skin', 'avatar']) if (changes[k] !== undefined && changes[k] !== p[k]) { p[k] = changes[k]; changed = true; }
    if (changed) this.revision++;
    return changed;
  }
  offer(person, now = Date.now()) {
    const old = this.find(person.id);
    if (old) { this.update(person.id, person); return old; }
    const value = { ...person, queuedAt: now };
    if (this.people.size >= ENTRANCE_SIZE) {
      // A genuine new arrival is visible promptly. Reuse one far slot and keep
      // its previous occupant in the rotating data queue, with no data loss.
      const previous = [...this.people.values()].find(p => p.lineSlot === this.arrivalSlot);
      if (previous) {
        this.people.delete(previous.id); this.waiting.set(previous.id, previous);
        Object.assign(value, { lineSlot: previous.lineSlot, shownAt: now, state: 'standing' });
        delete previous.lineSlot; this.people.set(value.id, value);
        this.arrivalSlot = FRONT_SIZE + 1 + (this.arrivalSlot - FRONT_SIZE) % (ENTRANCE_SIZE - FRONT_SIZE);
        this.revision++; return value;
      }
    }
    this.waiting.set(value.id, value); this.revision++; this.fill(now); return value;
  }
  fill(now) {
    const used = new Set([...this.people.values()].map(v => v.lineSlot));
    for (let slot = 1; slot <= ENTRANCE_SIZE && this.waiting.size; slot++) {
      if (used.has(slot)) continue;
      const [id, p] = this.waiting.entries().next().value; this.waiting.delete(id);
      Object.assign(p, { lineSlot: slot, shownAt: now, state: 'standing' });
      this.people.set(id, p); this.revision++;
    }
  }
  remove(id) {
    id = String(id); const removed = this.people.delete(id) || this.waiting.delete(id);
    if (removed) this.revision++; return removed;
  }
  tick(now = Date.now()) {
    this.fill(now);
    if (!this.waiting.size || now - this.lastRotation < ENTRANCE_ROTATE_MS) return;
    this.lastRotation = now;
    // Swap only one far row. Retired avatars return to the data queue's tail.
    const row = Math.floor(now / ENTRANCE_ROTATE_MS) % 3;
    const swap = [...this.people.values()].filter(p => p.lineSlot > FRONT_SIZE && Math.floor((p.lineSlot - FRONT_SIZE - 1) / 26) === row);
    const available = Math.min(swap.length, this.waiting.size);
    for (const old of swap.slice(0, available)) {
      const [id, next] = this.waiting.entries().next().value; this.waiting.delete(id);
      this.people.delete(old.id);
      Object.assign(next, { lineSlot: old.lineSlot, shownAt: now, state: 'standing' }); this.people.set(id, next);
      delete old.lineSlot; this.waiting.set(old.id, old);
    }
    this.revision++;
  }
  clear() { this.people.clear(); this.waiting.clear(); this.lastRotation = 0; this.arrivalSlot = FRONT_SIZE + 1; this.revision++; }
  serialize() { return [...this.people.values(), ...this.waiting.values()]; }
  snapshot(now = Date.now()) {
    const all = this.serialize(), demo = all.filter(p => p.demo).length;
    return { people: [...this.people.values()].sort((a, b) => a.lineSlot - b.lineSlot), waiting: this.waiting.size,
      total: all.length, realTotal: all.length - demo, demoTotal: demo, serverTime: now };
  }
}
