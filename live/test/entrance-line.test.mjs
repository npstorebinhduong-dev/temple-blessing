import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EntranceLine, entrancePosition, ENTRANCE_SIZE, ENTRANCE_WAITING_LIMIT, ENTRANCE_MIN_MS, ENTRANCE_EXIT_MS, ENTRANCE_STAY_MS, ENTRANCE_WAIT_MS } from '../entrance-line.js';
import { Room } from '../ganesha.mjs';
const person = i => ({ id: String(i), name: `Guest ${i}`, skin: i % 2 ? 'male' : 'female' });

test('room entries occupy ten stable standing places, deduplicate and never add seats or donations', () => {
  const room = new Room({}, { now: 0 });
  for (let i = 0; i < 20; i++) room.enter(String(i), `Guest ${i}`, { now: 0 });
  assert.equal(room.entrance.people.size, 10); assert.equal(room.entrance.waiting.size, 10);
  assert.equal(room.viewers.size, 0); assert.equal(room.seating.actors.size, 10);
  assert.equal(room.stats.coins, 0); assert.equal(room.stats.gifts, 0); assert.equal(room.top().length, 0);
  const slots = [...room.entrance.people.values()].map(v => v.lineSlot);
  room.enter('0', 'Updated', { skin: 'female', now: 14000 });
  assert.equal(room.entrance.people.size, 10); assert.equal(room.entrance.find('0').shownAt, 0);
  assert.equal(room.entrance.find('0').name, 'Updated');
  assert.deepEqual([...room.entrance.people.values()].map(v => v.lineSlot), slots);
});

test('welcome line rotates FIFO only after a visible stay and completes departure before reusing the place', () => {
  const line = new EntranceLine();
  for (let i = 0; i < 12; i++) line.offer(person(i), 0);
  line.tick(ENTRANCE_MIN_MS - 1); assert.equal(line.people.get('0').state, 'standing');
  line.tick(ENTRANCE_MIN_MS); assert.equal(line.people.get('0').state, 'leaving');
  line.tick(ENTRANCE_MIN_MS + ENTRANCE_EXIT_MS - 1); assert.ok(!line.people.has('10'));
  line.tick(ENTRANCE_MIN_MS + ENTRANCE_EXIT_MS);
  assert.ok(!line.find('0')); assert.equal(line.people.get('10').lineSlot, 1);
  assert.equal(line.people.get('1').lineSlot, 2); assert.equal(line.people.size, 10);
});

test('entry bursts have bounded memory, expire stale waiting entries and protect donors waiting for a seat', () => {
  const line = new EntranceLine();
  for (let i = 0; i < 1000; i++) line.offer(person(i), 0);
  assert.equal(line.people.size, ENTRANCE_SIZE); assert.equal(line.waiting.size, ENTRANCE_WAITING_LIMIT);
  const protectedIds = new Set(['0']);
  for (let t = ENTRANCE_MIN_MS; t <= ENTRANCE_STAY_MS + 10000; t += 1200) {
    line.tick(t, protectedIds);
    assert.equal(line.people.get('0').state, 'standing');
    assert.ok(line.people.size <= ENTRANCE_SIZE);
    assert.equal(new Set([...line.people.values()].map(v => v.lineSlot)).size, line.people.size);
  }
  line.tick(ENTRANCE_WAIT_MS + 1, protectedIds); assert.equal(line.waiting.size, 0);
  assert.ok(line.people.has('0')); line.clear(); assert.equal(line.people.size + line.waiting.size, 0);
});

test('a donor moves once from the standing line into seat 11 with their chosen skin and origin', () => {
  const room = new Room({}, { now: 0 });
  room.enter('u', 'Guest', { skin: 'female', now: 0 });
  room.entrance.update('u', { skin: 'male' });
  const joined = room.join('u', 'Guest', { now: 2000 });
  assert.equal(joined.viewer.slot, 11); assert.equal(joined.viewer.skin, 'male');
  assert.deepEqual(joined.viewer.entryFrom, entrancePosition(1));
  assert.equal(room.entrance.find('u'), undefined); assert.equal(room.viewers.size, 1);
  room.gift('u', 'Guest', 1, 10); assert.equal(room.stats.coins, 10);
  assert.equal(room.enter('u', 'Guest', { now: 3000 }), null);
  assert.equal(room.viewers.size, 1); assert.equal(room.entrance.people.size, 0);
});

test('a donor keeps their standing place while sixty seats are full and leaves the line only when admitted', () => {
  const room = new Room({}, { now: 0 });
  for (let i = 0; i < 50; i++) room.join(`seat${i}`, 'Seated', { now: 0 });
  room.enter('waiting-donor', 'Waiting', { skin: 'female', now: 30000 });
  const result = room.join('waiting-donor', 'Waiting', { now: 30000 });
  assert.equal(result.waiting, true); assert.ok(room.entrance.people.has('waiting-donor'));
  room.advance(30000);
  assert.ok(room.entrance.people.has('waiting-donor'));
  const events = room.advance(35200);
  const join = events.find(e => e.t === 'join' && e.v.id === 'waiting-donor');
  assert.ok(join); assert.deepEqual(join.v.entryFrom, entrancePosition(1));
  assert.equal(room.entrance.find('waiting-donor'), undefined); assert.equal(room.seating.actors.size, 60);
});

test('line state is isolated per room and cleared without erasing donations; positions fit the bottom strip', () => {
  const demo = new Room(), live = new Room();
  demo.enter('u', 'Demo'); assert.equal(live.entrance.people.size, 0);
  demo.gift('u', 'Demo', 1, 10); demo.clearScene();
  assert.equal(demo.entrance.people.size, 0); assert.equal(demo.stats.coins, 10);
  assert.equal(new Room(demo.serialize()).entrance.people.size, 0);
  for (let slot = 1; slot <= ENTRANCE_SIZE; slot++) {
    const p = entrancePosition(slot);
    assert.ok(p.x - p.height * .375 >= 0 && p.x + p.height * .375 <= 1080);
    assert.ok(p.y - p.height > 1710 && p.y + 34 < 1920);
  }
});

test('a delayed member event still shows a donor waiting for a seat, preserving their selected avatar', () => {
  const room = new Room({}, { now: 0 });
  for (let i = 0; i < 50; i++) room.join(`seat${i}`, 'Seated', { now: 0 });
  room.join('late-member', 'Donor', { skin: 'female', now: 30000 });
  room.gift('late-member', 'Donor', 1, 10, 30000);
  const entry = room.enter('late-member', 'Donor', { skin: 'male', now: 30001 });
  assert.equal(entry.skin, 'female'); assert.equal(room.entrance.people.size, 1);
  assert.equal(room.seating.waiting.size, 1); assert.equal(room.stats.coins, 10);
  room.advance(30001); room.advance(35201);
  assert.equal(room.entrance.people.size, 0); assert.equal(room.find('late-member').skin, 'female');
});
