import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BlessingSession, GANESHA_BLESSING, BANNER_HOLD_MS, TEXT_READ_MS } from '../blessing-session.js';
import { specialPose, specialCamera, WHISPER_PLACE } from '../special-rituals.js';
import { Room } from '../ganesha.mjs';
import { RITUALS } from '../gift-rituals.mjs';
import { seatLayout, ENTRY_MS, EXIT_MS } from '../seating.js';
const turn = (now=0) => ({ id:'donor',name:'ศิริพร',turn:'turn-1',ritual:RITUALS.galaxy,beganAt:now,until:now+20000,blessing:GANESHA_BLESSING });

test('voice/banner share exact Thai text, follow all audible listeners and hold 2.5s after actual completion',()=>{
 const a=turn(),s=new BlessingSession(a,4500);s.delivered(['live','obs'],5000);
 assert.equal(a.speech.startedAt,null);assert.equal(a.speech.text,GANESHA_BLESSING);
 assert.equal(s.receipt(s.id,'preview','started',5100),false);
 s.receipt(s.id,'live','started',6000);s.receipt(s.id,'obs','started',6300);
 assert.equal(a.speech.startedAt,6000);assert.equal(a.speech.state,'playing');
 s.receipt(s.id,'live','ended',22500);assert.equal(a.speech.endedAt,null);
 s.receipt(s.id,'obs','ended',26000);assert.equal(a.speech.endedAt,26000);
 assert.equal(a.speech.bannerUntil,26000+BANNER_HOLD_MS);assert.equal(a.until,31500);
 assert.equal(s.receipt('previous','obs','ended',30000),false);assert.equal(a.until,31500);
});
test('no sound, failed playback, silent listeners and timeouts get a readable text fallback without hanging',()=>{
 for(const fail of ['no-listeners','error','timeout']) {
  const a=turn(),s=new BlessingSession(a,4500);
  if(fail==='no-listeners')s.delivered([],5000);
  if(fail==='error'){s.delivered(['live'],5000);s.receipt(s.id,'live','error',5000);}
  if(fail==='timeout'){assert.equal(s.tick(21000),true);}
  assert.equal(a.speech.state,'text');assert.ok(a.speech.endedAt-a.speech.startedAt>=TEXT_READ_MS);
  assert.equal(a.speech.bannerUntil-a.speech.endedAt,2500);assert.ok(a.until>=20000);
 }
 const a=turn(),s=new BlessingSession(a,4500);s.delivered(['live'],5000);s.receipt(s.id,'live','started',5500);
 s.remove('live',16000);assert.equal(a.speech.state,'ended');assert.equal(a.speech.bannerUntil,18500);
});
test('all seats reach the actual whisper anchor, hold 3.6 seconds, and return without position discontinuities',()=>{
 for(const seat of seatLayout())for(const kind of ['mushika','galaxy']){
  const duration=kind==='mushika'?14000:32000;let previous=specialPose(kind,0,seat,seat,{untilMs:duration});
  for(let ms=16;ms<=duration;ms+=16){
   const p=specialPose(kind,ms,seat,seat,{untilMs:duration});assert.ok(Number.isFinite(p.x+p.y));
   assert.ok(Math.hypot(p.x-previous.x,p.y-previous.y)<31,`${kind} discontinuity at ${ms}`);previous=p;
   const cam=specialCamera(kind,ms,duration);assert.ok(cam.scale>=1&&cam.scale<=1.71);
  }
  const end=specialPose(kind,duration,seat,seat,{untilMs:duration});assert.equal(end.x,seat.x);assert.equal(end.y,seat.y);
  assert.deepEqual(specialCamera(kind,duration,duration),{scale:1,x:0,y:0});
 }
 for(const ms of [4300,5000,7899]){const p=specialPose('mushika',ms,{x:540,y:1710},{x:540,y:1710},{untilMs:14000});assert.equal(p.phase,'whisper');assert.equal(p.x,WHISPER_PLACE.x);assert.equal(p.y,WHISPER_PLACE.y);}
});
test('FIFO cannot deadlock a full room whose later donors also have pending turns',()=>{
 const room=new Room({}, {ambient:false,now:0});
 for(let i=0;i<60;i++)room.join('seated'+i,'Seated',{now:0});
 room.join('first','Waiting first',{now:30000});room.rituals.enqueue({id:'first',name:'Waiting first',count:1,ritual:RITUALS.mushika},30000);
 for(let i=0;i<60;i++)room.rituals.enqueue({id:'seated'+i,name:'Seated',count:1,ritual:RITUALS.lotus},30001+i);
 room.advance(30000);assert.equal(room.rituals.active,null);
 room.advance(30000+EXIT_MS);room.advance(30000+EXIT_MS+ENTRY_MS);
 assert.equal(room.rituals.active.id,'first');assert.equal(room.rituals.pending.length,60);
 const saved=JSON.parse(JSON.stringify(room.serialize())),restored=new Room(saved,{ambient:false,now:50000});
 assert.equal(restored.rituals.pending.length,61);restored.advance(50000);assert.equal(restored.rituals.active.id,'first');
});
test('restart removes previous voice timestamps and honours a disabled background crowd',()=>{
 const room=new Room({}, {now:0});room.rituals.enqueue({id:'u',count:1,ritual:RITUALS.galaxy},0);
 const active=room.rituals.tick(0);active.speech={id:'old',state:'playing',startedAt:1000,bannerUntil:null};
 const restored=new Room(JSON.parse(JSON.stringify(room.serialize())),{ambient:false,now:20000});
 assert.equal(restored.seating.summary().ambient,0);assert.equal(restored.rituals.pending[0].speech,undefined);
 assert.equal(restored.rituals.pending[0].beganAt,undefined);
});
