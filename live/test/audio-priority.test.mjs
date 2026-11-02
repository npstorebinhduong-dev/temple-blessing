import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SceneAudio } from '../audio.js';

test('browser playback interrupts an idle reminder for a gift and never overlaps speech', t => {
  const playing = new Set(), created = [], reports = [];
  class FakeAudio {
    constructor(url) { this.url = url; created.push(this); }
    play() { playing.add(this); assert.equal(playing.size, 1); this.onplaying?.(); return Promise.resolve(); }
    pause() { playing.delete(this); }
    end() { playing.delete(this); this.onended?.(); }
  }
  t.mock.method(globalThis, 'setTimeout', () => 0);
  const originalAudio = globalThis.Audio; globalThis.Audio = FakeAudio;
  t.after(() => { if (originalAudio === undefined) delete globalThis.Audio; else globalThis.Audio = originalAudio; });
  const audio = new SceneAudio({ onSpeechState: status => reports.push(status) });
  audio.ctx = { state: 'running', createMediaElementSource: () => ({ connect() {}, disconnect() {} }) };
  audio.configure = () => {}; audio.settings = { voiceEnabled: true };
  audio.speech('/idle.mp3', 'idle', 'idle-1'); assert.equal(playing.size, 1);
  audio.speech('/idle-duplicate.mp3', 'idle'); assert.equal(created.length, 1);
  audio.giftPriority(); assert.equal(playing.size, 0);
  assert.equal(reports.filter(r => r.id === 'idle-1' && r.state === 'cancelled').length, 1);
  audio.speech('/gift-a.mp3', 'gift', 'gift-a'); audio.speech('/gift-b.mp3', 'gift', 'gift-b');
  audio.speech('/idle-during-gift.mp3', 'idle'); assert.equal(audio.queue.length, 1);
  created.at(-1).end(); assert.equal(created.at(-1).url, '/gift-b.mp3');
  assert.equal(reports.filter(r => r.id === 'gift-a' && r.state === 'ended').length, 1);
  assert.equal(reports.some(r => r.id === 'gift-b' && r.state === 'ended'), false);
  audio.clear(); assert.equal(playing.size, 0); assert.equal(audio.queue.length, 0);
  audio.settings.voiceEnabled = false; audio.speech('/muted.mp3', 'gift'); assert.equal(playing.size, 0);
  assert.equal(reports.at(-1).state, 'skipped');
});
