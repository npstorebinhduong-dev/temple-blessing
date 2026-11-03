import { Seating } from './seating.js';
import { RitualQueue } from './ritual-queue.js';
import { EntranceLine, entrancePosition } from './entrance-line.js';
import { isSmall } from './gift-catalog.js';
import { PrayerQueue } from './prayer-queue.js';
export const DEFAULTS = Object.freeze({
  title: 'พระพิฆเนศ', subtitle: 'โอม ศรี คเณศายะ นะมะฮา',
  voice: 'th-TH-PremwadeeNeural', voiceEnabled: true, pitch: -5, rate: -8,
  music: true, musicLoop: true, musicVolume: 60, volume: 35, joinOnEnter: true, joinOnChat: false,
  effectsEnabled: true, effectsVolume: 75, voiceVolume: 100,
  mushikaGiftId: '6267', mushikaGiftName: '', mushikaGiftIcon: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/148eef0884fdb12058d1c6897d1e02b9~tplv-obj.webp',
  infoPanelX: 54, infoPanelY: 210,
  safeTop:0,safeBottom:0,giftCatalog:{},
  galaxyGiftId: '11046', galaxyGiftName: '',
  galaxyGiftIcon: 'https://p16-webcast.tiktokcdn.com/img/maliva/webcast-va/resource/79a02148079526539f7599150da9fd28.png~tplv-obj.webp',
  cinematicZoom: true, petalMode: 'full',
  goal: 4995, giftMap: '', characterMode: 'mixed',
  idlePrompts: true, idleEverySec: 10, ambientCrowd: true, statueMotion: true, statueMotionLevel: 'clear',
});
// Synthetic Thai demonstration names; never import names from a reference LIVE.
export const DEMO_NAMES = ['ศิริพร', 'น้องพลอย', 'มาลี', 'ธนกฤต', 'อรทัย', 'วารุณี',
  'พิมพ์ชนก', 'ณัฐชา', 'สมพร', 'ดวงใจ', 'ขวัญ', 'น้ำฝน', 'มณีรัตน์', 'น้องแก้ม',
  'สิริ', 'กัญญา', 'ศุภชัย', 'เมย์', 'รัตนา', 'นภัส', 'อรอุมา', 'น้องฟ้า', 'พลอย', 'นิดา'];
export const positive = (value, max = Number.MAX_SAFE_INTEGER) => Number.isFinite(Number(value))
  ? Math.max(1, Math.min(max, Math.floor(Number(value)))) : 1;
const nonnegative = value => Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
const graphemes = new Intl.Segmenter('th', { granularity: 'grapheme' });
export const cleanName = value => [...graphemes.segment(String(value || 'ผู้ร่วมบูชา').normalize('NFC'))].slice(0, 48).map(x => x.segment).join('');
export function defaultSkin(id, mode = 'mixed') {
  if (['male', 'female'].includes(mode)) return mode;
  const hash = Array.from(String(id)).reduce((sum, c) => (sum * 31 + c.codePointAt(0)) >>> 0, 0);
  return hash % 2 ? 'male' : 'female';
}
export function skinFromComment(text) {
  const value = String(text || '').normalize('NFKC').trim().toLocaleLowerCase();
  if (['2', '๒', 'ชาย', 'ผู้ชาย', 'male', 'nam'].includes(value)) return 'male';
  if (['1', '๑', 'หญิง', 'ผู้หญิง', 'female', 'nữ'].includes(value)) return 'female';
  return null;
}

