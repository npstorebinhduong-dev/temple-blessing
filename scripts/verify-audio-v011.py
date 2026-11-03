"""Actual Edge speech + local blessing playback. Run server on disposable port 31950.
No fake TTS: the browser decodes/plays MP3 and records the WebAudio output.
"""
import asyncio,json,importlib.util,math
from pathlib import Path
from playwright.async_api import async_playwright
spec=importlib.util.spec_from_file_location('capture',Path(__file__).with_name('verify-live-v011.py'))
C=importlib.util.module_from_spec(spec);spec.loader.exec_module(C)
OUT=Path('artifacts/v011/audio');OUT.mkdir(parents=True,exist_ok=True);C.OUT=OUT
HOOK="""window.played=[];window.gains=[];window.duckEvents=[];
const AC=AudioContext;window.AudioContext=class extends AC{
 constructor(...a){super(...a);window.testAudio=this;window.capture=this.createMediaStreamDestination();}
 createGain(){const g=super.createGain();gains.push(g);const set=g.gain.setTargetAtTime.bind(g.gain);g.gain.setTargetAtTime=(v,t,c)=>{duckEvents.push({at:performance.now(),index:gains.indexOf(g),value:v,constant:c});return set(v,t,c)};return g;}
 createMediaElementSource(el){const item={src:el.src,created:performance.now()};played.push(item);el.addEventListener('playing',()=>{item.started=performance.now();item.duration=Number.isFinite(el.duration)?el.duration:null});el.addEventListener('ended',()=>{item.ended=performance.now();item.duration=Number.isFinite(el.duration)?el.duration:null;item.playbackSeconds=(item.ended-item.started)/1000});return super.createMediaElementSource(el);}
};const connect=AudioNode.prototype.connect;AudioNode.prototype.connect=function(dest,...a){if(dest===this.context.destination&&window.capture)connect.call(this,capture);return connect.call(this,dest,...a)};
window.startAudioCapture=()=>{window.audioChunks=[];window.audioEpoch=Date.now()/1000;window.recorder=new MediaRecorder(capture.stream,{mimeType:'audio/webm;codecs=opus'});recorder.ondataavailable=e=>audioChunks.push(e.data);recorder.start(1000)};
window.stopAudioCapture=()=>new Promise(r=>{recorder.onstop=async()=>{const data=await new Blob(audioChunks).arrayBuffer();r({epoch:audioEpoch,bytes:Array.from(new Uint8Array(data))})};recorder.stop()});
"""
BLESSING='ขอให้เจ้ามีจิตใจที่สงบ มีปัญญาก้าวผ่านอุปสรรค และพบกับการเริ่มต้นที่ดี'
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required'])
  pg=await b.new_page(viewport={'width':1080,'height':1920});await pg.add_init_script(C.HOOK+HOOK);errors=[];pg.on('pageerror',lambda e:errors.append(str(e)))
  await pg.goto('http://127.0.0.1:31950/live/overlay.html?debugCamera=1');await pg.evaluate('document.fonts.ready')
  await pg.wait_for_function("document.querySelector('#scene').dataset.people!==undefined")
  await pg.evaluate("async()=>{window.ctl=new WebSocket('ws://127.0.0.1:31950/ws?role=control');await new Promise(r=>ctl.onopen=r);window.send=(cmd,data={})=>ctl.send(JSON.stringify({t:'ctl',cmd,...data}));send('demo');send('reset');send('settings',{settings:{music:true,musicLoop:true,musicVolume:60,voiceEnabled:true,voiceVolume:100,idlePrompts:false,petalMode:'light',voice:'th-TH-NiwatNeural',rate:-12,pitch:-6}})}")
  await pg.wait_for_function("document.querySelector('#scene').dataset.music==='playing'",timeout=20000)
  await pg.add_style_tag(content='#cameraDebug{display:none}')
  # Dynamic speech must use the configured network proxy, not the bundled clip.
  await pg.evaluate("send('say',{text:'ขอให้วันนี้เป็นวันที่ดีของคุณ'})")
  await pg.wait_for_function('played.some(x=>x.ended)',timeout=30000)
  dynamic=await pg.evaluate('played[0]');assert dynamic['playbackSeconds']>1
  print('ONLINE NIWAT PLAYBACK PASS',dynamic['playbackSeconds'],flush=True)
  stop=await C.record(pg,'galaxy-with-audio');await pg.evaluate('startAudioCapture()');await pg.wait_for_timeout(800)
  await pg.evaluate("send('gift',{kind:'galaxy',name:'ศิริพร'})")
  await pg.wait_for_function("document.querySelector('#blessingBanner').dataset.speechState==='playing'",timeout=30000)
  assert await pg.locator('#blessingText').inner_text()==BLESSING
  assert await pg.locator('#blessingName').inner_text()=='ศิริพร'
  await pg.wait_for_timeout(1000);await pg.screenshot(path=str(OUT/'galaxy-speaking.png'))
  await pg.wait_for_function("messages.some(m=>m.t==='ritual-progress'&&m.active?.speech?.state==='ended')",timeout=15000)
  speech=await pg.evaluate("messages.filter(m=>m.t==='ritual-progress'&&m.active?.speech?.state==='ended').at(-1).active.speech")
  assert speech['bannerUntil']-speech['endedAt']==2500
  assert 5800<speech['endedAt']-speech['startedAt']<8500
  assert await pg.locator('#blessingBanner').is_visible()
  await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=15000);await pg.wait_for_timeout(1000)
  await stop();audio=await pg.evaluate('stopAudioCapture()');(OUT/'actual-output.webm').write_bytes(bytes(audio.pop('bytes')))
  state=await pg.evaluate("({final:__cameraDebug,played,duckEvents,music:document.querySelector('#scene').dataset.music,bannerHidden:document.querySelector('#blessingBanner').hidden})")
  assert state['final']['world']=={'scale':.84,'x':86.4,'y':270} and state['final']['owner'] is None and state['bannerHidden']
  duck=[d for d in state['duckEvents'] if d['constant']==.2 and abs(d['value']-.12)<1e-8]
  restore=[d for d in state['duckEvents'] if d['constant']==.6 and abs(d['value']-.6)<1e-8]
  assert duck and restore[-1]['at']>duck[-1]['at']
  # A failed audio request still releases the scene and exact camera snapshot.
  await pg.route('**/live/tts/*',lambda route:route.abort())
  await pg.evaluate("send('gift',{kind:'galaxy',name:'ศิริพร'})")
  await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind==='galaxy'")
  await pg.wait_for_function("document.querySelector('#blessingBanner').dataset.speechState==='text'",timeout=15000)
  await pg.wait_for_function("document.querySelector('#scene').dataset.ritualKind===''",timeout=22000)
  failed=await pg.evaluate('__cameraDebug');assert failed['owner'] is None and failed['world']=={'scale':.84,'x':86.4,'y':270}
  assert not errors,errors
  result={'kind':'Actual browser MP3 playback; Edge online Niwat plus bundled Niwat blessing. Simulated gift, not TikTok LIVE.', 'dynamic':dynamic,'speech':speech,'audioCapture':audio,'state':state,'failedAudioCamera':failed,'pageErrors':errors}
  (OUT/'result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print('AUDIO/BANNER/DUCK/FAILURE PASS',flush=True);await b.close()
asyncio.run(main())
