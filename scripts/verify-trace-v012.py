"""Inspect recorded DOM/canvas transforms and real drawImage calls."""
import json,math
from pathlib import Path
root=Path('artifacts/v012');data=json.loads((root/'trace.json').read_text());errors=[];scales=[];counts={};stale=[]
by={f['rendered']:f for f in data['trace']}
for f in data['trace']:
 d=f.get('debug')
 if not d:continue
 c={'scale':float(f['cameraScale']),'x':float(f['cameraX']),'y':float(f['cameraY'])};b=f['bounds']
 errors.extend([abs(b[0]-c['x']),abs(b[1]-c['y']),abs(b[2]-1080*c['scale']),abs(b[3]-1920*c['scale'])])
 if c!=d['world']:stale.append({'at':f['at'],'renderState':f['cameraState'],'debugState':d['state']})
 assert f['cameraState'] not in ['render-error','camera-error','invalid-camera','invalid-focus']
 assert f['lotusCalls']==0
for v in data['draws']:
 f=by.get(v['frame']);d=f and f.get('debug');a=d and d.get('actor')
 if not a or not d['kind']:continue
 m=v['matrix'];r=float(f['rasterScale']);pad=float(f['rasterPadding']);px=(m[0]*(v['dx']+v['width']/2)+m[2]*(v['dy']+v['height'])+m[4])/r-pad;py=(m[1]*(v['dx']+v['width']/2)+m[3]*(v['dy']+v['height'])+m[5])/r
 if math.hypot(px-a['x'],py-a['y'])>6:continue
 assert abs(v['width']-a['width'])<1e-5
 scale=math.hypot(m[0],m[1])/r;assert abs(scale-1)<1e-5;scales.append(scale);counts[d['kind']]=counts.get(d['kind'],0)+1
assert len(counts)==9 and max(errors)<.001
assert len(stale)<=1 and all(s['renderState']=='reset' for s in stale),stale
turns=data['turns'];assert len(turns)==25
assert [t['ritual']['kind']for t in turns[:5]]==['lotus','lamp','fragrance','prayer','incense']
assert [t['ritual']['kind']for t in turns[5:15]]==['lotus','lamp','fragrance','incense','prayer']*2
small={'lotus','lamp','fragrance','prayer','incense'}
for t in turns[:23]:
 fs=[f for f in data['trace']if f.get('debug')and f['debug']['turn']==t['turn']]
 assert fs and all(f['debug']['focusId']==t['id'] for f in fs)
for i,k in enumerate(['marigold','royal','mushika','galaxy']):assert [t['ritual']['kind']for t in turns[15+2*i:17+2*i]]==[k,'lotus']
gifts=[m for m in data['messages']if m['t']=='gift' and m['giftName']in['Shamrock','Perfume','OK','Unknown']];assert len(gifts)==4 and sum(m['coins']for m in gifts)==36 and all(m['ritual']is None for m in gifts)
smalltiming={}
for kind in ['lotus','lamp','fragrance','prayer','incense']:
 rows=[f for f in data['trace'] if f.get('giftReceivedKind')==kind]
 received=float(rows[0]['giftReceivedAt']);rows=[f for f in rows if f['at']>=received]
 moving=next(f for f in rows if float(f['cameraScale'])>.840001)
 settled=next(f for f in rows if abs(float(f['cameraScale'])-1.008)<1e-8)
 offer=next(f for f in rows if f.get('ceremonyPhase')=='offer')
 smalltiming[kind]={'receiptToFirstMovedFrameMs':moving['at']-received,'receiptToAisleMs':settled['at']-received,'receiptToOfferMs':offer['at']-received}
result={'version':'0.12','input':'Synthetic TikFinity WebSocket envelopes → production normalizer/onGift/queue. Not a paid TikTok LIVE. Lamp 900101 / Love Perfume 900105 were temporary test fixtures, not verified catalog IDs.','frames':len(data['trace']),'turns':25,'fullyCompletedTurns':23,'resetOrMissingTargetTurns':2,'consecutiveSmallGifts':10,'actualDrawImageCallsChecked':len(scales),'drawsByKind':counts,'localContextScale':[min(scales),max(scales)],'worldBoundsMaxErrorPx':max(errors),'smallGiftTiming':smalltiming,'unknownGifts':4,'unknownCoinsCounted':36,'largeKindsPreserved':['marigold','royal','mushika','galaxy'],'largeLotusCalls':0,'initialDebugIssue':{'staleResetSnapshots':stale,'resolution':'CameraDebug.reset now updates immediately; final targeted browser check in extra-result.json'},'finalWorld':data['trace'][-1]['debug']['world']}
(root/'trace-verification.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print(json.dumps(result,ensure_ascii=False,indent=2))
