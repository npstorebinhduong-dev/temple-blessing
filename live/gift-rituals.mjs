// Identify the gift by ID or exact name AND the price of ONE gift.
import { RITUAL_TIMING } from './ritual-timing.js';
import { GIFTS } from './gift-catalog.js';
const RETIRED_IDS = new Set(['9875','5658']);
// Corroborated public catalogs; Thai account availability still needs a LIVE test.
// See docs/QUA-MOI.md for immutable source links. Corgi is the selected 299 gift.
export const GALAXY_GIFT_ID = '11046';
export const CORGI_GIFT_ID = '6267';
export const RITUALS = Object.freeze({
  lamp: {kind:'lamp',label:'จุดประทีป',unitCoins:1,duration:RITUAL_TIMING.lamp.duration,station:true,procession:true},
  fragrance: {kind:'fragrance',label:'กำยาน',unitCoins:5,duration:RITUAL_TIMING.fragrance.duration,station:true,procession:true},
  prayer: {kind:'prayer',label:'คำอธิษฐาน',unitCoins:30,duration:RITUAL_TIMING.prayer.duration,station:true,procession:true},
  lotus: { kind: 'lotus', label: 'ถวายดอกบัว', icon: '🪷', unitCoins: 1, duration: RITUAL_TIMING.lotus.duration, station:true, procession:true },
  incense: { kind: 'incense', label: 'ถวายกำยาน', icon: '🕯️', unitCoins: 5, duration: RITUAL_TIMING.incense.duration, station:true, procession:true },
  marigold: { kind: 'marigold', label: 'ถวายพวงมาลัยดอกดาวเรือง', icon: '🏵️', unitCoins: 100,
    feature: 'Golden Marigold Offering', duration: RITUAL_TIMING.marigold.duration, procession: true },
  royal: { kind: 'royal', label: 'มหาบูชาพระพิฆเนศ', icon: '🪔', unitCoins: 500,
    feature: 'Royal Ganesha Offering', duration: RITUAL_TIMING.royal.duration, procession: true },
  mushika: { kind: 'mushika', label: 'ฝากคำอธิษฐานกับมุสิกะ', icon: '✧', unitCoins: 299,
    duration: RITUAL_TIMING.mushika.duration, procession: true },
  galaxy: { kind: 'galaxy', label: 'พรจากพระพิฆเนศ', icon: '✧', unitCoins: 1000,
    duration: RITUAL_TIMING.galaxy.duration, procession: true },
});
export function parseGiftMap(text) {
  const map = Object.create(null);
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.trim().match(/^(\d{1,20})\s*=\s*([a-z]+)$/);
    if (!match || RETIRED_IDS.has(match[1]) || !Object.hasOwn(RITUALS,match[2])) throw new Error('ID quà không hợp lệ. Các loại: '+Object.keys(RITUALS).join(', '));
    if (Object.hasOwn(map, match[1]) && map[match[1]] !== match[2]) throw new Error(`ID ${match[1]} đang được gắn cho hai hiệu ứng khác nhau.`);
    map[match[1]] = match[2];
    if (Object.keys(map).length > 100) throw new Error('Tối đa 100 ID quà.');
  }
  return map;
}
// Strip retired slots before validating old saved settings; retain other settings,
// contribution totals and the four premium bindings exactly.
export function sanitizeGiftMap(text) {
  return String(text||'').split(/\r?\n/).filter(line=>{
    const [id,kind]=line.trim().split(/\s*=\s*/);
    return !['garland','aarti','floral','light'].includes(kind) && !RETIRED_IDS.has(id);
  }).join('\n');
}
const normalize = name => String(name || '').normalize('NFKC').toLocaleLowerCase().trim()
  .replace(/[\u200B-\u200D\u2060\uFEFF\uFE0E\uFE0F]/g, '').replace(/[‐‑‒–—−-]/g, ' ').replace(/\s+/g, ' ');
const ROSES = ['Rose', 'Roses', 'Hoa hồng', 'Hoa hong', 'กุหลาบ', 'ดอกกุหลาบ'].map(normalize);
const BOUQUETS = ['Bouquet', 'Flower Bouquet', 'Bó hoa', 'Bo hoa', 'ช่อดอกไม้'].map(normalize);
const NAMES = {
  lotus: ROSES,
  incense: ['Peach', 'Peaches', 'Quả đào', 'Qua dao', 'Đào', 'พีช', 'ลูกพีช', 'ลูกท้อ'].map(normalize),
  marigold: BOUQUETS,
  royal: ['Love Balloon', 'Love Balloons', 'Bóng tình yêu', 'Bong bóng tình yêu', 'Bong tinh yeu', 'Bong bong tinh yeu', 'บอลลูนแห่งความรัก', 'บอลลูนความรัก', 'ลูกโป่งความรัก'].map(normalize),
  mushika: ['Corgi'].map(normalize),
  galaxy: ['Galaxy'].map(normalize),
};
export function giftRitual(name, unitCoins, giftId = '', overrides = {}) {
  const value = Number(unitCoins), id = String(giftId);
  if (RETIRED_IDS.has(id)) return null;
  if (Object.hasOwn(overrides, id)) {
    const mapped = RITUALS[overrides[id]];
    return mapped && mapped.unitCoins === value ? { ...mapped } : null;
  }
  // Once a slot has specific IDs, its name/price fallback is disabled.
  const bound = new Set(Object.entries(overrides).filter(([id])=>!id.startsWith('demo:')).map(([,kind])=>kind));
  const catalog=GIFTS.find(g=>g.id===id&&!bound.has(g.kind));
  if(catalog)return value===catalog.coins?{...RITUALS[catalog.kind]}:null;
  if (!bound.has('mushika') && id === CORGI_GIFT_ID) return value === 299 ? { ...RITUALS.mushika } : null;
  if (!bound.has('galaxy') && id === GALAXY_GIFT_ID) return value === 1000 ? { ...RITUALS.galaxy } : null;
  const kind = Object.keys(NAMES).find(k => !bound.has(k) && RITUALS[k].unitCoins === value && NAMES[k].includes(normalize(name)));
  // Unmatched gifts still count; price alone never selects a ritual.
  return kind ? { ...RITUALS[kind] } : null;
}
