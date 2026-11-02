import { test } from 'node:test';
import assert from 'node:assert/strict';
import { actorGeometry, actorHeight } from '../actor-geometry.js';
import { seatLayout } from '../seating.js';
import { processionPose } from '../procession.js';
import { specialPose, MUSHIKA, WHISPER_PLACE } from '../special-rituals.js';
import { RITUALS, giftRitual } from '../gift-rituals.mjs';
import { drawSmallGift } from '../small-gift-effect.js';
import { Nameplates } from '../nameplates.js';

test('ordinary and special ceremonies keep seated stature at each world position, including both handoffs', () => {
  for (const seat of seatLayout()) {
    const person = { id:'u', ...seat, seat, entryStart:null };
    const before = actorGeometry(person);
    for (const kind of ['marigold','royal','mushika','galaxy']) {
      const duration = RITUALS[kind].duration;
      const poseAt = ms => ['mushika','galaxy'].includes(kind)
        ? specialPose(kind, ms, seat, seat, {untilMs:duration}) : processionPose(kind, ms, seat, seat);
      assert.deepEqual(actorGeometry(person, poseAt(0)), before, kind + ' start');
      assert.deepEqual(actorGeometry(person, poseAt(duration)), before, kind + ' end');
      let previous = before;
      for (let ms=16; ms<=duration; ms+=16) {
        const pose=poseAt(ms), g=actorGeometry(person, pose);
        // Compare to an ordinary bystander standing at precisely the same depth.
        assert.deepEqual(g, actorGeometry({...person,x:pose.x,y:pose.y}));
        assert.ok(Math.abs(g.height-previous.height)<5, `${kind} size discontinuity at ${ms}`);
        previous=g;
      }
    }
  }
});
test('whisper moves the donor feet to the ear without enlarging the donor or changing Mushika',()=>{
  const h=actorHeight(WHISPER_PLACE.y);
  assert.ok(Math.abs(WHISPER_PLACE.x+.2544*h-MUSHIKA.earX)<1e-9);
  assert.ok(Math.abs(WHISPER_PLACE.y-.788*h-MUSHIKA.earY)<1e-9);
  assert.equal(MUSHIKA.width,260);assert.equal(MUSHIKA.earY,979);
});
test('one-coin gift only draws brief donor sparks clear of the mouse; it cannot select a special ritual',()=>{
  const arcs=[],pen={save(){},restore(){},beginPath(){},fill(){},arc(...a){arcs.push(a)}};
  for(const seat of seatLayout()) {
    for(const ms of [0,350,700,1399]) {
      const box=drawSmallGift(pen,seat,ms);
      assert.ok(box.y>MUSHIKA.y+MUSHIKA.height);
      assert.ok(arcs.every(([x,y,r])=>r<=2.5));
    }
    assert.equal(drawSmallGift(pen,seat,1400),null);
  }
  assert.equal(giftRitual('Rose',1,'5655').kind,'lotus');
  assert.equal(giftRitual('Corgi',1,'6267'),null);
  assert.equal(giftRitual('Galaxy',1,'11046'),null);
  assert.equal(giftRitual('Unknown one-coin gift',1,'999001'),null);
  assert.equal(giftRitual('Rose',1,'5655',{'5655':'galaxy'}),null);
  assert.equal(giftRitual('Corgi',299,'6267').kind,'mushika');
  assert.equal(giftRitual('Galaxy',1000,'11046').kind,'galaxy');
});
test('a focused donor name remains visible outside Mushika after removing the enlarged ceremony body',()=>{
  const names=new Nameplates(),draws=[];
  names.badge=()=>({width:140,height:48});
  names.add({id:'donor',name:'ศิริพร'},540,1210,230,true);
  const mouse={x:420,y:1140,w:240,h:180};
  const pen={drawImage:(im,x,y)=>draws.push({x,y,w:im.width,h:im.height}),beginPath(){},moveTo(){},lineTo(){},stroke(){}};
  assert.equal(names.draw(pen,{scale:1,x:0,y:0},[mouse]),1);
  assert.ok(draws[0].y+draws[0].h<mouse.y || draws[0].y>mouse.y+mouse.h);
});
