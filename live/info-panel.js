import { GIFTS, isSmall, ICON_ATLAS, configuredGift } from './gift-catalog.js';
export function giftIcon(g) {
  const el=document.createElement('span');el.className='guide-icon';el.setAttribute('aria-label',g.thai||g.name);
  const atlas=()=>{el.replaceChildren();if(Number.isInteger(g.cell)){el.classList.add('atlas-icon');el.style.backgroundImage=`url("${ICON_ATLAS}")`;el.style.backgroundPosition=`${-64*(g.cell%24)}px ${-64*Math.floor(g.cell/24)}px`;}else{el.classList.add('icon-unavailable');el.textContent='รูป';}};
  // Catalog pixels are local and stay crisp at their native 64px size.
  if(g.icon){const image=document.createElement('img');image.src=g.icon;image.alt='';image.referrerPolicy='no-referrer';image.onerror=atlas;el.append(image);}
  else atlas();
  return el;
}
export class InfoPanel {
  constructor(root){this.root=root;this.nodes=[];this.page=-1;this.pageCount=1;}
  configure(settings,mode) {
    this.root.style.left=`${settings.infoPanelX??54}px`;this.root.style.top=`${Math.min(235,(settings.infoPanelY??210)+(settings.safeTop||0))}px`;
    const stage=this.root.closest('#stage');stage?.classList.toggle('panel-raised',(settings.infoPanelY??210)<200);
    stage?.classList.toggle('safe-top',!!settings.safeTop);stage?.style.setProperty('--safe-top',`${settings.safeTop||0}px`);
    stage?.style.setProperty('--safe-bottom',`${settings.safeBottom||0}px`);
    const gifts=GIFTS.map(g=>configuredGift(g,settings));
    const grid=this.root.querySelector('#giftGrid');grid.replaceChildren();this.nodes=[];
    const groups={};
    for(const [key,label] of [['small','ของขวัญเล็ก · 5'],['large','พิธีใหญ่ · 4']]){
      const section=document.createElement('section');section.className='gift-group';
      section.dataset.group=key;const title=document.createElement('h3');title.textContent=label;
      section.append(title);grid.append(section);groups[key]=section;
    }
    for(const g of gifts){
      const el=document.createElement('div');el.className=`guide-gift ${['mushika','galaxy'].includes(g.kind)?'special-gift':''}`;el.dataset.kind=g.kind;
      el.classList.toggle('unconfigured',!g.liveReady);el.title=`${g.name} · ${g.coins} · ${g.effect}`;
      const text=document.createElement('span');text.className='guide-copy';
      const name=document.createElement('small');name.className='guide-name';name.textContent=g.thai+(!g.liveReady?' · รอยืนยัน':'');
      const effect=document.createElement('span');effect.className='guide-effect';effect.textContent=g.effect;
      text.append(name,effect);const value=document.createElement('b');value.className='guide-price';value.textContent=g.coins.toLocaleString('en-US');
      el.append(giftIcon(g),text,value);el.dataset.group=isSmall(g.kind)?'small':'large';groups[el.dataset.group].append(el);this.nodes.push(el);
    }
    this.page=-1;
  }
  tick(now,focus=false,label='กำลังถวาย') {
    const page=Math.floor(now/8000)%6;
    if(page!==this.page){
      this.page=page;
      for(const group of ['small','large']){
        const rows=this.nodes.filter(n=>n.dataset.group===group),pages=Math.ceil(rows.length/2);
        rows.forEach((node,i)=>{node.hidden=Math.floor(i/2)!==page%pages;});
      }
      this.root.querySelector('#giftPageCount').textContent=`${page%3+1}/3 · ${page%2+1}/2`;
    }
    this.root.classList.toggle('ceremony-focus',focus);
    const text=this.root.querySelector('.panel-focus');if(text.textContent!==label)text.textContent=label;
  }
}
