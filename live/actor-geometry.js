// One world-space stature for every actor, regardless of gift, pose or camera.
// This is the existing seated/walking perspective, now shared by ceremonies.
export const ACTOR_DENSITY = Math.pow(.6, .6);
export function actorHeight(y, density = ACTOR_DENSITY) {
  const depth = Math.max(0, Math.min(1.4, (y - 1230) / 480));
  return (245 + 105 * depth) * density;
}
export function actorGeometry(person, pose = person, seconds = Infinity) {
  const perspectiveHeight = actorHeight(pose.y, person.seat?.density ?? ACTOR_DENSITY);
  const entry = person.entryStart == null ? 1 : Math.max(0, Math.min(1, (seconds - person.entryStart) / 2));
  const height = 128 + (perspectiveHeight - 128) * entry;
  return { height, width: height * .75, perspectiveHeight, entry };
}
