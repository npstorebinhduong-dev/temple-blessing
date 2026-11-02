// Opt-in diagnostics only: overlay.html?debugCamera=1. Never shown on LIVE by default.
export class CameraDebug {
  constructor(stage, enabled) {
    this.enabled = enabled; this.previous = new Map(); this.actors = []; this.lastId = ''; this.before = null;
    if (!enabled) return;
    this.panel = document.createElement('pre'); this.panel.id = 'cameraDebug';
    this.panel.style.cssText = 'position:absolute;z-index:20;left:20px;top:20px;margin:0;padding:12px;background:#08101ded;color:#caffb8;border:1px solid #caffb8;font:15px/1.45 monospace;pointer-events:none;white-space:pre-wrap;max-width:510px';
    stage.append(this.panel);
  }
  begin(active) {
    if (!this.enabled) return;
    this.actors = [];
    if (active && active.turn !== this.turn) {
      this.before = this.previous.get(active.id) || null; this.lastId = active.id; this.turn = active.turn;
    }
  }
  actor(person, pose, geometry, mode, drawnHeight = geometry.height) {
    if (!this.enabled || person.ambient) return;
    this.actors.push({ id: person.id, x: pose.x, y: pose.y, height: drawnHeight, width: geometry.width,
      perspectiveHeight: geometry.perspectiveHeight, entry: geometry.entry,
      localScale: drawnHeight / geometry.height, mode });
  }
  end(controller, active, smallGift) {
    if (!this.enabled) return;
    const actor = this.actors.find(a => a.id === this.lastId) || null;
    const data = { version: '0.10.2', focusId: controller.target, owner: controller.owner,
      system: 'CameraController → #world', world: { ...controller.current }, relative: { ...controller.relative },
      turn: active?.turn || null, kind: active?.ritual.kind || null, before: this.before, actor,
      actors: this.actors, smallGift, state: controller.reason };
    window.__cameraDebug = data;
    const n = v => Number.isFinite(v) ? v.toFixed(4) : '—', c = data.world;
    this.panel.textContent = `DEV 0.10.2 · WORLD CAMERA\nfocus: ${data.focusId || '—'}\nowner: ${data.owner || '—'}\nsystem: CameraController → #world\nworld: s=${n(c.scale)} x=${n(c.x)} y=${n(c.y)}\nactor: ${this.lastId || '—'} / ${actor?.mode || '—'}\nlocal scale before/now: ${n(this.before?.localScale)} / ${n(actor?.localScale)}\nworld height: ${n(actor?.height)}\nperspective height: ${n(actor?.perspectiveHeight)}`;
    this.previous = new Map(this.actors.map(a => [a.id, a]));
  }
}
