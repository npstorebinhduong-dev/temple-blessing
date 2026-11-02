const clamp = v => Math.max(0, Math.min(1, v));
const smooth = v => { v = clamp(v); return v * v * (3 - 2 * v); };
const mix = (a, b, v) => a + (b - a) * smooth(v);
// Mouse is on the low altar plinth. Anchor measured in the supplied PNG,
// not an approximate point at its head's centre.
export const MUSHIKA = Object.freeze({ x: 380, y: 940, width: 260, height: 260 * 1024 / 1536, earX: 459.6, earY: 979 });
export const WHISPER_PLACE = Object.freeze({ x: 396, y: 1176, height: 250 });
export const GALAXY_PLACE = Object.freeze({ x: 792, y: 1320, height: 282 });
export function specialPose(kind, elapsedMs, from, seat, { untilMs = 20000, reduced = false } = {}) {
  const t = Math.max(0, elapsedMs) / 1000, p = { ...from, frame: 7, phase: 'rise', height: kind === 'mushika' ? 250 : 282, side: false, flip: false, lean: 0, focus: 0 };
  const end = untilMs / 1000, dest = kind === 'mushika' ? WHISPER_PLACE : GALAXY_PLACE;
  const arrival = kind === 'mushika' ? 3.7 : 4.2, backAt = kind === 'mushika' ? 9.7 : end - 3;
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
      else if (t < 9) { p.phase = 'light-stream'; p.frame = 2; p.lean = 1; }
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
export function specialCamera(kind, elapsedMs, durationMs, { enabled = true, reduced = false } = {}) {
  if (!enabled || reduced) return { scale: 1, x: 0, y: 0 };
  const t = elapsedMs / 1000, end = durationMs / 1000;
  const w = smooth((t - .5) / 3.1) * (1 - smooth((t - end + 3) / 3));
  const scale = 1 + (kind === 'mushika' ? .7 : .13) * w;
  const target = kind === 'mushika' ? { x: 473, y: 1080 } : { x: 520, y: 1050 };
  return { scale, x: Math.max(1080 * (1 - scale), Math.min(0, (540 - target.x * scale) * w)),
    y: Math.max(1920 * (1 - scale), Math.min(0, (1080 - target.y * scale) * w)) };
}
export { clamp, smooth };
