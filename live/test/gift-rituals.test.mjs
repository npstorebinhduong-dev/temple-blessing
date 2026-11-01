import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { giftRitual } from '../gift-rituals.mjs';
import { createEventHandler } from '../tikfinity.mjs';

test('matches named gifts at their unit value, not accumulated coins', () => {
  for (const name of ['Bó hoa','BO HOA','Bouquet','Flower Bouquet']) assert.equal(giftRitual(name,100)?.kind,'incense');
  for (const name of ['Bong bóng tình yêu','Love Balloon','Love Balloons']) assert.equal(giftRitual(name,500)?.kind,'offering');
  for (const [name,value] of [['Hoa hồng',100],['Hoa hồng',500],['Bó hoa',500],['Love Balloon',100],['Bó hoa',1]]) assert.equal(giftRitual(name,value),null);
});

test('TikFinity final combo produces one ritual; duplicate final is ignored', () => {
  const result=[];
  const handler=createEventHandler({gift:(id,name,gift,count,value)=>result.push({count,ritual:giftRitual(gift,value)})});
  for (const repeatEnd of [false,false,true,true]) handler(JSON.stringify({event:'gift',data:{uniqueId:'an',giftName:'Bó hoa',diamondCount:100,repeatCount:5,giftType:1,repeatEnd,msgId:'same'}}));
  assert.equal(result.length,1); assert.equal(result[0].count,5); assert.equal(result[0].ritual.kind,'incense');
});

test('ceremonies queue, escape viewer names as text, and clear on reset', () => {
  const elements=Object.fromEntries(['.ritual-name','.ritual-label','.petal-rain'].map(k=>[k,{append(){},textContent:''}]));
  const root={querySelector:k=>elements[k],className:'',hidden:true,offsetWidth:1080};
  const context={window:{},document:{createElement:()=>({style:{}})}};
  vm.runInNewContext(readFileSync(new URL('../rituals.js',import.meta.url),'utf8'),context);
  const player=context.window.createRitualPlayer(root,{duration:12000});
  player.enqueue({name:'<img src=x>',ritual:giftRitual('Bó hoa',100)});
  player.enqueue({name:'Bình',ritual:giftRitual('Love Balloon',500)});
  assert.equal(root.className,'ritual-incense'); assert.equal(elements['.ritual-name'].textContent,'<img src=x>');
  player.tick(11999); assert.equal(root.className,'ritual-incense');
  player.tick(1); assert.equal(root.className,'ritual-offering'); assert.equal(elements['.ritual-name'].textContent,'Bình');
  player.tick(12000); assert.equal(root.hidden,true);
  player.enqueue({name:'An',ritual:giftRitual('Bó hoa',100)}); player.clear(); player.tick(12000); assert.equal(root.hidden,true);
});
