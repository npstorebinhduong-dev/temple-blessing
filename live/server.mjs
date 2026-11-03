// Ganesha LIVE: local OBS renderer + TikFinity bridge. No TikTok credentials stored.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { WebSocketServer } from 'ws';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';
import HttpsProxyAgent from 'https-proxy-agent';
import { getProxyForUrl } from 'proxy-from-env';
import { connectTikFinity, createEventHandler } from './tikfinity.mjs';
import { RITUALS, giftRitual, parseGiftMap, upgradeShamrockMap } from './gift-rituals.mjs';
import { DEFAULTS, DEMO_NAMES, Room, cleanName, positive, defaultSkin, skinFromComment } from './ganesha.mjs';
import { EngagementClock, SpeechQueue, blessingForGift } from './engagement.mjs';
import { BlessingSession, GANESHA_BLESSING, BLESSING_VOICE } from './blessing-session.js';
import { GIFTS, giftByKind, demoId } from './gift-catalog.js';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(DIR, '..');
const DATA = process.env.GANESHA_DATA_DIR || path.join(DIR, 'data');
const TTS_DIR = path.join(DIR, 'tts');
const BLESSING_MP3 = path.join(ROOT, 'assets', 'ganesha', 'audio', 'ganesha-blessing-th.mp3');
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
  voiceEnabled: Boolean, music: Boolean, joinOnEnter: Boolean, joinOnChat: Boolean, statueMotion: Boolean,
  statueMotionLevel: v => ['soft', 'clear', 'strong'].includes(v) ? v : 'clear',
  musicLoop: Boolean, cinematicZoom: Boolean,
  musicVolume: v => clamp(v, 0, 100),
  effectsEnabled: Boolean, effectsVolume: v => clamp(v, 0, 100), voiceVolume: v => clamp(v, 0, 100),
  mushikaGiftId: giftIdSetting, galaxyGiftId: giftIdSetting,
  mushikaGiftName: v => String(v || '').normalize('NFC').slice(0, 100), galaxyGiftName: v => String(v || '').normalize('NFC').slice(0, 100),
  mushikaGiftIcon: giftIconSetting, galaxyGiftIcon: giftIconSetting,
  infoPanelX: v => clamp(v, 18, 90), infoPanelY: v => clamp(v, 140, 235),
  safeTop:v=>clamp(v,0,260),safeBottom:v=>clamp(v,0,360),
  giftCatalog:v=>Object.fromEntries(GIFTS.filter(g=>v?.[g.kind]).map(g=>{const m=v[g.kind];return[g.kind,{id:giftIdSetting(m.id),thai:String(m.thai||'').normalize('NFC').slice(0,100),icon:giftIconSetting(m.icon)}]})),
  petalMode: v => v === 'light' ? 'light' : 'full',
  idlePrompts: Boolean, ambientCrowd: Boolean,
  characterMode: v => ['mixed', 'male', 'female'].includes(v) ? v : 'mixed',
  idleEverySec: v => clamp(v, 10, 300),
  volume: v => clamp(v, 0, 100), pitch: v => clamp(v, -30, 30), rate: v => clamp(v, -30, 30),
  goal: v => clamp(v, 1, 99999999),
  giftMap: v => { const s = String(v).slice(0, 5000); parseGiftMap(s); return s; },
};
function giftIdSetting(v) {
  const s = String(v || '').trim(); if (s && !/^\d{1,20}$/.test(s)) throw new Error('ID quà phải là số trong nhật ký TikFinity.'); return s;
}
function giftIconSetting(v) {
  const s = String(v || '').trim(); if (!s) return '';
  if(/^\/assets\/ganesha\/gifts\/[a-zA-Z0-9_.-]+\.(png|webp|jpg)$/.test(s))return s;
  try { const u = new URL(s); if (u.protocol === 'https:' && !u.username && !u.password && s.length < 2048) return s; } catch {}
  throw new Error('Icon quà cần URL HTTPS từ dữ liệu TikTok. Có thể để trống.');
}
function giftOverrides() {
  const map = Object.create(null);
  if(mode==='demo')for(const g of GIFTS)map[demoId(g.kind)]=g.kind;
  for(const g of GIFTS){const id=settings.giftCatalog?.[g.kind]?.id;if(id)map[id]=g.kind;}
  if (settings.mushikaGiftId) map[settings.mushikaGiftId] = 'mushika';
  if (settings.galaxyGiftId) map[settings.galaxyGiftId] = 'galaxy';
  return Object.assign(map, parseGiftMap(settings.giftMap));
}
function applySettings(input = {}) {
  const changes = {};
  for (const [key, rule] of Object.entries(SETTING_RULES)) if (key in input) changes[key] = rule(input[key]);
  Object.assign(settings, changes);
}
try { applySettings(saved.settings); } catch { console.warn('Cấu hình lưu không hợp lệ; dùng cấu hình mặc định.'); }
// v0.2 enables the requested spoken blessings once when upgrading a v0.1 session.
if (saved.version === 1) settings.voiceEnabled = true;
// v0.4 starts real admissions with gifts. Older crowd-size settings are retired.
if ((saved.version || 0) < 3) { settings.joinOnEnter = false; settings.joinOnChat = false; }
// v0.7 uses the confirmed Thai LIVE gift: Shamrock, ID 9875, 10 coins.
// Other gifts/settings are preserved; future manual edits are not rewritten.
if ((saved.version || 0) < 4) settings.giftMap = upgradeShamrockMap(settings.giftMap);
// v0.8 routes room-entry events to the bottom welcome line, never to a seat.
if ((saved.version || 0) < 5) settings.joinOnEnter = true;
// v0.10 explicitly replaces the old 299 gift with the user-selected Corgi.
// Other six bindings and Galaxy stay unchanged; future manual edits are kept.
if ((saved.version || 0) < 7) {
  if (settings.mushikaGiftId !== DEFAULTS.mushikaGiftId) settings.mushikaGiftName = '';
  settings.mushikaGiftId = DEFAULTS.mushikaGiftId; settings.mushikaGiftIcon = DEFAULTS.mushikaGiftIcon;
  settings.giftMap = Object.entries(parseGiftMap(settings.giftMap)).filter(([id,kind])=>kind!=='mushika'&&id!==DEFAULTS.mushikaGiftId).map(([id,kind])=>`${id}=${kind}`).join('\n');
}
const newRoom = savedRoom => new Room(savedRoom, { ambient: settings.ambientCrowd });
const rooms = { demo: newRoom(), live: newRoom(saved.live) };
const engagement = new EngagementClock();
let mode = 'demo', room = rooms.demo, source = null, sourceGeneration = 0;
let tiktokState = { status: 'idle', source: 'tikfinity', error: '' };
let botTimer = null, persistTimer = null;
let lastSeatingSummary = '', lastEntranceRevision = -1;
const meta = () => ({ stats: room.stats, top: room.top(), mode, goal: settings.goal });
const seatingMeta = () => ({ ...room.seating.summary(), rituals: room.rituals.pending.length,
  standing: room.entrance.people.size, entryWaiting: room.entrance.waiting.size });
