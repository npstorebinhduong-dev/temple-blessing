import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ceremonyCamera } from '../ceremony-camera.js';
import { processionPose } from '../procession.js';
import { RoyalPetals } from '../royal-petals.js';
import { MusicBed } from '../music.js';

test('camera follows both premium processions, keeps the world covering the frame, and returns to wide', () => {
  const from = { x: 880, y: 1710 }, seat = { x: 880, y: 1710 };
  for (const [kind, duration, peak] of [['marigold', 20000, 1.45], ['royal', 24000, 1.62]]) {
    const camera = ms => ceremonyCamera(kind, ms, processionPose(kind, ms, from, seat));
    assert.deepEqual(camera(0), { scale: 1, x: 0, y: 0 });
    assert.ok(camera(3000).scale > 1.2);
    assert.equal(camera(9000).scale, peak);
    for (let t = 0; t <= duration; t += 100) {
      const c = camera(t);
      assert.ok(c.x <= 0 && c.y <= 0);
      assert.ok(c.x + 1080 * c.scale >= 1080 - 1e-6);
      assert.ok(c.y + 1920 * c.scale >= 1920 - 1e-6);
    }
    assert.deepEqual(camera(duration), { scale: 1, x: 0, y: 0 });
    assert.equal(ceremonyCamera(kind, 9000, from, { reduced: true }).scale, 1);
    assert.equal(ceremonyCamera(kind, 9000, from, { enabled: false }).scale, 1);
  }
  assert.equal(ceremonyCamera('lotus', 2000, from).scale, 1);
});

test('royal flower shower covers all quadrants, bursts at offering, and stays bounded through long use', () => {
  let seed = 17;
  const petals = new RoyalPetals({ random: () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) });
  petals.start(0);
  const quadrants = new Set(petals.items.map(p => `${p.x >= 540}:${p.y >= 960}`));
  assert.equal(quadrants.size, 4); assert.equal(petals.items.length, 110);
  for (let ms = 20; ms < 300000; ms += 20) {
    petals.update(ms, .02); assert.ok(petals.items.length <= 320);
  }
  assert.equal(petals.burstDone, true);
  petals.stop(); for (let i = 0; i < 110; i++) petals.update(300000 + i * 20, .02);
  assert.equal(petals.items.length, 0);
  petals.start(400000, { reduced: true }); assert.ok(petals.items.length <= 90);
  petals.reset(); assert.equal(petals.items.length, 0); assert.equal(petals.active, false);
});

function fakeMusic(options = {}) {
  const sources = [], gains = [], statuses = [];
  const ctx = { currentTime: 0, decodeAudioData: async () => ({ duration: 128 }), createBufferSource: () => {
    const source = { connect() {}, disconnect() {}, start() { this.started = true; }, stop() { this.stopped = true; this.onended?.(); } };
    sources.push(source); return source;
  } };
  let fetches = 0;
  const output = { gain: { setTargetAtTime: value => gains.push(value) } };
  const bed = new MusicBed(ctx, output, { onStatus: s => statuses.push(s.state), fetcher: async () => { fetches++; return { ok: true, arrayBuffer: async () => new ArrayBuffer(1) }; }, ...options });
  return { bed, sources, gains, statuses, fetches: () => fetches };
}
const flush = () => new Promise(resolve => setImmediate(resolve));

test('music uses one native looping source, ducks for speech, replays without refetching and supports one-shot', async () => {
  const { bed, sources, gains, fetches } = fakeMusic();
  const settings = { music: true, musicLoop: true, musicVolume: 60 };
  bed.configure(settings); await flush();
  assert.equal(sources.length, 1); assert.equal(sources[0].loop, true); assert.equal(fetches(), 1);
  bed.configure(settings, true); assert.equal(gains.at(-1), .12);
  bed.configure(settings, false); assert.equal(gains.at(-1), .6); assert.equal(sources.length, 1);
  bed.configure({ ...settings, musicLoop: false }); assert.equal(sources[0].loop, false);
  sources[0].onended(); assert.equal(bed.status, 'ended');
  bed.configure({ ...settings, musicLoop: false }); assert.equal(sources.length, 1);
  bed.replay(); assert.equal(sources.length, 2); assert.equal(fetches(), 1);
  bed.replay(); assert.equal(sources[1].stopped, true); assert.equal(sources.length, 3);
  bed.configure({ ...settings, music: false }); assert.equal(gains.at(-1), 0); assert.equal(bed.status, 'off');
});

test('disabling music while it loads cannot start unwanted audio; failed assets report an error', async () => {
  let resolveFetch;
  const pending = new Promise(resolve => { resolveFetch = resolve; });
  const { bed, sources } = fakeMusic({ fetcher: () => pending });
  bed.configure({ music: true }); bed.configure({ music: false });
  resolveFetch({ ok: true, arrayBuffer: async () => new ArrayBuffer(1) }); await flush();
  assert.equal(sources.length, 0); assert.equal(bed.status, 'off');
  bed.configure({ music: true }); assert.equal(sources.length, 1);
  const failed = fakeMusic({ fetcher: async () => ({ ok: false, status: 404 }) });
  failed.bed.configure({ music: true }); await flush();
  assert.equal(failed.bed.status, 'error'); assert.equal(failed.sources.length, 0);
});
