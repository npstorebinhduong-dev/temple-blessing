import asyncio,json,importlib.util
from pathlib import Path
from playwright.async_api import async_playwright
spec=importlib.util.spec_from_file_location('capture',Path(__file__).with_name('verify-live-v011.py'));C=importlib.util.module_from_spec(spec);spec.loader.exec_module(C)
OUT=Path('artifacts/v011/demo');OUT.mkdir(parents=True,exist_ok=True);C.OUT=OUT
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
  pg=await b.new_page(viewport={'width':1080,'height':1920});await pg.add_init_script(C.HOOK);errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  await pg.goto('http://127.0.0.1:31946/live/overlay.html?debugCamera=1');await pg.evaluate('document.fonts.ready');await pg.wait_for_function("document.querySelector('#scene').dataset.people!==undefined")
  await pg.evaluate("async()=>{window.ctl=new WebSocket('ws://127.0.0.1:31946/ws?role=control');await new Promise(r=>ctl.onopen=r);window.send=(cmd,data={})=>ctl.send(JSON.stringify({t:'ctl',cmd,...data}));send('demo');send('reset');send('settings',{settings:{music:false,voiceEnabled:false,idlePrompts:false,petalMode:'light',joinOnEnter:true}})}")
  await pg.wait_for_timeout(1000);await pg.add_style_tag(content='#cameraDebug{display:none}')
  await pg.screenshot(path=str(OUT/'wide.png'))
  for kind in ['lotus','lamp','fragrance','floral','light','prayer']:
   stop=await C.record(pg,'demo-'+kind);await pg.wait_for_timeout(700)
   await pg.evaluate("kind=>send('gift',{kind,name:'ศิริพร',count:1})",kind)
   if kind=='prayer':
    await pg.wait_for_timeout(500);await pg.evaluate("send('chat',{name:'คนอื่น',text:'ต้องไม่รับข้อความนี้'});send('chat',{name:'ศิริพร',text:'ขอให้ครอบครัวมีความสุข น้ำใจงาม <b>สาธุ</b>'})")
   await pg.wait_for_function("k=>document.querySelector('#scene').dataset.ritualKind===k",arg=kind,timeout=22000)
   if kind in ['lamp','fragrance','floral','light']:await pg.wait_for_function("document.querySelector('#scene').dataset.ceremonyPhase==='offer'",timeout=10000)
   else:await pg.wait_for_timeout(1300)
   await pg.screenshot(path=str(OUT/(kind+'.png')))
   if kind=='prayer':
    assert await pg.locator('#prayerText').inner_text()=='ขอให้ครอบครัวมีความสุข น้ำใจงาม <b>สาธุ</b>'
    assert await pg.locator('#prayerText b').count()==0
   await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=22000);await pg.wait_for_timeout(700);await stop()
   print('DEMO PASS',kind,flush=True)
  # A second gift opens another real 30-second window, with no submitted comment.
  await pg.evaluate("send('gift',{kind:'prayer',name:'นิดา',count:1})")
  await pg.wait_for_function("!document.querySelector('#prayerPrompt').hidden",timeout=5000)
  await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='prayer'",timeout=45000)
  await pg.wait_for_timeout(1000);await pg.screenshot(path=str(OUT/'prayer-timeout.png'))
  assert 'ขอให้มีสติ' in await pg.locator('#prayerText').inner_text()
  await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=12000)
  for name,cmd in [('member','member'),('promotion','gift')]:
   await pg.evaluate("send('member',{name:'น้องพลอย',skin:'male'})");await pg.wait_for_timeout(500)
   if cmd=='gift':
    await pg.evaluate("send('gift',{name:'น้องพลอย',kind:'lotus'})");await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='lotus'",timeout=18000);await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=12000)
  data=await pg.evaluate('({turns,trace,draws,messages})');(OUT/'trace.json').write_text(json.dumps(data,ensure_ascii=False));assert not errors,errors
  assert [t['ritual']['kind'] for t in data['turns'][:6]]==['lotus','lamp','fragrance','floral','light','prayer']
  assert all(a['localScale']==1 for f in data['trace'] if f['debug'] for a in f['debug']['actors'])
  assert [m['giftId'] for m in data['messages'] if m['t']=='gift'][:6]==['5655','demo:lamp','demo:fragrance','demo:floral','5658','5879']
  final=await pg.evaluate('__cameraDebug');assert final['world']=={'scale':.84,'x':86.4,'y':270} and final['owner'] is None
  await pg.set_viewport_size({'width':360,'height':640});await pg.wait_for_timeout(500);await pg.screenshot(path=str(OUT/'phone-wide.png'))
  await pg.evaluate("send('gift',{name:'ศิริพร',kind:'lotus'})");await pg.wait_for_function("+document.querySelector('#scene').dataset.zoom>1.5");await pg.screenshot(path=str(OUT/'phone-focus.png'))
  (OUT/'result.json').write_text(json.dumps({'demoNormalizerVerified':True,'prayerPlainText':True,'prayerTimeout30s':True,'turns':[t['ritual']['kind'] for t in data['turns']],'localScale':1,'errors':errors,'final':final},ensure_ascii=False,indent=2));print('DEMO FULL PASS',flush=True)
  await b.close()
asyncio.run(main())
