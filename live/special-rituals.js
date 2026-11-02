import { actorHeight } from './actor-geometry.js';
const clamp = v => Math.max(0, Math.min(1, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const mix = (a, b, v) => a + (b - a) * smooth(v);
// Mouse is on the low altar plinth. Anchor measured in the supplied PNG,
// not an approximate point at its head's centre.
export const MUSHIKA = Object.freeze({ x: 380, y: 940, width: 260, height: 260 * 1024 / 1536, earX: 459.6, earY: 979 });
// The old atlas contact at h=250 was (396 + .2544h, 1176 - .788h).
// Move the FEET to keep that same mouth/ear contact at the normal world stature.
// Never enlarge the donor or resize/move the mouse to make the contact fit.
const whisperHeight = actorHeight(MUSHIKA.earY);
export const WHISPER_PLACE = Object.freeze({ x: MUSHIKA.earX - .2544 * whisperHeight, y: MUSHIKA.earY + .788 * whisperHeight });
export const GALAXY_PLACE = Object.freeze({ x: 850, y: 1370 });
export function specialPose(kind, elapsedMs, from, seat, { untilMs = 20000, reduced = false } = {}) {
  const t = Math.max(0, elapsedMs) / 1000, p = { ...from, frame: 7, phase: 'rise', side: false, flip: false, lean: 0, focus: 0 };
  const end = untilMs / 1000, dest = kind === 'mushika' ? WHISPER_PLACE : GALAXY_PLACE;
  const arrival = kind === 'mushika' ? 3.7 : 4.2, backAt = kind === 'mushika' ? 12.1 : end - 3;
  const walk = () => { p.frame = Math.floor(t * 7) % 4; p.bob = reduced ? 0 : Math.sin(t * 7 * Math.PI / 2) * 1.2; };
  if (t < .7) p.frame = 7 - Math.min(3, Math.floor(t / .175));
  else if (t < 1.4) { p.phase = 'to-aisle'; p.x = mix(from.x, 540, (t - .7) / .7); walk(); }
  else if (t < arrival - .6) {
    p.phase = 'approach'; p.x = 540; p.y = mix(from.y, dest.y + 38, (t - 1.4) / (arrival - 2)); walk();
  } else if (t < arrival) {
    p.phase = 'align'; p.x = mix(540, dest.x, (t - arrival + .6) / .6); p.y = mix(dest.y + 38, dest.y, (t - arrival + .6) / .6); walk();
  } else if (t < backAt) {
    Object.assign(p, dest, { side: true, frame: 3, focus: 1, phase: 'blessing', flip: kind === 'galaxy' });
    if (kind === 'mushika') {
      if (t < 4.3) { p.phase = 'lean'; p.frame = t < 4 ? 0 : 1; p.lean = smooth((t - 3.7) / .6); }
      else if (t < 7.9) { p.phase = 'whisper'; p.frame = 2; p.lean = 1; }
      else if (t < 8.6) { p.phase = 'gather'; p.frame = 3; }
      else if (t < 10.2) { p.phase = 'light-stream'; p.frame = 3; }
      else if (t < 10.7) { p.phase = 'receive'; p.frame = 3; }
      else if (t < 11.8) { p.phase = 'reply'; p.frame = 3; }
      else { p.phase = 'wai'; p.frame = 3; }
    }
  } else if (t < end - .7) {
    p.phase = 'return'; const q = clamp((t - backAt) / (end - .7 - backAt));
    // Return through the clear central aisle, then to the original place.
    if (q < .22) { p.x = mix(dest.x, 540, q / .22); p.y = mix(dest.y, dest.y + 38, q / .22); }
    else if (q < .77) { p.x = 540; p.y = mix(dest.y + 38, seat.y, (q - .22) / .55); }
    else { p.x = mix(540, seat.x, (q - .77) / .23); p.y = seat.y; }
    walk();
  } else { p.phase = t >= end ? 'done' : 'settle'; p.x = seat.x; p.y = seat.y; p.frame = 4 + Math.min(3, Math.floor((t - end + .7) / .175)); }
  return p;
}
// Both new rituals deliberately retain a wide shot: mouse, transmission path,
// standing apparition and donor remain visible. The seated shrine stays fixed.
export function specialCamera() { return { scale: 1, x: 0, y: 0 }; }
export { clamp, smooth };
