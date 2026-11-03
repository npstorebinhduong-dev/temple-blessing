import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Room} from '../ganesha.mjs';
import {RitualQueue} from '../ritual-queue.js';
import {RITUALS} from '../gift-rituals.mjs';
import {GIFTS,SMALL_KINDS,LARGE_KINDS} from '../gift-catalog.js';
const msg=(kind,id='new')=>({id,name:'น้ำฝน',count:1,ritual:RITUALS[kind]});
test('catalog, timings, demos and routing have exactly five small and four premium kinds',()=>{
 assert.equal(GIFTS.length,9);assert.deepEqual(new Set(GIFTS.map(g=>g.kind)),new Set([...SMALL_KINDS,...LARGE_KINDS]));
 assert.deepEqual(new Set(Object.keys(RITUALS)),new Set(GIFTS.map(g=>g.kind)));
 assert.deepEqual(GIFTS.filter(g=>LARGE_KINDS.includes(g.kind)).map(g=>[g.kind,g.id,g.coins]),[['marigold','10994',100],['royal',null,500],['mushika','6267',299],['galaxy','11046',1000]]);
 assert.equal(GIFTS.find(g=>g.kind==='incense').id,'14786');
});
test('each small gift starts while a new actor is still arriving, with no TTS/prayer readiness gate',()=>{
 for(const kind of SMALL_KINDS){const room=new Room({}, {ambient:false,now:0});room.join('new','น้ำฝน',{now:0});room.rituals.enqueue(msg(kind),0);
  room.advance(1);assert.equal(room.rituals.active.ritual.kind,kind);assert.equal(room.find('new').seatState,'arriving');}
});
test('small actions remain FIFO behind a large ceremony; contribution is recorded at intake',()=>{
 const room=new Room({}, {ambient:false,now:0});room.join('large','มาลี',{now:0});room.join('small','น้ำฝน',{now:0});room.advance(8000);
 room.rituals.enqueue(msg('galaxy','large'),8000);room.advance(8000);
 room.gift('small','น้ำฝน',1,1,9000);room.rituals.enqueue(msg('lotus','small'),9000);
 room.advance(9001);assert.equal(room.stats.coins,1);assert.equal(room.rituals.active.ritual.kind,'galaxy');
 room.advance(28000);assert.equal(room.rituals.active.ritual.kind,'lotus');
});
test('Donut enters immediately; 30-second text rights and subsequent banners never add another walking/camera turn',()=>{
 const room=new Room({}, {ambient:false,now:0}),m=msg('prayer');room.join('new','น้ำฝน',{now:0});room.prayers.grant(m,0);room.rituals.enqueue(m,0);room.advance(1);
 assert.equal(room.rituals.active.ritual.kind,'prayer');room.advance(10001);assert.equal(room.rituals.active,null);assert.ok(room.prayers.current('new'));
 const result=room.prayers.comment('new','ขอให้สุขภาพแข็งแรง',{now:12000});room.prayerDisplay.enqueue(result,12000);room.advance(12000);
 assert.equal(room.rituals.active,null);assert.equal(room.prayerDisplay.active.prayer.text,'ขอให้สุขภาพแข็งแรง');
 room.clearScene(false);assert.equal(room.prayerDisplay.active,null);assert.equal(room.prayers.current('new'),null);
});
test('restored old small turns use current choreography and retired turns disappear without touching donations',()=>{
 const q=new RitualQueue();q.restore([{id:'a',ritual:{kind:'lotus',duration:4500}},{id:'b',ritual:{kind:'garland'}}]);
 assert.equal(q.pending.length,1);assert.equal(q.pending[0].ritual.station,true);assert.equal(q.pending[0].ritual.duration,10000);
 const room=new Room({stats:{coins:100,gifts:5},rituals:[{id:'b',ritual:{kind:'light'}}]});assert.equal(room.stats.coins,100);assert.equal(room.rituals.pending.length,0);
});
