// Stable places belong to the scene, never to an array index in the viewer list.
export const SEAT_COUNT = 60;
export const AMBIENT_COUNT = 10;
export const ENTRY_MS = 8000;
export const EXIT_MS = 5200;
export const MIN_STAY_MS = 12000;
// Waiting records are data, not render objects. Do not discard a paid turn.
export const MAX_WAITING = Infinity;

export class Seating {
  constructor({ ambient = true, now = Date.now() } = {}) {
    this.actors = new Map(); this.waiting = new Map();
    this.ambientEnabled = false; this.nextExitAt = 0;
    this.setAmbient(ambient, now);
  }
  find(id) { return this.actors.get(id) || this.waiting.get(id); }
  restore(saved, now) {
    if (!saved || !Array.isArray(saved.actors) || !Array.isArray(saved.waiting)) return;
    this.actors.clear(); this.waiting.clear(); const slots = new Set();
    for (const p of saved.actors) if (typeof p?.id === 'string' && Number.isInteger(p.slot) && p.slot >= 1 && p.slot <= SEAT_COUNT && !slots.has(p.slot) && (!p.ambient || this.ambientEnabled)) {
      const { exitAt, exitUntil, returning, ...stable } = p;
      slots.add(p.slot); this.actors.set(p.id, { ...stable, seatState: 'seated', seatedAt: Math.min(now, p.seatedAt ?? now) });
    }
    for (const p of saved.waiting) if (typeof p?.id === 'string' && !this.actors.has(p.id)) this.waiting.set(p.id, { ...p, seatState: 'waiting', slot: undefined });
  }
  serialize() { return { actors: [...this.actors.values()], waiting: [...this.waiting.values()] }; }
  get viewers() { return new Map([...this.actors].filter(([, v]) => !v.ambient)); }
  setAmbient(enabled, now = Date.now()) {
    if (enabled === this.ambientEnabled) return [];
    this.ambientEnabled = enabled;
    const events = [];
    if (enabled) {
      const used = new Map([...this.actors.values()].map(v => [v.slot,v]));
      for (let i = 0; i < AMBIENT_COUNT; i++) {
        const old = used.get(i+1);
        if (old?.ambient && old.seatState === 'leaving') {
          old.seatState = 'seated'; delete old.exitAt; delete old.exitUntil;
          events.push({ t: 'settle', v: old });
        }
        if (used.has(i + 1)) continue;
        const v = { id: `@scene/ambient/${i}`, name: '', ambient: true, skin: i % 2 ? 'male' : 'female', coins: 0,
          slot: i + 1, seatState: 'seated', admittedAt: now - ENTRY_MS, seatedAt: now - MIN_STAY_MS - 1 };
        this.actors.set(v.id, v); events.push({ t: 'join', v });
      }
    } else {
      for (const v of this.actors.values()) if (v.ambient && v.seatState !== 'leaving') events.push(this.depart(v, now));
    }
    return events;
  }
  freeSlot() {
    const used = new Set([...this.actors.values()].map(v => v.slot));
    // Slots 1–10 start with background figures. Real arrivals fill 11–60 first.
    for (let i = 10; i < 70; i++) { const slot = i % SEAT_COUNT + 1; if (!used.has(slot)) return slot; }
    return null;
  }
  admit(v, slot, now) {
    Object.assign(v, { slot, seatState: 'arriving', admittedAt: now, seatedAt: now + ENTRY_MS });
    delete v.exitAt; delete v.exitUntil; delete v.entryFrom;
    this.actors.set(v.id, v); return { t: 'join', v };
  }
  offer(person, now = Date.now()) {
    const old = this.find(person.id);
    if (old) {
      Object.assign(old, { name: person.name, skin: person.skin, coins: person.coins, lastAt: now });
      if (person.avatar) old.avatar = person.avatar;
      // An actor already walking out finishes leaving, then rejoins the FIFO.
      if (old.seatState === 'leaving') old.returning = true;
      return { viewer: old, isNew: false, waiting: this.waiting.has(old.id), events: [{ t: 'character', v: old }] };
    }
    const v = { ...person, lastAt: now, queuedAt: now, seatState: 'waiting' };
    const slot = this.waiting.size ? null : this.freeSlot();
    if (slot !== null) return { viewer: v, isNew: true, waiting: false, events: [this.admit(v, slot, now)] };
    if (this.waiting.size >= MAX_WAITING) return { viewer: v, overflow: true, events: [] };
    this.waiting.set(v.id, v);
    return { viewer: v, isNew: true, waiting: true, events: [] };
  }
  depart(v, now) {
    Object.assign(v, { seatState: 'leaving', exitAt: now, exitUntil: now + EXIT_MS });
    return { t: 'depart', v };
  }
  tick(now = Date.now(), protectedIds = new Set()) {
    const events = [];
    for (const v of this.actors.values()) {
      if (v.seatState === 'arriving' && now >= v.seatedAt) v.seatState = 'seated';
      if (v.seatState !== 'leaving' || now < v.exitUntil) continue;
      this.actors.delete(v.id); events.push({ t: 'leave', id: v.id });
      if (v.returning && this.waiting.size < MAX_WAITING) {
        delete v.returning; v.seatState = 'waiting'; v.queuedAt = now; delete v.slot;
        this.waiting.set(v.id, v);
      }
    }
    while (this.waiting.size) {
      const slot = this.freeSlot(); if (slot === null) break;
      const [id, v] = this.waiting.entries().next().value;
      this.waiting.delete(id); events.push(this.admit(v, slot, now));
    }
    const leaving = [...this.actors.values()].filter(v => v.seatState === 'leaving').length;
    if (this.waiting.size > leaving && leaving < 2 && now >= this.nextExitAt) {
      const oldest = [...this.actors.values()]
        .filter(v => v.seatState === 'seated' && now - v.seatedAt >= MIN_STAY_MS && !protectedIds.has(v.id))
        // A fresh gift renews priority; chat/name updates do not. Background
        // actors and optional chat admissions fall back to their seated time.
        .sort((a, b) => (a.lastGiftAt ?? a.seatedAt) - (b.lastGiftAt ?? b.seatedAt)
          || a.seatedAt - b.seatedAt || a.slot - b.slot)[0];
      if (oldest) { events.push(this.depart(oldest, now)); this.nextExitAt = now + 1200; }
    }
    return events;
  }
  summary() {
    const actors = [...this.actors.values()];
    return { seated: actors.filter(v => !v.ambient).length, ambient: actors.filter(v => v.ambient).length,
      waiting: this.waiting.size, departing: actors.filter(v => v.seatState === 'leaving').length };
  }
}

