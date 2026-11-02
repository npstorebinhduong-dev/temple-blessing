import { seatLayout, exitPose } from './seating.js';
import { actorPhase, devotionPose } from './devotion.js';
import { ShrineArms } from './shrine-arms.js';
import { CharacterSprites } from './character-sprites.js';
import { SceneAudio } from './audio.js';
import { processionPose } from './procession.js';
import { ceremonyCamera } from './ceremony-camera.js';
import { RoyalPetals, PetalPainter } from './royal-petals.js';
const $ = id => document.getElementById(id);
const stage = $('stage'), canvas = $('scene'), ctx = canvas.getContext('2d');
const shrine = document.querySelector('.shrine'), celebration = $('celebration'), celebrationCtx = celebration.getContext('2d');
const royalPetals = new RoyalPetals(), petalPainter = new PetalPainter();
const shrineArms = new ShrineArms(() => { $('assetError').hidden = false; $('assetError').textContent = 'โหลดภาพไม่สำเร็จ · กรุณารีเฟรชหน้าจอ'; });
const preview = new URLSearchParams(location.search).has('preview');
const actorResolution = preview ? .5 : 1;
if (preview) { canvas.width = 540; canvas.height = 960; }
// Soft decorative petals need less raster resolution than names and characters.
celebration.width = 540; celebration.height = 960; celebrationCtx.scale(.5, .5);
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
let overlaySocket = null;
const audio = new SceneAudio({ preview, onState: state => {
  if (preview) return;
  $('unmute').hidden = state === 'running';
  if (state !== 'running') $('unmute').textContent = '♫ เปิดเสียง';
}, onMusicStatus: status => {
  canvas.dataset.music = status.state;
  $('audioError').hidden = status.state !== 'error';
  if (status.state === 'error') $('audioError').textContent = 'โหลดเพลงไม่สำเร็จ · กรุณารีเฟรช';
}, onSpeechState: status => {
  if (status.id) {
    canvas.dataset.speechId = status.id; canvas.dataset.speechState = status.state; canvas.dataset.speechTag = status.tag;
  }
  if (!preview && overlaySocket?.readyState === WebSocket.OPEN) overlaySocket.send(JSON.stringify({ t: 'speech-status', ...status }));
} });
const visitors = new Map(), petals = [];
const badgeCache = new Map();
document.fonts.addEventListener('loadingdone', () => badgeCache.clear());
const seats = seatLayout(), cap = 60;
let mode = null, settings = {}, last = performance.now(), lastRitual = null, remoteRitual = null;
let hero = null, lastGiftAt = Date.now(), inviteUntil = 0, nextGolden = 0, waiting = 0;
let renderedFrames = 0;
const numbers = new Intl.NumberFormat('en-US');
const images = {};
const characterSprites = new CharacterSprites(images);
for (const [key, file] of Object.entries({ female: 'worshipper', male: 'worshipper-male', bows: 'worshipper-bows', carriers: 'ceremony-carriers', marigold: 'marigold-garland', royal: 'royal-offering', shrine: 'shrine' })) {
  const image = new Image(); image.src = `/assets/ganesha/${file}.png`; images[key] = image;
  image.onerror = () => { $('assetError').hidden = false; $('assetError').textContent = 'โหลดภาพไม่สำเร็จ · กรุณารีเฟรชหน้าจอ'; };
}
function fit() { stage.style.transform = `translate(-50%,-50%) scale(${Math.min(innerWidth / 1080, innerHeight / 1920)})`; }
addEventListener('resize', fit); fit();
$('unmute').hidden = preview;
$('unmute').onclick = async () => {
  try { if (await audio.start()) { $('unmute').hidden = true; audio.bell(); } }
  catch { $('unmute').hidden = false; $('unmute').textContent = 'ลองเปิดเสียงอีกครั้ง'; }
};
// OBS permits audio without a gesture; browsers show the explicit sound button.
if (!preview) audio.start().then(r => { if (r) $('unmute').hidden = true; }).catch(() => {});
function addViewer(p, instant = false) {
  if (!p.slot || p.seatState === 'waiting') return;
  if (visitors.has(p.id)) {
    Object.assign(visitors.get(p.id), { name: p.name, coins: p.coins, skin: p.skin }); attendance(); return;
  }
  const phase = actorPhase(p.id), now = performance.now() / 1000;
  const v = { ...p, seat: seats[p.slot - 1], x: 540, y: 1990, state: instant || reduced ? 'sit' : 'walk',
    elapsed: 0, step: 0, glow: 0, phase: phase * 6.28, bowAt: now - phase * 29 };
  visitors.set(p.id, v);
  if (v.state === 'sit' && v.seat) { v.x = v.seat.x; v.y = v.seat.y; }
  if (p.seatState === 'leaving') depart(p);
  attendance();
}
function depart(p) {
  const v = visitors.get(p.id); if (!v) return;
  v.state = 'leave'; v.exitAt = p.exitAt; v.exitUntil = p.exitUntil;
}
function settle(p) {
  const v = visitors.get(p.id); if (!v?.seat) return;
  v.state = 'sit'; v.x = v.seat.x; v.y = v.seat.y; v.bowAt = performance.now() / 1000 - actorPhase(v.id) * 29;
}
function attendance() {
  const real = [...visitors.values()].filter(v => !v.ambient), ambient = visitors.size - real.length;
  $('attendance').textContent = `${real.length} คนร่วมบูชา${waiting ? ` · รอ ${waiting}` : ''}`;
  canvas.dataset.people = real.length; canvas.dataset.ambient = ambient; canvas.dataset.waiting = waiting;
  canvas.dataset.male = real.filter(v => v.skin === 'male').length;
  $('ambientBadge').hidden = ambient === 0;
}
function seatingStatus(m) {
  waiting = m.waiting || 0; canvas.dataset.departing = m.departing || 0;
  canvas.dataset.queued = m.rituals || 0; attendance();
}
function receiveRitual(active, serverTime) {
  if (!active) { remoteRitual = null; return; }
  if (remoteRitual?.id === active.id && remoteRitual?.serverBeganAt === active.beganAt) return;
  const elapsed = Math.max(0, (serverTime || Date.now()) - active.beganAt);
  const beganAt = performance.now() - elapsed;
  remoteRitual = { ...active, serverBeganAt: active.beganAt, beganAt, until: beganAt + active.until - active.beganAt };
}
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
  visitors.clear(); petals.length = 0; remoteRitual = null; lastRitual = null; hero = null;
  royalPetals.reset(); shrine.style.transform = ''; canvas.dataset.zoom = '1.000';
  $('gift').hidden = true; stage.classList.remove('ceremony'); audio.clear();
  lastGiftAt = m.engagement?.lastGiftAt || Date.now(); inviteUntil = 0;
  mode = m.mode; settings = m.settings;
  for (const person of m.actors) addViewer(person, true);
  seatingStatus(m.seating); receiveRitual(m.active, m.serverTime);
  $('title').textContent = settings.title; $('subtitle').textContent = settings.subtitle;
  $('demoBadge').hidden = mode !== 'demo'; audio.configure(settings); updateStats(m); attendance();
  document.title = `${settings.title} · Ganesha LIVE`;
}
function updateSettings(m) {
  settings = m.settings;
  const ids = new Set(m.actors.map(v => v.id));
  for (const id of visitors.keys()) if (!ids.has(id)) visitors.delete(id);
  for (const person of m.actors) { addViewer(person, true); if (person.seatState === 'leaving') depart(person); }
  seatingStatus(m.seating); updateStats(m); audio.clear(); audio.configure(settings);
  $('title').textContent = settings.title; $('subtitle').textContent = settings.subtitle;
  if (!settings.idlePrompts) inviteUntil = 0;
}
function particles(x, y, count, heart = false) {
  const amount = Math.min(count, reduced ? 6 : 36);
  for (let i = 0; i < amount; i++) petals.push({ x, y, vx: (Math.random() - .5) * 110, vy: -(40 + Math.random() * 75), age: 0, life: 2 + Math.random() * 3, size: 5 + Math.random() * 8, phase: Math.random() * 6, heart });
  if (petals.length > 180) petals.splice(0, petals.length - 180);
}
function connect() {
  const ws = new WebSocket(`${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws?role=overlay${preview ? '&preview=1' : ''}`);
  overlaySocket = ws;
  ws.onopen = () => { $('connection').hidden = true; audio.reportSpeech(); };
  ws.onclose = () => { overlaySocket = null; audio.clear(); $('connection').hidden = false; setTimeout(connect, 2000); };
  ws.onmessage = e => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'state') state(m);
    if (m.t === 'settings') updateSettings(m);
    if (m.t === 'stats') updateStats(m);
    if (m.t === 'join') addViewer(m.v);
    if (m.t === 'character') {
      addViewer(m.v);
      if (hero?.id === m.v.id) hero.skin = m.v.skin;
      if (remoteRitual?.id === m.v.id) remoteRitual.skin = m.v.skin;
    }
    if (m.t === 'depart') depart(m.v);
    if (m.t === 'settle') settle(m.v);
    if (m.t === 'leave') { visitors.delete(m.id); attendance(); }
    if (m.t === 'seating') seatingStatus(m);
    if (m.t === 'ritual') { receiveRitual(m.active, m.serverTime); canvas.dataset.queued = m.queued || 0; }
    if (m.t === 'chat') { const v = visitors.get(m.id); if (v) { v.bubble = { text: m.text, until: performance.now() + 4000 }; v.glow = .35; } }
    if (m.t === 'gift') {
      lastGiftAt = m.lastGiftAt || Date.now(); inviteUntil = 0; audio.giftPriority();
      const v = visitors.get(m.id); if (v) { v.coins = m.total; v.glow = 1; }
    }
    if (m.t === 'engagement') {
      if (m.lastGiftAt < lastGiftAt) return;
      inviteUntil = performance.now() + 6000; $('inviteText').textContent = 'กดหัวใจ ♥ และแชร์ไลฟ์';
      $('inviteSub').textContent = m.text; canvas.dataset.prompts = Number(canvas.dataset.prompts || 0) + 1;
    }
    if (m.t === 'like') { const v = visitors.get(m.id); particles(v?.x || 900, (v?.y || 1650) - 150, Math.min(4, m.n), true); }
    if (m.t === 'follow') { const v = visitors.get(m.id); if (v) { v.glow = 1; particles(v.x, v.y - 150, 8); } }
    if (m.t === 'bell') audio.bell('aarti');
    if (m.t === 'tts') audio.speech(m.url, m.tag, m.id);
    if (m.t === 'music-replay') audio.replayMusic();
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
  if (!active || active.ritual.procession) return;
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
  if (!v.seat || hero?.id === v.id) return;
  const seat = v.seat; let frame = 7;
  if (v.state === 'walk') {
    const target = Math.abs(v.y - seat.y) > 3 ? { x: 540, y: seat.y } : seat;
    const dx = target.x - v.x, dy = target.y - v.y, d = Math.hypot(dx, dy), speed = 210 * dt;
    if (d > 1) { v.x += dx / d * Math.min(speed, d); v.y += dy / d * Math.min(speed, d); }
    v.step += dt * 7; frame = Math.floor(v.step) % 4;
    if (Math.hypot(v.x - seat.x, v.y - seat.y) < 4) { v.state = 'kneel'; v.elapsed = 0; }
  } else if (v.state === 'kneel') {
    v.elapsed += dt; frame = 4 + Math.min(3, Math.floor(v.elapsed / .22));
    if (v.elapsed >= .9) { v.state = 'sit'; v.bowAt = t; }
  } else if (v.state === 'leave') {
    const pose = exitPose(seat, Date.now() - v.exitAt);
    v.x = pose.x; v.y = pose.y; frame = pose.frame; ctx.globalAlpha *= pose.alpha;
  }
  v.glow = Math.max(0, v.glow - dt * .3);
  const highlight = active?.id === v.id || v.glow > .4;
  const depth = Math.max(0, Math.min(1.4, (v.y - 1230) / 480));
  const h = (245 + 105 * depth) * seat.density, w = h * .75;
  v.renderHeight = h;
  const bob = reduced ? 0 : v.state === 'walk' ? Math.sin(v.step * Math.PI / 2) * 2 : Math.sin(t * 1.4 + v.phase) * 1.1;
  ctx.save();
  ctx.fillStyle = '#25100745'; ctx.beginPath(); ctx.ellipse(v.x, v.y - 7, w * .28, 11 * seat.density, 0, 0, Math.PI * 2); ctx.fill();
  if (highlight) { ctx.strokeStyle = '#ffe8a5bb'; ctx.lineWidth = 2; ctx.shadowColor = '#ffc95d'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.ellipse(v.x, v.y - 6, w * .32, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.shadowBlur = 0;
  if (v.state === 'sit' && characterSprites.ready('bows')) {
    const pose = devotionPose(t - v.bowAt, 0, reduced);
    const heights = v.skin === 'male' ? [455,356,244,436] : [448,345,208,415];
    const bodyHeight = heights[pose.from] * (1 - pose.mix) + heights[pose.to] * pose.mix;
    // Warp one opaque pose toward the next height: a crossfade leaves ghost
    // heads/hands against the bright floor, especially on the front row.
    const f = pose.mix < .5 ? pose.from : pose.to, sy = bodyHeight / heights[f];
    const sprite = characterSprites.get(f, h, v.skin, false, true);
    if (sprite) ctx.drawImage(sprite, v.x - w / 2, v.y - h * sy, w, h * sy);
    v.bowing = pose.bow > 0;
  } else {
    // Keep the original kneeling pose until the bow sheet has loaded fully.
    const sprite = characterSprites.get(frame, h, v.skin);
    if (sprite) ctx.drawImage(sprite, v.x - w / 2, v.y - h + bob, w, h);
    v.bowing = false;
  }
  ctx.restore();
  if (v.ambient) return;
  const tagY = v.y - h * (frame > 3 ? .89 : .99) - 4;
  nameTag(v, v.x, tagY, Math.max(80, seat.gap + 8), highlight || v.coins >= 100);
  if (v.bubble && performance.now() < v.bubble.until) {
    // Only show one line; bounded width avoids covering the central statue.
    ctx.save(); ctx.font = '19px Thai, Latin, sans-serif'; const text = shorten(v.bubble.text, 170), width = ctx.measureText(text).width + 24;
    ctx.fillStyle = '#2b1913ed'; rounded(v.x - width / 2, tagY - 78, width, 33, 12); ctx.fill();
    ctx.fillStyle = '#ffe6b6'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, v.x, tagY - 62); ctx.restore();
  }
}
function finishHero() {
  if (!hero) return;
  const v = visitors.get(hero.id);
  if (v?.seat) { v.x = v.seat.x; v.y = v.seat.y; v.state = 'sit'; v.elapsed = 0; v.bowAt = performance.now() / 1000; }
  hero = null; canvas.dataset.ceremonyPhase = ''; canvas.dataset.ceremonySkin = '';
}
function drawCeremony(active, now, t, pose) {
  if (!hero || !active?.ritual.procession) return;
  canvas.dataset.ceremonyPhase = pose.phase; canvas.dataset.ceremonySkin = hero.skin;
  const h = 300 + Math.max(0, Math.min(1, (pose.y - 1230) / 480)) * 50, w = h * .75;
  const royal = active.ritual.kind === 'royal';
  ctx.save();
  const beam = ctx.createLinearGradient(540, 900, 540, 1780);
  beam.addColorStop(0, royal ? '#ffe8a43a' : '#ffc22f28'); beam.addColorStop(1, '#edbe4400');
  ctx.fillStyle = beam; ctx.beginPath(); ctx.moveTo(500, 900); ctx.lineTo(580, 900); ctx.lineTo(710, 1780); ctx.lineTo(370, 1780); ctx.closePath(); ctx.fill();
  if (pose.focus > 0) {
    ctx.globalAlpha = pose.focus;
    const glow = ctx.createRadialGradient(540, 850, 40, 540, 850, 430); glow.addColorStop(0, '#ffc55b00'); glow.addColorStop(.75, royal ? '#ffce6540' : '#ffc24925'); glow.addColorStop(1, '#ffdd8100');
    ctx.fillStyle = glow; ctx.fillRect(90, 400, 900, 900);
    ctx.strokeStyle = royal ? '#ffe6a080' : '#ffd17165'; ctx.lineWidth = royal ? 3 : 2;
    ctx.beginPath(); ctx.ellipse(540, 1160, 125 + Math.sin(t * 2) * 5, 25, 0, 0, Math.PI * 2); ctx.stroke();
    if (royal) {
      for (const x of [365, 715]) {
        ctx.fillStyle = '#d8a448'; ctx.beginPath(); ctx.ellipse(x, 1090, 32, 9, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#ffe8a6'; ctx.beginPath(); ctx.ellipse(x, 1074, 6, 20 + Math.sin(t * 8) * 3, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1; ctx.fillStyle = '#21100760'; ctx.beginPath(); ctx.ellipse(pose.x, pose.y - 4, 65, 14, 0, 0, Math.PI * 2); ctx.fill();
  const sprite = characterSprites.get(pose.carrier ? pose.carrierFrame : pose.frame, h, hero.skin, pose.carrier)
    || characterSprites.get(pose.frame, h, hero.skin);
  if (sprite) {
    ctx.save(); ctx.translate(pose.x, pose.y); ctx.rotate(pose.bow);
    ctx.drawImage(sprite, -w / 2, -h, w, h); ctx.restore();
  }
  const prop = images[active.ritual.kind];
  if (pose.prop && prop?.naturalWidth) {
    const ph = royal ? 110 : 128, pw = ph * prop.naturalWidth / prop.naturalHeight;
    const px = pose.x + h * .24, py = pose.y - h * (pose.phase === 'offer' ? .47 + .23 * pose.lift : .60);
    ctx.drawImage(prop, px - pw / 2, py - ph / 2, pw, ph);
  } else if (['stand', 'return', 'to-seat', 'settle', 'done'].includes(pose.phase) && prop?.naturalWidth) {
    const ph = royal ? 105 : 125, pw = ph * prop.naturalWidth / prop.naturalHeight;
    ctx.drawImage(prop, 540 - pw / 2, 1000 - ph, pw, ph);
  }
  nameTag(hero, pose.x, pose.y - h - 6, 230, true);
  if (!reduced && now > nextGolden && pose.focus > .5) {
    nextGolden = now + (royal ? 110 : 190);
    particles(360 + Math.random() * 360, 1110, royal ? 3 : 2);
    for (const p of petals.slice(-(royal ? 3 : 2))) p.golden = true;
  }
  ctx.restore();
}
function frame(now) {
  requestAnimationFrame(frame);
  // 30 fps suits the broadcast; the small operator preview needs only 15 fps.
  if (now - last < 1000 / (preview ? 15 : 30) - .7) return;
  const dt = Math.min(.1, (now - last) / 1000); last = now; const t = now / 1000;
  canvas.dataset.rendered = ++renderedFrames;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, 1080, 1920);
  const active = remoteRitual && now < remoteRitual.until ? remoteRitual : null;
  if (active !== lastRitual) {
    if (lastRitual?.ritual.kind === 'royal') royalPetals.stop();
    finishHero();
    lastRitual = active; $('gift').hidden = !active;
    stage.classList.toggle('ceremony', !!active?.ritual.procession);
    if (active) {
      $('giftIcon').textContent = active.ritual.icon; $('giftLabel').textContent = active.ritual.label;
      $('giftName').textContent = active.name; $('giftCount').textContent = '×' + active.count;
      $('gift').dataset.kind = active.ritual.kind; audio.bell(active.ritual.kind);
      const v = visitors.get(active.id); particles(v?.x || 540, (v?.y || 1400) - 160, active.ritual.kind === 'aarti' ? 36 : 16);
      if (active.ritual.procession) {
        const seat = v?.seat || { x: 620, y: 1710 };
        hero = { id: active.id, name: active.name, skin: v?.skin || active.skin || 'female', from: { x: v?.x ?? 540, y: v?.y ?? 1870 }, seat: { ...seat }, seated: v?.state === 'sit' };
      }
      if (active.ritual.kind === 'royal') royalPetals.start(now, { reduced, light: settings.petalMode === 'light' });
    }
  }
  const pose = hero && active ? processionPose(active.ritual.kind, now - active.beganAt, hero.from, visitors.get(hero.id)?.seat || hero.seat, hero.seated) : null;
  const donor = active && visitors.get(active.id);
  const focus = pose || (donor && { x: donor.x, y: donor.y, bodyHeight: donor.renderHeight || 200 });
  const camera = ceremonyCamera(active?.ritual.kind, active ? now - active.beganAt : 0, focus,
    { enabled: settings.cinematicZoom !== false, reduced, durationMs: active ? active.until - active.beganAt : 0 });
  // Transform world coordinates inside a fixed-size canvas so zoom does not
  // create a much larger animated compositor layer on integrated graphics.
  shrine.style.transform = `translate(${camera.x.toFixed(2)}px,${camera.y.toFixed(2)}px) scale(${camera.scale.toFixed(4)})`;
  ctx.setTransform(camera.scale * actorResolution, 0, 0, camera.scale * actorResolution, camera.x * actorResolution, camera.y * actorResolution);
  canvas.dataset.zoom = camera.scale.toFixed(3);
  canvas.dataset.zoomTarget = active && focus ? active.id : '';
  canvas.dataset.ritualKind = active?.ritual.kind || '';
  shrine.classList.toggle('articulated', settings.statueMotion !== false && shrineArms.ready);
  if (shrine.classList.contains('articulated')) {
    const pose = shrineArms.draw(ctx, t, { enabled: true, reduced, level: settings.statueMotionLevel });
    canvas.dataset.armLotus = pose.lotus.toFixed(4); canvas.dataset.armHammer = pose.hammer.toFixed(4);
  } else { canvas.dataset.armLotus = '0'; canvas.dataset.armHammer = '0'; }
  for (let i = 0; i < 24; i++) {
    const x = (i * 137 + Math.sin(t * .15 + i) * 30) % 1080;
    const y = (i * 83 - t * (reduced ? 2 : 7) + 20000) % 1660;
    ctx.fillStyle = `rgba(255,221,147,${.12 + .16 * Math.sin(t + i) ** 2})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3, 0, 6.28); ctx.fill();
  }
  if (inviteUntil <= now) {
    $('inviteText').textContent = settings.joinOnChat ? 'พิมพ์ “สาธุ” เพื่อร่วมบูชา' : 'ร่วมถวายด้วยใจศรัทธา';
    $('inviteSub').textContent = 'พิมพ์ 1 = หญิง · 2 = ชาย';
  }
  $('invitation').classList.toggle('call-to-action', inviteUntil > now && !hero);
  ritualArt(active, t);
  for (const v of [...visitors.values()].sort((a, b) => a.y - b.y)) {
    ctx.save(); ctx.globalAlpha = hero ? .82 : 1; drawViewer(v, dt, t, active); ctx.restore();
  }
  canvas.dataset.bowing = [...visitors.values()].filter(v => v.bowing).length;
  drawCeremony(active, now, t, pose);
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i]; p.age += dt; if (p.age > p.life) { petals.splice(i, 1); continue; }
    p.x += (p.vx + Math.sin(t + p.phase) * 12) * dt; p.y += p.vy * dt;
    ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = Math.min(1, (p.life - p.age) * .7);
    if (p.heart) { ctx.fillStyle = '#fa9b9e'; ctx.font = '25px serif'; ctx.fillText('♥', 0, 0); }
    else { ctx.rotate(t + p.phase); ctx.fillStyle = p.golden ? p.phase > 3 ? '#ffe29a' : '#f8b42f' : p.phase > 3 ? '#fbd7c7' : '#efb6ba'; ctx.beginPath(); ctx.ellipse(0, 0, p.size * .55, p.size, 0, 0, 6.28); ctx.fill(); }
    ctx.restore();
  }
  royalPetals.configure({ reduced, light: settings.petalMode === 'light' });
  petalPainter.draw(celebrationCtx, royalPetals.update(now, dt), now);
  celebration.dataset.petals = royalPetals.items.length;
}
connect(); requestAnimationFrame(frame);
