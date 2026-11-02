import { test } from 'node:test';
import assert from 'node:assert/strict';
import { giftRitual, parseGiftMap, upgradeShamrockMap, RITUALS } from '../gift-rituals.mjs';
import { createEventHandler } from '../tikfinity.mjs';
import { Room } from '../ganesha.mjs';
import { RitualQueue } from '../ritual-queue.js';

test('all six gifts require exact name and unit price, including the two 5-coin gifts', () => {
  const cases = [['Rose',1,'lotus'],['Hoa hồng',1,'lotus'],['กุหลาบ',1,'lotus'],['Quả đào',5,'incense'],['Peach',5,'incense'],['ลูกพีช',5,'incense'],['OK',5,'garland'],['โอเค',5,'garland'],['Cỏ 4 lá',10,'aarti'],['Four-leaf Clover',10,'aarti'],['Bó hoa',100,'marigold'],['ช่อดอกไม้',100,'marigold'],['Love Balloon',500,'royal'],['Bóng tình yêu',500,'royal']];
  for (const [name, coins, kind] of cases) {
    assert.equal(giftRitual(name, coins)?.kind, kind, name);
    assert.equal(giftRitual(name, coins + 1), null, name + ' wrong price');
  }
  for (const coins of [1,5,10,100,500]) assert.equal(giftRitual('Unknown gift', coins), null);
  assert.equal(giftRitual('Rose', 500), null);
  assert.equal(giftRitual('Bouquet', 500), null);
});
test('explicit IDs require correct unit price and prevent name fallback for the bound slot', () => {
  const map = parseGiftMap('42=garland\n900=royal');
  assert.equal(giftRitual('ชื่อใหม่', 5, '42', map).kind, 'garland');
  assert.equal(giftRitual('OK', 5, '99', map), null);
  assert.equal(giftRitual('ชื่อใหม่', 1, '42', map), null);
  assert.equal(giftRitual('Peach', 5, '99', map).kind, 'incense');
  assert.equal(giftRitual('localized balloon', 500, '900', map).kind, 'royal');
  for (const text of ['42=offering', '__proto__=lotus', 'foo', '42=aarti\ninvalid', '42=incense\n42=garland']) assert.throws(() => parseGiftMap(text));
});
test('Shamrock 9875 maps to Clover only at ten coins, including localized names and final streaks', () => {
  for (const name of ['Shamrock', ' SHAMROCK ', 'Shamrock\u200b', 'แชมร็อก']) assert.equal(giftRitual(name, 10)?.kind, 'aarti');
  assert.equal(giftRitual('ชื่อใหม่', 10, '9875')?.kind, 'aarti');
  for (const coins of [1,5,100,500]) assert.equal(giftRitual('Shamrock', coins, '9875'), null);
  for (const name of ['Rosa', 'Lucky Pig', 'Unknown gift']) assert.equal(giftRitual(name, 10, '1234'), null);
  const seen = [];
  const receive = createEventHandler({ gift: (id, name, gift, count, price, avatar, giftId) => seen.push({ count, price, giftId, ritual: giftRitual(gift, price, giftId) }) });
  const data = { uniqueId: 'thai', giftName: 'Shamrock', giftId: 9875, diamondCount: 10, giftType: 1, repeatCount: 3, repeatEnd: false, msgId: 'shamrock' };
  receive(JSON.stringify({ event: 'gift', data })); data.repeatEnd = true;
  receive(JSON.stringify({ event: 'gift', data })); receive(JSON.stringify({ event: 'gift', data }));
  assert.equal(seen.length, 1); assert.equal(seen[0].giftId, '9875');
  assert.equal(seen[0].count * seen[0].price, 30); assert.equal(seen[0].ritual.kind, 'aarti');
  assert.equal(seen[0].ritual.duration, 8000);
});
test('upgrading the old Clover binding preserves the other five gift mappings', () => {
  assert.equal(upgradeShamrockMap(''), '');
  assert.equal(upgradeShamrockMap('42=garland'), '42=garland');
  const upgraded = parseGiftMap(upgradeShamrockMap('1=lotus\n2=incense\n42=garland\n99=aarti\n100=marigold\n500=royal'));
  assert.equal(upgraded['9875'], 'aarti'); assert.equal(upgraded['99'], undefined);
  assert.equal(upgraded['1'], 'lotus'); assert.equal(upgraded['2'], 'incense'); assert.equal(upgraded['42'], 'garland');
  assert.equal(upgraded['100'], 'marigold'); assert.equal(upgraded['500'], 'royal');
  assert.equal(giftRitual('Shamrock', 10, '9875', upgraded)?.kind, 'aarti');
  assert.equal(giftRitual('Other ten coin gift', 10, '99', upgraded), null);
  assert.deepEqual(Object.values(RITUALS).map(r => r.duration), [4500,5500,6000,8000,23000,28000]);
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
  const room = new Room({}, { ambient: false, now: 0 }); room.join('donor', 'ศิริพร', { now: 0 }); room.gift('donor', 'ศิริพร', 2, 100, 0);
  for (let i=0;i<59;i++) room.join('b'+i, 'B', { now: i+1 });
  room.join('c', 'C', { now: 30000 }); room.advance(30000);
  assert.equal(room.viewers.size, 60); assert.equal(room.find('donor').seatState, 'leaving');
  room.advance(35200); assert.equal(room.viewers.size, 60); assert.equal(room.viewers.has('donor'), false);
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

test('premium ceremonies survive a basic gift burst and run before waiting basics', () => {
  const queue = new RitualQueue({ limit: 2, maxAge: 5000 });
  const message = (id, name, coins) => ({ id, name: id, count: 1, ritual: giftRitual(name, coins) });
  queue.enqueue(message('first', 'Rose', 1), 0); queue.tick(0);
  queue.enqueue(message('royal', 'Love Balloon', 500), 1);
  queue.enqueue(message('golden', 'Bouquet', 100), 2);
  for (let i = 0; i < 50; i++) queue.enqueue(message('basic'+i, 'Rose', 1), 3);
  const royal = queue.tick(4500); assert.equal(royal.id, 'royal'); assert.equal(royal.until - royal.beganAt, 28000);
  assert.equal(queue.tick(32499).id, 'royal');
  assert.equal(queue.tick(32500).id, 'golden');
  assert.equal(queue.tick(55500), null);
  queue.clear(); assert.equal(queue.dropped, 0);
});
