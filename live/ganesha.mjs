export const DEFAULTS = Object.freeze({
  title: 'พระพิฆเนศ', subtitle: 'โอม ศรี คเณศายะ นะมะฮา',
  voice: 'th-TH-PremwadeeNeural', voiceEnabled: true, pitch: -5, rate: -8,
  music: true, volume: 35, joinOnEnter: false, seatMode: 'auto',
  goal: 4995, giftMap: '', characterMode: 'mixed',
  idlePrompts: true, idleEverySec: 10, ambientCrowd: true, ambientAfterSec: 10, ambientTarget: 36,
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
  constructor(saved = {}) {
    this.viewers = new Map(); this.donors = new Map();
    this.stats = { coins: nonnegative(saved.stats?.coins), gifts: nonnegative(saved.stats?.gifts), likes: nonnegative(saved.stats?.likes) };
    this.startedAt = Number(saved.startedAt) || Date.now();
    for (const d of Array.isArray(saved.donors) ? saved.donors : []) {
      if (typeof d.id === 'string' && d.id && Number.isFinite(d.coins) && d.coins > 0)
        this.donors.set(d.id, { id: d.id, name: cleanName(d.name), coins: Math.floor(d.coins) });
    }
  }
  join(id, name, { avatar = '', demo = false, limit = 60, skin } = {}) {
    if (!id) return null;
    id = String(id);
    const existing = this.viewers.get(id);
    if (existing) {
      existing.lastAt = Date.now(); existing.name = cleanName(name);
      if (avatar) existing.avatar = avatar;
      if (['male', 'female'].includes(skin)) existing.skin = skin;
      return { viewer: existing, isNew: false, removed: null };
    }
    let removed = null;
    if (this.viewers.size >= limit) {
      const oldest = [...this.viewers.values()].sort((a, b) => a.lastAt - b.lastAt)[0];
      removed = oldest.id; this.viewers.delete(removed);
    }
    const viewer = { id, name: cleanName(name), avatar, demo, skin: ['male', 'female'].includes(skin) ? skin : defaultSkin(id), coins: this.donors.get(id)?.coins || 0, lastAt: Date.now() };
    this.viewers.set(id, viewer);
    return { viewer, isNew: true, removed };
  }
  gift(id, name, count, unitCoins) {
    count = positive(count, 9999); unitCoins = positive(unitCoins, 50000);
    const coins = count * unitCoins;
    const donor = this.donors.get(id) || { id, name: cleanName(name), coins: 0 };
    donor.name = cleanName(name); donor.coins += coins; this.donors.set(id, donor);
    this.stats.coins += coins; this.stats.gifts += count;
    const viewer = this.viewers.get(id); if (viewer) viewer.coins = donor.coins;
    return { count, unitCoins, coins, total: donor.coins };
  }
  top() { return [...this.donors.values()].sort((a, b) => b.coins - a.coins).slice(0, 5); }
  serialize() { return { stats: this.stats, donors: [...this.donors.values()], startedAt: this.startedAt }; }
}