// Background figures are spread across the floor. Remaining places fill from
// the front, without ever changing coordinates when the crowd grows.
export function seatLayout() {
  const seats = [];
  for (let row = 0; row < 6; row++) {
    const t = row / 5, half = 305 + 135 * t;
    for (let col = 0; col < 10; col++) {
      let u = (col - 4.5) / 4.5; u = Math.sign(u) * (.12 + .88 * Math.abs(u));
      seats.push({ x: 540 + u * half, y: 1230 + t * 480, depth: t, gap: half * 1.8 / 9, density: Math.pow(.6, .6), row, col });
    }
  }
  const ambient = seats.filter(s => s.row === 5 && [1,3,6,8].includes(s.col) || s.row === 3 && [1,4,5,8].includes(s.col) || s.row === 1 && [2,7].includes(s.col));
  const rest = seats.filter(s => !ambient.includes(s)).sort((a, b) => b.row - a.row || Math.abs(a.x - 540) - Math.abs(b.x - 540));
  return [...ambient.sort((a,b) => b.row-a.row || a.col-b.col), ...rest];
}

export function exitPose(seat, elapsedMs) {
  const t = Math.max(0, elapsedMs / 1000), sign = seat.x < 540 ? -1 : 1;
  const edge = sign < 0 ? 55 : 1025;
  if (t < .8) return { x: seat.x, y: seat.y, frame: 7 - Math.min(3, Math.floor(t / .2)), walking: false, alpha: 1 };
  const sideways = Math.min(1, (t - .8) / 1.6), out = Math.max(0, Math.min(1, (t - 2.4) / 2.8));
  return { x: seat.x + (edge - seat.x) * sideways, y: seat.y + (2030 - seat.y) * out,
    frame: Math.floor(t * 7) % 4, walking: true, alpha: Math.min(1, Math.max(0, (5.2 - t) / .7)) };
}
