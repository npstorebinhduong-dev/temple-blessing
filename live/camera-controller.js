import { ceremonyCamera } from './ceremony-camera.js';
import { specialCamera } from './special-rituals.js';
import { SCENE_VIEW, sceneCamera } from './scene-layout.js';

const identity = () => ({ scale: 1, x: 0, y: 0 });
const keyOf = active => active ? `${active.turn}:${active.serverBeganAt ?? active.beganAt}` : null;
const point = p => p && Number.isFinite(p.x) && Number.isFinite(p.y);
const valid = c => point(c) && Number.isFinite(c.scale) && c.scale > 0;

// Ownership/restoration only. The six legacy curves, target formulas, zoom
// strengths and timings in ceremony-camera.js are unchanged from v0.8 4bf9b79.
// The server FIFO supplies the ONLY active turn. Intake never drives a camera.
export class CameraController {
  constructor(base = SCENE_VIEW) {
    this.home = { ...base }; this.current = { ...base }; this.before = null;
    this.owner = null; this.target = ''; this.blocked = null;
    this.relative = identity(); this.reason = 'wide';
  }
  release(reason = 'wide') {
    this.current = { ...(this.before || this.current) }; this.before = null;
    this.owner = null; this.target = ''; this.relative = identity(); this.reason = reason;
    return this.current;
  }
  reset() { this.blocked = null; return this.release('reset'); }
  cancel(reason = 'cancelled') {
    this.blocked = this.owner; return this.release(reason);
  }
  accept(active, target) {
    const key = keyOf(active);
    if (!key) { this.blocked = null; this.release(); return false; }
    if (this.owner && this.owner !== key) this.release();
    if (this.blocked === key) return false;
    if (!target || target.id !== active.id || !point(target) || !target.seat) {
      if (this.owner) this.cancel('missing-target');
      else this.reason = 'waiting-target';
      return false;
    }
    if (!this.owner) {
      this.before = { ...this.current }; this.owner = key; this.target = active.id;
    }
    return true;
  }
  sample(active, now, pose, options = {}) {
    if (this.owner !== keyOf(active)) return this.current;
    try {
      if (!point(pose)) return this.cancel('invalid-focus');
      const special = ['mushika', 'galaxy'].includes(active.ritual.kind);
      const relative = special ? specialCamera() : ceremonyCamera(active.ritual.kind, now - active.beganAt, pose,
        { ...options, durationMs: active.until - active.beganAt });
      if (!valid(relative)) return this.cancel('invalid-camera');
      this.relative = relative; this.current = sceneCamera(relative, this.before);
      this.reason = special ? 'special-wide' : 'legacy-focus';
      return this.current;
    } catch { return this.cancel('camera-error'); }
  }
}
