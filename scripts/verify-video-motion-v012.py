from pathlib import Path
import json,cv2,numpy as np
cv2.setNumThreads(1)
root=Path(__file__).resolve().parents[1]/'artifacts/v012';results={}
for label in ['small-lotus','small-lamp','small-fragrance','small-prayer','small-incense']:
 folder=root/label;times=json.loads((folder/'timestamps.json').read_text());reference=cv2.resize(cv2.imread(str(folder/times[0]['file']),0),(540,960));mask=np.zeros_like(reference);mask[440:630,50:490]=255
 detector=cv2.SIFT_create(nfeatures=2000,contrastThreshold=.008);kp,des=detector.detectAndCompute(reference,mask);matcher=cv2.BFMatcher();samples=[]
 for i,f in enumerate(times):
  frame=cv2.resize(cv2.imread(str(folder/f['file']),0),(540,960));k,d=detector.detectAndCompute(frame,None)
  if d is None:continue
  pairs=matcher.knnMatch(des,d,k=2);good=[a for a,b in pairs if a.distance<.68*b.distance]
  if len(good)<10:continue
  src=np.float32([kp[m.queryIdx].pt for m in good]);dst=np.float32([k[m.trainIdx].pt for m in good]);matrix,inliers=cv2.estimateAffinePartial2D(src,dst,method=cv2.RANSAC,ransacReprojThreshold=2,maxIters=2000)
  if matrix is None:continue
  use=inliers[:,0].astype(bool)
  if use.sum()<10:continue
  prediction=src@matrix[:,:2].T+matrix[:,2];err=np.linalg.norm(prediction[use]-dst[use],axis=1)
  if np.median(err)>.8:continue
  samples.append({'frame':i,'time':f['stamp']-times[0]['stamp'],'scale':float(np.hypot(matrix[0,0],matrix[1,0])),'x':float(matrix[0,2]),'y':float(matrix[1,2]),'inliers':int(use.sum()),'error':float(np.median(err))})
 peak=max(samples,key=lambda s:s['scale']);end=samples[-1]
 assert abs(peak['scale']-1.2)<.025,(label,peak);assert abs(end['scale']-1)<.015 and abs(end['x'])<3 and abs(end['y'])<3
 assert len([s for s in samples if 1.005<s['scale']<1.195])>=3
 results[label]={'recordedFrames':len(times),'matchedFrames':len(samples),'peak':peak,'returned':end};print(label,results[label],flush=True)
 frames=[]
 for seconds in [0,.6,.8,1,1.5,2.5,4.5,6,8,10,11,12]:
  f=min(times,key=lambda f:abs(f['stamp']-times[0]['stamp']-seconds));im=cv2.resize(cv2.imread(str(folder/f['file'])),(360,640));cv2.rectangle(im,(0,0),(360,27),(0,0,0),-1);cv2.putText(im,f"{label}: {f['stamp']-times[0]['stamp']:.2f}s",(8,20),cv2.FONT_HERSHEY_SIMPLEX,.55,(255,255,255),1);frames.append(im)
 cv2.imwrite(str(root/(label+'-motion.jpg')),np.vstack([np.hstack(frames[i:i+4])for i in range(0,12,4)]))
(root/'video-motion.json').write_text(json.dumps(results,indent=2))
