import asyncio,json,os,subprocess,tempfile
from pathlib import Path
from playwright.async_api import async_playwright
async def main():
 root=Path(__file__).resolve().parents[1];out=root/'artifacts/v012';data=Path(tempfile.mkdtemp(prefix='v012-extra-'))
 (data/'session.json').write_text(json.dumps({'version':7,'settings':{'giftMap':'5655=lotus\n9875=aarti\n42=garland\n5658=light\n90015=floral\n6267=mushika','giftCatalog':{'aarti':{'id':'9875'},'light':{'id':'5658'}},'voiceEnabled':False,'music':False,'idlePrompts':False},'live':{'stats':{'coins':100,'gifts':4}}}))
 env={**os.environ,'PORT':'31954','GANESHA_DATA_DIR':str(data)};server=subprocess.Popen(['node','server.mjs'],cwd=root/'live',env=env,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
 try:
  await asyncio.sleep(1)
  async with async_playwright() as p:
   b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);pg=await b.new_page(viewport={'width':1080,'height':1920});errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
   await pg.add_init_script("""window.traceFrames=[];window.events=[];const W=WebSocket;window.WebSocket=class extends W{constructor(...a){super(...a);this.addEventListener('message',e=>{const m=JSON.parse(e.data);events.push(m);});}};let seen=0;function f(){const c=document.querySelector('#scene');if(c&&+c.dataset.rendered!==seen&&window.__cameraDebug){seen=+c.dataset.rendered;traceFrames.push({at:performance.now(),...c.dataset,debug:window.__cameraDebug});}requestAnimationFrame(f)}requestAnimationFrame(f)""")
   await pg.goto('http://127.0.0.1:31954/live/overlay.html?debugCamera=1');await pg.wait_for_function('window.__cameraDebug');await pg.add_style_tag(content='#cameraDebug,#unmute{display:none}')
   await pg.evaluate("()=>{window.ctl=new WebSocket('ws://127.0.0.1:31954/ws?role=control');window.send=(cmd,data={})=>ctl.send(JSON.stringify({t:'ctl',cmd,...data}))}");await pg.wait_for_function('ctl.readyState===1');await pg.wait_for_timeout(500)
   state=await pg.evaluate("events.find(m=>m.t==='state')");assert state['settings']['giftMap']=='5655=lotus\n6267=mushika';assert state['settings']['giftCatalog']=={}
   assert await pg.locator('#giftGrid .guide-gift').count()==9
   assert await pg.locator('#giftGrid .unconfigured').count()==2
   await pg.evaluate("send('live')");await pg.wait_for_timeout(200);assert (await pg.evaluate("events.filter(m=>m.t==='state').at(-1)"))['stats']['coins']==100
   await pg.evaluate("send('demo');send('gift',{kind:'lotus',name:'น้ำฝน'})");await pg.wait_for_timeout(1000)
   rows=await pg.evaluate('traceFrames');receipt=next(f for f in rows if f.get('giftReceivedKind')=='lotus');base=int(receipt['giftReceivedFrame']);nextf=next(f for f in rows if int(f['rendered'])>base and f.get('giftReceivedKind')=='lotus');assert float(nextf['cameraScale'])>.84
   timing={'receiptFrame':base,'firstCameraFrame':int(nextf['rendered']),'latencyMs':nextf['at']-float(nextf['giftReceivedAt'])};assert timing['firstCameraFrame']==base+1,timing
   await pg.evaluate("send('clear')");await pg.wait_for_timeout(400);rows=await pg.evaluate('traceFrames')
   assert all(abs(float(f['cameraScale'])-f['debug']['world']['scale'])<1e-8 for f in rows),'debug reset mismatch'
   # Multiple entirely NEW donors during a big shot must stay out of the aisle.
   await pg.evaluate("send('gift',{kind:'mushika',name:'มาลี'})");await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='mushika'",timeout=15000)
   for i,k in enumerate(['lotus','lamp','fragrance','prayer','incense']):await pg.evaluate("d=>send('gift',d)",{'kind':k,'name':'ผู้ร่วมบูชา '+str(i)})
   await pg.wait_for_timeout(1000);dbg=await pg.evaluate('window.__cameraDebug');assert dbg['kind']=='mushika';assert not any(a['id'].startswith('sim_ผู้ร่วมบูชา')for a in dbg['actors'])
   await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='lotus'",timeout=20000)
   await pg.wait_for_function("document.querySelector('#scene').dataset.ceremonyPhase==='offer'",timeout=10000);dbg=await pg.evaluate('window.__cameraDebug');assert dbg['focusId']=='sim_ผู้ร่วมบูชา 0';assert len([a for a in dbg['actors']if a['id'].startswith('sim_ผู้ร่วมบูชา')])==1
   await pg.screenshot(path=str(out/'new-donors-aisle.png'));await pg.evaluate("send('clear')");await pg.wait_for_timeout(500);assert (await pg.evaluate('window.__cameraDebug'))['owner'] is None
   # No-comment Donut returns to overview before its 30s prayer deadline.
   await pg.evaluate("send('gift',{kind:'prayer',name:'ศิริพร'})");await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='prayer'");await pg.wait_for_timeout(11500);assert (await pg.evaluate('window.__cameraDebug'))['world']=={'scale':.84,'x':86.4,'y':270}
   await pg.wait_for_function("!document.querySelector('#prayerBanner').hidden",timeout=22000);assert (await pg.evaluate('window.__cameraDebug'))['owner'] is None
   prayer=await pg.locator('#prayerText').inner_text();assert 'ขอให้มีสติ' in prayer
   await pg.screenshot(path=str(out/'donut-default-overview.png'))
   control=await b.new_page();await control.goto('http://127.0.0.1:31954/live/control.html');await control.wait_for_timeout(700);assert await control.locator('#demoGifts button').count()==9
   # Mobile rendering, not a resized screenshot.
   await pg.set_viewport_size({'width':360,'height':640});await pg.wait_for_timeout(600);await pg.screenshot(path=str(out/'mobile-360.png'))
   assert not errors,errors
   result={'migration':True,'guideSlots':9,'demoButtons':9,'unverifiedSlots':2,'nextFrame':timing,'debugResetConsistent':True,'newDonorsDuringLarge':5,'simultaneousNewDonorsInAisle':1,'prayerNoCommentCameraReleasedBeforeDeadline':True,'defaultPrayer':prayer,'errors':errors,'browser':b.version}
   (out/'extra-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False),flush=True);await b.close()
 finally:
  server.terminate();server.wait(timeout=10)
asyncio.run(main())
