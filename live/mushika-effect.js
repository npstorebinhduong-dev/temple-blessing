import { MUSHIKA, WHISPER_PLACE, clamp, smooth } from './special-rituals.js';
export const ORB = Object.freeze({x:384,y:939});
export const RECEIVER = Object.freeze({x:540,y:728});
export const TRANSMISSION = Object.freeze([ORB,{x:155,y:840},{x:228,y:615},RECEIVER]);
export const RESPONSE = Object.freeze([RECEIVER,{x:810,y:790},{x:720,y:1105},{x:WHISPER_PLACE.x,y:WHISPER_PLACE.y-4}]);
export function curvePoint(points,t) {
  const u=1-t;return {x:u*u*u*points[0].x+3*u*u*t*points[1].x+3*u*t*t*points[2].x+t*t*t*points[3].x,
    y:u*u*u*points[0].y+3*u*u*t*points[1].y+3*u*t*t*points[2].y+t*t*t*points[3].y};
}
export function mushikaLight(ms) {
  const t=ms/1000;
  const phase=t<4.3?'approach':t<7.9?'whisper':t<8.6?'gather':t<10.2?'transfer':t<10.7?'receive':t<11.8?'reply':t<12.1?'thanks':'return';
  return {phase,ear:MUSHIKA,whisper:smooth((t-4.3)/.3)*(1-smooth((t-7.7)/.3)),
    orb:smooth((t-7.9)/.7)*(1-smooth((t-8.6)/.35)),
    progress:clamp((t-8.6)/1.6),response:clamp((t-10.7)/1.1),
    receive:smooth((t-10.1)/.25)*(1-smooth((t-11.5)/.6)),
    head:smooth((t-7.95)/.6)*(1-smooth((t-11.4)/.7)),
    blessing:smooth((t-11.25)/.5)*(1-smooth((t-12.1)/.5))};
}
