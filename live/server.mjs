// Ganesha LIVE: local OBS renderer + TikFinity bridge. No TikTok credentials stored.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import { connectTikFinity, createEventHandler } from './tikfinity.mjs';
import { RITUALS, giftRitual, parseGiftMap } from './gift-rituals.mjs';
import { DEFAULTS, DEMO_NAMES, Room, cleanName, positive, defaultSkin, skinFromComment } from './ganesha.mjs';
import { EngagementClock, SpeechQueue, blessingForGift } from './engagement.mjs';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');
const DATA = process.env.GANESHA_DATA_DIR || path.join(DIR, 'data');
const TTS_DIR = path.join(DIR, 'tts');
fs.mkdirSync(DATA, { recursive: true }); fs.mkdirSync(TTS_DIR, { recursive: true });
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const log = [];
let saved = {};
try { saved = JSON.parse(fs.readFileSync(path.join(DATA, 'session.json'), 'utf8')); }
catch (e) { if (e.code !== 'ENOENT') console.warn('Không đọc được dữ liệu phiên đã lưu:', e.message); }
const settings = { ...DEFAULTS };
const clamp = (v, a, b) => Math.max(a, Math.min(b, Math.round(Number(v) || 0)));
const SETTING_RULES = {
  title: v => cleanName(v), subtitle: v => Array.from(String(v)).slice(0, 80).join(''),
  voice: v => ['th-TH-PremwadeeNeural', 'th-TH-NiwatNeural'].includes(v) ? v : settings.voice,
  voiceEnabled: Boolean, music: Boolean, joinOnEnter: Boolean,
  idlePrompts: Boolean, ambientCrowd: Boolean,
  characterMode: v => ['mixed', 'male', 'female'].includes(v) ? v : 'mixed',
  idleEverySec: v => clamp(v, 10, 300), ambientAfterSec: v => clamp(v, 10, 300),
  ambientTarget: v => [24, 36, 60].includes(Number(v)) ? Number(v) : 36,
  volume: v => clamp(v, 0, 100), pitch: v => clamp(v, -30, 30), rate: v => clamp(v, -30, 30),
  goal: v => clamp(v, 1, 99999999),
  seatMode: v => ['auto', '24', '36', '60'].includes(String(v)) ? String(v) : 'auto',
  giftMap: v => { const s = String(v).slice(0, 5000); parseGiftMap(s); return s; },
};
function applySettings(input = {}) {
  const changes = {};
  for (const [key, rule] of Object.entries(SETTING_RULES)) if (key in input) changes[key] = rule(input[key]);
  Object.assign(settings, changes);
}
try { applySettings(saved.settings); } catch { console.warn('Cấu hình lưu không hợp lệ; dùng cấu hình mặc định.'); }
// v0.2 enables the requested spoken blessings once when upgrading a v0.1 session.
if (saved.version === 1) settings.voiceEnabled = true;
const rooms = { demo: new Room(), live: new Room(saved.live) };
const engagement = new EngagementClock();
let mode = 'demo', room = rooms.demo, source = null, sourceGeneration = 0;
let tiktokState = { status: 'idle', source: 'tikfinity', error: '' };
let botTimer = null, persistTimer = null;
const capacity = () => settings.seatMode === 'auto' ? ([24, 36, 60].find(n => room.viewers.size <= n) || 60) : +settings.seatMode;
const limit = () => settings.seatMode === 'auto' ? 60 : +settings.seatMode;
const meta = () => ({ stats: room.stats, top: room.top(), mode, goal: settings.goal });
const snapshot = () => ({ t: 'state', settings, viewers: [...room.viewers.values()], cap: capacity(), startedAt: room.startedAt, tiktok: tiktokState, engagement: engagement.snapshot(), ...meta() });
function addLog(message) {
  const line = `[${new Date().toLocaleTimeString('vi-VN')}] ${message}`;
  log.push(line); if (log.length > 180) log.shift();
  broadcast({ t: 'log', line }, 'control'); console.log(line);
}
function persist() {
  clearTimeout(persistTimer); persistTimer = null;
  try {
    const file = path.join(DATA, 'session.json');
    fs.writeFileSync(file + '.tmp', JSON.stringify({ version: 2, settings, live: rooms.live.serialize() }));
    fs.renameSync(file + '.tmp', file);
    return true;
  } catch (e) { addLog('Không lưu được phiên: ' + e.message); return false; }
}
function saveSoon() { if (!persistTimer) persistTimer = setTimeout(persist, 200); }
function statsChanged() { broadcast({ t: 'stats', ...meta() }); if (mode === 'live') saveSoon(); }
function seat(id, name, avatar = '', skin) {
  const old = room.viewers.get(String(id));
  const result = room.join(id, name, { avatar, demo: mode === 'demo', limit: limit(), skin: skin || old?.skin || defaultSkin(id, settings.characterMode) });
  if (!result) return null;
  if (result.removed) broadcast({ t: 'leave', id: result.removed });
  if (result.isNew) broadcast({ t: 'join', v: result.viewer, cap: capacity() });
  else broadcast({ t: 'character', v: result.viewer });
  return result.viewer;
}
function onChat(id, name, text, avatar, skin) {
  const v = seat(id, name, avatar, skinFromComment(text) || skin); if (!v) return;
  broadcast({ t: 'chat', id: String(id), name: v.name, text: String(text || '').slice(0, 160) });
}
function onGift(id, name, giftName, count, unitCoins, avatar, giftId = '', demoKind, skin) {
  if (!id) return;
  id = String(id); const v = seat(id, name, avatar, skin);
  const values = room.gift(id, name, count, unitCoins);
  const ritual = mode === 'demo' && Object.hasOwn(RITUALS, demoKind || '') && RITUALS[demoKind].unitCoins === values.unitCoins
    ? RITUALS[demoKind] : giftRitual(giftName, values.unitCoins, giftId, parseGiftMap(settings.giftMap));
  engagement.gift(Date.now());
  const blessing = blessingForGift(v?.name || name, ritual?.kind, room.stats.gifts);
  const message = { t: 'gift', id, name: cleanName(name), skin: v?.skin, giftName: String(giftName || 'ของขวัญ').slice(0, 80), giftId: String(giftId), ...values, ritual, blessing, ...engagement.snapshot() };
  broadcast(message); statsChanged();
  addLog(`${mode === 'demo' ? 'DEMO' : 'LIVE'} · ${message.name} · ${message.giftName} ×${values.count} · ${values.unitCoins} xu/quà · ID ${giftId || '—'} → ${ritual?.kind || 'chưa gán hiệu ứng'}`);
  say(blessing, 'gift');
}
function onLike(id, n) { n = positive(n, 100000); room.stats.likes += n; broadcast({ t: 'like', id, n }); statsChanged(); }
function onFollow(id, name) { seat(id, name); broadcast({ t: 'follow', id, name: cleanName(name) }); }
const eventHandler = () => createEventHandler({ chat: onChat, gift: onGift, like: onLike, follow: onFollow,
  member: (id, name, avatar) => { if (settings.joinOnEnter) seat(id, name, avatar); } });

