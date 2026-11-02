import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Seating, ENTRY_MS, EXIT_MS, MIN_STAY_MS, MAX_WAITING, seatLayout, exitPose } from '../seating.js';
import { Room } from '../ganesha.mjs';
import { RITUALS } from '../gift-rituals.mjs';
import { actorPhase, devotionPose, statuePose } from '../devotion.js';
import { ARM_PARTS, ShrineArms } from '../shrine-arms.js';

const person = i => ({ id: `u${i}`, name: `Name ${i}`, skin: i % 2 ? 'male' : 'female', coins: 0 });
test('statue never caches arm crops from a PNG whose dimensions arrived before its pixels', () => {
  const arms = Object.create(ShrineArms.prototype);
  arms.parts = null;
  arms.base = { complete: true, naturalWidth: 941 };
  arms.atlas = { complete: false, naturalWidth: 941 };
  assert.equal(arms.ready, false);
  // No drawing APIs should be touched while the atlas is still loading.
  assert.equal(arms.draw({}, 1, {}).lotus, statuePose(1).lotus);
  assert.equal(arms.parts, null);
  arms.atlas.complete = true; arms.base.complete = false;
  assert.equal(arms.ready, false); arms.prepare(); assert.equal(arms.parts, null);
  arms.base.complete = true; assert.equal(arms.ready, true);
  arms.atlas.naturalWidth = 0; assert.equal(arms.ready, false);
});

test('turning background off and on during its exit restores the same ten slots', () => {
  const seats = new Seating({ now:0 }); seats.setAmbient(false,100);
  assert.equal(seats.summary().departing,10);
  assert.equal(seats.setAmbient(true,200).filter(e=>e.t==='settle').length,10);
  seats.tick(10000);assert.equal(seats.summary().ambient,10);assert.equal(seats.summary().departing,0);
  assert.equal(new Set([...seats.actors.values()].map(v=>v.slot)).size,10);
});
test('ten background actors keep fixed slots through fifty arrivals and repeated gifts', () => {
  const room = new Room({}, { now: 0 });
  const before = [...room.seating.actors.values()].map(v => [v.id,v.slot]);
  assert.deepEqual(before.map(([,slot]) => slot), [1,2,3,4,5,6,7,8,9,10]);
  for (let i=0;i<50;i++) assert.equal(room.join(`u${i}`,`Name ${i}`,{ now: i+1 }).viewer.slot, i+11);
  const savedSlots = [...room.seating.actors.values()].map(v => [v.id,v.slot]);
  room.join('u0','Updated name',{ now: 40000 }); room.gift('u0','Updated name',3,500,40000);
  room.advance(40000);
  assert.deepEqual([...room.seating.actors.values()].map(v => [v.id,v.slot]), savedSlots);
  assert.equal(room.seating.actors.size,60); assert.equal(room.seating.summary().ambient,10);
  assert.equal(room.find('u0').seatedAt,ENTRY_MS+1); // Keep their seat and admission animation.
  assert.equal(room.find('u0').lastGiftAt,40000); // Only a gift renews departure priority.
  assert.equal(room.stats.coins,1500); assert.equal(room.stats.gifts,3);
  assert.equal(room.viewers.size,50); assert.equal(room.top().length,1);
  assert.equal(room.seating.waiting.size,0);
});

test('a full scene vacates the oldest seat before admitting FIFO, including all ten background actors', () => {
  const seats = new Seating({ now: 0 });
  for (let i=0;i<65;i++) seats.offer(person(i),i+1);
  assert.equal(seats.actors.size,60); assert.equal(seats.waiting.size,15);
  const first = seats.tick(100).find(e => e.t==='depart'); assert.equal(first.v.slot,1); assert.equal(first.v.ambient,true);
  seats.tick(100+EXIT_MS-1); assert.equal(seats.actors.has('u50'),false);
  const events = seats.tick(100+EXIT_MS);
  assert.equal(events.find(e=>e.t==='leave').id,first.v.id);
  assert.equal(events.find(e=>e.t==='join').v.id,'u50'); assert.equal(seats.find('u50').slot,1);
  const admitted = ['u50'], departed = [first.v.id];
  // Every tick checks capacity and unique slots, including simultaneous exits.
  for (let now=5500;now<140000;now+=100) {
    for (const e of seats.tick(now)) {
      if (e.t==='join') admitted.push(e.v.id);
      if (e.t==='leave') departed.push(e.id);
    }
    assert.ok(seats.actors.size<=60); assert.equal(new Set([...seats.actors.values()].map(v=>v.slot)).size,seats.actors.size);
    assert.ok(seats.summary().departing<=2);
  }
  assert.deepEqual(admitted,Array.from({length:15},(_,i)=>`u${i+50}`));
  assert.equal(seats.waiting.size,0); assert.equal(seats.summary().ambient,0);
  assert.ok(departed.includes('u0')); assert.ok(!seats.actors.has('u0')); assert.equal(seats.actors.size,60);
  seats.tick(200000); assert.equal(seats.summary().ambient,0,'background actors must not refill after yielding');
});

