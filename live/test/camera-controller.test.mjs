import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CameraController,AISLE_CAMERA} from '../camera-controller.js';
import {SCENE_VIEW,sceneCamera} from '../scene-layout.js';
const reference=JSON.parse(readFileSync(new URL('./fixtures/camera-v08.json',import.meta.url)));
const target={id:'donor',x:540,y:1420,seat:{x:540,y:1420}};
const turn=(kind='lotus',n=1)=>({id:'donor',turn:`turn-${n}`,beganAt:1000,until:11000,ritual:{kind}});
test('premium legacy curves match the actual v0.8 samples exactly; special shots retain the overview',()=>{
 for(const r of reference.rows.filter(r=>['marigold','royal'].includes(r.kind))){
  const c=new CameraController(),a={...turn(r.kind),until:1000+r.duration};
  assert.ok(c.accept(a,target));assert.deepEqual(c.sample(a,1000+r.elapsed,r.pose),sceneCamera(r.camera));
 }
 for(const kind of ['mushika','galaxy']){const c=new CameraController(),a=turn(kind);c.accept(a,target);assert.deepEqual(c.sample(a,5000,target),SCENE_VIEW);}
});
test('receipt starts the next-frame aisle movement before any target exists, reaches it in 350ms, and holds 20 turns without retweening',()=>{
 const c=new CameraController();c.notifySmall('donor',1000);
 assert.ok(c.sample(null,1016,null).scale>SCENE_VIEW.scale);assert.deepEqual(c.sample(null,1350,null),sceneCamera(AISLE_CAMERA));
 c.queue(20);
 for(let i=0;i<20;i++){
  const now=1500+i*10000,a={...turn('lotus',i),beganAt:now,until:now+10000};
  c.notifySmall('donor',now);assert.ok(c.accept(a,target));
  for(const t of [now,now+100,now+9999])assert.deepEqual(c.sample(a,t,target),sceneCamera(AISLE_CAMERA));
  assert.equal(c.owner,'aisle');assert.equal(c.transition,null);
 }
 c.queue(0);c.sample(null,202000,null);c.sample(null,202350,null);assert.deepEqual(c.sample(null,202700,null),SCENE_VIEW);assert.equal(c.owner,null);
});
test('small gifts wait for a premium owner, transition directly afterward, and reset cancels every lease',()=>{
 const c=new CameraController(),a={...turn('galaxy'),until:21000};c.accept(a,target);
 c.sample(a,1000,target);c.notifySmall('next',2000);c.queue(1);
 assert.deepEqual(c.sample(a,9000,target),SCENE_VIEW);assert.equal(c.owner,'turn-1:1000');
 c.sample(null,21000,null);assert.equal(c.owner,'aisle');assert.deepEqual(c.sample(null,21350,null),sceneCamera(AISLE_CAMERA));
 assert.deepEqual(c.reset(),SCENE_VIEW);assert.deepEqual(c.sample(null,21400,null),SCENE_VIEW);assert.equal(c.pending,0);
});
test('lost target and render cancellation cannot reacquire a cancelled turn or accumulate viewport offsets',()=>{
 const c=new CameraController(),a=turn();c.notifySmall(a.id,1000);c.accept(a,target);c.sample(a,1400,target);
 assert.equal(c.accept(a,null),false);assert.deepEqual(c.current,SCENE_VIEW);assert.equal(c.accept(a,target),false);
 c.sample(null,1450,null);assert.deepEqual(c.current,SCENE_VIEW);
 c.reset();const next=turn('royal',2);c.accept(next,target);assert.deepEqual(c.sample(next,3000,{x:NaN,y:10}),SCENE_VIEW);
 for(let i=0;i<40;i++){c.reset();c.notifySmall('donor',i*1000);c.sample(null,i*1000+350,null);assert.deepEqual(c.current,sceneCamera(AISLE_CAMERA));assert.deepEqual(c.reset(),SCENE_VIEW);}
});
