// Identify the gift by ID or exact name AND the price of ONE gift.
export const RITUALS = Object.freeze({
  lotus: { kind: 'lotus', label: 'ถวายดอกบัว', icon: '🪷', unitCoins: 1, duration: 3200 },
  incense: { kind: 'incense', label: 'ถวายกำยาน', icon: '🕯️', unitCoins: 5, duration: 4200 },
  garland: { kind: 'garland', label: 'ถวายพวงมาลัย', icon: '🌼', unitCoins: 5, duration: 5000 },
  aarti: { kind: 'aarti', label: 'อารตีบูชา', icon: '🔥', unitCoins: 10, duration: 6500 },
  marigold: { kind: 'marigold', label: 'ถวายพวงมาลัยดอกดาวเรือง', icon: '🏵️', unitCoins: 100,
    feature: 'Golden Marigold Offering', duration: 20000, procession: true },
  royal: { kind: 'royal', label: 'มหาบูชาพระพิฆเนศ', icon: '🪔', unitCoins: 500,
    feature: 'Royal Ganesha Offering', duration: 24000, procession: true },
});
export function parseGiftMap(text) {
  const map = Object.create(null);
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.trim().match(/^(\d{1,20})\s*=\s*(lotus|incense|garland|aarti|marigold|royal)$/);
    if (!match) throw new Error('ID quà không hợp lệ. Các loại: lotus, incense, garland, aarti, marigold, royal.');
    if (Object.hasOwn(map, match[1]) && map[match[1]] !== match[2]) throw new Error(`ID ${match[1]} đang được gắn cho hai hiệu ứng khác nhau.`);
    map[match[1]] = match[2];
    if (Object.keys(map).length > 100) throw new Error('Tối đa 100 ID quà.');
  }
  return map;
}
const normalize = name => String(name || '').normalize('NFC').toLocaleLowerCase().trim().replace(/\s+/g, ' ');
const ROSES = ['Rose', 'Roses', 'Hoa hồng', 'Hoa hong', 'กุหลาบ', 'ดอกกุหลาบ'].map(normalize);
const BOUQUETS = ['Bouquet', 'Flower Bouquet', 'Bó hoa', 'Bo hoa', 'ช่อดอกไม้'].map(normalize);
const NAMES = {
  lotus: ROSES,
  incense: ['Peach', 'Peaches', 'Quả đào', 'Qua dao', 'Đào', 'พีช', 'ลูกพีช', 'ลูกท้อ'].map(normalize),
  garland: ['OK', 'Okay', 'OK Hand', 'Ok Hand Sign', 'โอเค'].map(normalize),
  aarti: ['Clover', 'Four Leaf Clover', 'Four-leaf Clover', 'Cỏ 4 lá', 'Cỏ bốn lá', 'Co 4 la', 'โคลเวอร์', 'ใบโคลเวอร์', 'โคลเวอร์สี่แฉก'].map(normalize),
  marigold: BOUQUETS,
  royal: ['Love Balloon', 'Love Balloons', 'Bóng tình yêu', 'Bong bóng tình yêu', 'Bong tinh yeu', 'Bong bong tinh yeu', 'บอลลูนแห่งความรัก', 'บอลลูนความรัก', 'ลูกโป่งความรัก'].map(normalize),
};
export function giftRitual(name, unitCoins, giftId = '', overrides = {}) {
  const value = Number(unitCoins), id = String(giftId);
  if (Object.hasOwn(overrides, id)) {
    const mapped = RITUALS[overrides[id]];
    return mapped && mapped.unitCoins === value ? { ...mapped } : null;
  }
  // Once a slot has specific IDs, its name/price fallback is disabled.
  const bound = new Set(Object.values(overrides));
  const kind = Object.keys(RITUALS).find(k => !bound.has(k) && RITUALS[k].unitCoins === value && NAMES[k].includes(normalize(name)));
  // Unmatched gifts still count; price alone never selects a ritual.
  return kind ? { ...RITUALS[kind] } : null;
}
