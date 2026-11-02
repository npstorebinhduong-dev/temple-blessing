#!/usr/bin/env python3
"""Prepare a 4:40 looping medley from two CC0 Kevin MacLeod recordings.

Requires NumPy and ffmpeg for preparation only; the LIVE app plays the MP3.
See assets/ganesha/music/LICENSE.txt for immutable source URLs and provenance.
Run: python scripts/prepare-eastern-serenity.py --source-dir /path/to/sources
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import numpy as np

RATE = 44100
FADE = 8 * RATE
SOURCE_HASHES = {
    'shambhala.mp3': '5acaf11e067c234493fbd137c97dbdc098f9eb082225af8ad7cd420861ef32a8',
    'midnight-green-house.mp3': '2a13476ce634cb8ec8fa553f212980e8f25e612c717bbd5133d73700d979571c',
}


def decode(path, start, duration):
    # Match the level of two independent recordings before the crossfades.
    data = subprocess.check_output([
        'ffmpeg', '-hide_banner', '-loglevel', 'error', '-ss', str(start),
        '-i', str(path), '-t', str(duration), '-af',
        'highpass=f=35,loudnorm=I=-18:TP=-2:LRA=9',
        '-ar', str(RATE), '-ac', '2', '-f', 'f32le', '-'])
    result = np.frombuffer(data, dtype='<f4').reshape(-1, 2).copy()
    if len(result) != duration * RATE:
        raise ValueError(f'{path.name}: insufficient decoded samples')
    return result


def crossfade(tail, head):
    angle = np.linspace(0, np.pi / 2, len(head), dtype=np.float32)[:, None]
    return tail * np.cos(angle) + head * np.sin(angle)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path, default=Path('assets/ganesha/music/eastern-serenity.mp3'))
    args = parser.parse_args()
    sources = [args.source_dir / 'shambhala.mp3', args.source_dir / 'midnight-green-house.mp3']
    hashes = {p.name: hashlib.sha256(p.read_bytes()).hexdigest() for p in sources}
    if hashes != SOURCE_HASHES:
        raise ValueError('Source hashes differ from the documented CC0 recordings')
    first = decode(sources[0], 4, 146)
    second = decode(sources[1], 12, 150)
    joined = np.concatenate([first[:-FADE], crossfade(first[-FADE:], second[:FADE]), second[FADE:]])
    # Circular overlap joins the end to the beginning before MP3 encoding.
    # The output starts just after the overlap: 146 + 150 - 8 - 8 = 280 s.
    loop = np.concatenate([joined[FADE:-FADE], crossfade(joined[-FADE:], joined[:FADE])])
    assert len(loop) == 280 * RATE
    peak = float(np.max(np.abs(loop))); rms = float(np.sqrt(np.mean(loop ** 2)))
    loop *= min(.88 / peak, .14 / rms)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix='ganesha-eastern-music-') as directory:
        raw = Path(directory) / 'loop.f32'; loop.astype('<f4').tofile(raw)
        subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
            '-f', 'f32le', '-ar', str(RATE), '-ac', '2', '-i', str(raw),
            '-codec:a', 'libmp3lame', '-b:a', '160k',
            '-metadata', 'title=Eastern Serenity - 4:40 LIVE medley',
            '-metadata', 'artist=Kevin MacLeod', '-metadata', 'album=Ganesha LIVE',
            '-metadata', 'copyright=CC0 1.0 / Public Domain; edited medley',
            '-metadata', 'comment=The Hidden Valley of Shambhala + Midnight in the Green House; trim, level matching and circular crossfade for Ganesha LIVE',
            str(args.output)], check=True)
    print(json.dumps({'duration': len(loop) / RATE, 'peak': float(np.max(np.abs(loop))),
        'rms': float(np.sqrt(np.mean(loop ** 2))),
        'seam_step': float(np.max(np.abs(loop[0] - loop[-1]))), 'sources': hashes,
        'output_sha256': hashlib.sha256(args.output.read_bytes()).hexdigest(),
        'bytes': args.output.stat().st_size}, indent=2))


if __name__ == '__main__':
    main()
