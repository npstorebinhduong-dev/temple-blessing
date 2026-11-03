import json,math
from pathlib import Path
import argparse
a=argparse.ArgumentParser();a.add_argument('directory',type=Path);args=a.parse_args();p=args.directory;data=json.loads((p/'full-trace.json').read_text());trace=data['trace'];draws=data['draws'];turns=data['turns'];owners={};errors=[];local=set();panels=set()
expected=[('lotus','u1'),('marigold','u1'),('royal','u2'),('incense','u3'),('mushika','u2'),('aarti','u1'),('galaxy','u3'),('light','u4'),('mushika','u1'),('lotus','u3'),('galaxy','u4')]+[('lotus',['u1','u1','u2','u3','u4'][i%5]) for i in range(13)]
assert [(t['ritual']['kind'],t['id']) for t in turns]==expected
for f in trace:
 d=f.get('debug')
 if not d:continue
 assert f['shrine']=='none';c=d['world'];b=f['bounds'];errors.extend([abs(b[0]-c['x']),abs(b[1]-c['y']),abs(b[2]-1080*c['scale']),abs(b[3]-1920*c['scale'])]);r=float(f['rasterScale']);pad=float(f['rasterPadding']);assert abs(f['canvas'][0]-r)<1e-6 and abs(f['canvas'][1]-r)<1e-6 and abs(f['canvas'][2]-pad*r)+abs(f['canvas'][3])<1e-5
 for a in d['actors']:local.add(a['localScale']);assert abs(a['height']-a['perspectiveHeight'])<1e-6 or a['entry']<1
 if d['owner']:owners.setdefault(d['owner'],[]).append(f)
 if d['smallGift']:assert d['smallGift']['x']>640 and d['smallGift']['w']<=56
 if d['kind'] in ['mushika','galaxy']:assert d['relative']['scale']==1
 panels.add(tuple(round(x,2) for x in f['panel'][:3]));assert f['lotusCalls']==0
 assert d['state'] not in ['render-error','camera-error','invalid-camera','invalid-focus']
assert max(errors)<.1 and len(owners)==24 and local=={1} and all(18<=p[0]<=54 and 209<=p[1]<=211 and 239<=p[2]<=973 for p in panels)
for t in turns:
 fs=[f for f in trace if f.get('debug') and f['debug']['turn']==t['turn']];assert fs and all(f['debug']['focusId']==t['id'] for f in fs)
 if t['ritual']['kind'] not in ['mushika','galaxy']:assert max(f['debug']['relative']['scale'] for f in fs)>1.4
final=trace[-1]['debug'];assert final['owner'] is None and final['world']=={'scale':.84,'x':86.4,'y':270}
by={f['rendered']:f for f in trace};counts={};scales=[]
for v in draws:
 f=by.get(v['frame']);dbg=f and f.get('debug');a=dbg and dbg.get('actor')
 if not a or not dbg['owner']:continue
 m=v['matrix'];r=float(f['rasterScale']);pad=float(f['rasterPadding']);px=(m[0]*(v['dx']+v['width']/2)+m[2]*(v['dy']+v['height'])+m[4])/r-pad;py=(m[1]*(v['dx']+v['width']/2)+m[3]*(v['dy']+v['height'])+m[5])/r
 if math.hypot(px-a['x'],py-a['y'])>6:continue
 counts[dbg['owner']]=counts.get(dbg['owner'],0)+1;scales.append(math.hypot(m[0],m[1])/r);assert abs(v['width']-a['width'])<1e-5
assert len(counts)==24 and max(abs(s-1) for s in scales)<1e-5
summary={'version':'0.11','input':'Simulated TikFinity WebSocket envelopes through production LIVE connector, normalizer, onGift and FIFO; no DEMO override','viewport':[1080,1920],'turns':[{'kind':t['ritual']['kind'],'id':t['id'],'turn':t['turn']} for t in turns],'ordinaryFocuses':20,'specialHolds':4,'frames':len(trace),'worldBoundsMaxErrorPx':max(errors),'localScales':sorted(local),'largeLotusCalls':0,'cameraErrorFrames':0,'final':final}
(p/'trace-verification.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2))
check={'matchedDonorDraws':len(scales),'cameraOwnersCovered':len(counts),'localContextScaleMin':min(scales),'localContextScaleMax':max(scales),'drawWidthMismatches':0,'drawsPerOwner':counts,'note':'Actual drawImage width and context basis checked, not only debug self-report. Pose-dependent bow height excluded; width/stature remains constant.'};(p/'draw-verification.json').write_text(json.dumps(check,indent=2))
print('PASS',len(trace),'frames,',len(scales),'actual donor draws,',len(counts),'owners; world error px',max(errors))
