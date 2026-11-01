// One ceremony at a time so simultaneous gifts remain visible.
window.createRitualPlayer = function(root, { duration = 12000, reducedMotion = false } = {}) {
  const queue = [];
  let active = null, elapsed = 0;
  const name = root.querySelector('.ritual-name');
  const label = root.querySelector('.ritual-label');
  const rain = root.querySelector('.petal-rain');
  for (let i=0; i<64; i++) {
    const p = document.createElement('i');
    p.className = 'ritual-petal';
    p.style.cssText = `left:${(i*37)%100}%;top:${(i*53)%100}%;--delay:-${(i*.37)%8}s;--fall:${7+i%5}s;--drift:${(i%2?1:-1)*(40+i%7*18)}px;--size:${14+i%6*5}px`;
    rain.append(p);
  }
  function next() {
    active = queue.shift() || null; elapsed = 0;
    root.className = ''; root.hidden = !active;
    if (!active) return;
    name.textContent = active.name;
    label.textContent = active.ritual.label;
    // Restart CSS animations for consecutive ceremonies of the same kind.
    void root.offsetWidth;
    root.className = `ritual-${active.ritual.kind}${reducedMotion ? ' reduced-motion' : ''}`;
  }
  return {
    enqueue(message) {
      if (!['incense','offering'].includes(message.ritual?.kind)) return;
      queue.push(message); if (!active) next();
    },
    tick(ms) { if (active) { elapsed += ms; if (elapsed >= duration) next(); } },
    clear() { queue.length=0; active=null; next(); },
  };
};
