const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
export class Nameplates {
  constructor() { this.items = []; this.cache = new Map(); }
  add(person, x, y, width, focus = false) { this.items.push({ person, x, y, width, focus }); }
  clear() { this.items.length = 0; }
  badge(pen, text, width, focus) {
    const key = JSON.stringify([text, Math.round(width), focus]);
    if (this.cache.has(key)) return this.cache.get(key);
    const size = focus ? 26 : 22; pen.font = `700 ${size}px Thai, Latin, sans-serif`;
    const chars = [...segmenter.segment(text)].map(x => x.segment), lines = [];
    if (focus) {
      let line = '';
      for (const ch of chars) {
        if (line && pen.measureText(line + ch).width > width - 24) { lines.push(line); line = ''; }
        line += ch;
      }
      if (line) lines.push(line);
    } else {
      let short = text;
      if (pen.measureText(short).width > width - 20) {
        while (chars.length && pen.measureText(chars.join('') + '…').width > width - 20) chars.pop();
        short = chars.join('') + '…';
      }
      lines.push(short);
    }
    const w = Math.ceil(Math.min(width, Math.max(...lines.map(s => pen.measureText(s).width)) + 24)), h = 42 + (lines.length - 1) * 37;
    const badge = document.createElement('canvas'); badge.width = w + 4; badge.height = h + 4;
    const b = badge.getContext('2d'); b.fillStyle = focus ? '#271218e6' : '#170c12cc'; b.strokeStyle = focus ? '#ffe3a3' : '#daba7b9c'; b.lineWidth = 1;
    b.beginPath(); b.roundRect(1.5, 1.5, w + 1, h + 1, 13); b.fill(); b.stroke();
    b.font = pen.font; b.fillStyle = '#fff4da'; b.textAlign = 'center'; b.textBaseline = 'middle';
    lines.forEach((line, i) => b.fillText(line, badge.width / 2, 22 + i * 37));
    if (this.cache.size >= 256) this.cache.delete(this.cache.keys().next().value);
    this.cache.set(key, badge); return badge;
  }
  draw(pen, camera, exclusions = []) {
    const used = [];
    // A separate pass above ALL bodies; labels never deform with a bow.
    for (const item of this.items.sort((a, b) => Number(a.focus) - Number(b.focus) || (a.person.slot || 61) - (b.person.slot || 61))) {
      const x = item.x * camera.scale + camera.x, y = item.y * camera.scale + camera.y;
      if (x < -40 || x > 1120 || y < 990 || y > 1705) continue;
      // Fixed pixel size keeps text sharp and avoids regenerating dozens of
      // badge canvases every frame while the camera changes scale.
      const width = item.focus ? 520 : Math.min(145, item.width);
      const badge = this.badge(pen, item.person.name, width, item.focus), w = badge.width, h = badge.height;
      const left = Math.max(8, Math.min(1072 - w, x - w / 2));
      let top = Math.max(1000, Math.min(1690 - h, y - h));
      if (exclusions.some(r => left < r.x + r.w && left + w > r.x && top < r.y + r.h && top + h > r.y)) continue;
      const intersects = y0 => used.some(r => left < r.x + r.w + 2 && left + w + 2 > r.x && y0 < r.y + r.h + 2 && y0 + h + 2 > r.y);
      if (intersects(top) && !item.focus) {
        const options = [-23, 23, -12, 12];
        const offset = options.find(d => top + d >= 1000 && top + d + h <= 1700 && !intersects(top + d));
        if (offset !== undefined) top += offset;
      }
      if (Math.abs(top + h - y) > 8) { pen.strokeStyle = '#e8ca8f80'; pen.lineWidth = 1; pen.beginPath(); pen.moveTo(x, y); pen.lineTo(left + w / 2, top + h); pen.stroke(); }
      pen.drawImage(badge, left, top); used.push({ x: left, y: top, w, h });
    }
  }
}