export class Room {
  constructor(saved = {}, { ambient = true, now = Date.now() } = {}) {
    this.prayers=new PrayerQueue(saved.prayers);this.prayerDisplay=new RitualQueue();this.prayerDisplay.restore(saved.prayerDisplay);this.eventSeen=new Map(saved.eventSeen||[]);this.comboSeen=new Map(saved.comboSeen||[]);
    this.seating = new Seating({ ambient, now }); this.rituals = new RitualQueue(); this.entrance = new EntranceLine(saved.entrance); this.donors = new Map(); this.choices = new Map(saved.choices || []);
    this.seating.restore(saved.seating, now); this.rituals.restore(saved.rituals);
    this.stats = { coins: nonnegative(saved.stats?.coins), gifts: nonnegative(saved.stats?.gifts), likes: nonnegative(saved.stats?.likes) };
    this.startedAt = Number(saved.startedAt) || Date.now();
    for (const d of Array.isArray(saved.donors) ? saved.donors : []) {
      if (typeof d.id === 'string' && d.id && Number.isFinite(d.coins) && d.coins > 0)
        this.donors.set(d.id, { id: d.id, name: cleanName(d.name), coins: Math.floor(d.coins) });
    }
  }
  get viewers() { return this.seating.viewers; }
  find(id) { return this.seating.find(String(id)); }
  clearScene(ambient = true) { this.seating = new Seating({ ambient }); this.rituals.clear(); this.entrance.clear(); this.prayers.clear(); this.prayerDisplay.clear(); }
  enter(id, name, { avatar = '', demo = false, skin, now = Date.now() } = {}) {
    const existing = this.find(id);
    if (!id || existing && existing.seatState !== 'waiting') return null;
    id = String(id);
    return this.entrance.offer({ id, name: cleanName(name), avatar, demo,
      skin: existing?.skin || skin || this.entrance.find(id)?.skin || this.choices.get(id) || defaultSkin(id) }, now);
  }
  takeEntrance(viewer) {
    const standing = this.entrance.find(viewer.id);
    if (standing) { viewer.entryFrom = entrancePosition(standing.lineSlot || 5); viewer.entryLineSlot = standing.lineSlot || 5; }
    this.entrance.remove(viewer.id);
  }
  join(id, name, { avatar = '', demo = false, skin, now = Date.now() } = {}) {
    if (!id) return null;
    id = String(id);
    const viewer = { id, name: cleanName(name), avatar, demo, skin: ['male', 'female'].includes(skin) ? skin : this.find(id)?.skin || this.entrance.find(id)?.skin || this.choices.get(id) || defaultSkin(id), coins: this.donors.get(id)?.coins || 0 };
    const result = this.seating.offer(viewer, now);
    if (result.viewer.slot && !result.overflow) this.takeEntrance(result.viewer);
    return result;
  }
  gift(id, name, count, unitCoins, now = Date.now()) {
    count = positive(count, 9999); unitCoins = positive(unitCoins, 50000);
    const coins = count * unitCoins;
    const donor = this.donors.get(id) || { id, name: cleanName(name), coins: 0 };
    donor.name = cleanName(name); donor.coins += coins; this.donors.set(id, donor);
    this.stats.coins += coins; this.stats.gifts += count;
    const viewer = this.find(id);
    if (viewer) { viewer.coins = donor.coins; viewer.lastGiftAt = now; }
    return { count, unitCoins, coins, total: donor.coins };
  }
  top() { return [...this.donors.values()].sort((a, b) => b.coins - a.coins).slice(0, 5); }
  advance(now = Date.now()) {
    this.rituals.prune(now);
    const head = this.rituals.pending[0], events = [];
    // A donor can have left while their second turn was queued. Bring them
    // back through the same admission path, retaining the ceremony's order.
    if (head && !this.find(head.id)) events.push(...this.join(head.id, head.name, { skin: this.choices.get(head.id) || head.skin, now }).events);
    // Protect only the active donor and the next donor. Protecting every later
    // turn deadlocks a full room when the FIFO head is waiting outside.
    const protectedIds = new Set([head, this.rituals.active].filter(Boolean).map(v => v.id));
    events.push(...this.seating.tick(now, protectedIds));
    for (const event of events) if (event.t === 'join') this.takeEntrance(event.v);
    this.entrance.tick(now, new Set(this.seating.waiting.keys()));
    const previous = this.rituals.active;
    const active = this.rituals.tick(now, item => {
      const v = this.seating.actors.get(item.id);
      return v && (v.seatState === 'seated' || isSmall(item.ritual.kind) && v.seatState === 'arriving');
    });
    const previousBanner=this.prayerDisplay.active;
    const large=active&&!isSmall(active.ritual.kind);
    if(large)this.prayerDisplay.pause();
    else this.prayerDisplay.tick(now);
    if(previousBanner!==this.prayerDisplay.active)events.push({t:'prayer-banner',active:this.prayerDisplay.active,serverTime:now});
    if (previous !== active) events.push({ t: 'ritual', active, serverTime: now, queued: this.rituals.pending.length });
    return events;
  }
  serialize() { return { stats: this.stats, donors: [...this.donors.values()], startedAt: this.startedAt,
    prayers:this.prayers.serialize(),prayerDisplay:this.prayerDisplay.serialize(),eventSeen:[...this.eventSeen],comboSeen:[...this.comboSeen],
    entrance: this.entrance.serialize(), seating: this.seating.serialize(), rituals: this.rituals.serialize(), choices: [...this.choices] }; }
}
