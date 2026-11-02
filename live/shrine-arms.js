import { statuePose } from './devotion.js';

export const ARM_PARTS = Object.freeze([
  { kind: 'hammer', source: [148,225,222,410], pivot: [350,520], target: [348,522], scale: .69, light: [255,310] },
  { kind: 'lotus', source: [575,298,212,338], pivot: [601,520], target: [596,516], scale: .68, light: [695,355] },
]);

// Registered to the 941×1672 shrine. The foreground mask keeps the original
// blessing hand, bowl and torso in front of the two articulated rear arms.
export class ShrineArms {
  constructor(onError = () => {}) {
    this.parts = null;
    this.base = new Image(); this.base.src = '/assets/ganesha/shrine-base.png'; this.base.onerror = onError;
    this.atlas = new Image(); this.atlas.src = '/assets/ganesha/shrine-arms.png'; this.atlas.onerror = onError;
    this.foreground = new Path2D('M368 441 L355 461 L329 455 L306 461 L295 487 L294 538 L280 564 L282 594 L276 628 L692 628 L686 593 L680 565 L658 553 L619 543 L614 480 L582 441 Z');
  }
  get ready() {
    // Dimensions arrive before PNG pixels. Cropping at that point permanently
    // caches empty arms, so keep the original shrine until both images load.
    return [this.base, this.atlas].every(image => image.complete && image.naturalWidth > 0);
  }
  prepare() {
    if (this.parts || !this.ready) return;
    this.parts = ARM_PARTS.map(p => {
      const [x,y,w,h] = p.source, sprite = document.createElement('canvas'); sprite.width = w; sprite.height = h;
      sprite.getContext('2d').drawImage(this.atlas, x,y,w,h, 0,0,w,h);
      return { ...p, sprite };
    });
    this.halo = document.createElement('canvas'); this.halo.width = 192; this.halo.height = 192;
    const c = this.halo.getContext('2d'), g = c.createRadialGradient(96,96,6,96,96,96);
    g.addColorStop(0,'#fff7c5'); g.addColorStop(.28,'#ffdb7a90'); g.addColorStop(.62,'#f8ac3545'); g.addColorStop(1,'#ffc04d00');
    c.fillStyle = g; c.fillRect(0,0,192,192);
  }
  draw(ctx, seconds, options) {
    const pose = statuePose(seconds, options); this.prepare(); if (!this.parts) return pose;
    ctx.save(); ctx.translate(0,120); ctx.scale(1080 / 941,1920 / 1672);
    for (const p of this.parts) {
      ctx.save(); ctx.translate(...p.target); ctx.rotate(pose[p.kind]); ctx.scale(p.scale,p.scale); ctx.translate(-p.pivot[0],-p.pivot[1]);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = pose.glow;
      ctx.drawImage(this.halo,p.light[0]-96,p.light[1]-96); ctx.restore();
      ctx.drawImage(p.sprite,p.source[0],p.source[1]);
      if (pose.glow > 0) for (let i=0;i<5;i++) {
        const a = seconds * .35 + i * Math.PI * .4, r = 49 + 9 * Math.sin(seconds + i);
        ctx.fillStyle = `rgba(255,237,180,${pose.glow * (1 + Math.sin(seconds * 1.3 + i) * .5)})`;
        ctx.beginPath(); ctx.arc(p.light[0]+Math.cos(a)*r,p.light[1]+Math.sin(a)*r*.8,1.4+i%2,0,Math.PI*2); ctx.fill();
      }
      ctx.restore();
    }
    ctx.save(); ctx.clip(this.foreground); ctx.drawImage(this.base,0,0,941,1672); ctx.restore();
    ctx.restore(); return pose;
  }
}
