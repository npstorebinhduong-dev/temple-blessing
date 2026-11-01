import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import WebSocket, { WebSocketServer } from 'ws';
import { createEventHandler, connectTikFinity } from '../tikfinity.mjs';

const sleep = ms => new Promise(r => setTimeout(r, ms));
async function until(fn) { for (let i=0;i<100;i++) { if (fn()) return; await sleep(50); } throw Error('Timeout'); }

test('normalizes events, counts final streak once and rejects malformed data', () => {
  const calls = [];
  const handle = createEventHandler(Object.fromEntries(['chat','gift','member','like'].map(k => [k, (...args) => calls.push([k,...args])])));
  for (const raw of ['bad', 'null', '{}', '{"event":"chat","data":{}}']) handle(raw);
  const gift = {event:'gift',data:{uniqueId:'an',nickname:'An',msgId:'1',giftType:1,repeatCount:3,diamondCount:5}};
  handle(JSON.stringify(gift)); assert.equal(calls.length,0);
  gift.data.repeatEnd=true; handle(JSON.stringify(gift)); handle(JSON.stringify(gift));
  assert.deepEqual(calls[0],['gift','an','An','quà',3,5,'']);
  handle(JSON.stringify({event:'chat',data:{uniqueId:'an',comment:'bình an'}}));
  handle(JSON.stringify({event:'member',data:{userId:'2'}}));
  handle(JSON.stringify({event:'like',data:{uniqueId:'an',likeCount:4}}));
  assert.equal(calls.length,4);
  // Another gift of the same type is a separate transaction.
  gift.data.msgId='2'; handle(JSON.stringify(gift)); assert.equal(calls.length,5);
});

test('reconnects after socket closure; manual disconnect stops retries', async t => {
  const wss = new WebSocketServer({host:'127.0.0.1',port:0}); await once(wss,'listening');
  let connections=0; wss.on('connection', () => connections++);
  const client=connectTikFinity({url:`ws://127.0.0.1:${wss.address().port}`,onEvent:()=>{},onState:()=>{},retryMs:30});
  t.after(() => { client.disconnect(); for (const s of wss.clients) s.terminate(); wss.close(); });
  await until(()=>connections===1); for (const s of wss.clients) s.close();
  await until(()=>connections===2); client.disconnect(); await sleep(120); assert.equal(connections,2);
  assert.throws(()=>connectTikFinity({url:'ws://example.com',onEvent:()=>{},onState:()=>{}}));
});

test('server serves UI and forwards TikFinity chat/likes to overlay', async t => {
  const wss=new WebSocketServer({host:'127.0.0.1',port:0}); await once(wss,'listening');
  const child=spawn(process.execPath,['server.mjs'],{cwd:new URL('..',import.meta.url),env:{...process.env,PORT:'31876'},stdio:'pipe'});
  t.after(()=>{child.kill(); for(const s of wss.clients)s.terminate(); wss.close();});
  let ready=false; child.stdout.on('data',()=>ready=true); await until(()=>ready);
  const response=await fetch('http://127.0.0.1:31876/'); assert.equal(response.status,200); assert.match(await response.text(),/TikFinity Desktop/);
  assert.equal((await fetch('http://127.0.0.1:31876/live/server.mjs')).status,404);
  const overlay=new WebSocket('ws://127.0.0.1:31876/ws?role=overlay'); const messages=[]; overlay.on('message',b=>messages.push(JSON.parse(b))); await once(overlay,'open');
  const control=new WebSocket('ws://127.0.0.1:31876/ws?role=control'); await once(control,'open');
  t.after(()=>{overlay.terminate();control.terminate();});
  const incoming=once(wss,'connection');
  control.send(JSON.stringify({t:'ctl',cmd:'connect',source:'tikfinity',url:`ws://127.0.0.1:${wss.address().port}/`}));
  const [source]=await incoming;
  source.send(JSON.stringify({event:'chat',data:{uniqueId:'tester',nickname:'Minh An',comment:'bình an'}}));
  source.send(JSON.stringify({event:'like',data:{uniqueId:'tester',likeCount:5}}));
  await until(()=>messages.some(m=>m.t==='chat') && messages.some(m=>m.t==='like'));
  assert.equal(messages.find(m=>m.t==='join').v.name,'Minh An');
  assert.equal(messages.find(m=>m.t==='chat').text,'bình an');
  assert.equal(messages.find(m=>m.t==='like').n,5);
  control.send(JSON.stringify({t:'ctl',cmd:'disconnect'}));
  await until(()=>messages.some(m=>m.t==='tiktok' && m.status==='idle'));
});