const snapshot = () => ({ t: 'state', settings, viewers: [...room.viewers.values()], actors: [...room.seating.actors.values()],
  prayerPrompts:[...room.prayers.users.keys()].map(id=>room.prayers.current(id)),
  seating: seatingMeta(), entrance: room.entrance.snapshot(), active: room.rituals.active, serverTime: Date.now(), cap: 60,
  startedAt: room.startedAt, tiktok: tiktokState, engagement: engagement.snapshot(), ...meta() });
function addLog(message) {
  const line = `[${new Date().toLocaleTimeString('vi-VN')}] ${message}`;
  log.push(line); if (log.length > 180) log.shift();
  broadcast({ t: 'log', line }, 'control'); console.log(line);
}
function persist() {
  clearTimeout(persistTimer); persistTimer = null;
  try {
    const file = path.join(DATA, 'session.json');
    fs.writeFileSync(file + '.tmp', JSON.stringify({ version: 7, settings, live: rooms.live.serialize() }));
    fs.renameSync(file + '.tmp', file);
    return true;
  } catch (e) { addLog('Không lưu được phiên: ' + e.message); return false; }
}
function saveSoon() { if (!persistTimer) persistTimer = setTimeout(persist, 200); }
function statsChanged() { broadcast({ t: 'stats', ...meta() }); if (mode === 'live') saveSoon(); }
function seatingChanged() {
  const summary = seatingMeta(), key = JSON.stringify(summary);
  if (key !== lastSeatingSummary) { lastSeatingSummary = key; broadcast({ t: 'seating', ...summary }); }
}
function entranceChanged() {
  if (lastEntranceRevision === room.entrance.revision) return;
  lastEntranceRevision = room.entrance.revision;
  broadcast({ t: 'entrance', ...room.entrance.snapshot() }); seatingChanged();
  if (mode === 'live') saveSoon();
}
function onMember(id, name, avatar = '', skin) {
  const existing = room.find(id);
  if (!id || !settings.joinOnEnter || existing && existing.seatState !== 'waiting') return;
  const chosen = existing?.skin || skin || room.entrance.find(id)?.skin || room.choices.get(String(id)) || defaultSkin(id, settings.characterMode);
  room.enter(id, name, { avatar, skin: chosen, demo: mode === 'demo' }); // Coalesced by the 250ms scene tick.
}
function seat(id, name, avatar = '', skin) {
  const old = room.find(id) || room.entrance.find(id);
  const result = room.join(id, name, { avatar, demo: mode === 'demo', skin: skin || old?.skin || room.choices.get(String(id)) || defaultSkin(id, settings.characterMode) });
  if (!result) return null;
  for (const event of result.events) broadcast(event);
  entranceChanged();
  seatingChanged();
  return result.viewer;
}
function onChat(id, name, text, avatar, skin, timing) {
  if (!id) return;
  const chosen = skinFromComment(text) || skin, existing = room.find(id);
  if (chosen) {
    if (room.choices.size >= 1000) room.choices.delete(room.choices.keys().next().value);
    room.choices.set(String(id), chosen);
  }
  if (existing) {
    existing.name = cleanName(name); if (chosen) existing.skin = chosen;
    broadcast({ t: 'character', v: existing });
  } else if (settings.joinOnChat) seat(id, name, avatar, chosen);
  if (room.entrance.update(id, { name: cleanName(name), skin: chosen || undefined })) entranceChanged();
  broadcast({ t: 'chat', id: String(id), name: cleanName(name), text: String(text || '').slice(0, 160) });
  const prayer=room.prayers.comment(id,text,timing);
  if(prayer){room.rituals.enqueue(prayer,Date.now());broadcast({t:'prayer-prompt',grant:room.prayers.current(id)});seatingChanged();if(mode==='live')saveSoon();}
}
function onGift(id, name, giftName, count, unitCoins, avatar, giftId = '', unused, skin, giftIcon = '') {
  if (!id) return;
  id = String(id); const v = seat(id, name, avatar, skin);
  const values = room.gift(id, name, count, unitCoins);
  const ritual = giftRitual(giftName, values.unitCoins, giftId, giftOverrides());
  if(mode==='live'&&ritual) {
    const old=settings.giftCatalog[ritual.kind]||{},metadata={...old,id:String(giftId)};
    if(/\p{Script=Thai}/u.test(giftName))metadata.thai=String(giftName).normalize('NFC').slice(0,100);
    if(giftIcon)try{metadata.icon=giftIconSetting(giftIcon);}catch{}
    if(JSON.stringify(metadata)!==JSON.stringify(old)){
      settings.giftCatalog={...settings.giftCatalog,[ritual.kind]:metadata};
      broadcast({t:'gift-guide',settings:{giftCatalog:settings.giftCatalog}});
    }
  }
  // Learn display metadata only from a matching real event with a Thai name.
  // This never guesses an unknown 299-coin gift from its price.
  if (mode === 'live' && ['galaxy', 'mushika'].includes(ritual?.kind) && /\p{Script=Thai}/u.test(giftName) && !settings[`${ritual.kind}GiftName`]) {
    const changes = { [`${ritual.kind}GiftName`]: String(giftName).slice(0, 100) };
    if (giftIcon) { try { changes[`${ritual.kind}GiftIcon`] = giftIconSetting(giftIcon); } catch {} }
    Object.assign(settings, changes); broadcast({ t: 'gift-guide', settings: changes });
  }
  engagement.gift(Date.now());
  if (currentTTS?.tag === 'idle') currentTTS.cancel();
  const blessing = ritual?.kind === 'galaxy' ? GANESHA_BLESSING : blessingForGift(v?.name || name, ritual?.kind, room.stats.gifts);
  const message = { t: 'gift', id, name: cleanName(name), skin: v?.skin, giftName: String(giftName || 'ของขวัญ').slice(0, 80), giftId: String(giftId), ...values, ritual, blessing, ...engagement.snapshot() };
  broadcast(message); statsChanged();
  if (ritual?.kind==='prayer') {
    const grant=room.prayers.grant(message);broadcast({t:'prayer-prompt',grant});
  } else if (ritual) {
    room.rituals.enqueue(message, Date.now());
    broadcast({ t: 'ritual-wait', name: message.name, queued: room.rituals.pending.length });
  }
  seatingChanged();
  addLog(`${mode === 'demo' ? 'DEMO' : 'LIVE'} · ${message.name} · ${message.giftName} ×${values.count} · ${values.unitCoins} xu/quà · ID ${giftId || '—'} → ${ritual?.kind || 'chưa gán hiệu ứng'}`);
  if (!ritual && room.rituals.active?.ritual.kind !== 'galaxy') say(blessing, 'gift');
  if (mode === 'live') saveSoon();
}
function onLike(id, n) { n = positive(n, 100000); room.stats.likes += n; broadcast({ t: 'like', id, n }); statsChanged(); }
function onFollow(id, name) { broadcast({ t: 'follow', id, name: cleanName(name) }); }
const eventHandler = () => createEventHandler({ chat: onChat, gift: onGift, like: onLike, follow: onFollow,
  member: onMember, seen:room.eventSeen,combos:room.comboSeen });
