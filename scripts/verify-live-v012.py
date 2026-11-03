"""Real browser + production TikFinity socket; synthetic events, no paid LIVE."""
import asyncio,json,sys,importlib.util,time
from pathlib import Path
import websockets
from playwright.async_api import async_playwright
OUT=Path('artifacts/v012');OUT.mkdir(parents=True,exist_ok=True)
spec=importlib.util.spec_from_file_location('capture',Path(__file__).with_name('verify-live-v011.py'));capture=importlib.util.module_from_spec(spec)
saved=sys.argv;sys.argv=['capture','--out',str(OUT)];spec.loader.exec_module(capture);sys.argv=saved
PORT=31952;FIXTURE=31953
HOME={'scale':.84,'x':86.4,'y':270};AISLE={'scale':1.008,'x':-4.319999999999993,'y':24.72}
async def main():
 peers=set();counter=0;errors=[];results={};turnlog=[]
 async def handler(ws):
  peers.add(ws)
  try:await ws.wait_closed()
  finally:peers.discard(ws)
 async with websockets.serve(handler,'127.0.0.1',FIXTURE),async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
  pg=await browser.new_page(viewport={'width':1080,'height':1920});pg.on('pageerror',lambda e:errors.append(str(e)));await pg.add_init_script(capture.HOOK)
  await pg.goto(f'http://127.0.0.1:{PORT}/live/overlay.html?debugCamera=1');await pg.wait_for_function('window.__cameraDebug');await pg.add_style_tag(content='#cameraDebug,#unmute{display:none}')
  await pg.evaluate(f"()=>{{window.ctl=new WebSocket('ws://127.0.0.1:{PORT}/ws?role=control');window.send=(cmd,data={{}})=>ctl.send(JSON.stringify({{t:'ctl',cmd,...data}}))}}")
  await pg.wait_for_function('ctl.readyState===1')
  await pg.evaluate("send('disconnect');send('live');send('reset');send('settings',{settings:{music:false,voiceEnabled:false,idlePrompts:false,cinematicZoom:true,petalMode:'light',giftMap:'900101=lamp\\n900105=fragrance'}})")
  await pg.evaluate("d=>send('connect',d)",{'source':'tikfinity','url':f'ws://127.0.0.1:{FIXTURE}/'})
  for _ in range(100):
   if peers:break
   await asyncio.sleep(.05)
  assert peers
  # Visible receipt/frame timing on evidence only; never part of the app.
  await pg.evaluate("""()=>{const e=document.createElement('div');e.id='evidence';e.style='position:absolute;z-index:50;bottom:45px;left:12px;background:#08101de0;padding:10px;color:white;font:22px sans-serif';document.querySelector('#stage').append(e);function f(){const c=document.querySelector('#scene').dataset;e.textContent=c.giftReceivedAt?`รับของขวัญ ${c.giftReceivedKind} · ${Math.round(performance.now()-+c.giftReceivedAt)} ms · กล้อง ${(+c.cameraScale||0).toFixed(3)} · ${c.ceremonyPhase||'ภาพรวม'}`:'ก่อนรับของขวัญ';requestAnimationFrame(f)}f()}""")
  async def event(kind,data):
   for ws in list(peers):await ws.send(json.dumps({'event':kind,'data':data}))
  async def gift(kind,uid='u1',count=1):
   nonlocal counter
   name,coins,gid={'lotus':('Rose',1,5655),'lamp':('Fixture Lamp',1,900101),'fragrance':('Fixture Love Perfume',5,900105),'prayer':('Doughnut',30,5879),'incense':('Peach',5,14786),'marigold':('Bouquet',100,10994),'royal':('Love Balloon',500,999500),'mushika':('Corgi',299,6267),'galaxy':('Galaxy',1000,11046),'retired':('Shamrock',10,9875),'perfume':('Perfume',20,5658),'ok':('OK',5,999006),'unknown':('Unknown',1,999001)}[kind]
   counter+=1;await event('gift',{'uniqueId':uid,'nickname':{'u1':'ศิริพร','u2':'สมชาย','u3':'นิดา','u4':'อรุณ','u5':'น้ำฝน'}.get(uid,'ผู้ร่วมบูชา'),'giftName':name,'giftId':gid,'diamondCount':coins,'repeatCount':count,'giftType':1,'repeatEnd':True,'msgId':f'v012-{counter}'})
  async def kind(k,timeout=30000):await pg.wait_for_function("k=>document.querySelector('#scene').dataset.ritualKind===k",arg=k,timeout=timeout,polling=50)
  async def wide():await pg.wait_for_function("()=>window.__cameraDebug.owner===null&&window.__cameraDebug.world.scale===.84",timeout=40000,polling=50)
  await pg.wait_for_timeout(800)
  for uid in ['u1','u2','u3','u4','u5']:await event('chat',{'uniqueId':uid,'comment':'2' if uid in ['u2','u4'] else '1'})
  await pg.screenshot(path=str(OUT/'guide-1080.png'))
  for i,k in enumerate(['lotus','lamp','fragrance','prayer','incense']):
   stop=await capture.record(pg,'small-'+k);await pg.wait_for_timeout(500);start=await pg.evaluate('trace.length');await gift(k,'u'+str(i+1));await kind(k)
   if k=='prayer':
    await event('chat',{'uniqueId':'not-purchaser','comment':'ไม่ควรแสดง'})
    await event('chat',{'uniqueId':'u4','comment':'ขอให้ครอบครัวมีความสุข สุขภาพแข็งแรง'})
    await pg.wait_for_function("!document.querySelector('#prayerBanner').hidden")
   await pg.wait_for_function("document.querySelector('#scene').dataset.ceremonyPhase==='offer'",timeout=15000);await pg.screenshot(path=str(OUT/(k+'-offer.png')));await kind('');await wide();await pg.wait_for_timeout(500);await stop()
   rows=await pg.evaluate('n=>trace.slice(n)',start);received=next(float(f['giftReceivedAt'])for f in rows if f.get('giftReceivedKind')==k);moving=next(f for f in rows if f['at']>=received and float(f['cameraScale'])>.840001);settled=next(f for f in rows if f['at']>=received and abs(float(f['cameraScale'])-1.008)<1e-8)
   offer=next(f for f in rows if f.get('ceremonyPhase')=='offer')
   assert moving['at']-received<100,(k,moving['at']-received)
   assert 300<=settled['at']-received<500,(k,settled['at']-received)
   assert settled['at']<offer['at'];assert rows[-1]['debug']['world']==HOME
   results[k]={'receiptToFirstMovedFrameMs':moving['at']-received,'receiptToAisleMs':settled['at']-received,'receiptToOfferMs':offer['at']-received,'newDonor':True};print('SMALL',k,results[k],flush=True)
  # Ten consecutive gifts, alternating donors, without a single camera restart.
  start=await pg.evaluate('trace.length');before=await pg.evaluate('turns.length')
  sequence=['lotus','lamp','fragrance','incense','prayer']*2
  for i,k in enumerate(sequence):await gift(k,'u'+str(i%5+1))
  await pg.wait_for_function('n=>turns.length>=n',arg=before+10,timeout=120000,polling=100);await kind('');await wide()
  rows=await pg.evaluate('n=>trace.slice(n)',start);active=[f for f in rows if f['debug'] and f['debug']['kind'] in sequence and f['at']>float(f.get('giftReceivedAt')or 0)+500]
  assert active and all(abs(f['debug']['world']['scale']-AISLE['scale'])<1e-8 for f in active)
  assert all(f['debug']['owner']=='aisle' for f in active)
  results['burst']={'turns':10,'frames':len(rows),'stableAisleFrames':len(active),'donors':5};print('BURST PASS',flush=True)
  # Every premium kind retains the old shot; a small arrival cannot interrupt it.
  for k in ['marigold','royal','mushika','galaxy']:
   stop=await capture.record(pg,'large-'+k);start=await pg.evaluate('trace.length');await gift(k,'u1');await kind(k);await pg.wait_for_timeout(1500);await gift('lotus','u5')
   await pg.wait_for_timeout(5500);await pg.screenshot(path=str(OUT/(k+'-action.png')))
   await kind('lotus',40000);await pg.wait_for_function("document.querySelector('#scene').dataset.ceremonyPhase==='offer'",timeout=12000);await kind('');await wide();await stop()
   rows=await pg.evaluate('n=>trace.slice(n)',start);large=[f for f in rows if f['debug'] and f['debug']['kind']==k];small=[f for f in rows if f['debug'] and f['debug']['kind']=='lotus'];assert large and small
   assert all(f['debug']['owner']!='aisle' for f in large)
   if k in ['mushika','galaxy']:assert all(f['debug']['world']==HOME for f in large)
   else:assert abs(max(f['debug']['relative']['scale'] for f in large)-({'marigold':1.45,'royal':1.62}[k]))<1e-8
   assert small[0]['at']>large[-1]['at'];results[k]={'frames':len(large),'smallWaited':True,'lastWorld':rows[-1]['debug']['world']};print('LARGE',k,'PASS',flush=True)
  # Retired/unknown gifts count but never enter the ritual queue or camera.
  n=await pg.evaluate('turns.length');start=await pg.evaluate('messages.length')
  for k in ['retired','perfume','ok','unknown']:await gift(k)
  await pg.wait_for_timeout(1000);msgs=await pg.evaluate('n=>messages.slice(n)',start);unknown=[m for m in msgs if m.get('t')=='gift'];assert len(unknown)==4 and all(m['ritual'] is None for m in unknown);assert await pg.evaluate('turns.length')==n
  assert (await pg.evaluate('window.__cameraDebug'))['world']==HOME;results['unknown']={'events':4,'coins':sum(m['coins']for m in unknown),'noRitual':True}
  # Reset and missing target release both shot and waiting positions.
  await gift('lotus');await kind('lotus');await pg.wait_for_timeout(800);await pg.evaluate("send('clear')");await pg.wait_for_timeout(500);assert (await pg.evaluate('window.__cameraDebug'))['world']==HOME
  await gift('incense','u2');await kind('incense');await pg.wait_for_timeout(600)
  await pg.evaluate("()=>sockets.find(s=>s.url.includes('role=overlay')).dispatchEvent(new MessageEvent('message',{data:JSON.stringify({t:'leave',id:'u2'})}))")
  await pg.wait_for_timeout(400);assert (await pg.evaluate('window.__cameraDebug'))['world']==HOME
  await pg.evaluate("send('clear')");await pg.wait_for_timeout(400)
  data=await pg.evaluate('({trace,draws,turns,messages})');(OUT/'trace.json').write_text(json.dumps(data,ensure_ascii=False))
  scales=set();worlderrors=[];lotusbounds=[]
  for f in data['trace']:
   d=f['debug']
   if not d:continue
   c=d['world'];b=f['bounds'];worlderrors.extend([abs(b[0]-c['x']),abs(b[1]-c['y']),abs(b[2]-1080*c['scale']),abs(b[3]-1920*c['scale'])])
   if d['actor'] and d['kind']:scales.add(d['actor']['localScale'])
   if d['smallGift']:lotusbounds.append(d['smallGift']);assert d['smallGift']['x']>=690 and d['smallGift']['w']<=56
  (OUT/'errors.json').write_text(json.dumps(errors));assert scales=={1};assert max(worlderrors)<.1;assert lotusbounds;assert not errors,errors
  results.update({'environment':{'browser':browser.version,'viewport':[1080,1920],'renderer':'Chromium headless, software Vulkan SwiftShader','platform':'Linux, 4 CPU quota'},'input':'Synthetic TikFinity-compatible WebSocket through production intake. Lamp 900101 / Love Perfume 900105 are TEST-ONLY mappings, not verified TikTok IDs. No paid LIVE test.','frames':len(data['trace']),'turns':len(data['turns']),'localScales':sorted(scales),'worldBoundsMaxErrorPx':max(worlderrors),'smallLotusMaxWidth':max(r['w']for r in lotusbounds),'reset':True,'missingTarget':True,'errors':errors})
  (OUT/'result.json').write_text(json.dumps(results,ensure_ascii=False,indent=2));print('ALL PASS',results,flush=True)
  await browser.close()
asyncio.run(main())
