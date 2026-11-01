import { test } from 'node:test';
import assert from 'node:assert/strict';
import { giftRitual, parseGiftMap } from '../gift-rituals.mjs';
import { createEventHandler } from '../tikfinity.mjs';
import { Room } from '../ganesha.mjs';
import { RitualQueue } from '../ritual-queue.js';

test('gift tiers depend on one gift, independent of names, combo totals and language', () => {
  for (const name of ['Rose', 'Hoa hồng', 'กุหลาบ', 'ชื่อใหม่']) {
    assert.equal(giftRitual(name, 1).kind, 'lotus');
    assert.equal(giftRitual(name, 9).kind, 'lotus');
    assert.equal(giftRitual(name, 10).kind, 'incense');
    assert.equal(giftRitual(name, 99).kind, 'incense');
    assert.equal(giftRitual(name, 100).kind, 'garland');
    assert.equal(giftRitual(name, 499).kind, 'garland');
    assert.equal(giftRitual(name, 500).kind, 'aarti');
  }
});
test('known gift IDs override tiers; malformed mappings are rejected', () => {
  const map = parseGiftMap(' 42 = garland\n900=aarti\n');
  assert.equal(giftRitual('ชื่อใหม่', 1, '42', map).kind, 'garland');
  assert.equal(giftRitual('ชื่อใหม่', 100, 'unknown', map).kind, 'garland');
  for (const text of ['42=offering', '__proto__=lotus', 'foo', '42=aarti\ninvalid']) assert.throws(() => parseGiftMap(text));
});
test('a 500-rose streak produces one lotus event and counts 500, including string final flags', () => {
  const result = [], room = new Room();
  const handler = createEventHandler({ gift: (id, name, gift, count, value, avatar, giftId) => {
    result.push(giftRitual(gift, value, giftId)); room.gift(id, name, count, value);
  } });
  for (const repeatEnd of [false, false, 'true', true]) handler(JSON.stringify({ event: 'gift', data: {
    uniqueId: 'thai', nickname: 'ศิริพร', giftName: 'กุหลาบ', giftId: 1, diamondCount: 1,
    repeatCount: 500, giftType: '1', repeatEnd, msgId: 'same-final',
  } }));
  assert.equal(result.length, 1); assert.equal(result[0].kind, 'lotus');
  assert.equal(room.stats.coins, 500); assert.equal(room.stats.gifts, 500);
});
test('crowd eviction never loses donations or the leaderboard; serialized totals restore', () => {
  const room = new Room(); room.join('donor', 'ศิริพร', { limit: 2 }); room.gift('donor', 'ศิริพร', 2, 100);
  room.join('b', 'B', { limit: 2 }); room.join('c', 'C', { limit: 2 });
  assert.equal(room.viewers.size, 2); assert.equal(room.viewers.has('donor'), false);
  assert.equal(room.top()[0].coins, 200);
  const restored = new Room(JSON.parse(JSON.stringify(room.serialize())));
  assert.equal(restored.stats.coins, 200); assert.equal(restored.top()[0].name, 'ศิริพร');
  assert.equal(restored.join('donor', 'ศิริพร').viewer.coins, 200);
});
test('demo and live rooms have independent totals and participants', () => {
  const demo = new Room(), live = new Room();
  demo.gift('same', 'Demo', 9, 500); live.gift('same', 'จริง', 3, 1);
  assert.equal(live.stats.coins, 3); assert.equal(demo.stats.coins, 4500);
  assert.equal(live.top()[0].name, 'จริง');
});
test('visual queue merges pending repeats, expires stale effects, and stays bounded under bursts', () => {
  const queue = new RitualQueue({ limit: 3, maxAge: 5000 });
  const message = (id, count = 1) => ({ id, count, name: '<img src=x>', ritual: giftRitual('Rose', 1) });
  queue.enqueue(message('a'), 0); const active = queue.tick(0); assert.equal(active.id, 'a');
  queue.enqueue(message('b', 2), 50); queue.enqueue(message('b', 3), 60);
  assert.equal(queue.pending.length, 1); assert.equal(queue.pending[0].count, 5);
  for (let i = 0; i < 20; i++) queue.enqueue(message(String(i)), 100);
  assert.equal(queue.pending.length, 3); assert.equal(queue.active.id, 'a');
  assert.equal(queue.tick(6000), null);
  queue.enqueue(message('fresh'), 6001); assert.equal(queue.tick(6001).id, 'fresh');
  queue.clear(); assert.equal(queue.tick(6002), null); assert.equal(queue.pending.length, 0);
});
