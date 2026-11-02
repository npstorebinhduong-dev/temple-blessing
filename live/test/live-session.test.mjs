import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { get } from 'node:http';
import WebSocket, { WebSocketServer } from 'ws';
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn) { for (let i = 0; i < 100; i++) { const result = fn(); if (result) return result; await sleep(40); } throw Error('Expected event was not received'); }

test('real bridge: streak accounting, isolation, capacity, persisted restore and local-only endpoints', async t => {
  const dir = mkdtempSync(path.join(tmpdir(), 'ganesha-session-'));
  writeFileSync(path.join(dir, 'session.json'), JSON.stringify({ version: 1, settings: { voiceEnabled: false, giftMap: '4444=aarti' } }));
  const mock = new WebSocketServer({ host: '127.0.0.1', port: 0 }); await once(mock, 'listening');
  const sockets = []; let child;
  async function start() {
    child = spawn(process.execPath, ['server.mjs'], { cwd: new URL('..', import.meta.url), env: { ...process.env, PORT: '31877', GANESHA_DATA_DIR: dir, GANESHA_OFFLINE_AUDIO: '1' }, stdio: 'pipe' });
    let ready = false, error = ''; child.stdout.on('data', () => { ready = true; }); child.stderr.on('data', b => { error += b; });
    await until(() => { if (child.exitCode !== null) throw Error(error); return ready; });
  }
  async function stop() { const exit = once(child, 'exit'); child.kill(); await exit; }
  async function client(role) {
    const ws = new WebSocket(`ws://127.0.0.1:31877/ws?role=${role}`), messages = [];
    sockets.push(ws); ws.on('message', b => messages.push(JSON.parse(b))); await once(ws, 'open');
    return { ws, messages, send: (cmd, extra = {}) => ws.send(JSON.stringify({ t: 'ctl', cmd, ...extra })) };
  }
  t.after(async () => { for (const ws of sockets) ws.terminate(); for (const ws of mock.clients) ws.terminate(); mock.close(); if (child?.exitCode === null) await stop(); rmSync(dir, { recursive: true, force: true }); });
  await start(); const control = await client('control'), overlay = await client('overlay');
  const initial = await until(() => control.messages.find(m => m.t === 'state'));
  assert.equal(initial.mode, 'demo'); assert.equal(initial.settings.voiceEnabled, true); assert.equal(initial.viewers.length, 0);
  assert.equal(initial.actors.length, 10); assert.equal(initial.seating.ambient, 10);
  assert.equal(initial.settings.joinOnChat, false); assert.equal(initial.settings.joinOnEnter, true);
  assert.equal(initial.entrance.people.length, 0);
  assert.equal(initial.settings.giftMap, '9875=aarti');
  control.send('settings', { settings: { giftMap: '9001=garland', goal: 900, voiceEnabled: false } });
  await until(() => overlay.messages.some(m => m.t === 'settings' && !m.settings.voiceEnabled));
  const connected = once(mock, 'connection');
  control.send('connect', { source: 'tikfinity', url: `ws://127.0.0.1:${mock.address().port}/` });
  const [source] = await connected;
  await until(() => overlay.messages.some(m => m.t === 'state' && m.mode === 'live' && m.stats.coins === 0));
  source.send(JSON.stringify({ event: 'follow', data: { uniqueId: 'follower', nickname: 'Follower' } }));
  await until(() => overlay.messages.some(m => m.t === 'follow' && m.id === 'follower'));
  assert.equal(overlay.messages.some(m => m.t === 'join' && m.v.id === 'follower'), false);
  source.send(JSON.stringify({ event: 'member', data: { uniqueId: 'thai', nickname: 'น้องพลอย' } }));
  source.send(JSON.stringify({ event: 'member', data: { uniqueId: 'thai', nickname: 'น้องพลอย' } }));
  const entry = await until(() => overlay.messages.find(m => m.t === 'entrance' && m.people.length === 1));
  assert.equal(entry.people[0].id, 'thai'); assert.equal(entry.people[0].lineSlot, 1);
  assert.equal(overlay.messages.some(m => m.t === 'join' && m.v.id === 'thai'), false);
  source.send(JSON.stringify({ event: 'chat', data: { uniqueId: 'thai', nickname: 'น้องพลอย', comment: '1' } }));
  await until(() => overlay.messages.some(m => m.t === 'chat' && m.text === '1'));
  await until(() => overlay.messages.some(m => m.t === 'entrance' && m.people[0]?.skin === 'female'));
  assert.equal(overlay.messages.some(m => m.t === 'join' && m.v.id === 'thai'), false);
  const gift = { event: 'gift', data: { uniqueId: 'thai', nickname: 'น้องพลอย', giftName: 'โอเค', giftId: 9001, giftType: 1, repeatEnd: false, repeatCount: 3, diamondCount: 5, msgId: 'one' } };
  source.send(JSON.stringify(gift)); gift.data.repeatEnd = true; source.send(JSON.stringify(gift)); source.send(JSON.stringify(gift));
  const result = await until(() => overlay.messages.find(m => m.t === 'gift'));
  assert.equal(result.coins, 15); assert.equal(result.ritual.kind, 'garland'); assert.equal(result.giftId, '9001');
  assert.equal(overlay.messages.find(m => m.t === 'join' && m.v.id === 'thai').v.slot, 11);
  assert.equal(overlay.messages.find(m => m.t === 'join' && m.v.id === 'thai').v.skin, 'female');
  assert.deepEqual(overlay.messages.find(m => m.t === 'join' && m.v.id === 'thai').v.entryFrom, { x: 54, y: 1848, height: 128 });
  assert.equal(overlay.messages.filter(m => m.t === 'entrance').at(-1).people.length, 0);
  await until(() => overlay.messages.some(m => m.t === 'stats' && m.stats.coins === 15));
  source.send(JSON.stringify({ event: 'chat', data: { uniqueId: 'thai', nickname: 'น้องพลอย', comment: '2' } }));
  await until(() => overlay.messages.some(m => m.t === 'character' && m.v.id === 'thai' && m.v.skin === 'male'));
  source.send(JSON.stringify({ event: 'gift', data: { uniqueId: 'thai', nickname: 'น้องพลอย', giftName: 'Unmapped 100', diamondCount: 100, repeatCount: 1, msgId: 'unknown' } }));
  const unmatched = await until(() => overlay.messages.find(m => m.t === 'gift' && m.giftName === 'Unmapped 100'));
  assert.equal(unmatched.ritual, null); assert.equal(unmatched.skin, 'male'); assert.match(unmatched.blessing, /ของขวัญ/);
  await until(() => overlay.messages.some(m => m.t === 'stats' && m.stats.coins === 115));
  control.send('gift', { name: 'fake', diamonds: 500, count: 99 });
  await until(() => control.messages.some(m => m.t === 'error' && /Demo/.test(m.message)));
  for (let i = 0; i < 80; i++) source.send(JSON.stringify({ event: 'chat', data: { uniqueId: `v${i}`, nickname: `User ${i}`, comment: 'สาธุ' } }));
  await until(() => overlay.messages.some(m => m.t === 'chat' && m.id === 'v79'));
  const beforeCrowd = await client('overlay'), giftOnly = await until(() => beforeCrowd.messages.find(m => m.t === 'state'));
  assert.equal(giftOnly.viewers.length, 1); assert.equal(giftOnly.actors.length, 11); // Chats never displace the ten background figures.
  control.send('settings', { settings: { joinOnChat: true } });
  await until(() => overlay.messages.some(m => m.t === 'settings' && m.settings.joinOnChat));
  for (let i = 0; i < 80; i++) source.send(JSON.stringify({ event: 'chat', data: { uniqueId: `v${i}`, nickname: `User ${i}`, comment: 'สาธุ' } }));
  await until(() => overlay.messages.filter(m => m.t === 'chat' && m.id === 'v79').length === 2);
  const observer = await client('overlay'); const full = await until(() => observer.messages.find(m => m.t === 'state'));
  assert.equal(full.actors.length, 60); assert.equal(full.viewers.length, 50); assert.equal(full.seating.waiting, 31);
  assert.equal(new Set(full.actors.map(v => v.slot)).size, 60);
  assert.equal(full.stats.coins, 115); assert.equal(full.top[0].name, 'น้องพลอย');
  source.send(JSON.stringify({ event: 'member', data: { uniqueId: 'standing', nickname: 'Guest' } }));
  await until(() => overlay.messages.some(m => m.t === 'entrance' && m.people.some(v => v.id === 'standing')));
  source.send(JSON.stringify({ event: 'gift', data: { uniqueId: 'standing', nickname: 'Guest', giftName: 'Unknown gift', diamondCount: 10, repeatCount: 1, msgId: 'waiting-gift' } }));
  await until(() => overlay.messages.some(m => m.t === 'gift' && m.id === 'standing'));
  assert.equal(overlay.messages.some(m => m.t === 'join' && m.v.id === 'standing'), false);
  source.send(JSON.stringify({ event: 'chat', data: { uniqueId: 'standing', nickname: 'Guest', comment: '2' } }));
  await until(() => overlay.messages.some(m => m.t === 'entrance' && m.people.some(v => v.id === 'standing' && v.skin === 'male')));
  control.send('settings', { settings: { joinOnEnter: false } });
  await until(() => overlay.messages.some(m => m.t === 'settings' && !m.settings.joinOnEnter && m.entrance.people.length === 0));
  // Overlays cannot issue control commands.
  observer.send('reset'); observer.send('gift', { name: 'fake', diamonds: 500, count: 1 });
  control.send('demo'); await until(() => control.messages.filter(m => m.t === 'state' && m.mode === 'demo').length >= 2);
  control.send('gift', { name: 'Demo', diamonds: 500, count: 2 });
  await until(() => overlay.messages.some(m => m.t === 'gift' && m.name === 'Demo'));
  control.send('live');
  await until(() => control.messages.filter(m => m.t === 'state' && m.mode === 'live' && m.stats.coins === 125).length >= 1);
  for (const p of ['/live/server.mjs', '/live/data/session.json', '/live/test/live-session.test.mjs', '/assets/../live/package.json']) assert.equal((await fetch(`http://127.0.0.1:31877${p}`)).status, 404);
  const rejected = await new Promise((resolve, reject) => {
    get('http://127.0.0.1:31877/', { headers: { Host: 'untrusted.example' } }, res => { res.resume(); resolve(res.statusCode); }).on('error', reject);
  }); assert.equal(rejected, 421);
  assert.equal((await fetch('http://127.0.0.1:31877/assets/ganesha/fonts/NotoSansThai-Regular.ttf')).status, 200);
  for (const ws of sockets) ws.terminate(); await stop(); await start();
  const restored = await client('control'); restored.send('live');
  const stored = await until(() => restored.messages.find(m => m.t === 'state' && m.mode === 'live'));
  assert.equal(stored.stats.coins, 125); assert.equal(stored.settings.goal, 900); assert.equal(stored.settings.giftMap, '9001=garland');
  assert.equal(stored.settings.voiceEnabled, false); // v0.2 preserves an explicit mute after the one-time upgrade.
  assert.equal(stored.settings.joinOnEnter, false); // v0.8 enables once, then preserves the operator's choice.
  assert.equal(stored.entrance.people.length, 0);
  assert.equal(stored.top[0].name, 'น้องพลอย');
  restored.send('clear'); await sleep(50);
  restored.send('reset'); await until(() => restored.messages.some(m => m.t === 'state' && m.mode === 'live' && m.stats.coins === 0));
});