// Voice failures never block gifts. Idle speech yields immediately to a donor.
let ttsBusy = false, ttsEpoch = 0, currentTTS = null, retrySpeechAt = 0, speechUntil = 0;
const ttsQueue = new SpeechQueue();
const offlineAudio = process.env.GANESHA_OFFLINE_AUDIO === '1';
const esc = s => String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
function say(text, tag = 'manual') {
  if (!settings.voiceEnabled || offlineAudio || Date.now() < retrySpeechAt) return;
  if (tag !== 'idle' && currentTTS?.tag === 'idle') currentTTS.cancel();
  if (tag === 'idle' && Date.now() < speechUntil) return;
  if (!ttsQueue.push({ text: String(text).slice(0, 400), tag, epoch: ttsEpoch }, currentTTS?.tag)) {
    if (tag !== 'idle') addLog('Giọng đọc đang bận; bỏ câu mới, điểm quà vẫn được tính.');
    return;
  }
  pumpTTS();
}
async function pumpTTS() {
  if (ttsBusy || !ttsQueue.length) return;
  ttsBusy = true;
  const job = ttsQueue.shift(), { text, epoch, tag } = job;
  const tts = new MsEdgeTTS(); let timer, cancelReject;
  const cancelled = new Promise((_, reject) => { cancelReject = reject; });
  currentTTS = { tag, cancel: () => { job.cancelled = true; cancelReject(new Error('cancelled')); try { tts.close(); } catch {} } };
  try {
    const cacheKey = createHash('sha256').update(JSON.stringify([text, settings.voice, settings.pitch, settings.rate])).digest('hex').slice(0, 20);
    const cacheFile = path.join(TTS_DIR, `idle-${cacheKey}.mp3`);
    const operation = (async () => {
      if (tag === 'idle' && fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile);
      await tts.setMetadata(settings.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(esc(text), { pitch: `${settings.pitch >= 0 ? '+' : ''}${settings.pitch}Hz`, rate: `${settings.rate >= 0 ? '+' : ''}${settings.rate}%` });
      const chunks = [];
      await new Promise((resolve, reject) => { audioStream.on('data', b => chunks.push(b)); audioStream.on('end', resolve); audioStream.on('error', reject); });
      const buffer = Buffer.concat(chunks); if (!buffer.length) throw new Error('Không có dữ liệu âm thanh'); return buffer;
    })();
    const data = await Promise.race([operation, cancelled, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('TTS quá 15 giây')), 15000); })]);
    if (epoch === ttsEpoch && settings.voiceEnabled && !job.cancelled) {
      const file = tag === 'idle' ? `idle-${cacheKey}.mp3` : `voice-${Date.now()}.mp3`;
      fs.writeFileSync(path.join(TTS_DIR, file), data);
      speechUntil = Math.max(Date.now(), tag === 'idle' ? 0 : speechUntil) + data.length / 12000 * 1000;
      broadcast({ t: 'tts', url: '/live/tts/' + file, tag });
      const old = fs.readdirSync(TTS_DIR).filter(f => /^(voice-\d+|idle-[a-f0-9]+)\.mp3$/.test(f)).map(f => ({ f, at: fs.statSync(path.join(TTS_DIR, f)).mtimeMs })).sort((a, b) => a.at - b.at);
      while (old.length > 50) fs.unlinkSync(path.join(TTS_DIR, old.shift().f));
    }
  } catch (e) {
    if (!job.cancelled) { retrySpeechAt = Date.now() + 30000; ttsQueue.clear(); addLog('Giọng Thái chưa phát được: ' + e.message + ' · thử lại sau 30 giây'); }
  }
  finally { clearTimeout(timer); try { tts.close(); } catch {} ttsBusy = false; currentTTS = null; setTimeout(pumpTTS, 50); }
}
function resetSpeech() { ttsEpoch++; ttsQueue.clear(); currentTTS?.cancel(); speechUntil = 0; }
setInterval(() => {
  const prompt = engagement.tick(Date.now(), { enabled: settings.idlePrompts, intervalMs: settings.idleEverySec * 1000 });
  if (prompt) { broadcast({ t: 'engagement', ...prompt }); say(prompt.text, 'idle'); }
}, 250).unref();
function stopBots() { clearInterval(botTimer); botTimer = null; broadcast({ t: 'bots', on: false }, 'control'); }
function disconnectSource() {
  sourceGeneration++;
  try { source?.disconnect(); } catch {} source = null;
  tiktokState = { status: 'idle', source: 'tikfinity', error: '' };
  broadcast({ t: 'tiktok', ...tiktokState });
}
function activate(nextMode) {
  stopBots(); resetSpeech(); engagement.reset(Date.now());
  mode = nextMode; room = rooms[mode]; broadcast(snapshot());
}
async function connectSource(message) {
  disconnectSource(); activate('live');
  const generation = sourceGeneration;
  const isCurrent = () => generation === sourceGeneration;
  const handle = eventHandler();
  const receive = raw => { if (isCurrent() && mode === 'live') handle(raw); };
  const state = (status, error = '') => {
    if (!isCurrent()) return;
    tiktokState = { status, error, source: message.source === 'direct' ? 'direct' : 'tikfinity' };
    broadcast({ t: 'tiktok', ...tiktokState }); addLog(`${tiktokState.source}: ${status}${error ? ' · ' + error : ''}`);
  };
  try {
    if (message.source !== 'direct') {
      source = connectTikFinity({ url: message.url || 'ws://127.0.0.1:21213/', onEvent: receive, onState: state }); return;
    }
    const user = String(message.uniqueId || '').trim().replace(/^@/, '').replace(/[^a-zA-Z0-9_.]/g, '');
    if (!user) throw new Error('Nhập username kênh TikTok đang LIVE.');
    state('connecting');
    const { TikTokLiveConnection, WebcastEvent, ControlEvent } = await import('tiktok-live-connector');
    if (!isCurrent()) return;
    const conn = new TikTokLiveConnection(user, { enableExtendedGiftInfo: true, processInitialData: false }); source = conn;
    for (const [type, key] of [['chat', 'CHAT'], ['gift', 'GIFT'], ['member', 'MEMBER'], ['like', 'LIKE'], ['follow', 'FOLLOW']]) {
      if (!WebcastEvent[key]) continue;
      conn.on(WebcastEvent[key], d => receive(JSON.stringify({ event: type, data: { ...d,
        uniqueId: d.user?.uniqueId || d.user?.userId, nickname: d.user?.nickname,
        giftId: d.giftId || d.giftDetails?.giftId, giftType: d.giftDetails?.giftType ?? d.extendedGiftInfo?.type,
        giftName: d.giftDetails?.giftName || d.extendedGiftInfo?.name,
        diamondCount: d.giftDetails?.diamondCount ?? d.extendedGiftInfo?.diamond_count,
        profilePictureUrl: d.user?.profilePicture?.url?.[0] || '' } })));
    }
    conn.on(ControlEvent.DISCONNECTED, () => state('disconnected'));
    conn.on(ControlEvent.ERROR, e => state('error', String(e.message || e.info || e)));
    await conn.connect();
    if (!isCurrent()) { conn.disconnect(); return; } state('connected');
  } catch (e) { state('error', e.message); }
}
function fillDemo(n) {
  if (mode !== 'demo') return;
  for (let i = 0; i < Math.min(n, limit()); i++) seat('demo_' + i, DEMO_NAMES[i % DEMO_NAMES.length] + (i >= DEMO_NAMES.length ? ` ${Math.floor(i / DEMO_NAMES.length) + 1}` : ''));
}
function startDemo() {
  disconnectSource(); rooms.demo = new Room(); activate('demo'); fillDemo(24);
  [338, 212, 106, 88, 52].forEach((coins, i) => room.gift('demo_' + i, DEMO_NAMES[i], coins, 1));
  broadcast(snapshot());
}
function setBots(on, pace) {
  stopBots(); if (!on || mode !== 'demo') return;
  fillDemo(36);
  botTimer = setInterval(() => {
    const viewers = [...room.viewers.values()]; if (!viewers.length) return;
    const v = viewers[Math.floor(Math.random() * viewers.length)], r = Math.random();
    if (r < .45) onChat(v.id, v.name, ['สาธุ', 'ขอให้ครอบครัวมีความสุข', 'ขอบคุณค่ะ', 'โอม ศรี คเณศายะ นะมะฮา'][Math.floor(Math.random() * 4)]);
    else if (r < .7) onLike(v.id, 3);
    else {
      const [name, kind] = [['Rose', 'lotus'], ['Peach', 'incense'], ['OK', 'garland'], ['Clover', 'aarti'], ['Bouquet', 'marigold'], ['Love Balloon', 'royal']][Math.floor(Math.random() * 6)];
      onGift(v.id, v.name, name, 1, RITUALS[kind].unitCoins, '', '', kind);
    }
  }, { slow: 4500, mid: 2000, fast: 650 }[pace] || 2000);
  broadcast({ t: 'bots', on: true }, 'control');
}
function onControl(m) {
  if (['chat', 'gift', 'fill', 'bots'].includes(m.cmd) && mode !== 'demo') throw new Error('Chuyển sang Demo để thử tương tác. Dữ liệu LIVE được giữ riêng.');
  switch (m.cmd) {
    case 'connect': void connectSource(m); break;
    case 'disconnect': disconnectSource(); break;
    case 'demo': startDemo(); break;
    case 'live': disconnectSource(); activate('live'); break;
    case 'chat': onChat('sim_' + cleanName(m.name), m.name, m.text || 'สาธุ', '', m.skin); break;
    case 'gift': onGift('sim_' + cleanName(m.name), m.name, m.gift || 'Demo', m.count, m.diamonds, '', m.giftId, m.kind, m.skin); break;
    case 'fill': fillDemo(positive(m.n, 60)); break;
    case 'bots': setBots(!!m.on, m.pace); break;
    case 'clear': stopBots(); room.viewers.clear(); broadcast(snapshot()); break;
    case 'reset':
      if (tiktokState.status !== 'idle') throw new Error('Ngắt nguồn sự kiện trước khi bắt đầu phiên mới.');
      rooms[mode] = new Room(); activate(mode); if (mode === 'live') persist(); break;
    case 'bell': broadcast({ t: 'bell' }); break;
    case 'say':
      if (!settings.voiceEnabled) throw new Error('Bật giọng đọc tiếng Thái trước khi thử.');
      say(m.text || 'ขอให้วันนี้เป็นวันที่ดีของคุณ'); break;
    case 'settings':
      applySettings(m.settings || {});
      while (room.viewers.size > limit()) room.viewers.delete(room.viewers.keys().next().value);
      resetSpeech();
      if (!persist()) throw new Error('Cấu hình đã áp dụng nhưng chưa lưu được xuống đĩa. Kiểm tra quyền ghi thư mục live/data.');
      broadcast({ ...snapshot(), t: 'settings' }); broadcast({ t: 'saved' }, 'control'); break;
  }
}

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.ttf': 'font/ttf' };
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`, `[::1]:${PORT}`]);
const okHost = h => ALLOWED_HOSTS.has(String(h || '').toLowerCase());
function resolveStatic(urlPath) {
  const p = urlPath === '/' ? '/live/control.html' : urlPath;
  if (!/^\/(assets|live)\//.test(p) || p.split('/').some(s => s.startsWith('.') || ['node_modules', 'data', 'test'].includes(s))) return null;
  if (!Object.hasOwn(MIME, path.extname(p).toLowerCase())) return null;
  const file = path.normalize(path.join(ROOT, p));
  return file.startsWith(ROOT + path.sep) ? file : null;
}
const server = http.createServer((req, res) => {
  if (!okHost(req.headers.host)) { res.writeHead(421).end('wrong host'); return; }
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  let p; try { p = decodeURIComponent(new URL(req.url, 'http://local').pathname); } catch { res.writeHead(400).end(); return; }
  const file = resolveStatic(p); if (!file) { res.writeHead(404).end('not found'); return; }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file).toLowerCase()], 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
    if (req.method === 'HEAD') { res.end(); return; }
    const stream = fs.createReadStream(file); stream.on('error', () => res.destroy()); stream.pipe(res);
  });
});
const wss = new WebSocketServer({ server, path: '/ws', maxPayload: 64 * 1024,
  verifyClient: ({ origin, req }) => {
    if (!okHost(req.headers.host)) return false;
    if (!origin) return true;
    try { const u = new URL(origin); return ['http:', 'https:'].includes(u.protocol) && okHost(u.host); } catch { return false; }
  } });
wss.on('error', () => {}); // The HTTP server below reports shared listener failures.
function broadcast(msg, only) {
  const data = JSON.stringify(msg);
  for (const c of wss.clients) if (c.readyState === 1 && (!only || c.role === only)) {
    if (c.bufferedAmount > 2 * 1024 * 1024) c.terminate(); else c.send(data);
  }
}
wss.on('connection', (ws, req) => {
  ws.role = new URL(req.url, 'http://local').searchParams.get('role') === 'control' ? 'control' : 'overlay';
  ws.send(JSON.stringify(snapshot()));
  if (ws.role === 'control') ws.send(JSON.stringify({ t: 'logs', lines: log }));
  ws.on('message', buf => {
    if (ws.role !== 'control') return;
    try { const m = JSON.parse(buf); if (m?.t === 'ctl') onControl(m); }
    catch (e) { ws.send(JSON.stringify({ t: 'error', message: e.message })); }
  });
  ws.on('error', () => {});
});
server.listen(PORT, HOST, () => { startDemo(); addLog(`Ganesha LIVE · http://localhost:${PORT}/live/control.html`); });
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Cổng ${PORT} đang được dùng. Đóng phiên cũ rồi chạy lại.` : e.message); process.exit(1); });
function shutdown() { persist(); process.exit(0); }
process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