test('a full scene releases the least recent donor; repeat gifts renew priority but ordinary interactions do not', () => {
  const room = new Room({}, { ambient: false, now: 0 });
  for (let i = 0; i < 60; i++) {
    room.join(`donor${i}`, `Donor ${i}`, { now: i });
    room.gift(`donor${i}`, `Donor ${i}`, 1, 1, 100 + i);
  }
  const oldSlot = room.find('donor0').slot, nextSlot = room.find('donor1').slot;
  room.gift('donor0', 'Recent donor', 1, 1, 29900);
  room.join('donor1', 'Updated name without a gift', { now: 29999 });
  room.join('new', 'New donor', { now: 30000 }); room.gift('new', 'New donor', 1, 1, 30000);
  const departing = room.advance(30000).find(e => e.t === 'depart');
  assert.equal(departing.v.id, 'donor1');
  assert.equal(room.find('donor0').slot, oldSlot); assert.equal(room.find('donor0').seatState, 'seated');
  assert.equal(room.find('donor1').lastGiftAt, 101);
  const admitted = room.advance(30000 + EXIT_MS).find(e => e.t === 'join' && e.v.id === 'new');
  assert.ok(admitted); assert.equal(admitted.v.slot, nextSlot);
  assert.equal(room.stats.coins, 62); assert.equal(room.top()[0].id, 'donor0');
});

test('returning donors finish their exit and rejoin once; bursts have bounded waiting memory', () => {
  const seats = new Seating({ ambient:false,now:0 });
  for(let i=0;i<61;i++) seats.offer(person(i),i);
  seats.tick(ENTRY_MS+MIN_STAY_MS+100);
  const leaving = [...seats.actors.values()].find(v=>v.seatState==='leaving');
  for(let i=0;i<5;i++) seats.offer({...leaving,name:'Returned',coins:500},21000+i);
  const events=seats.tick(ENTRY_MS+MIN_STAY_MS+100+EXIT_MS);
  assert.equal(events.filter(e=>e.t==='join'&&e.v.id==='u60').length,1);
  assert.equal(seats.waiting.size,1); assert.equal(seats.waiting.get(leaving.id).name,'Returned');
  let overflow=0;
  for(let i=1000;i<3000;i++) if(seats.offer(person(i),30000).overflow) overflow++;
  assert.equal(seats.waiting.size,MAX_WAITING); assert.equal(overflow,1501);
  assert.equal(seats.actors.size,60);
});

test('server owns ceremonies: a waiting premium is admitted first, then protected through its return', () => {
  const room=new Room({}, {ambient:false,now:0});
  for(let i=0;i<61;i++) room.join(`u${i}`,`Name ${i}`,{now:i});
  room.rituals.enqueue({id:'u60',name:'Name 60',count:1,ritual:RITUALS.royal},21000);
  room.advance(21000); assert.equal(room.rituals.active,null);
  room.advance(21000+EXIT_MS);
  assert.equal(room.rituals.active.id,'u60');
  const slot=room.find('u60').slot;
  for(let i=61;i<130;i++) room.join(`u${i}`,`Name ${i}`,{now:27000+i});
  for(let now=27000;now<54000;now+=250) {
    room.advance(now); assert.equal(room.find('u60').slot,slot); assert.notEqual(room.find('u60').seatState,'leaving');
  }
  assert.equal(room.rituals.active.id,'u60'); room.advance(54200); assert.equal(room.rituals.active,null);
});

test('seat and devotion motion stays finite, staggered and bounded; reduced motion holds a wai', () => {
  const layout=seatLayout(); assert.equal(layout.length,60);
  assert.equal(new Set(layout.map(s=>`${s.x},${s.y}`)).size,60);
  for(const s of layout) {
    const start=exitPose(s,0),end=exitPose(s,EXIT_MS);
    assert.equal(start.x,s.x);assert.equal(start.y,s.y);assert.equal(end.alpha,0);assert.equal(end.y,2030);
  }
  const phases=Array.from({length:10},(_,i)=>actorPhase(`@scene/ambient/${i}`));
  assert.ok(Math.max(...phases)-Math.min(...phases)>.6);
  for(let t=0;t<300;t+=.25) {
    const poses=phases.map(p=>devotionPose(t+p*29));
    assert.ok(poses.some(p=>p.bow>0),`crowd motion at ${t}`);
    for(const p of poses) { assert.ok(p.mix>=0&&p.mix<=1); assert.ok(p.from>=0&&p.to<=3); }
    const arms=statuePose(t);assert.ok(Math.abs(arms.lotus)<.25);assert.ok(Math.abs(arms.hammer)<.23);
    assert.ok(arms.glow>=.28&&arms.glow<=.58);
  }
  assert.equal(devotionPose(4,0,true).bow,0);assert.equal(statuePose(4,{reduced:true}).lotus,0);
  assert.deepEqual(statuePose(4,{enabled:false}),{lotus:0,hammer:0,glow:0});
  // Test perceptible travel on a 390 px phone, not just non-zero angles.
  for (const part of ARM_PARTS) {
    const positions=Array.from({length:160},(_,i)=>{
      const a=statuePose(i/20)[part.kind],dx=part.light[0]-part.pivot[0],dy=part.light[1]-part.pivot[1];
      return {x:(Math.cos(a)*dx-Math.sin(a)*dy)*part.scale*390/941,
        y:(Math.sin(a)*dx+Math.cos(a)*dy)*part.scale*390/941};
    });
    const travel=Math.max(...positions.flatMap(a=>positions.map(b=>Math.hypot(a.x-b.x,a.y-b.y))));
    assert.ok(travel>20,`${part.kind} must move visibly on a phone: ${travel}px`);
  }
  const soft=statuePose(1,{level:'soft'}),clear=statuePose(1),strong=statuePose(1,{level:'strong'});
  assert.ok(Math.abs(soft.lotus)<Math.abs(clear.lotus));assert.ok(Math.abs(strong.lotus)>Math.abs(clear.lotus));
});
