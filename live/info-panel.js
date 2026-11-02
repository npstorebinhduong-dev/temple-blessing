const BASE_GIFTS = [
  ['lotus','🌹',1,'ถวายบัว'], ['incense','🍑',5,'จุดธูป'], ['garland','👌',5,'มาลัย'],
  ['aarti','🍀',10,'อารตี'], ['marigold','💐',100,'ดาวเรือง'], ['royal','🎈',500,'มหาบูชา'],
];
// These are short Thai descriptions of the effects, not invented catalog names.
export class InfoPanel {
  constructor(root) { this.root = root; this.nodes = []; this.page = -1; this.lastPageAt = null; }
  configure(settings, mode) {
    this.root.style.left = `${settings.infoPanelX ?? 54}px`;
    this.root.style.top = `${settings.infoPanelY ?? 210}px`;
    this.root.closest('#stage')?.classList.toggle('panel-raised', (settings.infoPanelY ?? 210) < 200);
    const gifts = [
      ['mushika','',299,'ส่งคำขอ'], ['galaxy','',1000,'รับพร'], ...BASE_GIFTS,
    ];
    const grid = this.root.querySelector('#giftGrid'); grid.replaceChildren(); this.nodes = [];
    for (const [kind, emoji, coins, effect] of gifts) {
      const el = document.createElement('div'); el.className = `guide-gift ${coins >= 299 ? 'special-gift' : ''}`;
      el.dataset.kind = kind;
      const isNew = ['mushika','galaxy'].includes(kind), icon = isNew ? settings[`${kind}GiftIcon`] : '';
      const ready = !isNew || mode === 'demo' || !!settings[`${kind}GiftId`] || new RegExp(`=\\s*${kind}(?:\\s|$)`).test(settings.giftMap || '');
      const glyph = document.createElement('span'); glyph.className = 'guide-icon'; glyph.textContent = icon ? '' : emoji || '✧';
      if (icon) {
        const image = document.createElement('img'); image.src = icon; image.alt = ''; image.referrerPolicy = 'no-referrer';
        image.onerror = () => { image.hidden = true; glyph.classList.add('icon-unavailable'); glyph.append(document.createTextNode('✧')); }; glyph.append(image);
      }
      const label = document.createElement('span'); label.className = 'guide-effect'; label.textContent = ready ? effect : 'รอตั้งค่า';
      const value = document.createElement('b'); value.className = 'guide-price'; value.textContent = coins.toLocaleString('en-US');
      el.classList.toggle('unconfigured', !ready); el.title = settings[`${kind}GiftName`] || effect;
      el.append(glyph,label,value); grid.append(el); this.nodes.push(el);
    }
    this.page = -1; this.lastPageAt = null;
  }
  tick(now, focus = false) {
    // Keep the two special gifts visible; rotate just the two ordinary cells.
    const page = Math.floor(now / 8000) % 3;
    if (page !== this.page) {
      this.page = page;
      this.nodes.forEach((node,i) => { node.hidden = i >= 2 && Math.floor((i-2)/2) !== page; });
      this.root.querySelector('#giftPageCount').textContent = `${page+1}/3`;
    }
    this.root.classList.toggle('ceremony-focus', focus);
  }
}
