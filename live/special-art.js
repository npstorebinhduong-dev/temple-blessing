import { MUSHIKA, GALAXY_PLACE, clamp, smooth } from './special-rituals.js';
import { STANDING_GANESHA, screenRect } from './scene-layout.js';
import { ORB, RECEIVER, TRANSMISSION, RESPONSE, curvePoint, mushikaLight } from './mushika-effect.js';
const TAU=Math.PI*2,complete=im=>im?.complete&&im.naturalWidth>0;
let glowTexture;
function glow(p,x,y,r,a=.5) {
  if(!glowTexture){glowTexture=document.createElement('canvas');glowTexture.width=glowTexture.height=256;const c=glowTexture.getContext('2d'),g=c.createRadialGradient(128,128,2,128,128,128);g.addColorStop(0,'#fff1bddd');g.addColorStop(.18,'#ffd57788');g.addColorStop(.5,'#eea84636');g.addColorStop(1,'#d68b2400');c.fillStyle=g;c.fillRect(0,0,256,256);}
  p.save();p.globalAlpha*=a;p.drawImage(glowTexture,x-r,y-r,r*2,r*2);p.restore();
}
function ring(p,x,y,r,a,t) {p.save();p.globalAlpha*=a;p.strokeStyle='#ffe4ad';p.lineWidth=1.6;for(let i=0;i<3;i++){p.beginPath();p.ellipse(x,y,r+i*17+Math.sin(t+i)*2,12+i*5,0,0,TAU);p.stroke();}p.restore();}
function trail(p,points,progress,{alpha=1,tail=.42,width=1,petals=9}={}){
  if(progress<=0)return;
  const from=Math.max(0,progress-tail),head=curvePoint(points,progress);
  const path=()=>{p.beginPath();for(let i=0;i<=32;i++){const v=curvePoint(points,from+(progress-from)*i/32);if(i)p.lineTo(v.x,v.y);else p.moveTo(v.x,v.y);}};
  p.save();p.lineCap='round';for(const [w,a,c] of [[35,.14,'#efb54d'],[18,.30,'#ffd480'],[7,.85,'#ffe5a3'],[2.5,.92,'#fff3c6']]){p.globalAlpha=alpha*a;p.strokeStyle=c;p.lineWidth=w*width;path();p.stroke();}
  p.globalAlpha=alpha;glow(p,head.x,head.y,48*width,.85);p.fillStyle='#fff0b8';p.beginPath();p.arc(head.x,head.y,8*width,0,TAU);p.fill();
  for(let i=0;i<petals;i++){const u=Math.max(from,progress-i/petals*tail),v=curvePoint(points,u),s=i*2.399+progress*14;p.save();p.translate(v.x+Math.sin(s)*14,v.y+Math.cos(s)*13);p.rotate(s);p.globalAlpha=alpha*(1-i/petals)*.8;p.fillStyle=i%3?'#ffd992':'#f9c1c4';p.beginPath();p.ellipse(0,0,3.5,8,0,0,TAU);p.fill();p.restore();}p.restore();
}
export class SpecialArt {
  constructor(images){this.images=images;this.sprites=new Map();this.deity=null;this.mandala=null;this.mouseParts=null;}
  standingReady(){return complete(this.images.apparition);}
  side(frame,skin){const img=this.images.whisper;if(!complete(img))return null;const key=`${skin}:${frame}`;if(this.sprites.has(key))return this.sprites.get(key);const c=document.createElement('canvas');c.width=384;c.height=512;c.getContext('2d').drawImage(img,frame*img.naturalWidth/4,skin==='male'?img.naturalHeight/2:0,img.naturalWidth/4,img.naturalHeight/2,0,0,384,512);this.sprites.set(key,c);return c;}
  prepareDeity(){
    if(this.deity||!this.standingReady())return;
    const img=this.images.apparition,w=512,h=Math.round(w*img.naturalHeight/img.naturalWidth),s=w/1024;
    const body=document.createElement('canvas'),arm=document.createElement('canvas'),reveal=document.createElement('canvas');
    for(const c of [body,arm,reveal]){c.width=w;c.height=h;}
    const outline=[[73,551],[173,551],[205,637],[259,621],[294,638],[305,693],[266,741],[208,782],[111,783],[76,718]];
    const mask=p=>{p.beginPath();outline.forEach(([x,y],i)=>i?p.lineTo(x*s,y*s):p.moveTo(x*s,y*s));p.closePath();};
    const b=body.getContext('2d'),a=arm.getContext('2d');b.drawImage(img,0,0,w,h);b.globalCompositeOperation='destination-out';mask(b);b.fill();a.save();mask(a);a.clip();a.drawImage(img,0,0,w,h);a.restore();
    this.deity={body,arm,reveal,w,h,pivotX:285*s,pivotY:663*s};
  }
  prepareMandala(){
    if(this.mandala)return this.mandala;const c=document.createElement('canvas');c.width=c.height=720;const p=c.getContext('2d');p.translate(360,360);p.strokeStyle='#efd396';p.lineWidth=1.6;
    for(const r of [176,190,222,236,279,291,326]){p.beginPath();p.arc(0,0,r,0,TAU);p.stroke();}
    for(let i=0;i<24;i++){p.save();p.rotate(i/24*TAU);p.beginPath();p.moveTo(0,-211);p.bezierCurveTo(-44,-254,-26,-303,0,-335);p.bezierCurveTo(26,-303,44,-254,0,-211);p.stroke();p.fillStyle='#ffe1a3';p.beginPath();p.arc(0,-287,3,0,TAU);p.fill();p.restore();}this.mandala=c;return c;
  }
  mouse(p,t,elapsed=null){
    const img=this.images.mushika;if(!complete(img))return;
    if(!this.mouseParts){const body=document.createElement('canvas'),head=document.createElement('canvas');body.width=head.width=390;body.height=head.height=260;const s=390/1536;
      const outline=[[60,300],[190,210],[310,170],[330,100],[430,115],[470,160],[560,160],[650,205],[643,300],[560,370],[530,500],[400,550],[180,500],[70,400]];
      const mask=c=>{c.beginPath();outline.forEach(([x,y],i)=>i?c.lineTo(x*s,y*s):c.moveTo(x*s,y*s));c.closePath();};const b=body.getContext('2d'),h=head.getContext('2d');b.drawImage(img,0,0,390,260);b.globalCompositeOperation='destination-out';mask(b);b.fill();h.save();mask(h);h.clip();h.drawImage(img,0,0,390,260);h.restore();this.mouseParts={body,head};}
    const lift=elapsed===null?0:mushikaLight(elapsed).head*.14;
    p.save();p.translate(MUSHIKA.x,MUSHIKA.y);p.scale(MUSHIKA.width/390,MUSHIKA.height/260);p.drawImage(this.mouseParts.body,0,0);p.translate(140,114);p.rotate(lift);p.translate(-140,-114);p.drawImage(this.mouseParts.head,0,Math.sin(t*1.7)*.25);p.restore();
  }
  actor(pen, hero, pose, sprites, t, reduced) {
    const h = pose.height, w = h * .75;
    pen.save(); pen.fillStyle='#1c0b0a60';pen.beginPath();pen.ellipse(pose.x,pose.y-3,w*.23,10,0,0,TAU);pen.fill();
    if (pose.side) {
      const sprite = this.side(pose.frame, hero.skin);
      if (sprite) {
        const breath = reduced ? 0 : Math.sin(t * 2.1) * (pose.phase === 'whisper' ? .9 : .5);
        pen.translate(pose.x, pose.y); if (pose.flip) pen.scale(-1,1);
        // Foot baselines measured from the atlas; whisper contact remains fixed
        // within one pixel of the ear, independent of breathing and camera zoom.
        const bottom = hero.skin === 'male' ? [480,480,480,480][pose.frame] : [485,485,485,485][pose.frame];
        pen.drawImage(sprite,-w/2,-h*bottom/512+breath,w,h);
      }
    } else {
      const sprite = sprites.get(pose.frame,h,hero.skin); if (sprite) pen.drawImage(sprite,pose.x-w/2,pose.y-h+(pose.bob||0),w,h);
    }
    pen.restore();
  }
  whisper(p,elapsed,pose,t,lotus,light){
    const v=mushikaLight(elapsed),mandala=this.prepareMandala();
    if(v.whisper>0){const pulse=.55+.35*Math.sin(t*9)**2;glow(p,MUSHIKA.earX,MUSHIKA.earY,42,v.whisper*pulse);for(let i=0;i<9;i++){const a=i/9*TAU+t*3;p.fillStyle='#ffe7a4';p.beginPath();p.arc(MUSHIKA.earX+Math.cos(a)*17,MUSHIKA.earY+Math.sin(a)*13,1.5,0,TAU);p.fill();}}
    if(v.orb>0){glow(p,ORB.x,ORB.y,85,v.orb);p.save();p.globalAlpha=v.orb;p.translate(ORB.x,ORB.y);p.rotate(t*.7);p.drawImage(mandala,-44,-44,88,88);p.fillStyle='#ffecac';p.beginPath();p.arc(0,0,12,0,TAU);p.fill();for(let i=0;i<12;i++){const a=i/12*TAU;p.fillStyle='#f7c777';p.beginPath();p.arc(Math.cos(a)*34,Math.sin(a)*34,2.1,0,TAU);p.fill();}p.restore();}
    if(v.phase==='transfer'||v.phase==='receive')trail(p,TRANSMISSION,v.progress,{alpha:v.phase==='receive'?1-(elapsed-10200)/500:1,tail:.72,petals:light?8:20,width:1.6});
    if(v.receive>0){p.save();p.globalAlpha=v.receive*.6;p.translate(540,600);p.rotate(t*.045);p.drawImage(mandala,-260,-260,520,520);p.restore();glow(p,RECEIVER.x,RECEIVER.y,160,v.receive*.55);for(let i=0;i<3;i++){const q=clamp((elapsed-10100-i*110)/1200);p.save();p.globalAlpha=v.receive*(1-q)*.65;p.strokeStyle='#ffe3a2';p.lineWidth=2.5;p.beginPath();p.arc(RECEIVER.x,RECEIVER.y,25+q*180,0,TAU);p.stroke();p.restore();}}
    if(v.phase==='reply'||v.phase==='thanks')trail(p,RESPONSE,v.response,{alpha:v.phase==='thanks'?.85:1,tail:.60,width:1.1,petals:light?8:17});
    if(v.blessing>0){p.save();p.globalAlpha=v.blessing;glow(p,pose.x,pose.y-28,115,.42);ring(p,pose.x,pose.y,64,.8,t);lotus(pose.x,pose.y+6,.95,t);for(let i=0;i<(light?10:22);i++){const a=i*2.399+t*.7,r=45+i%4*12;p.save();p.translate(pose.x+Math.cos(a)*r,pose.y-45+Math.sin(a)*38);p.rotate(a);p.fillStyle=i%2?'#f4b8c6':'#ffe3a1';p.beginPath();p.ellipse(0,0,3,7,0,0,TAU);p.fill();p.restore();}p.restore();}
    return v;
  }
  faceRect(){const b=STANDING_GANESHA,w=b.height*2/3;return screenRect({x:b.x+w*.25,y:b.y+b.height*.12,w:w*.50,h:b.height*.28});}
  apparition(p,elapsed,until,t,lotus,{light=false,reduced=false,blessingElapsedMs=null}={}){
    this.prepareDeity();if(!this.deity)return{opacity:0,angle:0};
    const sec=elapsed/1000,end=until/1000,gather=smooth((sec-1.2)/1.6),reveal=smooth((sec-1.7)/2.5),dissolve=1-smooth((sec-end+3.4)/2.6),opacity=smooth((sec-1.6)/.9)*dissolve;
    const {x,y,height:h}=STANDING_GANESHA,w=h*this.deity.w/this.deity.h,cx=x+w*.5,cy=y+h*.53;
    // The lotus and mandala precede the figure. Darkness has already been drawn
    // behind this layer, so the standing Ganesha keeps its original detail.
    if(gather>0&&dissolve>0){p.save();p.globalAlpha=gather*dissolve;glow(p,cx,cy,h*.60,.60);glow(p,cx,cy,h*.37,.40);const mandala=this.prepareMandala();
      for(let layer=0;layer<2;layer++){p.save();p.translate(cx,cy);p.rotate(reduced?0:t*(layer?-.013:.019));const size=(layer?620:820)*(.76+gather*.24);p.globalAlpha=gather*dissolve*(layer?.38:.65);p.drawImage(mandala,-size/2,-size/2,size,size);p.restore();}
      p.save();p.globalAlpha=gather*dissolve*.18;p.translate(cx,cy);for(let i=0;i<(light?16:28);i++){const a=i/(light?16:28)*TAU+(reduced?0:t*.008);p.save();p.rotate(a);const beam=p.createLinearGradient(0,-150,0,-550);beam.addColorStop(0,'#ffd68a00');beam.addColorStop(.5,'#ffd68a88');beam.addColorStop(1,'#ffd68a00');p.fillStyle=beam;p.beginPath();p.moveTo(-3,-160);p.lineTo(-15,-560);p.lineTo(15,-560);p.lineTo(3,-160);p.closePath();p.fill();p.restore();}p.restore();
      ring(p,cx,y+h+5,140,.65,t);lotus(cx,y+h+12,1.8,t);p.restore();}
    if(opacity<=0)return{opacity:0,angle:0};
    const settle=blessingElapsedMs===null?0:smooth(blessingElapsedMs/1300),angle=reduced?0:(-.14+Math.sin(t*.7)*.015)*settle*dissolve;
    const breath=reduced?0:Math.sin(t*1.05)*2,scale=h/this.deity.h,{body,arm,pivotX,pivotY}=this.deity;
    const drawParts=c=>{c.save();c.translate(pivotX,pivotY);c.rotate(angle);c.translate(-pivotX,-pivotY);c.drawImage(arm,0,0);c.restore();c.drawImage(body,0,0);};
    p.save();p.globalAlpha=opacity;p.translate(x,y+breath);p.scale(scale,scale);
    if(reveal<1){const c=this.deity.reveal.getContext('2d');c.clearRect(0,0,this.deity.w,this.deity.h);drawParts(c);c.globalCompositeOperation='destination-in';const edge=this.deity.h*(1-reveal),g=c.createLinearGradient(0,Math.max(0,edge-30),0,edge+35);g.addColorStop(0,'#fff0');g.addColorStop(1,'#ffff');c.fillStyle=g;c.fillRect(0,0,this.deity.w,this.deity.h);c.globalCompositeOperation='source-over';p.drawImage(this.deity.reveal,0,0);}else drawParts(p);p.restore();
    const donor=GALAXY_PLACE;
    if(settle>0){p.save();p.globalAlpha=settle*dissolve;const beam=p.createLinearGradient(cx,cy,donor.x,donor.y);beam.addColorStop(0,'#ffdc9b08');beam.addColorStop(.35,'#ffdf9b45');beam.addColorStop(1,'#ffc56b05');p.fillStyle=beam;p.beginPath();p.moveTo(cx-50,cy-110);p.quadraticCurveTo(680,820,donor.x+100,donor.y);p.lineTo(donor.x-85,donor.y);p.quadraticCurveTo(620,930,cx-70,cy-85);p.fill();glow(p,donor.x,donor.y-80,180,.35);ring(p,donor.x,donor.y,78,.8,t);lotus(donor.x,donor.y+5,1,t);p.restore();}
    const count=light?40:100;
    p.save();for(let i=0;i<count;i++){const a=i*2.399+t*.15,r=70+i*37%300,burst=(1-dissolve)*2,px=cx+Math.cos(a)*r*(1+burst),py=y+h*(1-reveal)+Math.sin(a)*r*.32+(1-dissolve)*Math.sin(i)*250;
      p.globalAlpha=opacity*(.15+.5*(1-dissolve)+.6*(1-reveal));p.fillStyle=i%3?'#ffe3a3':'#f8b3bf';p.beginPath();p.arc(px,py,1.2+i%3*.8,0,TAU);p.fill();}p.restore();return{opacity,angle};
  }
}
