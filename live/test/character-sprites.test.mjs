import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CharacterSprites } from '../character-sprites.js';

test('partial PNGs cannot poison the character cache; all poses appear after load', () => {
  const images = Object.fromEntries(['female', 'male', 'bows', 'carriers'].map(key =>
    [key, { complete: false, naturalWidth: 1536, naturalHeight: 1024 }]));
  let crops = 0;
  const sprites = new CharacterSprites(images, () => ({
    getContext: () => ({ drawImage: image => { assert.equal(image.complete, true); crops++; } }),
  }));
  for (const skin of ['female', 'male']) for (let frame = 0; frame < 8; frame++) {
    assert.equal(sprites.get(frame, 180, skin), null);
    assert.equal(sprites.get(frame, 180, skin, false, true), null);
    assert.equal(sprites.get(frame, 180, skin, true), null);
  }
  assert.equal(crops, 0); assert.equal(sprites.cache.size, 0);
  // Walking/kneeling can render while the separate bow/carrier sheets load.
  images.female.complete = images.male.complete = true;
  assert.ok(sprites.get(7, 180, 'female')); assert.ok(sprites.get(7, 180, 'male'));
  assert.equal(sprites.ready('bows'), false); assert.equal(sprites.ready('carriers'), false);
  images.bows.complete = images.carriers.complete = true;
  for (const skin of ['female', 'male']) for (let frame = 0; frame < 8; frame++) {
    assert.ok(sprites.get(frame, 180, skin));
    assert.ok(sprites.get(frame, 180, skin, false, true));
    assert.ok(sprites.get(frame, 180, skin, true));
  }
  assert.equal(crops, 32);
  const seated = sprites.get(7, 180, 'female');
  assert.equal(sprites.get(7, 180, 'female'), seated); assert.equal(crops, 32);
});

test('failed images never replace a ready character pose with an empty crop', () => {
  const sprites = new CharacterSprites({ bows: { complete: true, naturalWidth: 0, naturalHeight: 0 } },
    () => { throw new Error('Must not crop a failed image'); });
  assert.equal(sprites.ready('bows'), false);
  assert.equal(sprites.get(2, 180, 'male', false, true), null);
  assert.equal(sprites.ready('female'), false); assert.equal(sprites.get(7, 180), null);
  assert.equal(sprites.cache.size, 0);
});
