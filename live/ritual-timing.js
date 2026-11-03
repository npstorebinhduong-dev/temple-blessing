// Shared by the gift queue, procession and camera so longer zooms cannot cut
// off an offering or leave the camera following an already finished ritual.
export const RITUAL_TIMING = Object.freeze({
  lotus:{duration:10000}, lamp:{duration:10000}, fragrance:{duration:10000},
  prayer:{duration:10000}, incense:{duration:10000},
  marigold: { duration: 23000, hold: 8 },
  royal: { duration: 28000, hold: 13 },
  mushika: { duration: 16000 },
  galaxy: { duration: 20000 },
});
export const MAX_RITUAL_MS = Math.max(...Object.values(RITUAL_TIMING).map(timing => timing.duration));
