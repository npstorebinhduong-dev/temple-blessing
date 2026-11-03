"""Run against a disposable server: PORT=31948 GANESHA_DATA_DIR=/tmp/... ."""
import asyncio,json,platform,os,time
from pathlib import Path
from playwright.async_api import async_playwright
OUT=Path('artifacts/v011/load');OUT.mkdir(parents=True,exist_ok=True)
HOME={'scale':.84,'x':86.4,'y':270}
AUDIO_HOOK="""window.oscillators=new Set();window.maxOsc=0;window.buffers=[];const A=AudioContext;window.AudioContext=class extends A{constructor(...a){super(...a);window.testAudio=this;}createOscillator(){const o=super.createOscillator(),start=o.start.bind(o);o.start=(...a)=>{oscillators.add(o);maxOsc=Math.max(maxOsc,oscillators.size);return start(...a)};o.addEventListener('ended',()=>oscillators.delete(o));return o;}createBufferSource(){const s=super.createBufferSource();buffers.push(s);return s;}};"""
async def setup(pg):
 await pg.goto('http://127.0.0.1:31948/live/overlay.html?debugCamera=1');await pg.evaluate('document.fonts.ready')
 await pg.wait_for_function("document.querySelector('#scene').dataset.people!==undefined")
 await pg.evaluate("async()=>{window.ctl=new WebSocket('ws://127.0.0.1:31948/ws?role=control');await new Promise(r=>ctl.onopen=r);window.send=(cmd,data={})=>ctl.send(JSON.stringify({t:'ctl',cmd,...data}));send('demo');send('settings',{settings:{music:false,voiceEnabled:false,idlePrompts:false,petalMode:'light',joinOnEnter:true}})}")
 await pg.add_style_tag(content='#cameraDebug{display:none}');await pg.wait_for_timeout(500)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
  pg=await b.new_page(viewport={'width':1080,'height':1920});await pg.add_init_script(AUDIO_HOOK);errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  await setup(pg);results=[]
  for n in [100,300,500]:
   await pg.evaluate("n=>{send('reset');send('fill',{n:50});send('entry-fill',{n})}",n)
   await pg.wait_for_function("n=>+document.querySelector('#scene').dataset.entryTotal===n",arg=n,timeout=15000)
   await pg.wait_for_timeout(10000)
   await pg.evaluate("window.frameSamples=[];window.frameSampleStop=false;let f=-1;function sample(t){const v=+document.querySelector('#scene').dataset.rendered;if(v!==f){f=v;frameSamples.push(t)}if(!frameSampleStop)requestAnimationFrame(sample)}requestAnimationFrame(sample)")
   await pg.wait_for_timeout(12000)
   sample=await pg.evaluate("()=>{frameSampleStop=true;const d={...document.querySelector('#scene').dataset},v=frameSamples;return {data:d,frames:v.length,duration:(v.at(-1)-v[0])/1000,fps:(v.length-1)*1000/(v.at(-1)-v[0]),gaps:v.slice(1).map((x,i)=>x-v[i]),petals:+document.querySelector('#celebration').dataset.petals}}")
   assert int(sample['data']['entryTotal'])==n and int(sample['data']['crowdRendered'])==88
   assert int(sample['data']['people'])==50 and int(sample['data']['ambient'])==10
   assert int(sample['data']['crowdLabels'])<=176 and int(sample['data']['crowdSprites'])<=8 and int(sample['data']['spriteCache'])<=512
   sample['queuedPeople']=n;sample['p95FrameMs']=sorted(sample.pop('gaps'))[int((sample['frames']-1)*.95)];results.append(sample)
   await pg.screenshot(path=str(OUT/f'crowd-{n}.png'));print('LOAD',n,round(sample['fps'],2),'fps',flush=True)
  # Head/shoulder renderer uses no TikTok avatars, and never draws into the aisle.
  assert await pg.evaluate("document.querySelector('#entranceScene').parentElement.id==='world' && document.querySelector('#entranceScene').getBoundingClientRect().top>=1695")
  await pg.set_viewport_size({'width':360,'height':640});await pg.wait_for_timeout(500);await pg.screenshot(path=str(OUT/'phone-crowd-500.png'));await pg.set_viewport_size({'width':1080,'height':1920})
  # Stable world-space promotion: the queue head and full actor share the camera.
  await pg.evaluate("send('clear');send('entry-fill',{n:100})");await pg.wait_for_timeout(500)
  await pg.evaluate("send('gift',{uniqueId:'entry_demo_0',name:'ศิริพร',kind:'lotus'})")
  await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='lotus'",timeout=20000)
  await pg.wait_for_function("+document.querySelector('#scene').dataset.zoom>1.5")
  bounds=await pg.evaluate("()=>{const d=__cameraDebug,c=d.world,b=document.querySelector('#entranceScene').getBoundingClientRect();return {error:Math.abs(b.x-(-102.857143*c.scale+c.x))+Math.abs(b.y-(1697.619048*c.scale+c.y)),localScale:d.actor.localScale}}")
  assert bounds['error']<.1 and bounds['localScale']==1
  await pg.screenshot(path=str(OUT/'crowd-world-focus.png'))
  await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=12000)
  # Actual WebAudio nodes: 300 simultaneous cue requests remain capped and drain.
  await pg.evaluate("()=>{send('clear');for(let i=0;i<300;i++)send('bell');send('settings',{settings:{music:true,musicLoop:true}})}")
  await pg.wait_for_function('maxOsc>0');await pg.wait_for_timeout(5000)
  await pg.wait_for_function("document.querySelector('#scene').dataset.music==='playing'",timeout=15000)
  audio=await pg.evaluate("({maxOsc,remaining:oscillators.size,context:testAudio.state,music:buffers.filter(s=>s.buffer?.duration>200).map(s=>({duration:s.buffer.duration,loop:s.loop}))})")
  assert audio['maxOsc']<=12 and audio['remaining']==0 and audio['context']=='running' and audio['music'][-1]['loop']
  await pg.close()
  failures={}
  for filename,kind in [('worshipper.png','lotus'),('ganesha-standing.png','galaxy')]:
   pg=await b.new_page(viewport={'width':1080,'height':1920});await pg.route('**/assets/ganesha/'+filename,lambda route:route.abort());await setup(pg)
   await pg.evaluate("k=>send('gift',{name:'ทดสอบภาพ',skin:'female',kind:k})",kind)
   if kind=='lotus':
    await pg.wait_for_timeout(10000);state=await pg.evaluate('__cameraDebug');assert state['owner'] is None and state['world']==HOME
    assert await pg.locator('#assetError').is_visible()
   else:
    await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='galaxy'",timeout=22000)
    await pg.wait_for_timeout(9500);await pg.screenshot(path=str(OUT/'missing-standing-asset.png'))
    await pg.evaluate("send('reset')");await pg.wait_for_timeout(500);state=await pg.evaluate('__cameraDebug');assert state['owner'] is None and state['world']==HOME
    assert await pg.locator('#blessingBanner').is_hidden()
   failures[filename]=state;await pg.close()
  result={'environment':{'os':platform.platform(),'cpuCount':os.cpu_count(),'chromium':b.version,'viewport':[1080,1920],'mode':'headless Chromium; software rendering; no concurrent video capture; light petals; 60 seated + 88 rendered waiting characters'},'loads':results,'promotionCamera':bounds,'audio':audio,'assetFailures':failures,'pageErrors':errors}
  (OUT/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));assert not errors,errors
  print('LOAD/AUDIO/ASSET PASS',flush=True);await b.close()
asyncio.run(main())
