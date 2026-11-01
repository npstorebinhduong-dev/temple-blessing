export const IDLE_PROMPTS = Object.freeze([
  'ถ้าชอบบรรยากาศนี้ ฝากกดหัวใจและแชร์ไลฟ์ให้เพื่อน ๆ ด้วยนะคะ',
  'มาร่วมส่งกำลังใจ กดหัวใจและแชร์ไลฟ์ให้คนที่คุณรักกันนะคะ',
  'ขอบคุณที่อยู่ด้วยกัน ฝากกดหัวใจและแชร์ช่วงเวลาดี ๆ นี้ด้วยนะคะ',
]);
const WISHES = ['ขอให้วันนี้เต็มไปด้วยความสุขและสิ่งดี ๆ', 'ขอให้คุณและครอบครัวมีความสุขและสุขภาพแข็งแรง', 'ขอให้ก้าวผ่านอุปสรรคและมีกำลังใจในทุกวัน'];
const LABELS = { lotus: 'ดอกบัว', incense: 'กำยาน', garland: 'พวงมาลัย', aarti: 'แสงอารตี', marigold: 'พวงมาลัยดอกดาวเรือง', royal: 'เครื่องบูชาพระพิฆเนศ' };
export function blessingForGift(name, kind, sequence = 0) {
  const spoken = String(name || '').normalize('NFC').replace(/[^\p{L}\p{M}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 80) || 'ผู้ร่วมบูชา';
  const gift = LABELS[kind] || 'ของขวัญ';
  const wish = kind === 'marigold' ? 'ขอพรจากองค์พระพิฆเนศ ให้การงานราบรื่นและมีสิ่งดี ๆ เข้ามาในชีวิต'
    : kind === 'royal' ? 'ขอพรจากองค์พระพิฆเนศ ให้คุณและครอบครัวมีความสุข ความเจริญ และก้าวผ่านอุปสรรคทั้งปวง'
    : WISHES[Math.abs(sequence) % WISHES.length];
  return `ขอบคุณคุณ${spoken}สำหรับ${gift} ${wish}`;
}
export class EngagementClock {
  constructor(now = Date.now()) { this.reset(now); }
  reset(now) { this.lastGiftAt = now; this.lastPromptAt = now; this.sequence = 0; }
  gift(now) { this.lastGiftAt = now; this.lastPromptAt = now; }
  tick(now, { enabled = true, intervalMs = 10000 } = {}) {
    if (!enabled || now - this.lastGiftAt < intervalMs || now - this.lastPromptAt < intervalMs) return null;
    this.lastPromptAt = now;
    return { text: IDLE_PROMPTS[this.sequence++ % IDLE_PROMPTS.length], lastGiftAt: this.lastGiftAt, at: now };
  }
  snapshot() { return { lastGiftAt: this.lastGiftAt }; }
}
export class SpeechQueue {
  constructor(limit = 5) { this.limit = limit; this.pending = []; }
  push(job, busyTag = '') {
    if (job.tag === 'idle') {
      if (busyTag || this.pending.length) return false;
    } else this.pending = this.pending.filter(item => item.tag !== 'idle');
    if (this.pending.length >= this.limit) return false;
    this.pending.push(job); return true;
  }
  shift() { return this.pending.shift(); }
  clear() { this.pending.length = 0; }
  get length() { return this.pending.length; }
}
