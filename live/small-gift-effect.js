// Rose (one coin) only thanks its donor. No altar/lotus foreground pass.
export function drawSmallGift(pen, donor, elapsedMs) {
  if (!donor || elapsedMs < 0 || elapsedMs >= 1400) return null;
  const fade = Math.sin(Math.PI * elapsedMs / 1400), x = donor.x, y = donor.y - 38;
  pen.save(); pen.globalAlpha = fade * .8; pen.fillStyle = '#ffe7a4';
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4 + elapsedMs / 1900;
    pen.beginPath(); pen.arc(x + Math.cos(angle) * 24, y + Math.sin(angle) * 17, 1.5 + i % 2, 0, Math.PI * 2); pen.fill();
  }
  pen.restore();
  return { x: x - 27, y: y - 20, w: 54, h: 40 };
}
