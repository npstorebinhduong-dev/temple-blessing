import asyncio,sys,importlib.util,json
from pathlib import Path
from playwright.async_api import async_playwright
root=Path(__file__).resolve().parents[1];spec=importlib.util.spec_from_file_location('capture',root/'scripts/verify-live-v011.py');capture=importlib.util.module_from_spec(spec);sys.argv=['capture','--out',str(root/'artifacts/v012')];spec.loader.exec_module(capture)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage']);pg=await b.new_page(viewport={'width':1080,'height':1920});await pg.add_init_script(capture.HOOK.replace("panel:[p.x,p.y,p.width,p.height]", "panel:[p.x,p.y,p.width,p.height],panelTextVisible:getComputedStyle(document.querySelector('#infoPanel .panel-grid')).visibility!=='hidden'"));errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  await pg.goto('http://127.0.0.1:31952/live/overlay.html?debugCamera=1');await pg.wait_for_function('window.__cameraDebug');await pg.add_style_tag(content='#cameraDebug,#unmute{display:none}')
  await pg.evaluate("()=>{window.ctl=new WebSocket('ws://127.0.0.1:31952/ws?role=control');window.send=(cmd,data={})=>ctl.send(JSON.stringify({t:'ctl',cmd,...data}))}");await pg.wait_for_function('ctl.readyState===1');await pg.evaluate("send('demo');send('settings',{settings:{giftMap:'',giftCatalog:{},voiceEnabled:false,music:false,idlePrompts:false}})");await pg.wait_for_timeout(800)
  await pg.evaluate("""()=>{const e=document.createElement('div');e.style='position:absolute;z-index:50;bottom:32px;left:12px;background:#08101de0;padding:10px;color:white;font:23px sans-serif';document.querySelector('#stage').append(e);function f(){const c=document.querySelector('#scene').dataset;e.textContent=c.giftReceivedAt?`รับของขวัญ · ${Math.round(performance.now()-+c.giftReceivedAt)} ms · กล้อง ${(+c.cameraScale||0).toFixed(3)}`:'ก่อนรับของขวัญ';requestAnimationFrame(f)}f()}""")
  for label,k in [('final-rose','lotus'),('final-corgi-to-small','mushika')]:
   stop=await capture.record(pg,label);await pg.wait_for_timeout(600);await pg.evaluate("k=>send('gift',{kind:k,name:'ศิริพร'})",k);await pg.wait_for_function("k=>document.querySelector('#scene').dataset.ritualKind===k",arg=k,timeout=20000)
   if k=='mushika':await pg.wait_for_timeout(1200);await pg.evaluate("send('gift',{kind:'incense',name:'สมชาย'})");await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='incense'",timeout=25000)
   await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=20000);await pg.wait_for_function("window.__cameraDebug.owner===null&&window.__cameraDebug.world.scale===.84");await pg.wait_for_timeout(900);await stop();print(label,'PASS',flush=True)
  trace=await pg.evaluate('trace');bad=[]
  for f in trace:
   if f.get('debug') and float(f['cameraScale'])>.84001:
    if f['panelTextVisible']:bad.append(f['at'])
  assert not bad,bad
  assert not errs,errs
  (root/'artifacts/v012/final-video-result.json').write_text(json.dumps({'cameraPanelOverlapFrames':len(bad),'errors':errs,'recordings':['final-rose','final-corgi-to-small'],'frames':len(trace)},indent=2));await b.close()
asyncio.run(main())
