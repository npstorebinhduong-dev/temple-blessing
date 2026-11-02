import { FRONT_SIZE, entrancePosition } from './entrance-line.js';
import { actorPhase } from './devotion.js';
const segmenter = new Intl.Segmenter('th',{granularity:'grapheme'});
const cut = (pen,text,width) => {
  const chars=[...segmenter.segment(text)].map(x=>x.segment);
  if(pen.measureText(text).width<=width)return text;
  while(chars.length && pen.measureText(chars.join('')+'…').width>width)chars.pop();
  return chars.join('')+'…';
};
// The crowd uses the same game characters as the kneeling area. No profile
// pictures, network requests, portrait frames, or per-viewer DOM elements.
export class ShoulderCrowd {
  constructor(images) { this.images=images;this.people=[];this.tiles=new Map();this.sprites=new Map();this.promotions=[]; }
  update(people) {
    this.people=[...people].sort((a,b)=>entrancePosition(a.lineSlot).layer-entrancePosition(b.lineSlot).layer || a.lineSlot-b.lineSlot);
  }
  promote(person,now) {
    this.promotions=this.promotions.filter(x=>x.person.id!==person.id);
    this.promotions.push({person:{...person},at:now});if(this.promotions.length>2)this.promotions.shift();
  }
  reset() { this.people=[];this.promotions=[]; }
  sprite(skin,variation) {
    const img=this.images[skin==='male'?'male':'female'];if(!img?.complete||!img.naturalWidth)return null;
    const key=`${skin}:${variation}`;if(this.sprites.has(key))return this.sprites.get(key);
    const c=document.createElement('canvas');c.width=180;c.height=175;
    // Crop the existing back-facing standing pose through shoulders/upper back.
    // The next row and the bottom vignette naturally occlude the lower edge.
    const sx=variation*img.naturalWidth/4,sy=0,scale=img.naturalWidth/1536;
    c.getContext('2d').drawImage(img,sx+103*scale,sy+5*scale,180*scale,175*scale,0,0,180,175);
    this.sprites.set(key,c);return c;
  }
  label(pen,name,width,near,layer) {
    const key=JSON.stringify([name,width,near,layer]);if(this.tiles.has(key))return this.tiles.get(key);
    pen.font=`700 ${near?25:17+layer}px Thai, Latin, sans-serif`;const txt=cut(pen,name,width-8);
    const c=document.createElement('canvas');c.width=width;c.height=near?39:29;const p=c.getContext('2d');
    p.fillStyle=near?'#160c11e8':'#160c11c7';p.beginPath();p.roundRect(0,0,width,c.height,5);p.fill();
    p.strokeStyle='#ead19c44';p.lineWidth=1;p.beginPath();p.moveTo(4,.5);p.lineTo(width-4,.5);p.stroke();
    p.font=pen.font;p.textAlign='center';p.textBaseline='middle';p.fillStyle='#fff1ce';p.fillText(txt,width/2,c.height/2-1);
    if(this.tiles.size>=176)this.tiles.delete(this.tiles.keys().next().value);this.tiles.set(key,c);return c;
  }
  draw(pen,now,{light=false,reduced=false}={}) {
    const visible=light?this.people.filter(p=>p.lineSlot<=FRONT_SIZE || (p.lineSlot-FRONT_SIZE)%2===0):this.people;
    pen.fillStyle='#140b0b99';pen.fillRect(0,1696,1080,224);
    for(const p of visible){
      const pos=entrancePosition(p.lineSlot),near=p.lineSlot<=FRONT_SIZE,phase=actorPhase(p.id)*Math.PI*2;
      const h=near?118:72+pos.layer*13,w=h*180/175;
      const top=near?1796:1698+pos.layer*34,fade=reduced?1:Math.min(1,Math.max(0,(now-p.shown)/800));
      const dx=reduced?0:Math.sin(now/2700+phase)*(near?1.3:.5),dy=reduced?0:Math.sin(now/1900+phase)*.75;
      const sprite=this.sprite(p.skin,Math.floor(actorPhase(p.id)*4)%4);
      if(sprite){pen.save();pen.globalAlpha=fade;pen.translate(pos.x+dx,top+h+dy+(1-fade)*12);pen.rotate(reduced?0:Math.sin(now/3700+phase)*.008);pen.drawImage(sprite,-w/2,-h,w,h);pen.restore();}
    }
    // Names occupy staggered bands rather than covering every face. Near names
    // stay large, while distant rows alternate slight vertical offsets.
    for(const p of visible){
      const pos=entrancePosition(p.lineSlot),near=p.lineSlot<=FRONT_SIZE;
      // Distant neighbours share a name band, taking turns without moving any
      // body or changing queue order. This leaves room for Thai graphemes.
      if(!near&&!light&&(p.lineSlot-FRONT_SIZE)%2!==Math.floor(now/6000)%2)continue;
      const width=near?103:76;
      const y=near?1878:1745+pos.layer*36+(p.lineSlot%2)*5;
      const label=this.label(pen,p.name,width,near,pos.layer);pen.drawImage(label,Math.max(1,Math.min(1079-width,pos.x-width/2)),y);
    }
    this.promotions=this.promotions.filter(x=>now-x.at<1500);
    for(const {person,at} of this.promotions){
      const u=(now-at)/1500,slot=person.lineSlot||person.entryLineSlot||5,pos=entrancePosition(slot),x=pos.x;
      pen.save();pen.globalAlpha=Math.sin(Math.PI*Math.min(1,u));
      const near=slot<=FRONT_SIZE,h=near?118:72+pos.layer*13,w=h*180/175,top=near?1796:1698+pos.layer*34;
      const selected=this.sprite(person.skin,Math.floor(actorPhase(person.id)*4)%4);
      if(selected)pen.drawImage(selected,x-w/2,top,w,h);
      pen.strokeStyle='#ffe7a4';pen.lineWidth=2;pen.beginPath();pen.ellipse(x,top+h*.45,w*.44,h*.48,0,0,Math.PI*2);pen.stroke();
      pen.font='700 27px Thai, Latin, sans-serif';const text=`ถึงคิว · ${person.name}`,labelWidth=Math.min(1000,pen.measureText(text).width+38);
      pen.fillStyle='#211117ed';pen.beginPath();pen.roundRect(540-labelWidth/2,1698,labelWidth,44,15);pen.fill();pen.fillStyle='#ffe6a3';pen.textAlign='center';pen.textBaseline='middle';pen.fillText(text,540,1720,labelWidth-20);pen.restore();
    }
    return visible.length;
  }
}
