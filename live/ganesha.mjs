import { Seating } from './seating.js';
import { RitualQueue } from './ritual-queue.js';
export const DEFAULTS = Object.freeze({
  title: 'พระพิฆเนศ', subtitle: 'โอม ศรี คเณศายะ นะมะฮา',
  voice: 'th-TH-PremwadeeNeural', voiceEnabled: true, pitch: -5, rate: -8,
  music: true, musicLoop: true, musicVolume: 60, volume: 35, joinOnEnter: false, joinOnChat: false,
  cinematicZoom: true, petalMode: 'full',
  goal: 4995, giftMap: '', characterMode: 'mixed',
  idlePrompts: true, idleEverySec: 10, ambientCrowd: true, statueMotion: true,
});
export const DEMO_NAMES = ['ศิริพร', 'น้องพลอย', 'มาลี', 'ธนกฤต', 'อรทัย', 'Mi Sirijan',
  'พิมพ์ชนก', 'ณัฐชา', 'สมพร', 'ดวงใจ', 'Kwan', 'น้ำฝน', 'มณีรัตน์', 'น้องแก้ม',
  'Siri', 'กัญญา', 'ศุภชัย', 'May', 'รัตนา', 'นภัส', 'อรอุมา', 'น้องฟ้า', 'Ploy', 'นิดา'];
export const positive = (value, max = Number.MAX_SAFE_INTEGER) => Number.isFinite(Number(value))
  ? Math.max(1, Math.min(max, Math.floor(Number(value)))) : 1;
const nonnegative = value => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
export const cleanName = value => Array.from(String(value || 'ผู้ร่วมบูชา').normalize('NFC')).slice(0, 48).join('');
export function defaultSkin(id, mode = 'mixed') {
  if (['male', 'female'].includes(mode)) return mode;
  const hash = Array.from(String(id)).reduce((sum, c) => (sum * 31 + c.codePointAt(0)) >>> 0, 0);
  return hash % 2 ? 'male' : 'female';
}
export function skinFromComment(text) {
  const value = String(text || '').normalize('NFC').trim().toLocaleLowerCase();
  if (['ชาย', 'ผู้ชาย', 'male', 'nam'].includes(value)) return 'male';
  if (['หญิง', 'ผู้หญิง', 'female', 'nữ'].includes(value)) return 'female';
  return null;
}

export class Room {
  constructor(saved = {}, { ambient = true, now = Date.now() } = {}) {
    this.seating = new Seating({ ambient, now }); this.rituals = new RitualQueue(); this.donors = new Map(); this.choices = new Map();
    this.stats = { coins: nonnegative(saved.stats?.coins), gifts: nonnegative(saved.stats?.gifts), likes: nonnegative(saved.stats?.likes) };
    this.startedAt = Number(saved.startedAt) || Date.now();
    for (const d of Array.isArray(saved.donors) ? saved.donors : []) {
      if (typeof d.id === 'string' && d.id && Number.isFinite(d.coins) && d.coins > 0)
        this.donors.set(d.id, { id: d.id, name: cleanName(d.name), coins: Math.floor(d.coins) });
    }
  }
  get viewers() { return this.seating.viewers; }
  find(id) { return this.seating.find(String(id)); }
  clearScene(ambient = true) { this.seating = new Seating({ ambient }); this.rituals.clear(); }
  join(id, name, { avatar = '', demo = false, skin, now = Date.now() } = {}) {
    if (!id) return null;
    id = String(id);
    const viewer = { id, name: cleanName(name), avatar, demo, skin: ['male', 'female'].includes(skin) ? skin : this.find(id)?.skin || defaultSkin(id), coins: this.donors.get(id)?.coins || 0 };
    return this.seating.offer(viewer, now);
  }
  gift(id, name, count, unitCoins) {
    count = positive(count, 9999); unitCoins = positive(unitCoins, 50000);
    const coins = count * unitCoins;
    const donor = this.donors.get(id) || { id, name: cleanName(name), coins: 0 };
    donor.name = cleanName(name); donor.coins += coins; this.donors.set(id, donor);
    this.stats.coins += coins; this.stats.gifts += count;
    const viewer = this.find(id); if (viewer) viewer.coins = donor.coins;
    return { count, unitCoins, coins, total: donor.coins };
  }
  top() { return [...this.donors.values()].sort((a, b) => b.coins - a.coins).slice(0, 5); }
  advance(now = Date.now()) {
    this.rituals.prune(now);
    const protectedIds = new Set([...this.rituals.pending, this.rituals.active].filter(Boolean).map(v => v.id));
    const events = this.seating.tick(now, protectedIds);
    const previous = this.rituals.active;
    const active = this.rituals.tick(now, item => {
      const v = this.seating.actors.get(item.id);
      return v && v.seatState !== 'leaving';
    });
    if (previous !== active) events.push({ t: 'ritual', active, serverTime: now, queued: this.rituals.pending.length });
    return events;
  }
  serialize() { return { stats: this.stats, donors: [...this.donors.values()], startedAt: this.startedAt }; }
}
