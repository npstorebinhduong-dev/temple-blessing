import { test } from 'node:test';
import assert from 'node:assert/strict';
import { EntranceLine, entrancePosition, ENTRANCE_SIZE, FRONT_SIZE, ENTRANCE_ROTATE_MS } from '../entrance-line.js';
import { Room } from '../ganesha.mjs';
const person = i => ({ id: String(i), name: `Guest ${i}`, skin: i % 2 ? 'male' : 'female' });

test('500 arrivals retain every record but expose only 88 render slots; no donations or seats are invented', () => {
  const room = new Room({}, { now: 0 });
  for (let i=0;i<500;i++) room.enter(String(i),`Guest ${i}`,{now:0});
  assert.equal(room.entrance.people.size,88);assert.equal(room.entrance.waiting.size,412);
  assert.equal(room.entrance.snapshot().realTotal,500);assert.equal(room.viewers.size,0);
  assert.equal(room.seating.actors.size,10);assert.equal(room.stats.coins,0);assert.equal(room.stats.gifts,0);
  room.enter('0','Updated',{skin:'male',now:10});
  assert.equal(room.entrance.find('0').name,'Updated');assert.equal(room.entrance.find('0').shownAt,0);
  assert.equal(room.entrance.snapshot().total,500);
});
test('far rows rotate without moving the front row or deleting a waiting person, even after a long live', () => {
  const line=new EntranceLine();for(let i=0;i<1200;i++)line.offer(person(i),0);
  const front=[...line.people.values()].filter(v=>v.lineSlot<=FRONT_SIZE).map(v=>[v.id,v.lineSlot]);
  const shown=new Set();
  for(let t=0;t<1200000;t+=ENTRANCE_ROTATE_MS){
    line.tick(t);for(const v of line.people.values())shown.add(v.id);
    assert.equal(line.people.size,ENTRANCE_SIZE);assert.equal(line.serialize().length,1200);
    assert.equal(new Set([...line.people.values()].map(v=>v.lineSlot)).size,88);
  }
  assert.deepEqual([...line.people.values()].filter(v=>v.lineSlot<=FRONT_SIZE).map(v=>[v.id,v.lineSlot]),front);
  assert.equal(shown.size,1200);
  const restored=new EntranceLine(JSON.parse(JSON.stringify(line.serialize())));
  assert.equal(restored.serialize().length,1200);assert.equal(restored.snapshot().people.length,88);
});
test('demo crowd is labelled separately and never added to the true waiting count',()=>{
  const line=new EntranceLine();line.offer({...person(1),demo:true});line.offer({...person(2),demo:false});
  assert.equal(line.snapshot().demoTotal,1);assert.equal(line.snapshot().realTotal,1);assert.equal(line.snapshot().total,2);
});
test('a donor leaves the avatar crowd once and enters seat 11, keeping their chosen gender and origin',()=>{
 const room=new Room({}, {now:0});room.enter('u','Guest',{skin:'female',now:0});room.entrance.update('u',{skin:'male'});
 const joined=room.join('u','Guest',{now:2000});assert.equal(joined.viewer.slot,11);assert.equal(joined.viewer.skin,'male');
 assert.deepEqual(joined.viewer.entryFrom,entrancePosition(1));assert.equal(room.entrance.find('u'),undefined);
 assert.equal(room.enter('u','Guest',{now:3000}),null);assert.equal(room.viewers.size,1);
});
test('a donor stays in the crowd until a full room frees a seat; waiting preference survives',()=>{
 const room=new Room({}, {now:0});for(let i=0;i<50;i++)room.join(`seat${i}`,'Seated',{now:0});
 room.enter('donor','Waiting',{skin:'female',now:30000});room.join('donor','Waiting',{now:30000});
 room.entrance.update('donor',{skin:'male'});room.find('donor').skin='male';room.gift('donor','Waiting',1,10,30000);
 room.advance(30000);assert.ok(room.entrance.find('donor'));const events=room.advance(35200);
 const joined=events.find(e=>e.t==='join'&&e.v.id==='donor');assert.ok(joined);assert.equal(joined.v.skin,'male');
 assert.equal(room.entrance.find('donor'),undefined);assert.equal(room.seating.actors.size,60);
});
test('waiting state persists per room and clear keeps donation totals; every avatar fits the bottom band',()=>{
 const demo=new Room(),live=new Room();demo.enter('u','Demo');assert.equal(live.entrance.people.size,0);
 demo.gift('u','Demo',1,10);const restored=new Room(JSON.parse(JSON.stringify(demo.serialize())));
 assert.equal(restored.entrance.snapshot().total,1);demo.clearScene();assert.equal(demo.stats.coins,10);assert.equal(demo.entrance.snapshot().total,0);
 for(let slot=1;slot<=ENTRANCE_SIZE;slot++){
  const p=entrancePosition(slot);assert.ok(p.x-p.radius>=0&&p.x+p.radius<=1080);assert.ok(p.y-p.radius>1710&&p.y+p.radius+29<1920);
 }
});
