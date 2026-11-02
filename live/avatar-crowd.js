import { entrancePosition, FRONT_SIZE } from './entrance-line.js';
const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
const cut = (pen, text, width) => {
  const chars = [...segmenter.segment(text)].map(s => s.segment);
  if (pen.measureText(text).width <= width) return text;
  while (chars.length && pen.measureText(chars.join('') + '…').width > width) chars.pop();
  return chars.join('') + '…';
};
export function avatarURL(value) {
  try { const u = new URL(String(value)); return ['https:', 'http:'].includes(u.protocol) && !u.username && !u.password && u.href.length < 2048 ? u.href : ''; }
  catch { return ''; }
}
// Bounded image cache and request concurrency. Failed images use a local monogram.
export class AvatarCache {
  constructor(limit = 112) { this.limit = limit; this.items = new Map(); this.loading = 0; this.wanted = []; }
  configure(people) {
    this.wanted = [...new Set(people.map(p => avatarURL(p.avatar)).filter(Boolean))]; this.pump();
  }
  pump() {
    for (const url of this.wanted) {
      if (this.loading >= 4) break;
      if (this.items.has(url)) continue;
      if (this.items.size >= this.limit) {
        const evict = [...this.items].find(([u, x]) => !x.loading && !this.wanted.includes(u));
        if (!evict) break;
        this.items.delete(evict[0]);
      }
      const img = new Image(), item = { image: img, ready: false, loading: true };
      this.items.set(url, item); this.loading++;
      let done = false;
      const finish = ok => {
        if (done) return; done = true; clearTimeout(timer);
        if (ok) {
          // Keep a thumbnail, not 112 full-resolution profile photos in memory.
          const thumb = document.createElement('canvas'); thumb.width = thumb.height = 96;
          const side = Math.min(img.naturalWidth, img.naturalHeight);
          thumb.getContext('2d').drawImage(img, (img.naturalWidth-side)/2, (img.naturalHeight-side)/2, side, side, 0, 0, 96, 96);
          item.image = thumb;
        }
        img.onload = img.onerror = null; img.src = ''; item.loading = false; item.ready = ok; this.loading--; this.pump();
      };
      const timer = setTimeout(() => { finish(false); img.src = ''; }, 8000);
      img.referrerPolicy = 'no-referrer'; img.onload = () => finish(img.naturalWidth > 0); img.onerror = () => finish(false); img.src = url;
    }
  }
  get(url) { const x = this.items.get(avatarURL(url)); return x?.ready ? x.image : null; }
}
export class AvatarCrowd {
  constructor() { this.cache = new AvatarCache(); this.people = []; this.far = []; this.front = []; this.lightPeople = []; this.highlight = null; this.tiles = new Map(); }
  update(people) {
    this.people = [...people].sort((a, b) => entrancePosition(a.lineSlot).layer - entrancePosition(b.lineSlot).layer || a.lineSlot - b.lineSlot);
    this.cache.configure(this.people);
    for (const p of this.people) p.avatarURL = avatarURL(p.avatar);
    this.far = this.people.filter(p => p.lineSlot > FRONT_SIZE); this.front = this.people.filter(p => p.lineSlot <= FRONT_SIZE);
    this.lightPeople = [...this.far.filter(p => (p.lineSlot - FRONT_SIZE) % 2 === 0), ...this.front];
  }
  tile(p, pos) {
    const img = this.cache.items.get(p.avatarURL)?.ready ? this.cache.items.get(p.avatarURL).image : null;
    const near = pos.layer === 3, r = pos.radius, labelWidth = near ? 103 : 62;
    const key = JSON.stringify([p.name,p.avatarURL,!!img,r,pos.layer,p.lineSlot%5,!!p.demo]);
    if(this.tiles.has(key))return this.tiles.get(key);
    const tile=document.createElement('canvas');tile.width=Math.max(labelWidth+4,r*2+6);tile.height=r*2+(near?33:24)+4;
    const pen=tile.getContext('2d'),x=tile.width/2,y=r+2;
    pen.fillStyle='#170b12cc';pen.beginPath();pen.arc(x,y,r+2,0,Math.PI*2);pen.fill();
    pen.save();pen.beginPath();pen.arc(x,y,r,0,Math.PI*2);pen.clip();
    if(img)pen.drawImage(img,x-r,y-r,r*2,r*2);
    else {
      const colors=['#784f43','#494f62','#586455','#705479','#7e6336'];pen.fillStyle=colors[p.lineSlot%colors.length];pen.fillRect(x-r,y-r,r*2,r*2);
      pen.fillStyle='#ffedc5';pen.font=`700 ${r*.9}px Thai, Latin, sans-serif`;pen.textAlign='center';pen.textBaseline='middle';
      pen.fillText([...segmenter.segment(p.name||'✧')][0]?.segment||'✧',x,y-1);
      pen.strokeStyle='#efd49144';pen.lineWidth=1;pen.beginPath();pen.arc(x,y,r-4,0,6.28);pen.stroke();
    }
    pen.restore();pen.strokeStyle=p.demo?'#c9ad7cbb':'#f6db9dbb';pen.lineWidth=1.2;pen.beginPath();pen.arc(x,y,r,0,Math.PI*2);pen.stroke();
    pen.font=`700 ${near?22:12+pos.layer}px Thai, Latin, sans-serif`;const text=cut(pen,p.name,labelWidth-8);
    pen.fillStyle=near?'#10090de8':'#10090db3';pen.beginPath();pen.roundRect(x-labelWidth/2,y+r-1,labelWidth,near?29:20,9);pen.fill();
    pen.fillStyle='#fff2d9';pen.textAlign='center';pen.textBaseline='middle';pen.fillText(text,x,y+r+(near?12:8));
    if(this.tiles.size>=176)this.tiles.delete(this.tiles.keys().next().value);this.tiles.set(key,tile);return tile;
  }
  draw(pen, now, { light = false, reduced = false } = {}) {
    const featured = this.far.length ? this.far[Math.floor(now / 6500) % this.far.length] : null;
    this.highlight = featured?.id;
    const visible = light ? this.lightPeople : this.people;
    const nudges = new Map();
    if(!reduced)for(const p of this.people)if(now-p.shown<900){const n=Math.sin(Math.max(0,now-p.shown)/900*Math.PI)*4;nudges.set(p.lineSlot-1,-n);nudges.set(p.lineSlot+1,n);}
    for (const p of visible) {
      const pos=entrancePosition(p.lineSlot),fade=reduced?1:Math.min(1,Math.max(0,now-p.shown)/800);
      const x=pos.x+(nudges.get(p.lineSlot)||0),y=pos.y+(1-fade)**2*23,tile=this.tile(p,pos);
      pen.save();pen.globalAlpha=fade;pen.drawImage(tile,x-tile.width/2,y-pos.radius-2);
      if(featured?.id===p.id){pen.strokeStyle='#ffe8ac';pen.lineWidth=2;pen.beginPath();pen.arc(x,y,pos.radius+1,0,Math.PI*2);pen.stroke();}
      pen.restore();
    }
    if (featured) {
      pen.save(); pen.font = '700 23px Thai, Latin, sans-serif'; pen.textAlign = 'center'; pen.textBaseline = 'middle';
      const text = featured.name, w = Math.min(1000, pen.measureText(text).width + 60);
      pen.fillStyle = '#160d15e8'; pen.beginPath(); pen.roundRect(540 - w / 2, 1700, w, 35, 16); pen.fill();
      pen.fillStyle = '#ffe5b3'; pen.fillText(text, 540, 1718, 970); pen.restore();
    }
    return visible.length;
  }
}
