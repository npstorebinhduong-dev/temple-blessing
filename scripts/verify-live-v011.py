import asyncio,base64,json,time,argparse
from pathlib import Path
import websockets
from playwright.async_api import async_playwright
P=argparse.ArgumentParser();P.add_argument('--port',type=int,default=31944);P.add_argument('--fixture-port',type=int,default=31945);P.add_argument('--baseline',action='store_true');P.add_argument('--out',default='artifacts/v011/live');A=P.parse_args();OUT=Path(A.out);OUT.mkdir(parents=True,exist_ok=True)
HOOK='''window.trace=[];window.turns=[];window.messages=[];window.draws=[];window.lotusCalls=0;window.sockets=[];const W=WebSocket;window.WebSocket=class extends W{constructor(...a){super(...a);sockets.push(this);this.addEventListener('message',e=>{const m=JSON.parse(e.data);if(this.url.includes('role=overlay'))messages.push(m);if(m.t==='ritual'&&m.active&&!turns.some(t=>t.turn===m.active.turn))turns.push(m.active)});}};const draw=CanvasRenderingContext2D.prototype.drawImage,scale=CanvasRenderingContext2D.prototype.scale;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.id==='scene'&&a.length===5&&Math.abs(a[3]/a[4]-.75)<.001){const m=this.getTransform();draws.push({at:performance.now(),height:a[4],width:a[3],dx:a[1],dy:a[2],matrix:[m.a,m.b,m.c,m.d,m.e,m.f],frame:document.querySelector('#scene').dataset.rendered});}return draw.apply(this,a)};CanvasRenderingContext2D.prototype.scale=function(x,y){if(this.canvas.id==='scene'&&x===1.25&&y===1.25)lotusCalls++;return scale.call(this,x,y)};let seen=-1;function sample(){const e=document.querySelector('#scene'),w=document.querySelector('#world');if(e&&e.dataset.rendered&&+e.dataset.rendered!==seen){seen=+e.dataset.rendered;const m=e.getContext('2d').getTransform(),s=getComputedStyle(document.querySelector('.shrine')),b=document.querySelector('.shrine').getBoundingClientRect(),p=document.querySelector('#infoPanel').getBoundingClientRect();trace.push({at:performance.now(),...e.dataset,canvas:[m.a,m.d,m.e,m.f],world:getComputedStyle(w).transform,shrine:s.transform,origin:s.transformOrigin,bounds:[b.x,b.y,b.width,b.height],panel:[p.x,p.y,p.width,p.height],debug:window.__cameraDebug||null,lotusCalls});}requestAnimationFrame(sample)}requestAnimationFrame(sample);'''
async def record(pg,label):
 folder=OUT/label;folder.mkdir(exist_ok=True);frames=[];cdp=await pg.context.new_cdp_session(pg)
 async def onframe(e):
  name=f'{len(frames):05d}.jpg';(folder/name).write_bytes(base64.b64decode(e['data']));frames.append({'file':name,'stamp':e['metadata']['timestamp']});await cdp.send('Page.screencastFrameAck',{'sessionId':e['sessionId']})
 cdp.on('Page.screencastFrame',onframe);await cdp.send('Page.startScreencast',{'format':'jpeg','quality':76,'maxWidth':1080,'maxHeight':1920,'everyNthFrame':1})
 async def stop():
  await cdp.send('Page.stopScreencast');await pg.wait_for_timeout(100);await cdp.detach();lines=[]
  for i,f in enumerate(frames):lines += [f"file '{f['file']}'",f"duration {max(.016,frames[i+1]['stamp']-f['stamp']) if i+1<len(frames) else .1:.6f}"]
  if frames:lines.append(f"file '{frames[-1]['file']}'")
  (folder/'frames.txt').write_text('\n'.join(lines)+'\n');(folder/'timestamps.json').write_text(json.dumps(frames));return len(frames)
 return stop
