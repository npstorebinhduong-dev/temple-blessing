import { test } from 'node:test';
import assert from 'node:assert/strict';
import { processionPose, ALTAR } from '../procession.js';
import { EngagementClock, SpeechQueue, blessingForGift } from '../engagement.mjs';
import { Room, defaultSkin, skinFromComment } from '../ganesha.mjs';

test('both ceremonies reach the altar, kneel, lift the correct offering and return within their duration', () => {
  const from = { x: 800, y: 1710 }, seat = { x: 765, y: 1550 };
  for (const kind of ['marigold', 'royal']) {
    const pose = ms => processionPose(kind, ms, from, seat);
    assert.equal(pose(0).phase, 'rise');
    assert.equal(pose(2000).phase, 'to-aisle');
    assert.equal(pose(4000).x, ALTAR.x);
    assert.ok(pose(4000).y > ALTAR.y && pose(4000).y < from.y);
    assert.equal(pose(6800).phase, 'kneel'); assert.equal(pose(6800).y, ALTAR.y);
    assert.equal(pose(9000).phase, 'offer'); assert.equal(pose(9000).carrierFrame, 3);
    assert.equal(pose(9000).lift, 1); assert.equal(pose(9000).prop, true);
    const duration = kind === 'royal' ? 24000 : 20000;
    assert.equal(pose(duration - 2000).prop, false);
    assert.equal(pose(duration - 10).phase, 'done');
    assert.equal(pose(duration).x, seat.x); assert.equal(pose(duration).y, seat.y);
  }
  assert.equal(processionPose('royal', 15000, from, seat).phase, 'offer');
  assert.equal(processionPose('marigold', 15000, from, seat).phase, 'return');
});

test('idle reminders start after ten gift-free seconds, then wait ten seconds after actual playback ends', () => {
  const clock = new EngagementClock(0);
  assert.equal(clock.tick(9999), null);
  const first = clock.tick(10000); assert.match(first.text, /หัวใจ.*แชร์/);
  assert.equal(clock.tick(20000), null, 'TTS generation/loading has not finished');
  clock.delivered(first.id, ['live'], 21000);
  assert.equal(clock.tick(30000), null, 'no estimate may finish an audible reminder');
  clock.listenerDone(first.id, 'live', 32500);
  assert.equal(clock.tick(42499), null);
  const second = clock.tick(42500); assert.notEqual(second.id, first.id);
  clock.gift(43000); clock.finish(second.id, 50000); // Late completion cannot shift the new gift timer.
  assert.equal(clock.tick(52999), null); assert.equal(clock.tick(53000).lastGiftAt, 43000);
});

test('reminder completion follows every audible window, handles disconnects and rejects stale receipts', () => {
  const clock = new EngagementClock(0), prompt = clock.tick(10000);
  clock.delivered(prompt.id, ['obs', 'live'], 11000);
  clock.listenerDone(prompt.id, 'preview', 13000); // A silent preview is not a listener.
  clock.listenerDone(prompt.id, 'obs', 14000);
  assert.equal(clock.tick(30000), null);
  clock.removeListener('live', 31000);
  assert.equal(clock.tick(40999), null);
  const next = clock.tick(41000);
  clock.listenerDone(prompt.id, 'live', 42000); assert.equal(clock.isCurrent(next.id), true);
  clock.reset(50000); assert.equal(clock.tick(59999), null);
  const fresh = clock.tick(60000); assert.notEqual(fresh.id, prompt.id);
});

test('muted or failed reminders recover without backlog, and busy gift speech delays the first reminder', () => {
  const clock = new EngagementClock(0);
  assert.equal(clock.tick(10000, { busy: true }), null);
  assert.equal(clock.tick(15000, { enabled: false }), null);
  const prompt = clock.tick(20000); clock.delivered(prompt.id, [], 20000);
  assert.equal(clock.tick(29999), null);
  const failed = clock.tick(30000); clock.finish(failed.id, 35000);
  assert.equal(clock.tick(44999), null);
  assert.ok(clock.tick(45000)); assert.equal(clock.tick(120000), null);
  clock.cancel(120000); assert.equal(clock.tick(129999), null); assert.ok(clock.tick(130000));
});

test('gift speech removes waiting idle speech; no idle backlog while any voice is busy', () => {
  const queue = new SpeechQueue(2);
  assert.equal(queue.push({ text: 'share', tag: 'idle' }, 'gift'), false);
  assert.equal(queue.push({ text: 'share', tag: 'idle' }), true);
  queue.push({ text: 'thank you', tag: 'gift' });
  assert.equal(queue.length, 1); assert.equal(queue.shift().tag, 'gift');
  queue.push({ tag: 'gift' }); assert.equal(queue.push({ tag: 'idle' }), false);
  queue.clear(); assert.equal(queue.length, 0);
  assert.match(blessingForGift('น้องพลอย', 'royal'), /พระพิฆเนศ.*ครอบครัว/);
  assert.match(blessingForGift('ศิริพร', 'marigold'), /ดอกดาวเรือง/);
  assert.match(blessingForGift('Siri', undefined), /ของขวัญ/);
});

test('avatar selection uses explicit comments and persists through subsequent activity', () => {
  const room = new Room();
  assert.equal(skinFromComment(' ชาย '), 'male'); assert.equal(skinFromComment('หญิง'), 'female');
  assert.equal(skinFromComment('ขอบคุณชาย'), null);
  room.join('u', 'Name', { skin: 'male' }); room.join('u', 'Updated name'); room.gift('u', 'Name', 1, 500);
  assert.equal(room.viewers.get('u').skin, 'male');
  room.join('u', 'Name', { skin: skinFromComment('หญิง') });
  assert.equal(room.viewers.get('u').skin, 'female');
  assert.equal(defaultSkin('same-id'), defaultSkin('same-id'));
  assert.equal(defaultSkin('any', 'male'), 'male');
  assert.deepEqual(new Set(Array.from({ length: 24 }, (_, i) => defaultSkin('demo_' + i))), new Set(['male', 'female']));
});
