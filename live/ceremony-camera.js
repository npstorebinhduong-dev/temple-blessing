const clamp = (n, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, n));
const smooth = n => { n = clamp(n); return n * n * (3 - 2 * n); };
const BASIC_ZOOM = { lotus: [1.55, 3200], incense: [1.6, 4200], garland: [1.6, 5000], aarti: [1.7, 6500] };

// Scene coordinates stay unchanged: the camera moves the shrine and actors together.
// HUD and celebration petals remain in screen coordinates.
export function ceremonyCamera(kind, elapsedMs, pose, { enabled = true, reduced = false, durationMs } = {}) {
  const basic = BASIC_ZOOM[kind], premium = ['marigold', 'royal'].includes(kind);
  if (!enabled || reduced || !pose || (!basic && !premium)) return { scale: 1, x: 0, y: 0 };
  const t = Math.max(0, elapsedMs) / 1000;
  if (basic) {
    const duration = (durationMs || basic[1]) / 1000;
    const weight = smooth(t / .85) * (1 - smooth((t - duration + .9) / .9));
    const scale = 1 + (basic[0] - 1) * weight;
    return { scale,
      x: clamp((540 - pose.x * scale) * weight, 1080 * (1 - scale), 0),
      y: clamp((1320 - (pose.y - (pose.bodyHeight || 200) * .5) * scale) * weight, 1920 * (1 - scale), 0) };
  }
  const returnAt = kind === 'royal' ? 17 : 13;
  const weight = smooth((t - .6) / 4.2) * (1 - smooth((t - returnAt) / 6));
  const scale = 1 + (kind === 'royal' ? .62 : .45) * weight;
  const x = clamp((540 - pose.x * scale) * weight, 1080 * (1 - scale), 0);
  const y = clamp((1130 - (pose.y - 165) * scale) * weight, 1920 * (1 - scale), 0);
  return { scale, x, y };
}