async def main():
 peers=set();counter=0
 async def handler(ws):
  peers.add(ws)
  try:await ws.wait_closed()
  finally:peers.discard(ws)
 async with websockets.serve(handler,'127.0.0.1',A.fixture_port),async_playwright() as pw:
  async def event(kind,data):
   for ws in list(peers):await ws.send(json.dumps({'event':kind,'data':data}))
  async def gift(kind='lotus',uid='u1',count=1):
   nonlocal counter
   name,coins,gid={'lotus':('Rose',1,5655),'incense':('Peach',5,14786),'garland':('OK',5,999006),'aarti':('Shamrock',10,9875),'marigold':('Bouquet',100,10994),'royal':('Love Balloon',500,999500),'mushika':('Corgi',299,6267),'galaxy':('Galaxy',1000,11046),'light':('Perfume',20,5658)}[kind];counter+=1
   await event('gift',{'uniqueId':uid,'nickname':{'u1':'ศิริพร','u2':'สมชาย','u3':'นิดา','u4':'อรุณ'}[uid],'giftName':name,'diamondCount':coins,'giftId':gid,'repeatCount':count,'giftType':1,'repeatEnd':True,'msgId':f'camera-{counter}'})
  b=await pw.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']);pg=await b.new_page(viewport={'width':1080,'height':1920});await pg.add_init_script(HOOK);errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  await pg.goto(f'http://127.0.0.1:{A.port}/live/overlay.html?debugCamera=1');await pg.evaluate('document.fonts.ready');await pg.wait_for_function("document.querySelector('#scene').dataset.people!==undefined")
  await pg.evaluate(f"()=>{{window.ctl=new WebSocket('ws://127.0.0.1:{A.port}/ws?role=control');window.send=(cmd,data={{}})=>ctl.send(JSON.stringify({{t:'ctl',cmd,...data}}))}}")
  await pg.wait_for_function('ctl.readyState===1');await pg.evaluate("send('disconnect');send('live');send('reset');send('settings',{settings:{music:false,voiceEnabled:false,idlePrompts:false,cinematicZoom:true,petalMode:'light'}})");await pg.evaluate("d=>send('connect',d)",{'source':'tikfinity','url':f'ws://127.0.0.1:{A.fixture_port}/'})
  for _ in range(100):
   if peers:break
   await asyncio.sleep(.05)
  assert peers
  await pg.add_style_tag(content='#cameraDebug{display:none}')
  async def waitkind(k,timeout=30000):await pg.wait_for_function("k=>document.querySelector('#scene').dataset.ritualKind===k",arg=k,timeout=timeout,polling=50)
  await pg.wait_for_timeout(1000)
  for uid in ['u1','u2','u3','u4']:await event('chat',{'uniqueId':uid,'comment':'2' if uid in ['u2','u4'] else '1'})
  stop=await record(pg,'baseline-rose' if A.baseline else 'fixed-rose');await pg.wait_for_timeout(1000);await gift();await waitkind('lotus');await pg.wait_for_timeout(1700);await pg.screenshot(path=str(OUT/('baseline-rose.jpg' if A.baseline else 'fixed-rose.jpg')),type='jpeg');await waitkind('');await pg.wait_for_timeout(1000);await stop()
  stop=await record(pg,'baseline-procession' if A.baseline else 'fixed-procession');await pg.wait_for_timeout(1000);await gift('marigold');await waitkind('marigold');await pg.wait_for_function("document.querySelector('#scene').dataset.ceremonyPhase==='offer'",timeout=16000);await pg.screenshot(path=str(OUT/('baseline-procession.jpg' if A.baseline else 'fixed-procession.jpg')),type='jpeg');await waitkind('');await pg.wait_for_timeout(1000);await stop()
  # Continue through the production TikFinity intake, not control-panel demo gifts.
  for i in range(32):await event('member',{'uniqueId':f'waiting-{i}','nickname':f'ผู้ชม {i}'})
  sequence=[('royal','u2'),('incense','u3'),('mushika','u2'),('aarti','u1'),('galaxy','u3'),('light','u4'),('mushika','u1'),('lotus','u3'),('galaxy','u4')]+[('lotus',['u1','u1','u2','u3','u4'][i%5]) for i in range(13)]
  for kind,uid in sequence:await gift(kind,uid)
  print('QUEUED 24 total turns',flush=True)
  await waitkind('royal');await pg.wait_for_timeout(7600);await pg.screenshot(path=str(OUT/'royal.jpg'),type='jpeg')
  await waitkind('mushika',45000);stop=await record(pg,'fixed-mushika');await pg.wait_for_function("document.querySelector('#scene').dataset.ceremonyPhase==='whisper'",timeout=16000);await pg.screenshot(path=str(OUT/'mushika-whisper.jpg'),type='jpeg')
  await pg.wait_for_function("document.querySelector('#scene').dataset.transferPhase==='transfer' && +document.querySelector('#scene').dataset.transferProgress>.5",timeout=16000);await pg.screenshot(path=str(OUT/'mushika-transfer.jpg'),type='jpeg');await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind!=='mushika'",timeout=22000);await stop();print('MUSHIKA captured',flush=True)
  await waitkind('galaxy',35000);stop=await record(pg,'fixed-galaxy');await pg.wait_for_function("!document.querySelector('#blessingBanner').hidden",timeout=18000);await pg.screenshot(path=str(OUT/'galaxy.jpg'),type='jpeg');await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind!=='galaxy'",timeout=30000);await stop();print('GALAXY captured',flush=True)
  await pg.wait_for_function('turns.length===24',timeout=160000,polling=100);await waitkind('');await pg.wait_for_timeout(1000)
  trace=await pg.evaluate('trace');draws=await pg.evaluate('draws');turns=await pg.evaluate('turns');(OUT/'full-trace.json').write_text(json.dumps({'trace':trace,'draws':draws,'turns':turns},ensure_ascii=False))
  assert [t['ritual']['kind'] for t in turns]==['lotus','marigold']+[k for k,u in sequence]
  assert [t['id'] for t in turns]==['u1','u1']+[u for k,u in sequence]
  assert await pg.evaluate('lotusCalls')==0
  geometry=[];owners={};local=set();worlderrors=[];panels=set()
  for f in trace:
   d=f['debug']
   if not d:continue
   assert f['shrine']=='none'
   cam=d['world'];bounds=f['bounds'];worlderrors += [abs(bounds[0]-cam['x']),abs(bounds[1]-cam['y']),abs(bounds[2]-1080*cam['scale']),abs(bounds[3]-1920*cam['scale'])]
   r=float(f['rasterScale']);pad=float(f['rasterPadding']);assert abs(f['canvas'][0]-r)<1e-6 and abs(f['canvas'][1]-r)<1e-6 and abs(f['canvas'][2]-pad*r)+abs(f['canvas'][3])<1e-5
   for actor in d['actors']:local.add(actor['localScale']);assert abs(actor['height']-actor['perspectiveHeight'])<1e-6 or actor['entry']<1
   if d['owner']:owners.setdefault(d['owner'],[]).append(f)
   if d['smallGift']:assert d['smallGift']['x']>640 and d['smallGift']['w']<=56
   if d['kind'] in ['mushika','galaxy']:assert d['relative']['scale']==1
   panels.add(tuple(round(x,2) for x in f['panel'][:3]))
  assert max(worlderrors)<.1,max(worlderrors)
  assert len(owners)==24,len(owners);assert local=={1};assert all(18<=p[0]<=54 and 209<=p[1]<=211 and 239<=p[2]<=973 for p in panels),panels
  for t in turns:
   fs=[f for f in trace if f['debug'] and f['debug']['turn']==t['turn']]
   assert fs and all(f['debug']['focusId']==t['id'] for f in fs)
   if t['ritual']['kind'] not in ['mushika','galaxy']:assert max(f['debug']['relative']['scale'] for f in fs)>1.4
  final=await pg.evaluate('window.__cameraDebug');assert final['owner'] is None and final['world']=={'scale':.84,'x':86.4,'y':270}
  print('24 TURNS PASS',len(trace),'frames',flush=True)
  # Same-user burst normalization plus wrong-price protection through the source socket.
  before=len(turns)
  for gid,name in [(6267,'Corgi'),(11046,'Galaxy'),(999001,'Unknown one coin')]:await event('gift',{'uniqueId':'u1','giftName':name,'giftId':gid,'diamondCount':1,'repeatCount':1,'msgId':f'wrong-price-{gid}'})
  await pg.wait_for_timeout(300);assert await pg.evaluate('turns.length')==before
  failures={}
  await gift('aarti');await pg.wait_for_function("+document.querySelector('#scene').dataset.zoom>1.5")
  await pg.evaluate("send('disconnect');send('reset')");await pg.wait_for_timeout(500);failures['reset']=await pg.evaluate('window.__cameraDebug');assert failures['reset']['owner'] is None and failures['reset']['world']=={'scale':.84,'x':86.4,'y':270}
  await pg.evaluate("d=>send('connect',d)",{'source':'tikfinity','url':f'ws://127.0.0.1:{A.fixture_port}/'});await pg.wait_for_timeout(500)
  await gift('aarti');await pg.wait_for_function("+document.querySelector('#scene').dataset.zoom>1.5",timeout=25000)
  await pg.evaluate("()=>{sockets.find(s=>s.url.includes('role=overlay')).dispatchEvent(new MessageEvent('message',{data:JSON.stringify({t:'leave',id:'u1'})}))}")
  await pg.wait_for_timeout(500);failures['missingTarget']=await pg.evaluate('window.__cameraDebug');assert failures['missingTarget']['owner'] is None and failures['missingTarget']['world']=={'scale':.84,'x':86.4,'y':270}
  await pg.wait_for_timeout(700);assert (await pg.evaluate('window.__cameraDebug'))['owner'] is None
  await pg.evaluate("send('clear')");await pg.wait_for_timeout(400)
  await gift('aarti','u2');await pg.wait_for_function("+document.querySelector('#scene').dataset.zoom>1.5",timeout=25000)
  await pg.evaluate("()=>{const original=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(...a){if(this.canvas.id==='scene'){CanvasRenderingContext2D.prototype.drawImage=original;throw new Error('Injected draw failure')}return original.apply(this,a)}}")
  await pg.wait_for_timeout(500);failures['renderError']=await pg.evaluate('window.__cameraDebug');assert failures['renderError']['owner'] is None and failures['renderError']['world']=={'scale':.84,'x':86.4,'y':270}
  await pg.evaluate("send('disconnect');send('reset')");assert not errors,errors
  (OUT/'result.json').write_text(json.dumps({'version':'0.11','input':'TikFinity-compatible WebSocket → production connectTikFinity/createEventHandler/onGift → server FIFO → overlay; no demo override','viewport':[1080,1920],'turns':[{'kind':t['ritual']['kind'],'id':t['id'],'turn':t['turn']} for t in turns],'frames':len(trace),'worldBoundsMaxErrorPx':max(worlderrors),'localScales':sorted(local),'largeLotusCalls':0,'smallLotusWorldBounds':{'x':690,'y':1128,'w':56,'h':34},'final':final,'failures':failures,'pageErrors':errors},ensure_ascii=False,indent=2));print('FULL PASS',flush=True)
  report={'errors':errors,'turns':await pg.evaluate('turns'),'lotusCalls':await pg.evaluate('lotusCalls'),'trace':await pg.evaluate('trace'),'draws':await pg.evaluate('draws')}
  (OUT/('baseline.json' if A.baseline else 'first-fixed.json')).write_text(json.dumps(report,ensure_ascii=False));print('BASELINE' if A.baseline else 'FIRST FIXED','DONE',len(report['trace']),'frames',report['lotusCalls'],'large lotus calls',flush=True)
  await b.close()
if __name__=='__main__':asyncio.run(main())
