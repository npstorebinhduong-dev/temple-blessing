import { seatLayout, exitPose, arrivalPose } from './seating.js';
import { actorPhase, devotionPose } from './devotion.js';
import { ShrineArms } from './shrine-arms.js';
import { CharacterSprites } from './character-sprites.js';
import { SceneAudio } from './audio.js';
import { processionPose } from './procession.js';
import { CameraController } from './camera-controller.js';
import { RoyalPetals, PetalPainter } from './royal-petals.js';
import { entrancePosition } from './entrance-line.js';
import { ShoulderCrowd } from './shoulder-crowd.js';
import { InfoPanel } from './info-panel.js';
import { screenRect, SCENE_VIEW } from './scene-layout.js';
import { Nameplates } from './nameplates.js';
import { SpecialArt } from './special-art.js';
import { specialPose, smooth, MUSHIKA } from './special-rituals.js';
import { actorGeometry, entryWorldPoint } from './actor-geometry.js';
import { drawSmallGift } from './small-gift-effect.js';
import { drawStations, OFFERING } from './ceremony-stations.js';
import { stationPose, drawGarland, drawTray } from './station-ritual.js';
import { CameraDebug } from './camera-debug.js';
const $ = id => document.getElementById(id);
const setText = (id, text) => { const el = $(id); if (el.textContent !== text) el.textContent = text; };
const stage = $('stage'), canvas = $('scene'), ctx = canvas.getContext('2d');
const nameCanvas = $('nameScene'), nameCtx = nameCanvas.getContext('2d');
const entranceCanvas = $('entranceScene'), entranceCtx = entranceCanvas.getContext('2d');
const shrine = document.querySelector('.shrine'), celebration = $('celebration'), celebrationCtx = celebration.getContext('2d');
const royalPetals = new RoyalPetals(), petalPainter = new PetalPainter();
const cameraController = new CameraController();
const world = $('world');
const cameraDebug = new CameraDebug(stage, new URLSearchParams(location.search).get('debugCamera') === '1');
const shrineArms = new ShrineArms(() => { $('assetError').hidden = false; $('assetError').textContent = 'โหลดภาพไม่สำเร็จ · กรุณารีเฟรชหน้าจอ'; });
const preview = new URLSearchParams(location.search).has('preview');
let actorResolution = preview ? .5 : 1;
// The standing figure extends left of world x=0. Preserve the old viewport's
// visible area BEFORE the root camera transforms the canvas bitmap.
const SCENE_PAD = 160, SCENE_WIDTH = 1400, SCENE_HEIGHT = 2080;
const textResolution = preview ? .5 : 1;
nameCanvas.width = 1080 * textResolution; nameCanvas.height = 1920 * textResolution;
canvas.width = SCENE_WIDTH * actorResolution; canvas.height = SCENE_HEIGHT * actorResolution;
entranceCanvas.width = 1080 * actorResolution; entranceCanvas.height = 224 * actorResolution;
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
const visitors = new Map(), entrance = new Map(), petals = [];
const images = {};
const crowd = new ShoulderCrowd(images), nameplates = new Nameplates(), infoPanel = new InfoPanel($('infoPanel'));
let statueTime = 0;
document.fonts.addEventListener('loadingdone', () => { nameplates.cache.clear(); crowd.tiles.clear(); });
const seats = seatLayout(), cap = 60;
let mode = null, settings = {}, last = performance.now(), lastRitual = null, remoteRitual = null;
let nextFrameAt = last;
let hero = null, lastGiftAt = Date.now(), inviteUntil = 0, nextGolden = 0, waiting = 0;
let renderedFrames = 0, prayerPrompt = null;
let frameMs = [], lastSpecialPhase = '', waitingNoticeUntil = 0;
const numbers = new Intl.NumberFormat('en-US');
const characterSprites = new CharacterSprites(images);
const specialArt = new SpecialArt(images);
for (const [key, file] of Object.entries({ female: 'worshipper', male: 'worshipper-male', bows: 'worshipper-bows', carriers: 'ceremony-carriers', marigold: 'marigold-garland', royal: 'royal-offering', shrine: 'shrine', mushika: 'mushika', whisper: 'whisper-poses', apparition: 'ganesha-standing' })) {
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
  const entryFrom = p.entryFrom || (entrance.has(p.id) ? entrancePosition(entrance.get(p.id).lineSlot) : null);
  const entryPoint = entryFrom ? entryWorldPoint(entryFrom, SCENE_VIEW) : null;
  if (!instant && (p.entryFrom || entrance.has(p.id))) crowd.promote({ ...entrance.get(p.id), ...p }, performance.now());
  entrance.delete(p.id); crowd.update([...entrance.values()]); entranceStatus();
  const v = { ...p, seat: seats[p.slot - 1], x: entryPoint?.x ?? 540, y: entryPoint?.y ?? 2090, state: instant || reduced ? 'sit' : 'walk',
    entryStart: entryFrom && !instant && !reduced ? now : null,
    elapsed: 0, step: 0, glow: 0, phase: phase * 6.28, bowAt: now - phase * 29 };
  v.arrivalOrigin = { x:v.x,y:v.y }; v.arrivalAt = now;
  visitors.set(p.id, v);
  if (v.state === 'sit' && v.seat) { v.x = v.seat.x; v.y = v.seat.y; }
  if (p.seatState === 'leaving') depart(p);
  attendance();
}
function entranceStatus() {
  canvas.dataset.standing = entrance.size;
  canvas.dataset.standingMale = [...entrance.values()].filter(v => v.skin === 'male').length;
  stage.classList.toggle('entrance-active', entrance.size > 0);
  entranceCanvas.hidden = entrance.size === 0;
}
function receiveEntrance(data = {}) {
  entrance.clear();
  const now = performance.now(), serverTime = data.serverTime || Date.now();
  for (const person of data.people || []) {
    if (visitors.has(person.id)) continue;
    entrance.set(person.id, { ...person, shown: now - Math.max(0, serverTime - person.shownAt),
      exit: person.exitAt === undefined ? null : now - Math.max(0, serverTime - person.exitAt) });
  }
  crowd.update([...entrance.values()]);
  canvas.dataset.entryWaiting = data.waiting || 0; canvas.dataset.entryTotal = data.total || 0;
  canvas.dataset.entryReal = data.realTotal || 0; canvas.dataset.entryDemo = data.demoTotal || 0;
  $('crowdCount').textContent = mode === 'demo' ? `ภาพตัวอย่าง · รอ ${data.demoTotal || 0} คน` : `รอร่วมบูชา ${data.realTotal || 0} คน`;
  $('crowdCount').hidden = !data.total; entranceStatus();
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
  const elapsed = Math.max(0, (serverTime || Date.now()) - active.beganAt);
  const beganAt = performance.now() - elapsed;
  const speech = active.speech ? { ...active.speech } : null;
  if (speech) for (const key of ['startedAt', 'endedAt', 'bannerUntil']) if (Number.isFinite(speech[key])) speech[key] = beganAt + speech[key] - active.beganAt;
  if (remoteRitual?.turn === active.turn && remoteRitual?.serverBeganAt === active.beganAt) {
    remoteRitual.until = remoteRitual.beganAt + active.until - active.beganAt;
    remoteRitual.speech = speech; return;
  }
  remoteRitual = { ...active, serverBeganAt: active.beganAt, beganAt, until: beganAt + active.until - active.beganAt };
  remoteRitual.speech = speech;
}
function giftGuide() {
  stage.classList.toggle('light-effects', settings.petalMode === 'light');
  const desiredResolution = preview ? .5 : settings.petalMode === 'light' ? .65 : 1;
  if (actorResolution !== desiredResolution) {
    actorResolution = desiredResolution; canvas.width = SCENE_WIDTH * actorResolution; canvas.height = SCENE_HEIGHT * actorResolution;
    // Resizing a canvas resets its matrix to identity. Keep the viewport
    // coherent even between this settings event and the next animation frame.
    applyCamera(cameraController.current);
  }
  infoPanel.configure(settings, mode);
  infoPanel.tick(performance.now(), false);
}
function updateStats(m) {
  if (m.stats) {
    $('goalValue').textContent = `${numbers.format(m.stats.coins)} / ${numbers.format(m.goal || settings.goal || 4995)}`;
    $('goalFill').style.width = Math.min(100, m.stats.coins / (m.goal || settings.goal || 4995) * 100) + '%';
    $('hearts').textContent = '♡ ' + numbers.format(m.stats.likes);
  }
  if (m.top) {
    const list = $('ranking'); list.replaceChildren();
    for (const [i, person] of m.top.slice(0,3).entries()) {
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
  visitors.clear(); entrance.clear(); crowd.reset(); petals.length = 0; remoteRitual = null; lastRitual = null; hero = null;
  royalPetals.reset(); applyCamera(cameraController.reset());
  nameplates.clear(); lastSpecialPhase = ''; $('blessingBanner').hidden = true; $('ritualWait').hidden = true;
  canvas.dataset.ceremonyPhase = ''; canvas.dataset.ceremonySkin = '';
  $('gift').hidden = true; stage.classList.remove('ceremony'); audio.clear();
  lastGiftAt = m.engagement?.lastGiftAt || Date.now(); inviteUntil = 0;
  mode = m.mode; settings = m.settings; prayerPrompt=m.prayerPrompts?.at(-1)||null;
  giftGuide();
  for (const person of m.actors) addViewer(person, true);
  receiveEntrance(m.entrance);
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
  receiveEntrance(m.entrance);
  seatingStatus(m.seating); updateStats(m); audio.clear(); audio.configure(settings);
  if (remoteRitual?.ritual.kind === 'galaxy') audio.beginSpecial();
  giftGuide();
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
  ws.onclose = () => { overlaySocket = null; remoteRitual = null; applyCamera(cameraController.reset()); audio.clear(); $('connection').hidden = false; setTimeout(connect, 2000); };
  ws.onmessage = e => {
    let m; try { m = JSON.parse(e.data); } catch { return; }
    if (m.t === 'state') state(m);
    if (m.t === 'settings') updateSettings(m);
    if (m.t === 'gift-guide') { settings = { ...settings, ...m.settings }; giftGuide(); }
    if (m.t === 'stats') updateStats(m);
    if (m.t === 'join') addViewer(m.v);
    if (m.t === 'entrance') receiveEntrance(m);
    if (m.t === 'character') {
      addViewer(m.v);
      if (hero?.id === m.v.id) hero.skin = m.v.skin;
      if (remoteRitual?.id === m.v.id) remoteRitual.skin = m.v.skin;
    }
    if (m.t === 'depart') depart(m.v);
    if (m.t === 'settle') settle(m.v);
    if (m.t === 'leave') { visitors.delete(m.id); attendance(); }
    if (m.t === 'seating') seatingStatus(m);
    if (m.t === 'ritual' || m.t === 'ritual-progress') { receiveRitual(m.active, m.serverTime); if (m.queued !== undefined) canvas.dataset.queued = m.queued; }
    if (m.t === 'ritual-wait') {
      $('ritualWait').textContent = `${m.name} · อยู่ในคิวบูชา (${m.queued})`; $('ritualWait').hidden = false; waitingNoticeUntil = performance.now() + 4500;
    }
    if(m.t==='prayer-prompt')prayerPrompt=m.grant;
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
    if (m.t === 'speech-clear') audio.clearSpeech();
    if (m.t === 'speech-cancel' && audio.playingJob?.id === m.id) audio.stopPlaying();
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
function nameTag(v, x, y, width, focus) { nameplates.add(v, x, y, width, focus); }

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
function ritualArt(active, now, t) {
  if(!active||active.ritual.procession)return null;
  const kind=active.ritual.kind,elapsed=now-active.beganAt;
  if(kind==='lotus')return drawSmallGift(ctx,visitors.get(active.id),elapsed,lotus);
  ctx.save();ctx.globalAlpha=Math.max(0,Math.min(1,elapsed/650,(active.until-now)/650));
  if(kind==='garland')drawGarland(ctx,OFFERING.x,OFFERING.y-29,27);
  if(kind==='aarti')drawTray(ctx,OFFERING.x,OFFERING.y-5,t);
  ctx.restore();return null;
}
function drawViewer(v, dt, t, active) {
  if (!v.seat || hero?.id === v.id) return;
  const seat = v.seat; let frame = 7;
  if (v.state === 'walk') {
    const pose = arrivalPose(v.arrivalOrigin,seat,(t-v.arrivalAt)*1000);
    v.x=pose.x;v.y=pose.y;v.step=pose.distance/34;frame=pose.frame;
    if(pose.phase==='sit'){v.state='sit';v.bowAt=t;}
  } else if (v.state === 'kneel') {
    v.elapsed += dt; frame = 4 + Math.min(3, Math.floor(v.elapsed / .22));
    if (v.elapsed >= .9) { v.state = 'sit'; v.bowAt = t; }
  } else if (v.state === 'leave') {
    const pose = exitPose(seat, Date.now() - v.exitAt);
    v.x = pose.x; v.y = pose.y; frame = pose.frame; ctx.globalAlpha *= pose.alpha;
  }
  v.glow = Math.max(0, v.glow - dt * .3);
  const highlight = active?.id === v.id || v.glow > .4;
  const geometry = actorGeometry(v, v, t), { height: h, width: w } = geometry;
  v.renderHeight = h;
  const bob = reduced ? 0 : v.state === 'walk' ? Math.sin(v.step * Math.PI / 2) * 2 : Math.sin(t * 1.4 + v.phase) * 1.1;
  ctx.save();
  ctx.fillStyle = '#25100745'; ctx.beginPath(); ctx.ellipse(v.x, v.y - 7, w * .28, 11 * seat.density, 0, 0, Math.PI * 2); ctx.fill();
  if (highlight) { ctx.strokeStyle = '#ffe8a5bb'; ctx.lineWidth = 2; ctx.shadowColor = '#ffc95d'; ctx.shadowBlur = 20; ctx.beginPath(); ctx.ellipse(v.x, v.y - 6, w * .32, 12, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.shadowBlur = 0;
  if (v.state === 'sit' && active?.id !== v.id && characterSprites.ready('bows')) {
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
  cameraDebug.actor(v, v, geometry, v.state, h);
  if (v.ambient) return;
  const tagY = v.y - h * (frame > 3 ? .89 : .99) - 4;
  nameTag(v, v.x, tagY, Math.max(94, seat.gap + 8), active?.id === v.id);

}
function finishHero() {
  if (!hero) return;
  const v = visitors.get(hero.id);
  if (v?.seat) { v.x = v.seat.x; v.y = v.seat.y; v.state = 'sit'; v.elapsed = 0; v.bowAt = performance.now() / 1000; }
  hero = null; canvas.dataset.ceremonyPhase = ''; canvas.dataset.ceremonySkin = '';
}
function drawEntrance(now) {
  const pen = entranceCtx;
  pen.setTransform(1, 0, 0, 1, 0, 0); pen.clearRect(0, 0, entranceCanvas.width, entranceCanvas.height);
  pen.setTransform(textResolution, 0, 0, textResolution, 0, -1696 * textResolution);
  canvas.dataset.crowdRendered = crowd.draw(pen, now, { light: settings.petalMode === 'light', reduced });
  canvas.dataset.crowdSprites = crowd.sprites.size;
  canvas.dataset.crowdLabels = crowd.tiles.size; canvas.dataset.avatarRequests = '0';
}
function blessingBanner(active, now) {
  const speech = active?.ritual.kind === 'galaxy' ? active.speech : null;
  const visible = speech && speech.startedAt !== null && now >= speech.startedAt && (speech.bannerUntil === null || now < speech.bannerUntil + 700);
  const banner = $('blessingBanner'); banner.hidden = !visible;
  if (visible) {
    if (banner.dataset.speechId !== speech.id) {
      setText('blessingName', active.name); setText('blessingText', speech.text);
      banner.style.top = Math.max(1440, 1680 - banner.offsetHeight) + 'px';
    }
    banner.classList.toggle('dissolving', speech.bannerUntil !== null && now >= speech.bannerUntil);
    banner.dataset.speechId = speech.id; banner.dataset.speechState = speech.state;
  }
  stage.classList.toggle('blessing-visible', !!visible);
}

function drawCeremony(active, now, t, pose, geometry) {
  if (!hero || !active?.ritual.procession || active.ritual.station || ['mushika', 'galaxy'].includes(active.ritual.kind)) return;
  canvas.dataset.ceremonyPhase = pose.phase; canvas.dataset.ceremonySkin = hero.skin;
  const { height: h, width: w } = geometry;
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
    ctx.beginPath(); ctx.ellipse(pose.x, pose.y, 86 + Math.sin(t * 2) * 3, 18, 0, 0, Math.PI * 2); ctx.stroke();
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
    const heldX=pose.x+h*.24,heldY=pose.y-h*(pose.phase==='offer'?.47+.23*pose.lift:.60);
    const px=heldX+(OFFERING.x-heldX)*pose.place,py=heldY+(OFFERING.y-ph/2-heldY)*pose.place;
    ctx.drawImage(prop, px - pw / 2, py - ph / 2, pw, ph);
  } else if (['stand', 'return', 'to-seat', 'settle', 'done'].includes(pose.phase) && prop?.naturalWidth) {
    const ph = royal ? 110 : 128, pw = ph * prop.naturalWidth / prop.naturalHeight;
    ctx.drawImage(prop, OFFERING.x - pw / 2, OFFERING.y - ph, pw, ph);
  }
  nameTag(hero, pose.x, pose.y - h - 6, 230, true);
  if (!reduced && now > nextGolden && pose.focus > .5) {
    nextGolden = now + (royal ? 110 : 190);
    particles(360 + Math.random() * 360, 1110, royal ? 3 : 2);
    for (const p of petals.slice(-(royal ? 3 : 2))) p.golden = true;
  }
  ctx.restore();
  cameraDebug.actor(hero, pose, geometry, pose.phase, h);
}
function drawStationCeremony(active,pose,geometry,t) {
  const {height:h,width:w}=geometry,kind=active.ritual.kind;
  canvas.dataset.ceremonyPhase=pose.phase;canvas.dataset.ceremonySkin=hero.skin;
  ctx.save();ctx.fillStyle='#06101d88';ctx.beginPath();ctx.ellipse(pose.x,pose.y-3,w*.28,10,0,0,7);ctx.fill();
  ctx.translate(pose.x,pose.y);ctx.rotate(pose.bow);
  const sprite=characterSprites.get(pose.carrier?pose.carrierFrame:pose.frame,h,hero.skin,pose.carrier)||characterSprites.get(pose.frame,h,hero.skin);
  if(sprite)ctx.drawImage(sprite,-w/2,-h,w,h);
  // The tray shares the body/hand transform; no independent spinning wrist.
  if(kind==='light') {
    ctx.save();ctx.globalAlpha=pose.phase==='settle'||pose.phase==='done'?0:1;
    drawTray(ctx,h*.24,-h*.62,t);ctx.restore();
  }
  if(kind==='floral'&&pose.place<1){const px=h*.24+(OFFERING.x-pose.x-h*.24)*pose.place,py=-h*.60+(OFFERING.y-29-pose.y+h*.60)*pose.place;drawGarland(ctx,px,py,27);}
  ctx.restore();
  if(kind==='floral'&&pose.place>=1)drawGarland(ctx,OFFERING.x,OFFERING.y-29,27);
  if(pose.phase==='offer'&&pose.phase!==lastSpecialPhase){audio.bell(kind);particles(OFFERING.x,OFFERING.y-30,kind==='floral'?9:3);}
  lastSpecialPhase=pose.phase;
  nameTag(hero,pose.x,pose.y-h-8,520,true);cameraDebug.actor(hero,pose,geometry,pose.phase,h);
}
function prayerBanner(active,now) {
  const ready=active?.ritual.kind==='prayer'&&active.prayer,el=$('prayerBanner');el.hidden=!ready;
  if(ready){setText('prayerName',active.name);setText('prayerText',active.prayer.text);el.style.opacity=String(Math.min(1,(now-active.beganAt)/450,(active.until-now)/600));el.style.top=Math.max(1270,1460-(settings.safeBottom||0))+'px';}
  const waiting=prayerPrompt&&Date.now()<prayerPrompt.deadline&&!active;
  $('prayerPrompt').hidden=!waiting;
  if(waiting)$('prayerPrompt').textContent=`${prayerPrompt.name} · พิมพ์คำอธิษฐานของคุณ ภายใน ${Math.max(0,Math.ceil((prayerPrompt.deadline-Date.now())/1000))} วินาที`;
}
function applyCamera(camera) {
  // Exactly ONE viewport transform on the world root. Neither the actor layer
  // nor the shrine gets a separate camera. Canvas transforms are raster units.
  world.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.scale})`;
  ctx.setTransform(actorResolution,0,0,actorResolution,SCENE_PAD*actorResolution,0);
  canvas.dataset.rasterScale = actorResolution; canvas.dataset.rasterPadding = SCENE_PAD;
  canvas.dataset.zoom = cameraController.relative.scale.toFixed(3);
  canvas.dataset.shrineScale = camera.scale.toFixed(3);
  canvas.dataset.cameraX = camera.x; canvas.dataset.cameraY = camera.y; canvas.dataset.cameraScale = camera.scale;
  canvas.dataset.cameraOwner = cameraController.owner || ''; canvas.dataset.zoomTarget = cameraController.target;
  canvas.dataset.cameraState = cameraController.reason;
}
function renderFrame(now) {
  // 30 fps suits the broadcast; the small operator preview needs only 15 fps.
  const frameInterval = 1000 / (preview ? 15 : 30);
  if (now < nextFrameAt - .7) return;
  // Keep the cadence across slightly late RAF callbacks. Scheduling from the
  // last *actual* frame threw away the remainder and needlessly skipped the
  // next frame, dropping a capable renderer from 30 toward 20 FPS.
  nextFrameAt += frameInterval;
  if (nextFrameAt < now) nextFrameAt = now + frameInterval;
  frameMs.push(now - last); if (frameMs.length > 240) frameMs.shift();
  const dt = Math.min(.1, (now - last) / 1000); last = now; const t = now / 1000;
  nameplates.clear();
  canvas.dataset.rendered = ++renderedFrames;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  const requested = remoteRitual && now < remoteRitual.until ? remoteRitual : null;
  const target = requested && visitors.get(requested.id);
  const targetImageReady = target && characterSprites.ready(target.skin === 'male' ? 'male' : 'female');
  const targetReady = targetImageReady && (target.state === 'sit' || hero?.id === target.id);
  const active = cameraController.accept(requested, targetReady ? target : null) ? requested : null;
  if (requested && target && !targetReady) cameraController.reason = targetImageReady ? 'actor-arriving' : 'actor-asset-unavailable';
  cameraDebug.begin(active);
  if (active !== lastRitual) {
    if (['royal', 'galaxy'].includes(lastRitual?.ritual.kind)) royalPetals.stop();
    audio.endSpecial(); lastSpecialPhase = '';
    finishHero();
    lastRitual = active; $('gift').hidden = true;
    stage.classList.toggle('ceremony', !!active?.ritual.procession);
    if (active) {
      // A queued notice belongs to the previous waiting state. New arrivals
      // can still post another notice while this ceremony is playing.
      waitingNoticeUntil = 0; $('ritualWait').hidden = true;
      $('giftIcon').textContent = ''; $('giftLabel').textContent = active.ritual.label;
      $('giftName').textContent = active.name; $('giftCount').textContent = '';
      $('gift').dataset.kind = active.ritual.kind; audio.bell(active.ritual.kind);
      if (active.ritual.kind === 'galaxy') audio.beginSpecial();
      const v = visitors.get(active.id);
      if (active.ritual.kind !== 'lotus') particles(v.x, v.y - 160, active.ritual.kind === 'aarti' ? 36 : 16);
      if (active.ritual.procession) {
        hero = { id: active.id, name: active.name, skin: v.skin || active.skin || 'female', from: { x: v.x, y: v.y }, seat: { ...v.seat }, seated: v.state === 'sit' };
      }
      if (['royal', 'galaxy'].includes(active.ritual.kind)) royalPetals.start(now, { reduced, light: settings.petalMode === 'light', galaxy: active.ritual.kind === 'galaxy' });
    }
  }
  const special = ['mushika', 'galaxy'].includes(active?.ritual.kind);
  const pose = hero && active ? special
    ? specialPose(active.ritual.kind, now - active.beganAt, hero.from, visitors.get(hero.id)?.seat || hero.seat, { untilMs: active.until - active.beganAt, reduced })
    : active.ritual.station ? stationPose(active.ritual.kind,now-active.beganAt,hero.from,visitors.get(hero.id)?.seat||hero.seat) : processionPose(active.ritual.kind, now - active.beganAt, hero.from, visitors.get(hero.id)?.seat || hero.seat, hero.seated) : null;
  const donor = active && visitors.get(active.id);
  const heroGeometry = hero && pose ? actorGeometry(hero, pose, t) : null;
  const focus = pose || (donor && { x: donor.x, y: donor.y, bodyHeight: donor.renderHeight || 200 });
  const camera = active ? cameraController.sample(active, now, focus, { enabled: settings.cinematicZoom !== false, reduced }) : cameraController.current;
  applyCamera(camera);
  canvas.dataset.ritualKind = active?.ritual.kind || '';
  shrine.classList.toggle('articulated', settings.statueMotion !== false && shrineArms.ready);
  if (!special) statueTime += dt;
  if (shrine.classList.contains('articulated')) {
    const armPose = shrineArms.draw(ctx, statueTime, { enabled: true, reduced, level: settings.statueMotionLevel });
    canvas.dataset.armLotus = armPose.lotus.toFixed(4); canvas.dataset.armHammer = armPose.hammer.toFixed(4);
  } else { canvas.dataset.armLotus = '0'; canvas.dataset.armHammer = '0'; }
  const galaxy = active?.ritual.kind === 'galaxy';
  const elapsed = active ? now-active.beganAt : 0;
  const dim = galaxy ? smooth(elapsed/1800) * (1-smooth((now-active.until+3200)/3200)) * (specialArt.standingReady() ? .80 : .28) : 0;
  canvas.dataset.dimmer = dim.toFixed(3);
  specialArt.mouse(ctx, reduced ? 0 : t, active?.ritual.kind === 'mushika' ? elapsed : null);
  drawStations(ctx,t,{lamp:active?.ritual.kind==='lamp'&&pose?.phase==='offer'?1:0,incense:active?.ritual.kind==='incense'||active?.ritual.kind==='fragrance'&&pose?.phase==='offer'?1:0});
  for (let i = 0; i < 24; i++) {
    const x = (i * 137 + Math.sin(t * .15 + i) * 30) % 1080;
    const y = (i * 83 - t * (reduced ? 2 : 7) + 20000) % 1660;
    ctx.fillStyle = `rgba(255,221,147,${.12 + .16 * Math.sin(t + i) ** 2})`; ctx.beginPath(); ctx.arc(x, y, 1.5 + i % 3, 0, 6.28); ctx.fill();
  }
  if (inviteUntil <= now) {
    setText('inviteText', settings.joinOnChat ? 'พิมพ์ “สาธุ” เพื่อร่วมบูชา' : 'ร่วมถวายด้วยใจศรัทธา');
    setText('inviteSub', 'พิมพ์ 1 = หญิง · 2 = ชาย');
  }
  $('invitation').classList.toggle('call-to-action', inviteUntil > now && !hero);
  const smallGift = ritualArt(active, now, t) || null;
  canvas.dataset.smallGiftEffect = smallGift ? 'small-fixed-lotus' : '';
  for (const v of [...visitors.values()].sort((a, b) => a.y - b.y)) {
    ctx.save(); ctx.globalAlpha = hero ? .82 : 1; drawViewer(v, dt, t, active); ctx.restore();
  }
  canvas.dataset.bowing = [...visitors.values()].filter(v => v.bowing).length;
  drawCeremony(active, now, t, pose, heroGeometry);
  if(active?.ritual.station)drawStationCeremony(active,pose,heroGeometry,t);
  royalPetals.configure({ reduced, light: settings.petalMode === 'light' });
  const shower = royalPetals.update(now, dt);
  if (dim) {
    ctx.save();ctx.setTransform(actorResolution/camera.scale,0,0,actorResolution/camera.scale,(SCENE_PAD-camera.x/camera.scale)*actorResolution,-camera.y*actorResolution/camera.scale);
    const shade=ctx.createLinearGradient(0,500,0,1830);shade.addColorStop(0,`rgba(6,7,19,${dim})`);shade.addColorStop(.55,`rgba(6,7,19,${dim*.93})`);shade.addColorStop(1,`rgba(6,7,19,${dim*.42})`);
    ctx.fillStyle=shade;ctx.fillRect(0,0,1080,1920);ctx.restore();
  }
  if (galaxy) {
    ctx.save();ctx.setTransform(actorResolution/camera.scale,0,0,actorResolution/camera.scale,(SCENE_PAD-camera.x/camera.scale)*actorResolution,-camera.y*actorResolution/camera.scale);
    petalPainter.draw(ctx,shower.filter(p=>p.depth<.55),now,{clear:false,opacity:.5});ctx.restore();
  }
  if (special && hero && pose) {
    canvas.dataset.ceremonyPhase = pose.phase; canvas.dataset.ceremonySkin = hero.skin;
    if (pose.phase !== lastSpecialPhase) {
      if (['gather','light-stream','receive','reply'].includes(pose.phase)) audio.ritualCue(pose.phase);
      lastSpecialPhase = pose.phase;
    }
    if (galaxy) {
      const art = specialArt.apparition(ctx, now - active.beganAt, active.until - active.beganAt, t, lotus, {
        light: settings.petalMode === 'light', reduced,
        blessingElapsedMs: Number.isFinite(active.speech?.startedAt) ? now - active.speech.startedAt : null,
      });
      canvas.dataset.apparition = art.opacity.toFixed(3); canvas.dataset.blessingArm = art.angle.toFixed(4);
      if (now >= active.until - 3200 && royalPetals.active) royalPetals.stop();
    } else {
      const transfer = specialArt.whisper(ctx, elapsed, pose, t, lotus, settings.petalMode === 'light');
      canvas.dataset.transferPhase = transfer.phase; canvas.dataset.transferProgress = transfer.progress.toFixed(3);
    }
    specialArt.actor(ctx, hero, pose, characterSprites, t, reduced, heroGeometry);
    cameraDebug.actor(hero, pose, heroGeometry, pose.phase, heroGeometry.height);
    if (!galaxy) nameTag(hero, pose.x, pose.y - heroGeometry.height - 12, 520, true);
  } else { canvas.dataset.apparition = '0'; canvas.dataset.blessingArm = '0'; canvas.dataset.transferPhase = ''; canvas.dataset.transferProgress = '0'; }
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i]; p.age += dt; if (p.age > p.life) { petals.splice(i, 1); continue; }
    p.x += (p.vx + Math.sin(t + p.phase) * 12) * dt; p.y += p.vy * dt;
    ctx.save(); ctx.translate(p.x, p.y); ctx.globalAlpha = Math.min(1, (p.life - p.age) * .7);
    if (p.heart) { ctx.fillStyle = '#fa9b9e'; ctx.font = '25px serif'; ctx.fillText('♥', 0, 0); }
    else { ctx.rotate(t + p.phase); ctx.fillStyle = p.golden ? p.phase > 3 ? '#ffe29a' : '#f8b42f' : p.phase > 3 ? '#fbd7c7' : '#efb6ba'; ctx.beginPath(); ctx.ellipse(0, 0, p.size * .55, p.size, 0, 0, 6.28); ctx.fill(); }
    ctx.restore();
  }
  nameCtx.setTransform(textResolution, 0, 0, textResolution, 0, 0); nameCtx.clearRect(0,0,1080,1920);
  const exclusions = [screenRect({x:MUSHIKA.x,y:MUSHIKA.y-12,w:MUSHIKA.width,h:MUSHIKA.height+24},camera)];
  if (active?.ritual.kind === 'mushika' && pose?.side) {
    // The other guests' labels must not run across the mouse or whispering hand.
    for (const r of [{ x:pose.x-90, y:pose.y-heroGeometry.height, w:190, h:heroGeometry.height }]) {
      exclusions.push({ x:r.x*camera.scale+camera.x,y:r.y*camera.scale+camera.y,w:r.w*camera.scale,h:r.h*camera.scale });
    }
  }
  canvas.dataset.namesRendered = nameplates.draw(nameCtx, camera, exclusions, now, !!active);
  drawEntrance(now);
  crowd.drawLabels(nameCtx, now, camera, SCENE_VIEW);
  blessingBanner(active, now);
  infoPanel.tick(now,!!active,active?.ritual.label);
  prayerBanner(active,now);
  stage.classList.toggle('any-ritual', !!active);
  if (now >= waitingNoticeUntil) $('ritualWait').hidden = true;
  if (renderedFrames % 30 === 0) {
    canvas.dataset.frameMeanMs = (frameMs.reduce((a,b) => a+b,0) / frameMs.length).toFixed(2);
    canvas.dataset.spriteCache = characterSprites.cache.size;
    canvas.dataset.nameCache = nameplates.cache.size;
    canvas.dataset.fxNodes = audio.effects.size;
  }
  petalPainter.draw(celebrationCtx, galaxy ? shower.filter(p=>p.depth>=.55) : shower, now, { exclusions: galaxy ? [specialArt.faceRect()] : [] });
  celebration.dataset.petals = royalPetals.items.length;
  cameraDebug.end(cameraController, active, smallGift);
}
let reportedRenderError = '';
function frame(now) {
  requestAnimationFrame(frame);
  try { renderFrame(now); }
  catch (error) {
    // Discard partial darkness and any unbalanced save() left by a failed draw.
    if (ctx.reset) ctx.reset(); else canvas.width = canvas.width;
    applyCamera(cameraController.cancel('render-error')); finishHero(); royalPetals.reset(); audio.clear();
    $('gift').hidden = true; $('blessingBanner').hidden = true; infoPanel.tick(now, false);
    stage.classList.remove('ceremony', 'any-ritual', 'blessing-visible');
    $('assetError').hidden = false; $('assetError').textContent = 'การแสดงผลขัดข้อง · กลับสู่มุมกว้างแล้ว กรุณารีเฟรช';
    if (reportedRenderError !== String(error)) { reportedRenderError = String(error); console.error(error); }
  }
}
connect(); requestAnimationFrame(frame);
