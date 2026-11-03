import { LOTUS_OFFERING as OFFERING } from './ceremony-stations.js';
// One small flower on the table, never at the mouse or following the donor.
export function drawSmallGift(pen, donor, elapsedMs, lotus) {
  if (!donor || elapsedMs < 0 || elapsedMs >= 4500) return null;
  if(lotus && elapsedMs>=700) {
    pen.save();pen.globalAlpha=Math.min(1,(elapsedMs-700)/500,(4500-elapsedMs)/650);
    lotus(OFFERING.x,OFFERING.y-5,.30,elapsedMs/1000);pen.restore();
  }
  if(elapsedMs>=1400)return{x:OFFERING.x-28,y:OFFERING.y-30,w:56,h:34};
  const fade = Math.sin(Math.PI * elapsedMs / 1400), x = donor.x, y = donor.y - 38;
  pen.save(); pen.globalAlpha = fade * .8; pen.fillStyle = '#ffe7a4';
  for (let i = 0; i < 8; i++) {
    const angle = i * Math.PI / 4 + elapsedMs / 1900;
    pen.beginPath(); pen.arc(x + Math.cos(angle) * 24, y + Math.sin(angle) * 17, 1.5 + i % 2, 0, Math.PI * 2); pen.fill();
  }
  pen.restore();
  return {x:OFFERING.x-28,y:OFFERING.y-30,w:56,h:34};
}
