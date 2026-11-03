import { test } from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, readdirSync, copyFileSync, readFileSync, writeFileSync, symlinkSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import WebSocket from 'ws';
import { GANESHA_BLESSING } from '../blessing-session.js';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function until(fn){for(let i=0;i<100;i++){const x=fn();if(x)return x;await sleep(35);}throw new Error('Missing ceremony event');}

test('real server holds Galaxy for actual voice, uses Thai Niwat/text once, preserves FIFO, caches speech and cancels cleanly',async t=>{
 const root=mkdtempSync(path.join(tmpdir(),'ganesha-special-')),live=path.join(root,'live'),source=fileURLToPath(new URL('..',import.meta.url));mkdirSync(live);
 for(const f of readdirSync(source))if(/\.(mjs|js|json)$/.test(f))copyFileSync(path.join(source,f),path.join(live,f));
 symlinkSync(path.join(source,'node_modules'),path.join(live,'node_modules'),'junction');
 const clockFile=path.join(root,'clock.txt'),clockModule=path.join(root,'clock.mjs'),records=path.join(root,'speech.jsonl');writeFileSync(clockFile,'0');
 writeFileSync(clockModule,`import {readFileSync} from 'node:fs';Date.now=()=>Number(readFileSync(${JSON.stringify(clockFile)},'utf8'));`);
 writeFileSync(path.join(live,'fake-edge.mjs'),`import {Readable} from 'node:stream';import {appendFileSync} from 'node:fs';export const OUTPUT_FORMAT={};export class MsEdgeTTS {async setMetadata(voice){this.voice=voice;}toStream(text,options){if(text==='offline test')throw new Error('offline test');appendFileSync(${JSON.stringify(records)},JSON.stringify({voice:this.voice,text,options})+'\\n');return {audioStream:Readable.from([Buffer.alloc(1200)])};}close(){}}`);
 const file=path.join(live,'server.mjs');writeFileSync(file,readFileSync(file,'utf8').replace("from 'msedge-tts'","from './fake-edge.mjs'"));
 const child=spawn(process.execPath,['--import',pathToFileURL(clockModule).href,'server.mjs'],{cwd:live,env:{...process.env,PORT:'31880',GANESHA_DATA_DIR:path.join(root,'data'),GANESHA_OFFLINE_AUDIO:'0'},stdio:'pipe'});
 const sockets=[];let ready=false,errors='';child.stdout.on('data',()=>ready=true);child.stderr.on('data',b=>errors+=b);
 t.after(async()=>{for(const ws of sockets)ws.terminate();if(child.exitCode===null){const ended=once(child,'exit');child.kill();await ended;}rmSync(root,{recursive:true,force:true});});
 await until(()=>{if(child.exitCode!==null)throw new Error(errors);return ready;});
 async function client(role){const ws=new WebSocket(`ws://127.0.0.1:31880/ws?role=${role}`),messages=[];sockets.push(ws);ws.on('message',b=>messages.push(JSON.parse(b)));await once(ws,'open');return {ws,messages,send:m=>ws.send(JSON.stringify(m))};}
 const control=await client('control'),liveWindow=await client('overlay'),preview=await client('overlay&preview=1');
 const ctl=(cmd,extra={})=>control.send({t:'ctl',cmd,...extra}),status=(id='',state='ready')=>liveWindow.send({t:'speech-status',ready:true,id,state});
 const at=async time=>{writeFileSync(clockFile,String(time));await sleep(350);};
 const speech=()=>liveWindow.messages.filter(m=>m.t==='tts'&&m.tag==='blessing');
 status();preview.send({t:'speech-status',ready:true});ctl('settings',{settings:{idlePrompts:false}});await sleep(100);
 ctl('gift',{name:'ศิริพร',kind:'galaxy',diamonds:1000,count:2});await until(()=>liveWindow.messages.find(m=>m.t==='gift'));
 await at(8000);await until(()=>liveWindow.messages.find(m=>m.t==='ritual'&&m.active?.ritual.kind==='galaxy'));
 await at(12500);const first=await until(()=>speech()[0]);assert.equal(preview.messages.some(m=>m.t==='tts'),false);
 const recorded=readFileSync(records,'utf8').trim().split('\n').map(JSON.parse);
 assert.equal(recorded[0].voice,'th-TH-NiwatNeural');assert.equal(recorded[0].text,GANESHA_BLESSING);assert.equal(recorded[0].options.rate,'-12%');
 await at(15000);status(first.id,'started');await sleep(80);
 const progress=await until(()=>liveWindow.messages.find(m=>m.t==='ritual-progress'&&m.active.speech?.state==='playing'));
 assert.equal(progress.active.speech.text,GANESHA_BLESSING);assert.equal(progress.active.speech.startedAt,15000);
 ctl('gift',{name:'ศิริพร',kind:'mushika',diamonds:299,count:1});await sleep(80);
 await at(40000);assert.equal(liveWindow.messages.filter(m=>m.t==='ritual'&&m.active).length,1,'ordinary 20-second timer cannot interrupt a speaking donor');
 status(first.id,'ended');await sleep(80);
 const end=await until(()=>liveWindow.messages.find(m=>m.t==='ritual-progress'&&m.active.speech?.state==='ended'));
 assert.equal(end.active.speech.bannerUntil,42500);assert.equal(end.active.until,45500);
 await at(45499);assert.equal(liveWindow.messages.filter(m=>m.t==='ritual'&&m.active).length,1);
 await at(45500);const second=await until(()=>liveWindow.messages.find(m=>m.t==='ritual'&&m.active?.ritual.kind==='mushika'));
 assert.equal(second.active.count,1);assert.equal(second.active.id,progress.active.id);
 ctl('gift',{name:'ศิริพร',kind:'galaxy',diamonds:1000,count:1});await at(61500);await at(66000);const replay=await until(()=>speech()[1]);
 assert.notEqual(replay.id,first.id);assert.equal(replay.url,first.url,'same sentence/voice uses cached asset');
 assert.equal(readFileSync(records,'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.voice==='th-TH-NiwatNeural').length,1);
 ctl('clear');await until(()=>liveWindow.messages.some(m=>m.t==='state'&&m.stats.coins===3299&&m.active===null));
 status(replay.id,'ended');await at(80000);
 const snapshot=liveWindow.messages.filter(m=>m.t==='state').at(-1);assert.equal(snapshot.active,null);assert.equal(snapshot.seating.rituals,0);
 // A network failure must not suppress the bundled Galaxy sentence during
 // the 30-second retry cooldown. This server test uses fixture MP3 bytes;
 // browser verification separately decodes/plays the actual bundled audio.
 const audioDir=path.join(root,'assets','ganesha','audio');mkdirSync(audioDir,{recursive:true});
 writeFileSync(path.join(audioDir,'ganesha-blessing-th.mp3'),Buffer.alloc(1200));
 ctl('say',{text:'offline test'});await until(()=>control.messages.some(m=>m.t==='log'&&m.line.includes('offline test')));
 const count=speech().length;ctl('gift',{name:'ศิริพร',kind:'galaxy',diamonds:1000,count:1});
 await sleep(100);await at(88000);await at(92500);
 const offline=await until(()=>speech()[count]);assert.equal(offline.tag,'blessing');
 assert.equal(readFileSync(records,'utf8').trim().split('\n').map(JSON.parse).filter(r=>r.voice==='th-TH-NiwatNeural').length,1);
 ctl('clear');await sleep(100);
 assert.equal(errors,'');
});
