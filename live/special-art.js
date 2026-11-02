import { MUSHIKA, clamp, smooth } from './special-rituals.js';
const TAU = Math.PI * 2;
const complete = image => image?.complete && image.naturalWidth > 0;
function halo(pen, x, y, r, opacity = .4) {
  const g = pen.createRadialGradient(x, y, r * .18, x, y, r);
  g.addColorStop(0, `rgba(255,204,119,${opacity * .08})`); g.addColorStop(.7, `rgba(247,184,86,${opacity})`); g.addColorStop(1, '#ffc75b00');
  pen.fillStyle = g; pen.fillRect(x - r, y - r, r * 2, r * 2);
}
function ring(pen, x, y, radius, alpha, t) {
  pen.save(); pen.globalAlpha *= alpha; pen.strokeStyle = '#ffe3a6'; pen.lineWidth = 1.5;
  for (let i = 0; i < 3; i++) { pen.beginPath(); pen.ellipse(x, y, radius + i * 17 + Math.sin(t + i) * 2, 12 + i * 5, 0, 0, TAU); pen.stroke(); }
  pen.restore();
}
export class SpecialArt {
  constructor(images) { this.images = images; this.sprites = new Map(); this.deity = null; this.mandala = null; }
  side(frame, skin) {
    const img = this.images.whisper; if (!complete(img)) return null;
    const key = `${skin}:${frame}`; if (this.sprites.has(key)) return this.sprites.get(key);
    const c = document.createElement('canvas'); c.width = 384; c.height = 512;
    c.getContext('2d').drawImage(img, frame * img.naturalWidth / 4, skin === 'male' ? img.naturalHeight / 2 : 0,
      img.naturalWidth / 4, img.naturalHeight / 2, 0, 0, 384, 512);
    this.sprites.set(key, c); return c;
  }
  prepareDeity() {
    if (this.deity || !complete(this.images.apparition)) return;
    const img = this.images.apparition, w = 640, h = Math.round(w * img.naturalHeight / img.naturalWidth), s = w / 1215;
    const body = document.createElement('canvas'), arm = document.createElement('canvas');
    body.width = arm.width = w; body.height = arm.height = h;
    // Render-time puppet mask for the outboard front arm. The original asset
    // stays intact. The shoulder overlap is hidden under the robe in the body.
    const outline = [[38,526],[157,526],[202,669],[284,672],[333,645],[385,677],[399,721],[363,758],[285,806],[76,806],[37,744]];
    const mask = pen => { pen.beginPath(); outline.forEach(([x,y],i) => i ? pen.lineTo(x*s,y*s) : pen.moveTo(x*s,y*s)); pen.closePath(); };
    const b = body.getContext('2d'), a = arm.getContext('2d');
    b.drawImage(img,0,0,w,h); b.globalCompositeOperation = 'destination-out'; mask(b); b.fill();
    a.save(); mask(a); a.clip(); a.drawImage(img,0,0,w,h); a.restore();
    this.deity = { body, arm, w, h, pivotX: 380 * s, pivotY: 704 * s };
  }
  prepareMandala() {
    if (this.mandala) return this.mandala;
    const c = document.createElement('canvas'); c.width = c.height = 720;
    const p = c.getContext('2d'); p.translate(360,360); p.strokeStyle = '#efd396'; p.lineWidth = 1.5;
    for (const r of [220,236,279,291,326]) { p.beginPath(); p.arc(0,0,r,0,TAU); p.stroke(); }
    for (let i=0;i<24;i++) {
      p.save(); p.rotate(i/24*TAU); p.beginPath(); p.moveTo(0,-211); p.bezierCurveTo(-44,-254,-26,-303,0,-335); p.bezierCurveTo(26,-303,44,-254,0,-211); p.stroke();
      p.fillStyle='#ffe1a3';p.beginPath();p.arc(0,-287,3,0,TAU);p.fill();p.restore();
    }
    this.mandala = c; return c;
  }
  mouse(pen, t) {
    const image = this.images.mushika; if (!complete(image)) return;
    if (!this.mouseImage) {
      this.mouseImage = document.createElement('canvas'); this.mouseImage.width = 390; this.mouseImage.height = 260;
      this.mouseImage.getContext('2d').drawImage(image, 0, 0, 390, 260);
    }
    pen.save(); const breath = Math.sin(t * 1.7) * .002;
    pen.drawImage(this.mouseImage, MUSHIKA.x, MUSHIKA.y - breath * MUSHIKA.height, MUSHIKA.width, MUSHIKA.height * (1 + breath)); pen.restore();
  }
  actor(pen, hero, pose, sprites, t, reduced) {
    const h = pose.height, w = h * .75;
    pen.save(); pen.fillStyle='#1c0b0a60';pen.beginPath();pen.ellipse(pose.x,pose.y-3,w*.23,10,0,0,TAU);pen.fill();
    if (pose.side) {
      const sprite = this.side(pose.frame, hero.skin);
      if (sprite) {
        const breath = reduced ? 0 : Math.sin(t * 2.1) * (pose.phase === 'whisper' ? .9 : .5);
        pen.translate(pose.x, pose.y); if (pose.flip) pen.scale(-1,1);
        // Foot baselines measured from the atlas; whisper contact remains fixed
        // within one pixel of the ear, independent of breathing and camera zoom.
        const bottom = hero.skin === 'male' ? [480,480,480,480][pose.frame] : [485,485,485,485][pose.frame];
        pen.drawImage(sprite,-w/2,-h*bottom/512+breath,w,h);
      }
    } else {
      const sprite = sprites.get(pose.frame,h,hero.skin); if (sprite) pen.drawImage(sprite,pose.x-w/2,pose.y-h+(pose.bob||0),w,h);
    }
    pen.restore();
  }
  whisper(pen, elapsedMs, pose, t, lotus, light) {
    const seconds = elapsedMs / 1000;
    const strength = smooth((seconds - 3.5) / .6) * (1 - smooth((seconds - 9.3) / .5));
    if (strength <= 0) return;
    ring(pen,pose.x,pose.y-3,58,strength*.65,t);
    if (seconds >= 7.9 && seconds <= 10) {
      const travel = clamp((seconds - 7.9)/1.1), start={x:MUSHIKA.earX,y:MUSHIKA.earY};
      pen.save(); pen.globalAlpha = strength;
      pen.strokeStyle='#ffd88e60';pen.lineWidth=2;pen.beginPath();pen.moveTo(start.x,start.y);pen.bezierCurveTo(250,870,790,710,540,530);pen.stroke();
      const count = light ? 20 : 55;
      for(let i=0;i<count;i++) {
        const u=clamp(travel-i/count*.3),v=1-u;
        const x=v*v*v*start.x+3*v*v*u*250+3*v*u*u*790+u*u*u*540;
        const y=v*v*v*start.y+3*v*v*u*870+3*v*u*u*710+u*u*u*530;
        pen.globalAlpha=strength*(.25+.7*(1-i/count));pen.fillStyle='#ffe8ab';pen.beginPath();pen.arc(x+Math.sin(i*7+t*2)*5,y+Math.cos(i*3+t)*5,1.4+i%3*.5,0,TAU);pen.fill();
      }
      pen.restore();
      if(travel>.75) halo(pen,540,540,215,strength*.25);
    }
    if(seconds>8.6) {pen.save();pen.globalAlpha=strength*smooth((seconds-8.6)/.4);lotus(pose.x,pose.y+6,.7,t);pen.restore();}
  }
  apparition(pen, elapsedMs, untilMs, t, lotus, { light = false, reduced = false, blessingElapsedMs = null } = {}) {
    this.prepareDeity(); if (!this.deity) return { opacity: 0, angle: 0 };
    const sec=elapsedMs/1000, end=untilMs/1000;
    const gather=smooth((sec-1.7)/2.6), dissolve=1-smooth((sec-end+3.4)/2.4), opacity=gather*dissolve;
    if(opacity<=0)return {opacity:0,angle:0};
    const x=128,y=707,h=626,w=h*this.deity.w/this.deity.h, breath=reduced?0:Math.sin(t*1.1)*2.5;
    // A foreground manifestation with a separate silhouette; the physical
    // shrine remains stable behind the dimmer and never changes its pose.
    pen.save();pen.globalAlpha=opacity;halo(pen,x+w*.52,y+285,345,.19);
    const mandala=this.prepareMandala();
    for(let layer=0;layer<2;layer++) {
      pen.save();pen.translate(x+w*.52,y+285);pen.rotate(reduced?0:t*(layer?-.016:.022));
      const s=(layer?.89:1.05)*(.75+gather*.25);pen.scale(s,s);pen.globalAlpha=opacity*(layer?.19:.42);pen.drawImage(mandala,-360,-360);pen.restore();
    }
    // Voice generation may be slow. Start the blessing hand and recipient ray
    // from the actual playback receipt (or readable-text fallback), not a timer
    // measured from the beginning of the ceremony.
    const settle=blessingElapsedMs === null ? 0 : smooth(blessingElapsedMs/1200), scale=h/this.deity.h;
    const angle=(reduced?0:(-.13+Math.sin(t*.75)*.025)*settle*dissolve);
    pen.save();pen.translate(x,y+breath);pen.scale(scale,scale);
    const {body,arm,pivotX,pivotY}=this.deity;
    pen.save();pen.translate(pivotX,pivotY);pen.rotate(angle);pen.translate(-pivotX,-pivotY);pen.drawImage(arm,0,0);pen.restore();pen.drawImage(body,0,0);pen.restore();
    // A descending blessing ray reaches the recipient; colour stays below
    // full-white so the deity, hands and costume retain their detail.
    if(settle>0) {
      const blessing=settle*dissolve;
      pen.save();pen.globalAlpha=blessing;
      const beam=pen.createLinearGradient(390,830,792,1320);beam.addColorStop(0,'#ffde9a00');beam.addColorStop(.35,'#ffdf9c35');beam.addColorStop(1,'#ffca6c0a');
      pen.fillStyle=beam;pen.beginPath();pen.moveTo(405,820);pen.quadraticCurveTo(700,850,895,1335);pen.lineTo(690,1335);pen.quadraticCurveTo(645,900,380,820);pen.fill();
      ring(pen,792,1320,70,blessing*.65,t);lotus(792,1326,.75+blessing*.2,t);
      pen.restore();
    }
    const count=light?40:100;
    for(let i=0;i<count;i++) {
      const a=i*2.399+t*.15, r=50+(i*37%270), dist=(1-gather)*1.9+(1-dissolve)*2;
      const px=x+w*.52+Math.cos(a)*r*(1+dist),py=y+300+Math.sin(a)*r+(1-dissolve)*Math.sin(i)*100;
      pen.globalAlpha=opacity*(.12+.45*(1-dissolve)+.4*(1-gather));pen.fillStyle=i%3?'#ffe3a3':'#f8b3bf';pen.beginPath();pen.arc(px,py,1.2+i%3*.7,0,TAU);pen.fill();
    }
    pen.restore();return { opacity, angle };
  }
}
