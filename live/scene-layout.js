// One fixed framing for the physical shrine. Gift cameras affect foreground
// guests only; the seated deity never scales or moves during a ceremony.
export const SCENE_VIEW = Object.freeze({ scale: .84, x: 86.4, y: 270 });
export const STANDING_GANESHA = Object.freeze({ x: -90, y: 400, height: 950 });
export const PANEL_BOUNDS = Object.freeze({ minX: 18, maxX: 90, minY: 140, maxY: 235, width: 972, height: 282 });
export function sceneCamera(camera = { scale: 1, x: 0, y: 0 }) {
  return { scale: camera.scale * SCENE_VIEW.scale, x: camera.x * SCENE_VIEW.scale + SCENE_VIEW.x, y: camera.y * SCENE_VIEW.scale + SCENE_VIEW.y };
}
export const screenRect = (r, camera = SCENE_VIEW) => ({ x: r.x * camera.scale + camera.x, y: r.y * camera.scale + camera.y, w: r.w * camera.scale, h: r.h * camera.scale });
