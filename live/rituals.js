// One ceremony at a time so simultaneous gifts remain visible.
window.createRitualPlayer = function(root, { duration = 12000, reducedMotion = false } = {}) {
  const queue = [];
  let active = null, elapsed = 0;
  const name = root.querySelector('.ritual-name');
  const label = root.querySelector('.ritual-label');
  const rain = root.querySelector('.petal-rain');
  const petals = [];
  for (let i=0; i<48; i++) {
    const p = document.createElement('i');
    p.className = 'ritual-petal';
    p.style.cssText = `--size:${14+i%6*4}px`;
    petals.push({ element:p, x:((i*137)%1080), y:((i*173)%2120)-100, phase:i*2.399, speed:55+i%7*9, sway:35+i%5*16 });
    rain.append(p);
  }
  function driftPetals() {
    const time = elapsed / 1000 * (reducedMotion ? .5 : 1);
    for (const p of petals) {
      const x = p.x + Math.sin(time*.85+p.phase)*p.sway + Math.sin(time*.31+p.phase)*28;
      const y = ((p.y+100+time*p.speed)%2120)-100;
      const rotation = Math.sin(time*.9+p.phase)*42 + Math.sin(time*.35+p.phase)*22;
      const tilt = .65 + .35*Math.cos(time*1.2+p.phase);
      p.element.style.transform = `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) rotate(${rotation.toFixed(1)}deg) scaleX(${tilt.toFixed(2)})`;
      p.element.style.opacity = Math.min(.85, Math.max(0,(y+80)/140), Math.max(0,(2010-y)/140));
    }
  }
  function next() {
    active = queue.shift() || null; elapsed = 0;
    root.className = ''; root.hidden = !active;
    if (!active) return;
    name.textContent = active.name;
    label.textContent = active.ritual.label;
    driftPetals();
    // Restart CSS animations for consecutive ceremonies of the same kind.
    void root.offsetWidth;
    root.className = `ritual-${active.ritual.kind}${reducedMotion ? ' reduced-motion' : ''}`;
  }
  return {
    enqueue(message) {
      if (!['incense','offering'].includes(message.ritual?.kind)) return;
      queue.push(message); if (!active) next();
    },
    tick(ms) { if (active) { elapsed += ms; if (active.ritual.kind === 'offering') driftPetals(); if (elapsed >= duration) next(); } },
    clear() { queue.length=0; active=null; next(); },
  };
};
