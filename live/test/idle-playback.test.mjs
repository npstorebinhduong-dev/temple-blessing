import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import WebSocket from 'ws';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function until(fn) {
  for (let i = 0; i < 100; i++) { const value = fn(); if (value) return value; await sleep(40); }
  throw new Error('Expected speech event was not received');
}

test('server schedules reminders from playback receipts, ignores preview receipts and resets on gifts', async t => {
  const root = mkdtempSync(path.join(tmpdir(), 'ganesha-idle-')), live = path.join(root, 'live');
  const source = fileURLToPath(new URL('..', import.meta.url)); mkdirSync(live);
  for (const f of readdirSync(source)) if (/\.(mjs|js|json)$/.test(f)) copyFileSync(path.join(source, f), path.join(live, f));
  symlinkSync(path.join(source, 'node_modules'), path.join(live, 'node_modules'), 'junction');
  // Test only: keep real WebSockets/timers, control wall time and replace Edge
  // synthesis with a local stream. No remote speech service or credentials.
  const clockFile = path.join(root, 'clock.txt'); writeFileSync(clockFile, '0');
  const clockModule = path.join(root, 'clock.mjs');
  writeFileSync(clockModule, `import { readFileSync } from 'node:fs'; Date.now = () => Number(readFileSync(${JSON.stringify(clockFile)}, 'utf8'));`);
  writeFileSync(path.join(live, 'fake-edge.mjs'), `import { Readable } from 'node:stream';
    export const OUTPUT_FORMAT = {};
    export class MsEdgeTTS { async setMetadata() {} toStream() { return { audioStream: Readable.from([Buffer.alloc(1200)]) }; } close() {} }`);
  const serverFile = path.join(live, 'server.mjs');
  writeFileSync(serverFile, readFileSync(serverFile, 'utf8').replace("from 'msedge-tts'", "from './fake-edge.mjs'"));
  const child = spawn(process.execPath, ['--import', pathToFileURL(clockModule).href, 'server.mjs'], {
    cwd: live, env: { ...process.env, PORT: '31878', GANESHA_DATA_DIR: path.join(root, 'data'), GANESHA_OFFLINE_AUDIO: '0' }, stdio: 'pipe',
  });
  const sockets = []; let ready = false, errors = '';
  child.stdout.on('data', () => { ready = true; }); child.stderr.on('data', b => { errors += b; });
  t.after(async () => {
    for (const ws of sockets) ws.terminate();
    if (child.exitCode === null) { const ended = once(child, 'exit'); child.kill(); await ended; }
    rmSync(root, { recursive: true, force: true });
  });
  await until(() => { if (child.exitCode !== null) throw new Error(errors); return ready; });
  async function client(role) {
    const ws = new WebSocket(`ws://127.0.0.1:31878/ws?role=${role}`), messages = [];
    sockets.push(ws); ws.on('message', data => messages.push(JSON.parse(data))); await once(ws, 'open');
    return { ws, messages, send: message => ws.send(JSON.stringify(message)) };
  }
  const control = await client('control'), speaker = await client('overlay'), muted = await client('overlay'), preview = await client('overlay&preview=1');
  const status = (id = '', state = 'ready') => ({ t: 'speech-status', ready: true, id, state });
  speaker.send(status()); preview.send(status());
  const setTime = async now => { writeFileSync(clockFile, String(now)); await sleep(320); };
  const prompts = () => speaker.messages.filter(m => m.t === 'tts' && m.tag === 'idle');
  await setTime(9999); assert.equal(prompts().length, 0);
  await setTime(10000); const first = await until(() => prompts()[0]);
  assert.equal(muted.messages.some(m => m.t === 'tts'), false);
  assert.equal(preview.messages.some(m => m.t === 'tts'), false);
  // Long buffering/playback cannot be mistaken for an already finished clip.
  await setTime(60000); assert.equal(prompts().length, 1);
  preview.send(status(first.id, 'ended')); muted.send(status(first.id, 'ended'));
  muted.send({ t: 'speech-status', ready: false });
  await sleep(320); assert.equal(prompts().length, 1);
  speaker.send(status(first.id, 'ended')); await sleep(60);
  await setTime(69999); assert.equal(prompts().length, 1);
  await setTime(70000); const second = await until(() => prompts()[1]);
  await setTime(72000);
  control.send({ t: 'ctl', cmd: 'gift', name: 'Gift test', gift: 'Rose', kind: 'lotus', diamonds: 1, count: 1 });
  await until(() => speaker.messages.find(m => m.t === 'gift'));
  speaker.send(status(second.id, 'cancelled'));
  const blessing = await until(() => speaker.messages.find(m => m.t === 'tts' && m.tag === 'gift'));
  await setTime(75000); speaker.send(status(blessing.id, 'ended')); await sleep(60);
  await setTime(81999); assert.equal(prompts().length, 2);
  await setTime(82000); const third = await until(() => prompts()[2]);
  await setTime(90000); speaker.send(status(second.id, 'ended')); await sleep(60);
  assert.equal(prompts().length, 3, 'old cancellation cannot finish the current reminder');
  // Closing the audible window releases its unfinished reminder.
  speaker.ws.close(); await once(speaker.ws, 'close');
  muted.send({ t: 'speech-status', ready: false }); await sleep(60);
  const replacement = await client('overlay'); replacement.send(status());
  await setTime(99999); assert.equal(replacement.messages.some(m => m.t === 'tts'), false);
  await setTime(100000);
  const next = await until(() => replacement.messages.find(m => m.t === 'tts' && m.tag === 'idle'));
  assert.notEqual(next.id, third.id);
});
