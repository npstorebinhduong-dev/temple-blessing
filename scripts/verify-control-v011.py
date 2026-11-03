"""Click the real operator UI on disposable port 31946. Never use during LIVE."""
import asyncio,json,importlib.util
from pathlib import Path
from playwright.async_api import async_playwright
spec=importlib.util.spec_from_file_location('capture',Path(__file__).with_name('verify-live-v011.py'));C=importlib.util.module_from_spec(spec);spec.loader.exec_module(C)
OUT=Path('artifacts/v011/control');OUT.mkdir(parents=True,exist_ok=True);C.OUT=OUT
HOME={'scale':.84,'x':86.4,'y':270}
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
  ui=await b.new_page(viewport={'width':1440,'height':1000});pg=await b.new_page(viewport={'width':1080,'height':1920});errors=[]
  for page in [ui,pg]:page.on('pageerror',lambda e:errors.append(str(e)))
  await pg.add_init_script(C.HOOK);await ui.goto('http://127.0.0.1:31946/live/control.html')
  await ui.wait_for_function("document.querySelector('#srv').classList.contains('ok')")
  await ui.locator('#demo').click();await ui.locator('#resetDemo').click()
  for key in ['music','voiceEnabled','idlePrompts']:await ui.locator('#'+key).uncheck()
  await ui.locator('#joinOnEnter').check();await ui.locator('#settingsForm button[type=submit]').click()
  await pg.goto('http://127.0.0.1:31946/live/overlay.html?debugCamera=1');await pg.evaluate('document.fonts.ready')
  await pg.wait_for_function("document.querySelector('#scene').dataset.people!==undefined")
  await pg.add_style_tag(content='#cameraDebug{display:none}')
  kinds=await ui.locator('[data-gift]').evaluate_all('(a)=>a.map(x=>x.dataset.gift)');assert len(kinds)==13
  await ui.locator('#simName').fill('ศิริพร');await ui.locator('#simSkin').select_option('male')
  stop=await C.record(pg,'ok-five');await ui.locator('[data-gift=garland]').click()
  await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='garland'",timeout=18000);await pg.wait_for_timeout(1700)
  await pg.screenshot(path=str(OUT/'ok-five.png'));await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=10000);await pg.wait_for_timeout(600);await stop()
  await ui.locator('#resetDemo').click();await pg.wait_for_timeout(300);await pg.evaluate('messages.length=0')
  for kind in kinds:await ui.locator('[data-gift='+kind+']').click()
  await pg.wait_for_function("messages.filter(m=>m.t==='gift').length===13")
  gifts=await pg.evaluate("messages.filter(m=>m.t==='gift').map(m=>({kind:m.ritual?.kind,id:m.giftId,coins:m.coins}))")
  assert [m['kind'] for m in gifts]==kinds
  await pg.wait_for_function("+document.querySelector('#scene').dataset.zoom>1.4",timeout=18000)
  await ui.locator('#resetDemo').click();await pg.wait_for_timeout(500)
  state=await pg.evaluate('__cameraDebug');assert state['owner'] is None and state['world']==HOME
  for n in [100,300,500]:
   await ui.locator('#resetDemo').click();await ui.locator('[data-entry-fill="'+str(n)+'"]').click()
   await pg.wait_for_function("n=>+document.querySelector('#scene').dataset.entryTotal===n",arg=n)
  await ui.locator('#settingsForm summary').filter(has_text='Vùng tránh UI TikTok').click()
  await ui.locator('#safeTop').fill('140');await ui.locator('#safeBottom').fill('180');await ui.locator('#settingsForm button[type=submit]').click()
  await pg.wait_for_function("document.querySelector('#stage').style.getPropertyValue('--safe-bottom')==='180px'")
  assert await pg.locator('.identity').evaluate("e=>getComputedStyle(e).visibility==='hidden'")
  await pg.set_viewport_size({'width':360,'height':640});await pg.screenshot(path=str(OUT/'safe-zones-phone.png'))
  await ui.locator('#safeTop').fill('0');await ui.locator('#safeBottom').fill('0');await ui.locator('#settingsForm button[type=submit]').click()
  await ui.locator('#resetDemo').click();await ui.locator('#giftBurst').click();await pg.wait_for_timeout(500)
  await ui.screenshot(path=str(OUT/'operator.png'),full_page=True)
  # Review the sparse crowd too: cropped shoulders must meet the nearer row.
  await ui.locator('#resetDemo').click();await ui.locator('[data-entry-fill="30"]').click()
  await pg.set_viewport_size({'width':1080,'height':1920});await pg.wait_for_timeout(1000)
  await pg.screenshot(path=str(OUT/'crowd-thirty.png'))
  for kind in ['mushika','galaxy']:
   stop=await C.record(pg,kind+'-final');await pg.wait_for_timeout(700);await ui.locator('[data-gift='+kind+']').click()
   await pg.wait_for_function("k=>document.querySelector('#scene').dataset.ritualKind===k",arg=kind,timeout=18000)
   if kind=='mushika':await pg.wait_for_function("document.querySelector('#scene').dataset.transferPhase==='transfer'",timeout=12000)
   else:await pg.wait_for_function("!document.querySelector('#blessingBanner').hidden",timeout=15000)
   await pg.wait_for_timeout(800);await pg.screenshot(path=str(OUT/(kind+'-final.png')))
   await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=25000);await pg.wait_for_timeout(600);await stop()
  await ui.locator('#resetDemo').click();await pg.close()
  # A missing whisper atlas must use the normal character instead of vanishing.
  pg=await b.new_page(viewport={'width':1080,'height':1920});await pg.add_init_script(C.HOOK)
  await pg.route('**/assets/ganesha/whisper-poses.png',lambda route:route.abort())
  await pg.goto('http://127.0.0.1:31946/live/overlay.html?debugCamera=1');await pg.add_style_tag(content='#cameraDebug{display:none}')
  await ui.locator('[data-gift=mushika]').click();await pg.wait_for_function("document.querySelector('#scene').dataset.ceremonyPhase==='whisper'",timeout=22000)
  await pg.wait_for_timeout(400);await pg.screenshot(path=str(OUT/'missing-whisper-fallback.png'))
  rendered=await pg.evaluate("()=>{const d=__cameraDebug,a=d.actor;return{debug:d,matching:draws.slice(-200).filter(x=>Math.abs(x.width-a.width)<.01&&Math.abs(x.height-a.height)<.01)}}")
  assert rendered['debug']['actor']['localScale']==1 and rendered['matching']
  await ui.locator('#resetDemo').click();await pg.wait_for_timeout(500);assert (await pg.evaluate('__cameraDebug'))['world']==HOME
  assert not errors,errors
  (OUT/'result.json').write_text(json.dumps({'clickedGifts':gifts,'crowdButtons':[100,300,500],'resetDuringZoom':state,'safeZonesSaved':True,'missingWhisperFallback':rendered,'errors':errors},ensure_ascii=False,indent=2))
  print('CONTROL 13 BUTTONS / OK / RESET / SAFE ZONES / MISSING WHISPER PASS',flush=True);await b.close()
asyncio.run(main())
