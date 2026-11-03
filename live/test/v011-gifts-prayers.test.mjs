import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PrayerQueue,prayerText,DEFAULT_PRAYER} from '../prayer-queue.js';
import {giftRitual,RITUALS} from '../gift-rituals.mjs';
import {GIFTS,demoId,configuredGift} from '../gift-catalog.js';
import {createEventHandler} from '../tikfinity.mjs';
import {smallPose as stationPose} from '../small-procession.js';
import {actorGeometry,entryWorldPoint} from '../actor-geometry.js';
import {seatLayout,arrivalPose,ENTRY_MS} from '../seating.js';
import {SCENE_VIEW} from '../scene-layout.js';
const message=(id='u',count=1)=>({id,name:'น้ำฝน',count,ritual:RITUALS.prayer});
test('arrivals finish before server focus even at 4 FPS, follow the aisle and never resize to catch up',()=>{
 for(const seat of seatLayout())for(const from of [{x:-30,y:2090},{x:540,y:2090},{x:1110,y:2020}]){
  let last=arrivalPose(from,seat,0);assert.equal(last.x,from.x);assert.equal(last.y,from.y);
  for(let ms=250;ms<=ENTRY_MS;ms+=250){
   const p=arrivalPose(from,seat,ms);assert.ok(p.distance>=last.distance);
   if(p.y<from.y-1&&p.y>seat.y+1)assert.equal(p.x,540);
   assert.equal(actorGeometry({seat},p).height,actorGeometry({...p,seat}).height);last=p;
  }
  assert.equal(last.phase,'sit');assert.equal(last.x,seat.x);assert.equal(last.y,seat.y);
  assert.equal(arrivalPose(from,seat,ENTRY_MS-150).phase,'sit');
 }
});
test('prayer grants accept fresh comments from the purchaser, one right at a time, preserving Thai and plain text',()=>{
 const q=new PrayerQueue();q.grant(message('u',2),1000);q.grant(message(),1001);
 assert.equal(q.comment('other','ขอให้มีความสุข',{now:1100}),null);
 assert.equal(q.comment('u','old',{now:1100,sentAt:999}),null);
 assert.equal(q.comment('u','2',{now:1100}),null);
 const result=q.comment('u','น้ำ'.repeat(150),{now:1200,sentAt:1199});
 assert.equal([...new Intl.Segmenter('th',{granularity:'grapheme'}).segment(result.prayer.text)].length,100);
 assert.equal(q.current('u').openedAt,1200);assert.equal(q.comment('u','delayed old comment',{now:1300,sentAt:1199}),null);
 const html='<img src=x onerror=alert(1)>';assert.equal(q.comment('u',html,{now:1400}).prayer.text,html);
 assert.equal(q.current('u').openedAt,1400);assert.equal(q.expire(31399).length,0);
 assert.equal(q.comment('u','late',{now:31400}),null);assert.equal(q.expire(31400)[0].prayer.text,DEFAULT_PRAYER);assert.equal(q.current('u'),null);
 assert.equal(prayerText(' \u202e '),null);
});
test('large prayer streaks stay compact, restore pending rights and reset clears them',()=>{
 const q=new PrayerQueue();q.grant(message('a',9999),1000);assert.equal(q.users.get('a').length,1);
 const restored=new PrayerQueue(JSON.parse(JSON.stringify(q.serialize())));assert.equal(restored.expire(31000).length,1);
 assert.equal(restored.users.get('a')[0].remaining,9998);restored.clear();assert.equal(restored.users.size,0);
});
test('same-price identities remain separate and pending mappings require explicit demo IDs or operator binding',()=>{
 const demoMap=Object.fromEntries(GIFTS.map(g=>[demoId(g.kind),g.kind]));
 for(const g of GIFTS)assert.equal(giftRitual(g.name,g.coins,g.id||demoId(g.kind),demoMap)?.kind,g.kind);
 assert.equal(giftRitual('anything',1,'5655').kind,'lotus');assert.equal(giftRitual('Rosa',10,'5655'),null);
 assert.equal(giftRitual('Perfume',20,'5658'),null);assert.equal(giftRitual('Doughnut',30,'5879').kind,'prayer');
 for(const kind of ['lamp','fragrance']){
  const g=GIFTS.find(g=>g.kind===kind);assert.equal(configuredGift(g).liveReady,false);
  assert.equal(giftRitual(g.name,g.coins),null);assert.equal(giftRitual(g.name,g.coins,demoId(kind)),null);
  assert.equal(giftRitual(g.name,g.coins,demoId(kind),{[demoId(kind)]:kind}).kind,kind);
 }
 assert.equal(giftRitual('Lamp',1,'123456',{'123456':'lamp'}).kind,'lamp');assert.equal(giftRitual('Lamp',5,'123456',{'123456':'lamp'}),null);
 const corgi=GIFTS.find(g=>g.kind==='mushika');
 assert.equal(configuredGift(corgi,{mushikaGiftId:'123456',mushikaGiftIcon:'https://example.test/gift.png'}).cell,undefined);
 assert.equal(configuredGift(corgi,{mushikaGiftIcon:'https://example.test/gift.png'}).icon,'https://example.test/gift.png');
 assert.equal(configuredGift(corgi,{mushikaGiftId:'123456'}).icon,undefined);
 assert.equal(configuredGift(corgi,{giftMap:'123456=mushika',giftCatalog:{mushika:{id:'6267',icon:'https://example.test/old-corgi.png'}}}).icon,undefined);
});
test('combo final counts are idempotent across reconnects, including repeated ends with different transport IDs',()=>{
 const seen=new Map(),combos=new Map(),calls=[];let h=createEventHandler({seen,combos,gift:(...args)=>calls.push(args)});
 const d={uniqueId:'u',giftId:5655,giftName:'Rose',diamondCount:1,giftType:1,groupId:'g',repeatCount:1,msgId:'a'};
 const send=()=>h(JSON.stringify({event:'gift',data:d}));send();d.repeatCount=4;send();assert.equal(calls.length,0);
 d.repeatEnd=true;send();assert.equal(calls[0][3],4);
 h=createEventHandler({seen,combos,gift:(...args)=>calls.push(args)});send();d.msgId='duplicate-end';send();assert.equal(calls.length,1);
 // A cumulative final can advance while the bridge retains its transport ID.
 d.repeatCount=6;send();assert.equal(calls[1][3],2);send();assert.equal(calls.length,2);
 d.uniqueId='other';send();assert.equal(calls[2][3],6);
});
test('60 seats preserve an open aisle; station rituals enter and leave continuously without gift scaling',()=>{
 const seats=seatLayout();assert.equal(seats.length,60);assert.equal(new Set(seats.map(s=>s.x+':'+s.y)).size,60);assert.ok(seats.every(s=>s.x<=360||s.x>=720));
 for(const kind of ['lotus','lamp','fragrance','prayer','incense'])for(const seat of seats){
  const duration=RITUALS[kind].duration;let previous=stationPose(kind,0,seat,seat);assert.equal(previous.x,seat.x);assert.equal(previous.y,seat.y);
  for(let ms=16;ms<duration;ms+=16){const p=stationPose(kind,ms,seat,seat);assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<18,`${kind} at ${ms}`);assert.equal(actorGeometry({seat},p).height,actorGeometry({...p,seat}).height);previous=p;}
  const end=stationPose(kind,duration,seat,seat);assert.equal(end.x,seat.x);assert.equal(end.y,seat.y);
 }
 const entry=entryWorldPoint({x:550,layer:3},SCENE_VIEW),g=actorGeometry({seat:seats[0]},entry,0);
 assert.ok(Math.abs(entry.y*SCENE_VIEW.scale+SCENE_VIEW.y-g.height*.975*SCENE_VIEW.scale-1796)<.1);
});
