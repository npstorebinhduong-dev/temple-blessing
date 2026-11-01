// Fallback tiers use ONE gift's unit value, never a streak's total.
// Real gift IDs can override these tiers after observing a TikFinity event.
export const RITUALS = Object.freeze({
  lotus: { kind: 'lotus', label: 'ถวายดอกบัว', icon: '🪷', duration: 3200 },
  incense: { kind: 'incense', label: 'ถวายกำยาน', icon: '🕯️', duration: 4200 },
  garland: { kind: 'garland', label: 'ถวายพวงมาลัย', icon: '🌼', duration: 5000 },
  aarti: { kind: 'aarti', label: 'อารตีบูชา', icon: '🔥', duration: 6500 },
});

export function parseGiftMap(text) {
  const map = Object.create(null);
  for (const line of String(text || '').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const match = line.trim().match(/^(\d{1,20})\s*=\s*(lotus|incense|garland|aarti)$/);
    if (!match) throw new Error('Mỗi dòng cần có dạng ID=lotus, incense, garland hoặc aarti.');
    map[match[1]] = match[2];
    if (Object.keys(map).length > 100) throw new Error('Tối đa 100 ID quà.');
  }
  return map;
}

export function giftRitual(_name, unitCoins, giftId = '', overrides = {}) {
  const value = Math.max(1, Number(unitCoins) || 1);
  const mapped = Object.hasOwn(overrides, String(giftId)) ? overrides[String(giftId)] : null;
  const kind = mapped && Object.hasOwn(RITUALS, mapped) ? mapped
    : value >= 500 ? 'aarti' : value >= 100 ? 'garland' : value >= 10 ? 'incense' : 'lotus';
  return { ...RITUALS[kind] };
}
