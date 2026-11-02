// Shared by the gift queue, procession and camera so longer zooms cannot cut
// off an offering or leave the camera following an already finished ritual.
export const RITUAL_TIMING = Object.freeze({
  lotus: { duration: 4500 },
  incense: { duration: 5500 },
  garland: { duration: 6000 },
  aarti: { duration: 8000 },
  marigold: { duration: 23000, hold: 8 },
  royal: { duration: 28000, hold: 13 },
  mushika: { duration: 16000 },
  galaxy: { duration: 20000 },
});
export const MAX_RITUAL_MS = Math.max(...Object.values(RITUAL_TIMING).map(timing => timing.duration));