let demoSequence=0;
function dispatchDemo(event,m={}) {
  const name=cleanName(m.name||'ศิริพร'),id=m.uniqueId||'sim_'+name;
  if(['male','female'].includes(m.skin))room.choices.set(id,m.skin);
  const g=giftByKind(m.kind);
  const data={uniqueId:id,nickname:name,msgId:`demo-${Date.now()}-${++demoSequence}`,comment:m.text||'สาธุ',
    giftName:m.gift||g?.name||'Demo',giftId:m.giftId||g?.id||(g?demoId(g.kind):''),
    giftType:1,repeatEnd:true,repeatCount:m.count||1,diamondCount:m.diamonds||g?.coins||1};
  eventHandler()(JSON.stringify({event,data}));
}

// Voice failures never block gifts. Idle speech yields immediately to a donor.
let ttsBusy = false, ttsEpoch = 0, currentTTS = null, retrySpeechAt = 0, speechSequence = 0;
let blessingSession = null;
const ttsQueue = new SpeechQueue();
const offlineAudio = process.env.GANESHA_OFFLINE_AUDIO === '1';
const esc = s => String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));
function say(text, tag = 'manual', id = `speech-${++speechSequence}`) {
  const localBlessing = tag === 'blessing' && fs.existsSync(BLESSING_MP3);
  if (!settings.voiceEnabled || offlineAudio || (!localBlessing && Date.now() < retrySpeechAt)) return false;
  if (tag !== 'blessing' && room.rituals.active?.ritual.kind === 'galaxy') return false;
  if (tag !== 'idle' && currentTTS?.tag === 'idle') currentTTS.cancel();
  if (tag === 'idle' && (speechBusy() || !speechListeners().length)) return false;
  if (!ttsQueue.push({ text: String(text).slice(0, 400), tag, id, epoch: ttsEpoch }, currentTTS?.tag)) {
    if (tag !== 'idle') addLog('Giọng đọc đang bận; bỏ câu mới, điểm quà vẫn được tính.');
    return false;
  }
  pumpTTS(); return true;
}
async function pumpTTS() {
  if (ttsBusy || !ttsQueue.length) return;
  ttsBusy = true;
  const job = ttsQueue.shift(), { text, epoch, tag, id } = job;
  // Edge uses a WebSocket; ws does not automatically honor HTTPS_PROXY.
  // Respect the host's proxy/NO_PROXY policy, while normal Windows installs
  // without a configured proxy continue to connect directly.
  const speechProxy = getProxyForUrl('https://speech.platform.bing.com');
  const tts = new MsEdgeTTS({ agent: speechProxy ? new HttpsProxyAgent(speechProxy) : undefined }); let timer, cancelReject;
  const cancelled = new Promise((_, reject) => { cancelReject = reject; });
  currentTTS = { tag, cancel: () => { job.cancelled = true; cancelReject(new Error('cancelled')); try { tts.close(); } catch {} } };
  try {
    const voiceSettings = tag === 'blessing' ? BLESSING_VOICE : settings;
    const cacheKey = createHash('sha256').update(JSON.stringify([text, voiceSettings.voice, voiceSettings.pitch, voiceSettings.rate])).digest('hex').slice(0, 20);
    const cachePrefix = tag === 'blessing' ? 'blessing' : 'idle';
    const cacheFile = path.join(TTS_DIR, `${cachePrefix}-${cacheKey}.mp3`);
    const operation = (async () => {
      if (tag === 'blessing' && fs.existsSync(BLESSING_MP3)) return fs.readFileSync(BLESSING_MP3);
      if (['idle', 'blessing'].includes(tag) && fs.existsSync(cacheFile)) return fs.readFileSync(cacheFile);
      await tts.setMetadata(voiceSettings.voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(esc(text), { pitch: `${voiceSettings.pitch >= 0 ? '+' : ''}${voiceSettings.pitch}Hz`, rate: `${voiceSettings.rate >= 0 ? '+' : ''}${voiceSettings.rate}%` });
      const chunks = [];
      await new Promise((resolve, reject) => { audioStream.on('data', b => chunks.push(b)); audioStream.on('end', resolve); audioStream.on('error', reject); });
      const buffer = Buffer.concat(chunks); if (!buffer.length) throw new Error('Không có dữ liệu âm thanh'); return buffer;
    })();
    const data = await Promise.race([operation, cancelled, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('TTS quá 15 giây')), 15000); })]);
    if (epoch === ttsEpoch && settings.voiceEnabled && !job.cancelled && (tag !== 'idle' || engagement.isCurrent(id))
      && (tag !== 'blessing' || blessingSession?.id === id && blessingSession.active.speech.state === 'loading')) {
      const file = ['idle', 'blessing'].includes(tag) ? `${cachePrefix}-${cacheKey}.mp3` : `voice-${Date.now()}.mp3`;
      fs.writeFileSync(path.join(TTS_DIR, file), data);
      const listeners = speechListeners();
      if (tag === 'idle') engagement.delivered(id, listeners, Date.now());
      if (tag === 'blessing') { blessingSession.delivered(listeners, Date.now()); announceBlessing(); }
      for (const listener of listeners) {
        listener.speechJobs.add(id);
        listener.send(JSON.stringify({ t: 'tts', id, url: '/live/tts/' + file, tag }));
      }
      job.delivered = true;
      const old = fs.readdirSync(TTS_DIR).filter(f => /^(voice-\d+|idle-[a-f0-9]+|blessing-[a-f0-9]+)\.mp3$/.test(f)).map(f => ({ f, at: fs.statSync(path.join(TTS_DIR, f)).mtimeMs })).sort((a, b) => a.at - b.at);
      while (old.length > 50) fs.unlinkSync(path.join(TTS_DIR, old.shift().f));
    }
  } catch (e) {
    if (!job.cancelled) { retrySpeechAt = Date.now() + 30000; ttsQueue.clear(); addLog('Giọng Thái chưa phát được: ' + e.message + ' · thử lại sau 30 giây'); }
  }
  finally {
    if (tag === 'idle' && !job.delivered) engagement.finish(id, Date.now());
    if (tag === 'blessing' && !job.delivered && blessingSession?.id === id) { blessingSession.fallback(Date.now()); announceBlessing(); }
    clearTimeout(timer); try { tts.close(); } catch {} ttsBusy = false; currentTTS = null; setTimeout(pumpTTS, 50);
  }
}
function speechListeners() { return [...wss.clients].filter(c => c.readyState === 1 && c.audioReady); }
function speechBusy() { return ttsBusy || !!ttsQueue.length || speechListeners().some(c => c.speechJobs.size); }
function resetSpeech() {
  ttsEpoch++; ttsQueue.clear(); currentTTS?.cancel(); engagement.cancel(Date.now());
  for (const c of wss.clients) c.speechJobs.clear();
  if (blessingSession) { blessingSession.fallback(Date.now()); announceBlessing(); }
}
function announceBlessing() {
  if (blessingSession?.active !== room.rituals.active) return;
  broadcast({ t: 'ritual-progress', active: room.rituals.active, serverTime: Date.now() });
}
function advanceBlessing(now) {
  const active = room.rituals.active;
  if (!active || active.ritual.kind !== 'galaxy') { blessingSession = null; return; }
  if (!blessingSession && now - active.beganAt >= 4500) {
    blessingSession = new BlessingSession(active, now);
    if (!speechListeners().length || !say(active.blessing, 'blessing', blessingSession.id)) blessingSession.fallback(now);
    announceBlessing();
  } else if (blessingSession?.tick(now)) {
    broadcast({ t: 'speech-cancel', id: blessingSession.id }); announceBlessing();
  }
}
setInterval(() => {
  for(const prayer of room.prayers.expire()) {room.rituals.enqueue(prayer,Date.now());broadcast({t:'prayer-prompt',grant:room.prayers.current(prayer.id)});if(mode==='live')saveSoon();}
  advanceBlessing(Date.now());
  for (const event of room.advance(Date.now())) {
    if (event.t === 'ritual') {
      blessingSession = null;
      if (event.active?.ritual.kind === 'galaxy') { resetSpeech(); broadcast({ t: 'speech-clear' }); }
      else if (event.active) say(event.active.blessing, 'gift');
    }
    broadcast(event);
    if (mode === 'live') saveSoon();
  }
  entranceChanged();
  seatingChanged();
  const prompt = engagement.tick(Date.now(), { enabled: settings.idlePrompts, intervalMs: settings.idleEverySec * 1000, busy: speechBusy() || room.rituals.active?.ritual.kind === 'galaxy' });
  if (prompt) {
    broadcast({ t: 'engagement', ...prompt });
    if (!say(prompt.text, 'idle', prompt.id)) engagement.finish(prompt.id, Date.now());
  }
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
  room.rituals.pause(); blessingSession = null;
  mode = nextMode; room = rooms[mode]; lastSeatingSummary = ''; lastEntranceRevision = -1; broadcast(snapshot());
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
  for (let i = 0; i < Math.min(n, 500); i++) seat('demo_' + i, DEMO_NAMES[i % DEMO_NAMES.length] + (i >= DEMO_NAMES.length ? ` ${Math.floor(i / DEMO_NAMES.length) + 1}` : ''));
}
function startDemo() {
  disconnectSource(); rooms.demo = newRoom(); activate('demo');
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
      dispatchDemo('gift',{uniqueId:v.id,name:v.name,gift:name,kind});
    }
  }, { slow: 4500, mid: 2000, fast: 650 }[pace] || 2000);
  broadcast({ t: 'bots', on: true }, 'control');
}
function onControl(m) {
  if (['chat', 'gift', 'fill', 'bots', 'member', 'entry-fill', 'burst', 'demo-reset'].includes(m.cmd) && mode !== 'demo') throw new Error('Chuyển sang Demo để thử tương tác. Dữ liệu LIVE được giữ riêng.');
  switch (m.cmd) {
    case 'connect': void connectSource(m); break;
    case 'disconnect': disconnectSource(); break;
    case 'demo': startDemo(); break;
    case 'live': disconnectSource(); activate('live'); break;
    case 'chat': dispatchDemo('chat',m); break;
    case 'gift': dispatchDemo('gift',m); break;
    case 'member':
      if (!settings.joinOnEnter) throw new Error('Bật Người vừa vào phòng đứng xếp hàng ở mép dưới rồi lưu cấu hình.');
      dispatchDemo('member',m); break;
    case 'entry-fill':
      if (!settings.joinOnEnter) throw new Error('Bật Người vừa vào phòng đứng xếp hàng ở mép dưới rồi lưu cấu hình.');
      for (let i = 0; i < positive(m.n, 500); i++) dispatchDemo('member',{uniqueId:`entry_demo_${i}`,name:`${DEMO_NAMES[i % DEMO_NAMES.length]} ${Math.floor(i / DEMO_NAMES.length) + 1}`});
      break;
    case 'burst':
      for (const [i, kind] of ['lotus','mushika','light','lotus','galaxy','fragrance','royal'].entries()) {
        dispatchDemo('gift',{name:i%2?DEMO_NAMES[i]:m.name,kind,count:i===3?3:1,skin:m.skin});
      }
      break;
    case 'demo-reset': startDemo(); break;
    case 'fill': fillDemo(positive(m.n, 500)); break;
    case 'bots': setBots(!!m.on, m.pace); break;
    case 'clear': stopBots(); resetSpeech(); blessingSession = null; room.clearScene(settings.ambientCrowd); broadcast(snapshot()); if (mode === 'live') saveSoon(); break;
    case 'reset':
      if (tiktokState.status !== 'idle') throw new Error('Ngắt nguồn sự kiện trước khi bắt đầu phiên mới.');
      rooms[mode] = newRoom(); activate(mode); if (mode === 'live') persist(); break;
    case 'bell': broadcast({ t: 'bell' }); break;
    case 'music-replay':
      if (!settings.music) throw new Error('Bật nhạc nền và lưu cấu hình trước khi phát lại.');
      broadcast({ t: 'music-replay' }); break;
    case 'say':
      if (!settings.voiceEnabled) throw new Error('Bật giọng đọc tiếng Thái trước khi thử.');
      say(m.text || 'ขอให้วันนี้เป็นวันที่ดีของคุณ'); break;
    case 'settings':
      applySettings(m.settings || {});
      for (const r of Object.values(rooms)) {
        const events = r.seating.setAmbient(settings.ambientCrowd);
        if (!settings.joinOnEnter) r.entrance.clear();
        if (r === room) for (const event of events) broadcast(event);
      }
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
  const params = new URL(req.url, 'http://local').searchParams;
  ws.role = params.get('role') === 'control' ? 'control' : 'overlay';
  ws.preview = params.get('preview') === '1'; ws.audioReady = false; ws.speechJobs = new Set();
  ws.send(JSON.stringify(snapshot()));
  if (ws.role === 'control') ws.send(JSON.stringify({ t: 'logs', lines: log }));
  ws.on('message', buf => {
    try {
      const m = JSON.parse(buf);
      if (ws.role === 'control') { if (m?.t === 'ctl') onControl(m); }
      else if (!ws.preview && m?.t === 'speech-status') {
        ws.audioReady = m.ready === true;
        if (ws.speechJobs.has(m.id) && blessingSession?.receipt(m.id, ws, m.state, Date.now())) announceBlessing();
        if (!ws.audioReady) {
          ws.speechJobs.clear(); engagement.removeListener(ws, Date.now());
          if (blessingSession?.remove(ws, Date.now())) announceBlessing();
        } else if (['ended', 'cancelled', 'error', 'skipped'].includes(m.state) && ws.speechJobs.delete(m.id)) {
          engagement.listenerDone(m.id, ws, Date.now());
        }
      }
    }
    catch (e) { ws.send(JSON.stringify({ t: 'error', message: e.message })); }
  });
  ws.on('error', () => {});
  ws.on('close', () => { engagement.removeListener(ws, Date.now()); if (blessingSession?.remove(ws, Date.now())) announceBlessing(); });
});
server.listen(PORT, HOST, () => { startDemo(); addLog(`Ganesha LIVE · http://localhost:${PORT}/live/control.html`); });
server.on('error', e => { console.error(e.code === 'EADDRINUSE' ? `Cổng ${PORT} đang được dùng. Đóng phiên cũ rồi chạy lại.` : e.message); process.exit(1); });
function shutdown() { persist(); process.exit(0); }
process.once('SIGTERM', shutdown); process.once('SIGINT', shutdown);
