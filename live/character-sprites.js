// Cache only fully loaded character sheets. A PNG exposes its dimensions
// before its pixels arrive; cropping then can cache an invisible pose forever.
export class CharacterSprites {
  constructor(images, createCanvas = () => document.createElement('canvas')) {
    this.images = images;
    this.createCanvas = createCanvas;
    this.cache = new Map();
  }
  ready(asset) {
    const image = this.images[asset];
    return !!(image?.complete && image.naturalWidth > 0 && image.naturalHeight > 0);
  }
  get(frame, height, skin = 'female', carrier = false, bow = false) {
    const asset = bow ? 'bows' : carrier ? 'carriers' : skin === 'male' ? 'male' : 'female';
    if (!this.ready(asset)) return null;
    const sprite = this.images[asset];
    if (carrier || bow) frame = frame % 4 + (skin === 'male' ? 4 : 0);
    const h = Math.ceil(height / 12) * 12, key = `${asset}:${frame}:${h}`;
    let cached = this.cache.get(key);
    if (!cached) {
      cached = this.createCanvas(); cached.height = h; cached.width = Math.ceil(h * .75);
      const cw = sprite.naturalWidth / 4, ch = sprite.naturalHeight / 2;
      const bottoms = bow ? [480,483,479,486,467,467,464,467] : carrier ? [501,503,490,486,476,476,473,473] : skin === 'male' ? [500,499,500,502,448,443,444,444] : [505,506,506,507,462,450,447,443];
      const scale = bow ? .87 : 1, dh = h * scale, dw = cached.width * scale;
      const y = bottoms ? h - dh * bottoms[frame] / 512 : 0;
      cached.getContext('2d').drawImage(sprite, frame % 4 * cw, Math.floor(frame / 4) * ch, cw, ch, (cached.width - dw) / 2, y, dw, dh);
      if (this.cache.size >= 512) this.cache.delete(this.cache.keys().next().value);
      this.cache.set(key, cached);
    }
    return cached;
  }
}
