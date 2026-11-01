import { RitualQueue } from './ritual-queue.js';
import { SceneAudio } from './audio.js';
const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('scene'), ctx = canvas.getContext('2d');
const preview = new URLSearchParams(location.search).has('preview');
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const audio = new SceneAudio({ preview });
const queue = new RitualQueue();
const visitors = new Map(), petals = [];
const badgeCache = new Map(), spriteCache = new Map();
document.fonts.addEventListener('loadingdone', () => badgeCache.clear());
let order = [], seats = [], cap = 24, mode = null, settings = {}, last = performance.now(), lastRitual = null;
const numbers = new Intl.NumberFormat('en-US');
const sprite = new Image(); sprite.src = '/assets/ganesha/worshipper.png';
const art = new Image(); art.src = '/assets/ganesha/shrine.png';
for (const image of [sprite, art]) image.onerror = () => { $('assetError').hidden = false; $('assetError').textContent = 'โหลดภาพไม่สำเร็จ · กรุณารีเฟรชหน้าจอ'; };
function fit() { stage.style.transform = `translate(-50%,-50%) scale(${Math.min(innerWidth / 1080, innerHeight / 1920)})`; }
addEventListener('resize', fit); fit();
$('unmute').hidden = preview;
$('unmute').onclick = async () => { try { if (await audio.start()) $('unmute').hidden = true; } catch { $('unmute').textContent = 'ลองเปิดเสียงอีกครั้ง'; } };
// OBS permits audio without a gesture; browsers show the explicit sound button.
if (!preview) audio.start().then(r => { if (r) $('unmute').hidden = true; }).catch(() => {});
function layout(size) {
  cap = size; const [cols, rows] = { 24: [6, 4], 36: [6, 6], 60: [10, 6] }[size] || [6, 4];
  seats = [];
  for (let row = 0; row < rows; row++) {
    const t = row / (rows - 1), half = 305 + 135 * t;
    for (let col = 0; col < cols; col++) {
      let u = (col - (cols - 1) / 2) / ((cols - 1) / 2); u = Math.sign(u) * (.12 + .88 * Math.abs(u));
      seats.push({ x: 540 + u * half, y: 1230 + t * 480, depth: t, gap: half * 1.8 / (cols - 1), density: Math.pow(6 / cols, .6), row });
    }
  }
  seats.sort((a, b) => b.row - a.row || Math.abs(a.x - 540) - Math.abs(b.x - 540)); assignSeats();
}
function assignSeats() {
  order = order.filter(id => visitors.has(id));
  order.forEach((id, index) => { const v = visitors.get(id); v.seat = seats[index]; if (v.seat && v.state === 'sit') { v.x = v.seat.x; v.y = v.seat.y; } });
}
function addViewer(p, instant = false) {
  if (visitors.has(p.id)) { Object.assign(visitors.get(p.id), { name: p.name, coins: p.coins }); return; }
  const v = { ...p, x: 540, y: 1990, state: instant || reduced ? 'sit' : 'walk', elapsed: 0, step: 0, glow: 0, phase: Math.random() * 6.28 };
  visitors.set(p.id, v); order.push(p.id); assignSeats();
  if (v.state === 'sit' && v.seat) { v.x = v.seat.x; v.y = v.seat.y; }
  attendance();
}
function attendance() { $('attendance').textContent = `${visitors.size} คนร่วมบูชา`; canvas.dataset.people = visitors.size; }
function updateStats(m) {
  if (m.stats) {
    $('goalValue').textContent = `${numbers.format(m.stats.coins)} / ${numbers.format(m.goal || settings.goal || 4995)}`;
    $('goalFill').style.width = Math.min(100, m.stats.coins / (m.goal || settings.goal || 4995) * 100) + '%';
    $('hearts').textContent = '♡ ' + numbers.format(m.stats.likes);
  }
  if (m.top) {
    const list = $('ranking'); list.replaceChildren();
    for (const [i, person] of m.top.entries()) {
      const li = document.createElement('li');
      for (const [className, text] of [['rank', i + 1], ['name', person.name], ['coins', numbers.format(person.coins)]]) {
        const el = document.createElement('span'); el.className = className; el.textContent = text; li.append(el);
      }
      list.append(li);
    }
    if (!m.top.length) { const li = document.createElement('li'); li.className = 'empty'; li.textContent = 'ร่วมถวายด้วยกัน'; list.append(li); }
  }
}
function state(m) {
  // Server snapshots are authoritative after reconnect, mode switches and operator edits.
  visitors.clear(); order = []; petals.length = 0; queue.clear(); lastRitual = null; $('gift').hidden = true; audio.clear();
  mode = m.mode; settings = m.settings; layout(m.cap);
  for (const person of m.viewers) addViewer(person, true);
  $('title').textContent = settings.title; $('subtitle').textContent = settings.subtitle;
  $('demoBadge').hidden = mode !== 'demo'; audio.configure(settings); updateStats(m); attendance();
  document.title = `${settings.title} · Ganesha LIVE`;
}
function particles(x, y, count, heart = false) {
  const amount = Math.min(count, reduced ? 6 : 36);
  for (let i = 0; i < amount; i++) petals.push({ x, y, vx: (Math.random() - .5) * 110, vy: -(40 + Math.random() * 75), age: 0, life: 2 + Math.random() * 3, size: 5 + Math.random() * 8, phase: Math.random() * 6, heart });
  if (petals.length > 180) petals.splice(0, petals.length - 180);
}
function connect() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?role=overlay`);
  ws.onopen = () => { $('connection').hidden = true; };
  ws.onclose = () => { $('connection').hidden = false; setTimeout(connect, 2000); };
  ws.onmessage = e => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'state') state(m);
    if (m.t === 'stats') updateStats(m);
    if (m.t === 'join') { if (m.cap !== cap) layout(m.cap); addViewer(m.v); }
    if (m.t === 'leave') { visitors.delete(m.id); assignSeats(); attendance(); }
    if (m.t === 'chat') { const v = visitors.get(m.id); if (v) { v.bubble = { text: m.text, until: performance.now() + 4000 }; v.glow = .35; } }
    if (m.t === 'gift') { const v = visitors.get(m.id); if (v) { v.coins = m.total; v.glow = 1; } queue.enqueue(m, performance.now()); }
    if (m.t === 'like') { const v = visitors.get(m.id); particles(v?.x || 900, (v?.y || 1650) - 150, Math.min(4, m.n), true); }
    if (m.t === 'follow') { const v = visitors.get(m.id); if (v) { v.glow = 1; particles(v.x, v.y - 150, 8); } }
    if (m.t === 'bell') audio.bell('aarti');
    if (m.t === 'tts') audio.speech(m.url);
  };
}
function rounded(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
function shorten(text, width) {
  const chars = [...segmenter.segment(String(text))].map(s => s.segment); let result = chars.join('');
  if (ctx.measureText(result).width <= width) return result;
  while (chars.length && ctx.measureText(chars.join('') + '…').width > width) chars.pop();
  return chars.join('') + '…';
}
function nameTag(v, x, y, width, highlight) {
  const size = cap === 60 ? 18 : 21;
  const key = JSON.stringify([v.name, Math.floor(width), size, !!highlight]);
  let badge = badgeCache.get(key);
  if (!badge) {
    ctx.font = `700 ${size}px Thai, Latin, sans-serif`;
    const text = shorten(v.name, width - 20), w = Math.ceil(Math.min(width, ctx.measureText(text).width + 23));
    badge = document.createElement('canvas'); badge.width = w + 20; badge.height = 54;
    const b = badge.getContext('2d'), gradient = b.createLinearGradient(0, 8, 0, 42);
    gradient.addColorStop(0, highlight ? '#ffeeb4' : '#fffdf2'); gradient.addColorStop(1, highlight ? '#d7a846' : '#d9e1db');
    b.shadowColor = '#21100699'; b.shadowBlur = 6; b.shadowOffsetY = 2;
    b.fillStyle = gradient; b.beginPath(); b.roundRect(10, 8, w, 34, 17); b.fill();
    b.shadowBlur = 0; b.shadowOffsetY = 0; b.strokeStyle = highlight ? '#ffe6a0' : '#a4b5b3'; b.lineWidth = 1.3; b.stroke();
    b.font = ctx.font; b.fillStyle = '#3c291e'; b.textAlign = 'center'; b.textBaseline = 'middle'; b.fillText(text, badge.width / 2, 24);
    if (badgeCache.size >= 256) badgeCache.delete(badgeCache.keys().next().value);
    badgeCache.set(key, badge);
  }
  ctx.drawImage(badge, x - badge.width / 2, y - 42);
}
function spriteFrame(frame, height) {
  const h = Math.ceil(height / 12) * 12, key = `${frame}:${h}`;
  let cached = spriteCache.get(key);
  if (!cached) {
    cached = document.createElement('canvas'); cached.height = h; cached.width = Math.ceil(h * .75);
    const cw = sprite.naturalWidth / 4, ch = sprite.naturalHeight / 2;
    cached.getContext('2d').drawImage(sprite, frame % 4 * cw, Math.floor(frame / 4) * ch, cw, ch, 0, 0, cached.width, cached.height);
    if (spriteCache.size >= 128) spriteCache.delete(spriteCache.keys().next().value);
    spriteCache.set(key, cached);
  }
  return cached;
}
function lotus(x, y, scale, time) {
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  const glow = ctx.createRadialGradient(0, -10, 0, 0, -10, 90); glow.addColorStop(0, '#ffdf9a70'); glow.addColorStop(1, '#ffbb5500'); ctx.fillStyle = glow; ctx.fillRect(-90, -100, 180, 180);
  for (const [index, angle] of [-1.05, -.68, -.32, 0, .32, .68, 1.05].entries()) {
    ctx.save(); ctx.rotate(angle * (.88 + .05 * Math.sin(time)));
    const g = ctx.createLinearGradient(0, -65, 0, 10); g.addColorStop(0, '#ffe3df'); g.addColorStop(.45, index % 2 ? '#efb2bc' : '#f7c6cd'); g.addColorStop(1, '#b44974');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-35, -8, -23, -40, 0, -70); ctx.bezierCurveTo(25, -40, 33, -5, 0, 20); ctx.fill(); ctx.restore();
  }
  ctx.fillStyle = '#ffdf86'; ctx.beginPath(); ctx.ellipse(0, 5, 23, 8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
function ritualArt(active, t) {
  if (!active) return;
  const progress = (performance.now() - active.beganAt) / (active.until - active.beganAt);
  const fade = Math.min(1, progress * 7, (1 - progress) * 7); ctx.save(); ctx.globalAlpha = Math.max(0, fade);
  const x = 540, y = 1015, kind = active.ritual.kind;
  const halo = ctx.createRadialGradient(x, 720, 20, x, 720, 450); halo.addColorStop(0, '#ffd15e00'); halo.addColorStop(.65, '#ffd15e1a'); halo.addColorStop(1, '#ffd15e00');
  ctx.fillStyle = halo; ctx.fillRect(80, 260, 920, 920);
  if (kind === 'lotus') lotus(x, y, 1.25, t);
  if (kind === 'incense') {
    ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      const px = x + i * 28, py = y - 140 + Math.abs(i) * 18;
      ctx.strokeStyle = '#b66b36'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px, py); ctx.stroke();
      ctx.fillStyle = '#ffc88b'; ctx.beginPath(); ctx.arc(px, py, 5, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#f2e7d875'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py);
      ctx.bezierCurveTo(px + 30 * Math.sin(t), py - 45, px - 25, py - 90, px + Math.sin(t * .7) * 36, py - 150); ctx.stroke();
    }
    ctx.fillStyle = '#ce9f43'; ctx.beginPath(); ctx.ellipse(x, y, 65, 19, 0, 0, Math.PI * 2); ctx.fill();
  }
  if (kind === 'garland') {
    for (let i = 0; i < 40; i++) {
      const a = i / 40 * Math.PI * 2; ctx.fillStyle = i % 6 < 2 ? '#eca39c' : '#fff0c9';
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * 77, y - 90 + Math.sin(a) * 106, 10, 0, Math.PI * 2); ctx.fill();
    }
    lotus(x, y + 15, .65, t);
  }
  if (kind === 'aarti') {
    const px = x + Math.sin(t * 1.2) * 60, py = y - 40 + Math.cos(t * 1.2) * 15;
    ctx.fillStyle = '#dba33e'; ctx.beginPath(); ctx.ellipse(px, py, 70, 18, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(px, py - 45, 1, px, py - 45, 100); g.addColorStop(0, '#fff8cfbb'); g.addColorStop(.3, '#ffc65f88'); g.addColorStop(1, '#ff943000'); ctx.fillStyle = g; ctx.fillRect(px - 100, py - 145, 200, 200);
    for (let i = -1; i <= 1; i++) { ctx.fillStyle = i === 0 ? '#fff0af' : '#ffc875'; ctx.beginPath(); ctx.ellipse(px + i * 25, py - 25 - Math.sin(t * 8 + i) * 5, 9, 28, .15 * Math.sin(t * 7), 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
function drawViewer(v, dt, t, active) {
  if (!v.seat || !sprite.naturalWidth) return;
  const seat = v.seat; let frame = 7;
  if (v.state === 'walk') {
    const target = Math.abs(v.y - seat.y) > 3 ? { x: 540, y: seat.y } : seat;
    const dx = target.x - v.x, dy = target.y - v.y, d = Math.hypot(dx, dy), speed = 210 * dt;
    if (d > 1) { v.x += dx / d * Math.min(speed, d); v.y += dy / d * Math.min(speed, d); }
    v.step += dt * 7; frame = Math.floor(v.step) % 4;
    if (Math.hypot(v.x - seat.x, v.y - seat.y) < 4) { v.state = 'kneel'; v.elapsed = 0; }
  } else if (v.state === 'kneel') {
    v.elapsed += dt; frame = 4 + Math.min(3, Math.floor(v.elapsed / .22));
    if (v.elapsed >= .9) v.state = 'sit';
  }
  v.glow = Math.max(0, v.glow - dt * .3);
  const highlight = active?.id === v.id || v.glow > .4;
  const depth = Math.max(0, Math.min(1.4, (v.y - 1230) / 480));
  const h = (245 + 105 * depth) * seat.density, w = h * .75;
  const bob = reduced ? 0 : v.state === 'walk' ? Math.sin(v.step * Math.PI / 2) * 2 : Math.sin(t * 1.4 + v.phase) * 1.1;
  ctx.save();
  ctx.fillStyle = '#25100745'; ctx.beginPath(); ctx.ellipse(v.x, v.y - 7, w * .28, 11 * seat.density, 0, 0, Math.PI * 2); ctx.fill();
  if (highlight) { ctx.strokeStyle = '#ffe8a5bb'; ctx.lineWidth = 2; ctx.shadowColor = '#ffc95d'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.ellipse(v.x, v.y - 6, w * .32, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.shadowBlur = 0;
  ctx.drawImage(spriteFrame(frame, h), v.x - w / 2, v.y - h + bob, w, h);
  ctx.restore();
  const tagY = v.y - h * (frame > 3 ? .89 : .99) - 4;
  nameTag(v, v.x, tagY, Math.max(80, seat.gap + 8), highlight || v.coins >= 100);
  if (v.bubble && performance.now() < v.bubble.until) {
    // Only show one line; bounded width avoids covering the central statue.
    ctx.save(); ctx.font = '19px Thai, Latin, sans-serif'; const text = shorten(v.bubble.text, 170), width = ctx.measureText(text).width + 24;
    ctx.fillStyle = '#2b1913ed'; rounded(v.x - width / 2, tagY - 78, width, 33, 12); ctx.fill();
    ctx.fillStyle = '#ffe6b6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, v.x, tagY - 62); ctx.restore();
  }
}
function frame(now) {
  requestAnimationFrame(frame); const dt = Math.min(.05, (now - last) / 1000); last = now; const t = now / 1000;
  ctx.clearRect(0, 0, 1080, 1920);
  // Slow drifting motes provide motion without moving the sacred figure.
  for (let i = 0; i < 24; i++) {
    const x = (i * 137 + Math.sin(t * .15 + i) * 30) % 1080;
    const y = (i * 83 - t * (reduced ? 2 : 7) + 20000) % 1660;
    ctx.fillStyle = `rgba(255,221,147,${.12 + .16 * Math.sin(t + i) ** 2})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3, 0, 6.28); ctx.fill();
  }
  const active = queue.tick(now);
  if (active !== lastRitual) {
    lastRitual = active; $('gift').hidden = !active;
    if (active) {
      $('giftIcon').textContent = active.ritual.icon; $('giftLabel').textContent = active.ritual.label;
      $('giftName').textContent = active.name; $('giftCount').textContent = '×' + active.count;
      $('gift').dataset.kind = active.ritual.kind; audio.bell(active.ritual.kind);
      const v = visitors.get(active.id); particles(v?.x || 540, (v?.y || 1400) - 160, active.ritual.kind === 'aarti' ? 36 : 16);
    }
  }
  ritualArt(active, t);
  for (const v of [...visitors.values()].sort((a, b) => a.y - b.y)) drawViewer(v, dt, t, active);
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i]; p.age += dt; if (p.age > p.life) { petals.splice(i, 1); continue; }
    p.x += (p.vx + Math.sin(t + p.phase) * 12) * dt; p.y += p.vy * dt;
    ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = Math.min(1, (p.life - p.age) * .7);
    if (p.heart) { ctx.fillStyle = '#fa9b9e'; ctx.font = '25px serif'; ctx.fillText('♥', 0, 0); }
    else { ctx.rotate(t + p.phase); ctx.fillStyle = p.phase > 3 ? '#fbd7c7' : '#efb6ba'; ctx.beginPath(); ctx.ellipse(0, 0, p.size * .55, p.size, 0, 0, 6.28); ctx.fill(); }
    ctx.restore();
  }
}
layout(24); connect(); requestAnimationFrame(frame);
