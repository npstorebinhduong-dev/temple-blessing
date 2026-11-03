const smooth=n=>{n=Math.max(0,Math.min(1,n));return n*n*(3-2*n)};
// Arc-length movement gives every donor one continuous route. The five gifts
// share the same entry/action/exit timing, without scaling their sprite.
function along(points,t){
 const lens=points.slice(1).map((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y));
 const distance=lens.reduce((a,b)=>a+b,0)*smooth(t);let left=distance;
 for(let i=0;i<lens.length;i++){
  if(left<=lens[i]&&lens[i]>0){const q=left/lens[i],a=points[i],b=points[i+1];return{x:a.x+(b.x-a.x)*q,y:a.y+(b.y-a.y)*q,distance};}
  left-=lens[i];
 }
 return{...points.at(-1),distance};
}
export function smallPose(kind,ms,from,seat,seated=false){
 const t=Math.max(0,ms)/1000;
 const dest={x:kind==='lamp'?820:kind==='fragrance'||kind==='incense'?700:kind==='lotus'?730:540,y:1285};
 const p={...from,frame:0,phase:'prepare',carrier:false,carrierFrame:3,bow:0};
 if(t<.4){p.frame=seated?7-Math.min(3,Math.floor(t/.1)):0;return p;}
 if(t<3.8){Object.assign(p,along([from,{x:540,y:from.y},{x:540,y:dest.y},dest],(t-.4)/3.4),{phase:'approach'});p.frame=Math.floor(p.distance/34)%4;}
 else if(t<4.4)Object.assign(p,dest,{phase:'kneel',frame:4+Math.min(3,Math.floor((t-3.8)/.15))});
 else if(t<6.1)Object.assign(p,dest,{phase:'offer',frame:7,bow:smooth((t-4.4)/.5)*.025});
 else if(t<6.7)Object.assign(p,dest,{phase:'stand',frame:7-Math.min(3,Math.floor((t-6.1)/.15))});
 else if(t<9.3){Object.assign(p,along([dest,{x:540,y:dest.y},{x:540,y:seat.y},seat],(t-6.7)/2.6),{phase:'return'});p.frame=Math.floor(p.distance/34)%4;}
 else Object.assign(p,seat,{phase:t>=10?'done':'settle',frame:4+Math.min(3,Math.floor((t-9.3)/.175))});
 return p;
}
