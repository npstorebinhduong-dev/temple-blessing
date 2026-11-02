import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CameraController } from '../camera-controller.js';
import { SCENE_VIEW, sceneCamera } from '../scene-layout.js';
const reference = JSON.parse(readFileSync(new URL('./fixtures/camera-v08.json', import.meta.url)));
const target = { id:'donor', x:540, y:1420, seat:{x:540,y:1420} };
const turn = (kind='lotus',n=1) => ({id:'donor',turn:`turn-${n}`,beganAt:1000,until:100000,ritual:{kind}});

test('all legacy gift camera samples match the actual v0.8 reference under the current viewport',()=>{
 for(const r of reference.rows){
  const c=new CameraController(),a={...turn(r.kind),until:1000+r.duration};
  assert.ok(c.accept(a,target));
  assert.deepEqual(c.sample(a,1000+r.elapsed,r.pose),sceneCamera(r.camera));
  assert.deepEqual(c.relative,r.camera);
 }
});
test('40 alternating turns restore the exact saved viewport with one owner and no accumulated zoom',()=>{
 const base={scale:.84,x:86.4,y:270},c=new CameraController(base);
 for(let i=1;i<=40;i++){
  const a=turn(i%3===0?'galaxy':i%3===1?'lotus':'mushika',i);
  assert.ok(c.accept(a,target));const owner=c.owner;
  for(let j=1;j<=50;j++){c.sample(a,1000+j*20,target);assert.equal(c.owner,owner);assert.equal(c.target,'donor');}
  if(a.ritual.kind!=='lotus')assert.deepEqual(c.current,base);
  c.accept(null,null);assert.equal(c.owner,null);assert.deepEqual(c.current,base);assert.deepEqual(c.relative,{scale:1,x:0,y:0});
 }
});
test('target loss, invalid coordinates, reset and cancellation release the camera; new target waits for admission',()=>{
 const c=new CameraController(),a=turn();assert.equal(c.accept(a,null),false);assert.deepEqual(c.current,SCENE_VIEW);
 assert.ok(c.accept(a,target));c.sample(a,2500,target);assert.notEqual(c.current.scale,SCENE_VIEW.scale);
 assert.equal(c.accept(a,null),false);assert.deepEqual(c.current,SCENE_VIEW);assert.equal(c.owner,null);
 assert.equal(c.accept(a,target),false,'a cancelled turn cannot reacquire the camera');
 const next=turn('aarti',2);assert.ok(c.accept(next,target));c.sample(next,3000,target);assert.deepEqual(c.reset(),SCENE_VIEW);
 assert.ok(c.accept(next,target));assert.deepEqual(c.sample(next,3000,{x:NaN,y:10}),SCENE_VIEW);assert.equal(c.reason,'invalid-focus');
 const final=turn('royal',3);assert.ok(c.accept(final,target));c.sample(final,8000,target);assert.deepEqual(c.cancel('render-error'),SCENE_VIEW);
 assert.equal(c.accept(final,target),false);c.accept(null,null);assert.ok(c.accept(turn('lotus',4),target));
});
