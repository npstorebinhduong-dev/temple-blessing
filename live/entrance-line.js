// A welcome line is independent of the sixty offering seats and their queue.
export const ENTRANCE_SIZE = 10;
export const ENTRANCE_WAITING_LIMIT = 200;
export const ENTRANCE_MIN_MS = 15000;
export const ENTRANCE_STAY_MS = 90000;
export const ENTRANCE_WAIT_MS = 300000;
export const ENTRANCE_EXIT_MS = 900;

export function entrancePosition(slot) {
  const index = Math.max(0, Math.min(ENTRANCE_SIZE - 1, Number(slot) - 1 || 0));
  return { x: 54 + index * 108, y: 1848, height: 128 };
}

export class EntranceLine {
  constructor() { this.people = new Map(); this.waiting = new Map(); this.revision = 0; this.nextExitAt = 0; }
  find(id) { return this.people.get(String(id)) || this.waiting.get(String(id)); }
  update(id, changes) {
    const person = this.find(id); if (!person) return false;
    let changed = false;
    for (const key of ['name', 'skin', 'avatar']) if (changes[key] !== undefined && changes[key] !== person[key]) {
      person[key] = changes[key]; changed = true;
    }
    if (changed) this.revision++;
    return changed;
  }
  offer(person, now = Date.now()) {
    const old = this.find(person.id);
    if (old) { this.update(person.id, person); return old; }
    if (this.waiting.size >= ENTRANCE_WAITING_LIMIT) return null;
    const value = { ...person, queuedAt: now };
    this.waiting.set(value.id, value); this.revision++; this.fill(now);
    return value;
  }
  fill(now) {
    const used = new Set([...this.people.values()].map(v => v.lineSlot));
    for (let slot = 1; slot <= ENTRANCE_SIZE && this.waiting.size; slot++) {
      if (used.has(slot)) continue;
      const [id, person] = this.waiting.entries().next().value;
      this.waiting.delete(id);
      Object.assign(person, { lineSlot: slot, shownAt: now, state: 'standing' });
      this.people.set(id, person); this.revision++;
    }
  }
  remove(id) {
    id = String(id);
    const removed = this.people.delete(id) || this.waiting.delete(id);
    if (removed) this.revision++;
    return removed;
  }
  clear() {
    if (this.people.size || this.waiting.size) this.revision++;
    this.people.clear(); this.waiting.clear(); this.nextExitAt = 0;
  }
  tick(now = Date.now(), protectedIds = new Set()) {
    for (const [id, person] of this.waiting) if (now - person.queuedAt >= ENTRANCE_WAIT_MS && !protectedIds.has(id)) this.remove(id);
    for (const [id, person] of this.people) {
      if (person.state === 'leaving' && protectedIds.has(id)) {
        person.state = 'standing'; delete person.exitAt; this.revision++;
      } else if (person.state === 'leaving' && now >= person.exitAt + ENTRANCE_EXIT_MS) this.remove(id);
    }
    this.fill(now);
    if (now < this.nextExitAt || [...this.people.values()].some(v => v.state === 'leaving')) return;
    const oldest = [...this.people.values()]
      .filter(v => !protectedIds.has(v.id) && (now - v.shownAt >= ENTRANCE_STAY_MS || this.waiting.size && now - v.shownAt >= ENTRANCE_MIN_MS))
      .sort((a, b) => a.shownAt - b.shownAt || a.lineSlot - b.lineSlot)[0];
    if (oldest) {
      oldest.state = 'leaving'; oldest.exitAt = now; this.nextExitAt = now + 1200; this.revision++;
    }
  }
  snapshot(now = Date.now()) {
    return { people: [...this.people.values()].sort((a, b) => a.lineSlot - b.lineSlot), waiting: this.waiting.size, serverTime: now };
  }
}
