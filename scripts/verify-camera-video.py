from pathlib import Path
import json,cv2,numpy as np
cv2.setNumThreads(1)
import argparse
p=argparse.ArgumentParser();p.add_argument('directory',type=Path);args=p.parse_args();root=args.directory;results={}
for label in ['fixed-rose','fixed-procession']:
 folder=root/label;times=json.loads((folder/'timestamps.json').read_text());reference=cv2.imread(str(folder/times[0]['file']),cv2.IMREAD_GRAYSCALE);h,w=reference.shape
 # Static altar/architecture. Exclude screen-fixed HUD/debug and walking guests.
 mask=np.zeros_like(reference);mask[int(h*.43):int(h*.65),int(w*.08):int(w*.92)]=255
 detector=cv2.SIFT_create(nfeatures=900);kp,des=detector.detectAndCompute(reference,mask);matcher=cv2.BFMatcher();samples=[]
 for i,f in enumerate(times):
  if i%2 and i!=len(times)-1:continue
  frame=cv2.imread(str(folder/f['file']),cv2.IMREAD_GRAYSCALE);k,d=detector.detectAndCompute(frame,None)
  if d is None:continue
  pairs=matcher.knnMatch(des,d,k=2);good=[a for a,b in pairs if a.distance<.68*b.distance]
  if len(good)<10:continue
  src=np.float32([kp[m.queryIdx].pt for m in good]);dst=np.float32([k[m.trainIdx].pt for m in good]);matrix,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=2,maxIters=3000)
  if matrix is None:continue
  use=inliers[:,0].astype(bool)
  if use.sum()<8:continue
  prediction=src@matrix[:,:2].T+matrix[:,2];err=np.linalg.norm(prediction[use]-dst[use],axis=1)
  samples.append({'frame':i,'time':f['stamp']-times[0]['stamp'],'scale':float(np.hypot(matrix[0,0],matrix[1,0])),'x':float(matrix[0,2]),'y':float(matrix[1,2]),'inliers':int(use.sum()),'medianErrorPx':float(np.median(err))})
 expected=1.55 if label=='fixed-rose' else 1.45
 good=[s for s in samples if s['medianErrorPx']<.8]
 peak=max(good,key=lambda s:s['scale']);end=good[-1]
 assert abs(peak['scale']-expected)<.025,(label,peak)
 assert abs(end['scale']-1)<.015,(label,end)
 assert abs(end['x'])<3 and abs(end['y'])<3,(label,end)
 # There must be observed intermediate framing during entry and return, not two still images.
 partial=[s for s in good if 1.03<s['scale']<expected-.03]
 assert len(partial)>=5,(label,len(partial))
 results[label]={'method':'SIFT/RANSAC affine registration of actual video frames against the initial altar/architecture; no overlay telemetry used to fit the motion','totalFrames':len(times),'measuredFrames':len(good),'intermediateFrames':len(partial),'peak':peak,'returned':end,'samples':samples}
 print(label,'PASS',len(good),'motion samples; peak',round(peak['scale'],5),'end',round(end['scale'],5),'return xy',round(end['x'],3),round(end['y'],3),flush=True)
(root/'video-motion.json').write_text(json.dumps(results,indent=2))
