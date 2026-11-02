// Bounded screen-space rain, with a shower at the moment the royal tray is raised.
export class RoyalPetals {
  constructor({ random = Math.random } = {}) { this.random = random; this.reset(); }
  reset() { this.items = []; this.startedAt = null; this.active = false; this.credit = 0; this.burstDone = false; }
  configure({ reduced = false, light = false } = {}) { this.light = reduced || light; this.limit = this.light ? 90 : 320; }
  start(now, options = {}) {
    this.reset(); this.configure(options); this.startedAt = now; this.active = true;
    this.galaxy = options.galaxy === true;
    // Spread the opening shower over the entire frame, including the upper corners.
    for (let i = 0; i < (this.light ? 32 : 110); i++) this.spawn('spread', i);
  }
  stop() { this.active = false; for (const p of this.items) p.life = Math.min(p.life, p.age + 2); }
  spawn(type = 'rain', index = 0) {
    const r = this.random;
    if (this.items.length >= this.limit) return;
    const depth = r(), burst = type === 'burst', ascending = this.galaxy && type === 'rain' && r() < .6;
    this.items.push({
      x: ascending ? (r() < .5 ? -20 : 1100) : burst ? 540 + (r() - .5) * 140 : type === 'spread' ? ((index % 10) + r()) * 108 : r() * 1200 - 60,
      y: ascending ? 1500 + r()*350 : burst ? 960 + (r() - .5) * 160 : type === 'spread' ? (Math.floor(index / 10) / (this.light ? 4 : 11)) * 1760 + r() * 120 : -50 - r() * 160,
      vx: ascending ? (r()-.5)*95 : burst ? (r() - .5) * 540 : (r() - .5) * 100,
      vy: ascending ? -70 - depth*100 : burst ? -100 - r() * 240 : 60 + depth * 100,
      gravity: burst ? 42 : 5, age: 0, life: burst ? 8 + r() * 3 : 9 + r() * 5,
      size: (10 + depth * 17) * (this.light ? .85 : 1), angle: r() * Math.PI * 2,
      spin: (r() - .5) * 2.2, phase: r() * Math.PI * 2, color: Math.floor(r() * 6), depth,
    });
  }
  update(now, dt) {
    dt = Math.max(0, Math.min(.08, dt));
    if (this.active) {
      if (!this.burstDone && now - this.startedAt >= 8000) {
        this.burstDone = true;
        for (let i = 0; i < (this.light ? 15 : 76); i++) this.spawn('burst');
      }
      this.credit += dt * (this.light ? 7 : 24);
      while (this.credit >= 1) { this.spawn(); this.credit--; }
    }
    for (const p of this.items) {
      p.age += dt; p.vy += p.gravity * dt;
      p.x += (p.vx + Math.sin(now / 1100 + p.phase) * (35 + p.depth * 35)) * dt;
      p.y += p.vy * dt; p.angle += p.spin * dt;
      if (p.x < -80) p.x = 1150;
      if (p.x > 1160) p.x = -70;
    }
    this.items = this.items.filter(p => p.age < p.life && p.y < 2020);
    if (this.items.length > this.limit) this.items.length = this.limit;
    return this.items;
  }
}

export class PetalPainter {
  constructor() { this.textures = new Map(); }
  texture(color) {
    if (this.textures.has(color)) return this.textures.get(color);
    const c = document.createElement('canvas'); c.width = 80; c.height = 104;
    const g = c.getContext('2d'); g.translate(40, 50); g.rotate(-.3);
    const colors = [['#fff4c7', '#e5a229'], ['#ffe7a0', '#f48c19'], ['#ffe9e0', '#e76f8c'], ['#ffd0c7', '#bd416f'], ['#fff5de', '#e7b877'], ['#f4bdd4', '#a94378']];
    const fill = g.createLinearGradient(-18, -38, 20, 37); fill.addColorStop(0, colors[color][0]); fill.addColorStop(1, colors[color][1]);
    g.fillStyle = fill; g.beginPath(); g.moveTo(-3, 39); g.bezierCurveTo(-35, 10, -23, -30, 8, -40); g.bezierCurveTo(39, -13, 23, 23, -3, 39); g.fill();
    g.strokeStyle = '#fff2c46b'; g.lineWidth = 1.7; g.beginPath(); g.moveTo(-3, 32); g.quadraticCurveTo(0, 0, 7, -31); g.stroke();
    this.textures.set(color, c); return c;
  }
  draw(ctx, items, now) {
    ctx.clearRect(0, 0, 1080, 1920);
    for (const p of items) {
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      const flip = .28 + .72 * Math.abs(Math.sin(now / 900 + p.phase));
      ctx.scale(flip, 1); ctx.globalAlpha = Math.min(.88, p.age * 1.8, (p.life - p.age) / 1.5);
      ctx.drawImage(this.texture(p.color), -p.size * .7, -p.size, p.size * 1.4, p.size * 2); ctx.restore();
    }
  }
}
