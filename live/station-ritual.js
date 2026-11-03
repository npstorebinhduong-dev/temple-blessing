import { ALTAR } from './procession.js';
import { RITUAL_TIMING } from './ritual-timing.js';
const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v)};
const mix=(a,b,v)=>a+(b-a)*ease(v);
export function stationPose(kind,ms,from,seat) {
  const t=Math.max(0,ms)/1000,end=RITUAL_TIMING[kind].duration/1000,back=end-4.8;
  const dest={x:kind==='lamp'?820:kind==='fragrance'?700:ALTAR.x,y:ALTAR.y};
  const p={...from,frame:7,phase:'rise',carrier:false,carrierFrame:0,bow:0,focus:0,place:0};
  const walk=()=>{p.frame=Math.floor((Math.abs(p.x-from.x)+Math.abs(p.y-from.y))/34)%4;p.carrier=kind==='floral'||kind==='light';p.carrierFrame=p.frame%2;};
  if(t<.7)p.frame=7-Math.min(3,Math.floor(t/.175));
  else if(t<2){p.phase='to-aisle';p.x=mix(from.x,540,(t-.7)/1.3);walk();}
  else if(t<4.7){p.phase='approach';p.x=540;p.y=mix(from.y,dest.y,(t-2)/2.7);walk();}
  else if(t<5.5){p.phase='align';p.x=mix(540,dest.x,(t-4.7)/.8);p.y=dest.y;walk();}
  else if(t<6.3){Object.assign(p,dest,{phase:'kneel',frame:4+Math.min(3,Math.floor((t-5.5)/.2))});}
  else if(t<back){Object.assign(p,dest,{phase:'offer',focus:1,carrier:true,carrierFrame:3});p.place=ease((t-back+1.2)/1.2);p.bow=kind==='light'?Math.sin((t-6.3)*1.8)*.025:ease((t-6.3)/.5)*.025;}
  else if(t<back+.6){Object.assign(p,dest,{phase:'stand',frame:7-Math.min(3,Math.floor((t-back)/.15)),place:1});}
  else if(t<end-.7){p.phase='return';const q=(t-back-.6)/(end-.7-back-.6);if(q<.2){p.x=mix(dest.x,540,q/.2);p.y=dest.y;}else if(q<.75){p.x=540;p.y=mix(dest.y,seat.y,(q-.2)/.55);}else{p.x=mix(540,seat.x,(q-.75)/.25);p.y=seat.y;}walk();p.carrier=false;p.place=1;}
  else{Object.assign(p,seat,{phase:t>=end?'done':'settle',frame:4+Math.min(3,Math.floor((t-end+.7)/.175)),place:1});}
  return p;
}
export function drawGarland(p,x,y,size=30) {
  p.save();p.lineWidth=7;p.strokeStyle='#f9d387';p.beginPath();p.ellipse(x,y,size*.7,size,0,0,7);p.stroke();
  for(let i=0;i<18;i++){const a=i/18*Math.PI*2;p.fillStyle=i%3?'#ffe8b0':'#eeaa72';p.beginPath();p.arc(x+Math.cos(a)*size*.7,y+Math.sin(a)*size,4,0,7);p.fill();}p.restore();
}
export function drawTray(p,x,y,t) {
  p.save();const g=p.createRadialGradient(x,y-16,0,x,y-16,42);g.addColorStop(0,'#ffce6a55');g.addColorStop(1,'#ffc56200');p.fillStyle=g;p.fillRect(x-42,y-58,84,84);
  p.fillStyle='#c99d49';p.beginPath();p.ellipse(x,y,30,8,0,0,7);p.fill();p.strokeStyle='#f9d990';p.lineWidth=2;p.stroke();
  for(let i=-1;i<=1;i++){p.fillStyle='#ffe3a0';p.beginPath();p.ellipse(x+i*17,y-11,3,9+Math.sin(t*5+i),0,0,7);p.fill();}p.restore();
}
