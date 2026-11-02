const smooth = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
export function actorPhase(id) {
  let h = [...String(id)].reduce((h, c) => Math.imul(h ^ c.codePointAt(0), 16777619) >>> 0, 2166136261);
  h = Math.imul(h ^ h >>> 16, 0x85ebca6b); h = Math.imul(h ^ h >>> 13, 0xc2b2ae35);
  return ((h ^ h >>> 16) >>> 0) / 4294967296;
}

// Three unhurried bows: wai, hands down, forehead lowered, return to kneeling.
// Independent phases avoid a synchronised crowd or long motionless intervals.
export function devotionPose(seconds, phase = 0, reduced = false) {
  const period = 29 + phase * 4, cycle = ((seconds + phase * period) % period + period) % period;
  const beat = cycle < 24 ? cycle % 8 : 0;
  if (reduced) return { from: 0, to: 0, mix: 0, bow: 0 };
  const transition = (from, to, start, duration, bow) => ({ from, to, mix: smooth((beat - start) / duration), bow });
  if (beat < 1.5) return { from: 0, to: 0, mix: 0, bow: 0 };
  if (beat < 3) return transition(0, 1, 1.5, 1.5, .4);
  if (beat < 4.2) return transition(1, 2, 3, 1.2, 1);
  if (beat < 5.3) return { from: 2, to: 2, mix: 0, bow: 1 };
  if (beat < 6.5) return transition(2, 1, 5.3, 1.2, .6);
  if (beat < 7.7) return transition(1, 3, 6.5, 1.2, .3);
  return transition(3, 0, 7.7, .3, 0);
}

export function statuePose(seconds, { enabled = true, reduced = false } = {}) {
  const motion = enabled && !reduced;
  return { lotus: motion ? Math.sin(seconds * .57) * .028 : 0,
    hammer: motion ? Math.sin(seconds * .43 + 1.1) * .024 : 0,
    glow: enabled ? reduced ? .25 : .32 + Math.sin(seconds * .8) * .12 : 0 };
}
