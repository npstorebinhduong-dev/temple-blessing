// One world-space stature for every actor, regardless of gift, pose or camera.
// This is the existing seated/walking perspective, now shared by ceremonies.
export const ACTOR_DENSITY = Math.pow(.6, .6);
export function actorHeight(y, density = ACTOR_DENSITY) {
  const depth = Math.max(0, Math.min(1.4, (y - 1230) / 480));
  return (245 + 105 * depth) * density;
}
export function actorGeometry(person, pose = person, seconds = Infinity) {
  const perspectiveHeight = actorHeight(pose.y, person.seat?.density ?? ACTOR_DENSITY);
  return { height: perspectiveHeight, width: perspectiveHeight * .75, perspectiveHeight, entry: 1 };
}
export function entryWorldPoint(screenPoint, camera) {
  // Queue anchors are authored in the resting viewport and converted once to
  // world coordinates. The queue and full actor then share the world camera.
  // Align the emerging head with its previous row, letting the crowd mask the body.
  const headY = screenPoint.layer === 3 ? 1796 : 1698 + (screenPoint.layer || 0) * 34;
  let y = (headY - camera.y) / camera.scale + 280;
  for (let i=0;i<5;i++) y = (headY - camera.y) / camera.scale + actorHeight(y) * .975;
  return { x: (screenPoint.x - camera.x) / camera.scale, y };
}
