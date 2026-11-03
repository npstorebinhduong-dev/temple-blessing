import { test } from 'node:test';
import assert from 'node:assert/strict';
import { giftRitual, parseGiftMap, sanitizeGiftMap, RITUALS } from '../gift-rituals.mjs';
import { createEventHandler } from '../tikfinity.mjs';
import { Room } from '../ganesha.mjs';
import { RitualQueue } from '../ritual-queue.js';

test('retained name fallbacks require exact name and unit price', () => {
  const cases = [['Rose',1,'lotus'],['Hoa hồng',1,'lotus'],['กุหลาบ',1,'lotus'],['Quả đào',5,'incense'],['Peach',5,'incense'],['ลูกพีช',5,'incense'],['Bó hoa',100,'marigold'],['ช่อดอกไม้',100,'marigold'],['Love Balloon',500,'royal'],['Bóng tình yêu',500,'royal']];
  for (const [name, coins, kind] of cases) {
    assert.equal(giftRitual(name, coins)?.kind, kind, name);
    assert.equal(giftRitual(name, coins + 1), null, name + ' wrong price');
  }
  for (const coins of [1,5,10,100,500]) assert.equal(giftRitual('Unknown gift', coins), null);
  assert.equal(giftRitual('Rose', 500), null);
  assert.equal(giftRitual('Bouquet', 500), null);
});
test('explicit IDs require correct unit price and prevent name fallback for the bound slot', () => {
  const map = parseGiftMap('42=fragrance\n900=royal');
  assert.equal(giftRitual('ชื่อใหม่', 5, '42', map).kind, 'fragrance');
  assert.equal(giftRitual('OK', 5, '99', map), null);
  assert.equal(giftRitual('ชื่อใหม่', 1, '42', map), null);
  assert.equal(giftRitual('Peach', 5, '99', map).kind, 'incense');
  assert.equal(giftRitual('localized balloon', 500, '900', map).kind, 'royal');
  for (const text of ['42=offering', '__proto__=lotus', 'foo', '42=aarti\ninvalid', '42=incense\n42=fragrance']) assert.throws(() => parseGiftMap(text));
});
test('retired identities, aliases, saved bindings and pending turns cannot trigger any ritual',()=>{
 for(const [name,price,id] of [['Shamrock',10,'9875'],['Perfume',20,'5658'],['OK',5,''],['Garland',15,''],['โคลเวอร์',10,'']]){
  assert.equal(giftRitual(name,price,id),null);
 }
 assert.equal(sanitizeGiftMap('5655=lotus\n9875=aarti\n99=garland\n55=floral\n5658=light\n10994=marigold'),'5655=lotus\n10994=marigold');
 assert.equal(giftRitual('Peach',5,'9875',{'9875':'incense'}),null);
 for(const kind of ['garland','aarti','floral','light']){
  assert.throws(()=>parseGiftMap('99='+kind));
  assert.equal(giftRitual('unknown',5,'99',{'99':kind}),null);
  const q=new RitualQueue();q.restore([{id:'a',ritual:{kind}}]);assert.equal(q.pending.length,0);
 }
 assert.equal(Object.keys(RITUALS).length,9);
 assert.deepEqual(['marigold','royal','mushika','galaxy'].map(k=>RITUALS[k].duration),[23000,28000,16000,20000]);
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
test('every separate final gift stays in FIFO order, including repeats by one donor, with no expiry or price priority', () => {
  const q = new RitualQueue();
  const kinds = ['lotus', 'galaxy', 'mushika', 'lotus', 'royal'];
  for (let i=0;i<1000;i++) q.enqueue({id:'same',count:i%3+1,name:'Name',ritual:RITUALS[kinds[i%kinds.length]]},i);
  q.prune(999999999); assert.equal(q.pending.length,1000);
  let now=999999999;const turns=new Set();
  for(let i=0;i<1000;i++){
    const active=q.tick(now);assert.equal(active.ritual.kind,kinds[i%kinds.length]);assert.equal(active.count,i%3+1);
    turns.add(active.turn);now=active.until;
  }
  assert.equal(turns.size,1000);assert.equal(q.tick(now),null);assert.equal(q.dropped,0);
});
test('the first waiting donor cannot be overtaken and pending turns survive pause/restore',()=>{
 const q=new RitualQueue();q.enqueue({id:'outside',count:2,ritual:RITUALS.mushika},0);q.enqueue({id:'seated',count:1,ritual:RITUALS.galaxy},1);
 assert.equal(q.tick(20,item=>item.id==='seated'),null);
 assert.equal(q.tick(21).id,'outside');q.pause();assert.equal(q.pending.length,2);
 const restored=new RitualQueue();restored.restore(JSON.parse(JSON.stringify(q.serialize())));
 assert.equal(restored.tick(30).id,'outside');assert.equal(restored.tick(16030).id,'seated');
});
test('new gifts require verified ID or explicit configuration and correct unit price, never a 299/1000 price guess',()=>{
 assert.equal(giftRitual('localized',1000,'11046').kind,'galaxy');assert.equal(giftRitual('Galaxy',1000).kind,'galaxy');
 assert.equal(giftRitual('Galaxy',299,'11046'),null);assert.equal(giftRitual('Unknown',1000,'42'),null);
 assert.equal(giftRitual('Bạn đồng hành',299,'42'),null);
 assert.equal(giftRitual('Corgi',299,'6267').kind,'mushika');
 assert.equal(giftRitual('localized',299,'6267').kind,'mushika');
 assert.equal(giftRitual('Corgi',499,'6267'),null);
 assert.equal(giftRitual('Other 299',299,'9999'),null);
 const overrides=parseGiftMap('42=mushika\n99=galaxy');
 assert.equal(giftRitual('localized',299,'42',overrides).kind,'mushika');
 assert.equal(giftRitual('Galaxy',1000,'11046',overrides),null);
 assert.equal(giftRitual('localized',1000,'99',overrides).kind,'galaxy');
});
