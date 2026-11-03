// Shared deterministic ceremony timeline; rendering and tests use the same poses.
import { RITUAL_TIMING } from './ritual-timing.js';
export const ALTAR = Object.freeze({ x: 730, y: 1285 });
const clamp = n => Math.max(0, Math.min(1, n));
const ease = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const lerp = (a, b, n) => a + (b - a) * ease(n);
export function processionPose(kind, elapsedMs, from, seat, initiallySeated = true) {
  const t = Math.max(0, elapsedMs) / 1000;
  const hold = RITUAL_TIMING[kind]?.hold ?? RITUAL_TIMING.marigold.hold;
  const standAt = 7.2 + hold, backAt = standAt + .8, sideAt = backAt + 3.8, kneelAt = sideAt + 2;
  const pose = { x: from.x, y: from.y, frame: 7, carrier: false, carrierFrame: 0, phase: 'rise', focus: 0, lift: 0, bow: 0, prop: true, place:0 };
  const walk = () => { const distance=Math.abs(pose.x-from.x)+Math.abs(pose.y-from.y); pose.frame = Math.floor(distance / 34) % 4; pose.carrier = true; pose.carrierFrame = Math.floor(distance / 48) % 2; };
  if (t < .8) { pose.frame = initiallySeated ? 7 - Math.min(3, Math.floor(t / .2)) : Math.floor(t * 7) % 4; }
  else if (t < 2.4) { pose.phase = 'to-aisle'; pose.x = lerp(from.x, 540, (t - .8) / 1.6); walk(); }
  else if (t < 6.2) { pose.phase = 'approach'; const q=(t-2.4)/3.8; pose.x=lerp(540,ALTAR.x,Math.max(0,(q-.7)/.3)); pose.y=lerp(from.y,ALTAR.y,Math.min(1,q/.85)); pose.focus=ease(q); walk(); }
  else if (t < 7.2) { pose.phase = 'kneel'; pose.x = ALTAR.x; pose.y = ALTAR.y; pose.focus = 1; pose.frame = 4 + Math.min(3, Math.floor((t - 6.2) / .25)); }
  else if (t < standAt) {
    pose.phase = 'offer'; pose.x = ALTAR.x; pose.y = ALTAR.y; pose.focus = 1;
    pose.carrier = true; pose.carrierFrame = t < 8 ? 2 : 3;
    pose.lift = ease((t - 7.2) / 1.2); pose.bow = Math.sin(clamp((t - 8.4) / (hold - 1.2)) * Math.PI) * .045;
    pose.place=ease((t-standAt+1.2)/1.2);
  } else if (t < backAt) { pose.phase = 'stand'; pose.x = ALTAR.x; pose.y = ALTAR.y; pose.focus = 1; pose.prop = false; pose.frame = 7 - Math.min(3, Math.floor((t - standAt) / .2)); }
  else if (t < sideAt) { pose.phase='return'; const q=(t-backAt)/3.8; pose.x=lerp(ALTAR.x,540,Math.min(1,q/.25)); pose.y=lerp(ALTAR.y,seat.y,Math.max(0,(q-.2)/.8)); pose.focus=1-ease(q); walk(); pose.carrier=false; pose.prop=false; }
  else if (t < kneelAt) { pose.phase='to-seat'; pose.x=lerp(540,seat.x,(t-sideAt)/2); pose.y=seat.y; walk(); pose.carrier=false; pose.prop=false; }
  else { pose.phase = t < kneelAt + .8 ? 'settle' : 'done'; pose.x = seat.x; pose.y = seat.y; pose.prop = false; pose.frame = 4 + Math.min(3, Math.floor((t - kneelAt) / .2)); }
  return pose;
}
