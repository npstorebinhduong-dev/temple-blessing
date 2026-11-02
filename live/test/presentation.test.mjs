import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mushikaLight, curvePoint, TRANSMISSION, RESPONSE, ORB, RECEIVER } from '../mushika-effect.js';
import { specialCamera, WHISPER_PLACE } from '../special-rituals.js';
import { SCENE_VIEW, STANDING_GANESHA, PANEL_BOUNDS, screenRect } from '../scene-layout.js';

test('Mushika sends one directional light path then a reply within its 16 second ceremony', () => {
  assert.deepEqual(curvePoint(TRANSMISSION,0),ORB);
  assert.deepEqual(curvePoint(TRANSMISSION,1),RECEIVER);
  assert.deepEqual(curvePoint(RESPONSE,0),RECEIVER);
  const foot=curvePoint(RESPONSE,1); assert.ok(Math.hypot(foot.x-WHISPER_PLACE.x,foot.y-WHISPER_PLACE.y)<20);
  assert.deepEqual([5000,8200,9400,10400,11200,11900,14000].map(t=>mushikaLight(t).phase),['whisper','gather','transfer','receive','reply','thanks','return']);
  let previous=-1;
  for(let ms=8600;ms<=10200;ms+=20){const v=mushikaLight(ms);assert.ok(v.progress>=previous);previous=v.progress;}
  assert.ok(Math.abs(previous-1)<1e-9); assert.equal(mushikaLight(11200).head,1);
  for(const kind of ['mushika','galaxy'])for(let ms=0;ms<=32000;ms+=40)assert.deepEqual(specialCamera(kind,ms,32000),{scale:1,x:0,y:0});
});

test('adjustable panel and standing figure stay inside broadcast safe regions', () => {
  assert.ok(PANEL_BOUNDS.maxX+PANEL_BOUNDS.width<=1080);
  assert.ok(PANEL_BOUNDS.maxY+PANEL_BOUNDS.height<540); // measured seated crown starts below 540
  const standing=screenRect({x:STANDING_GANESHA.x,y:STANDING_GANESHA.y,w:STANDING_GANESHA.height*2/3,h:STANDING_GANESHA.height});
  assert.ok(standing.x>=0); assert.ok(standing.y>PANEL_BOUNDS.maxY+PANEL_BOUNDS.height);
  assert.ok(standing.y+standing.h+22<1440); // lotus ends above blessing text
  assert.ok(standing.x+standing.w<750); // recipient stays visible at right
  assert.equal(Object.isFrozen(SCENE_VIEW),true);
});
