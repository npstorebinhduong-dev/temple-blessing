#!/usr/bin/env python3
"""Render the project's original 128-second instrumental loop (NumPy, SciPy, ffmpeg).

Original composition and synthesized timbres; no sampled recordings or existing melody.
Khim/ranat/khlui-inspired colors, not an authentic recording of Thai liturgical music.
Run from the repository root. This script is not needed to run the LIVE application.
"""
from pathlib import Path
import subprocess
import tempfile
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt

RATE, SECONDS = 32000, 128
N = RATE * SECONDS
rng = np.random.default_rng(20261102)
mix = np.zeros((N, 2), dtype=np.float64)
scale = np.array([0, 2, 4, 7, 9, 12, 14, 16])


def frequency(degree, octave=0):
    return 293.664768 * 2 ** (scale[degree % len(scale)] / 12 + octave)


def add(signal, when, level, pan=0):
    # Wrap every note tail into the beginning; the complete mix is periodic.
    start = int(round(when * RATE)) % N
    gains = np.array([np.sqrt((1 - pan) / 2), np.sqrt((1 + pan) / 2)]) * level
    values = signal[:, None] * gains
    first = min(len(values), N - start)
    mix[start:start + first] += values[:first]
    if first < len(values):
        mix[:len(values) - first] += values[first:]


def mallet(freq, khim=False):
    t = np.arange(int(RATE * (5 if khim else 3.6))) / RATE
    y = np.zeros_like(t)
    if khim:
        for partial in range(1, 10):
            for detune in [0.9991, 1.0009]:
                y += np.sin(2 * np.pi * freq * partial * detune * t) * np.exp(-t * (.7 + partial * .31)) / partial ** 1.55 / 2
    else:
        for ratio, strength, decay in [(1, 1, 1.6), (2.76, .16, 4.3), (5.4, .055, 7), (8.93, .012, 11)]:
            y += np.sin(2 * np.pi * freq * ratio * t) * strength * np.exp(-t * decay)
    y *= 1 - np.exp(-t * (160 if khim else 220))
    y *= np.minimum(1, (t[-1] - t) / .04)
    return y


def flute(freq, hold):
    duration = hold + .9
    t = np.arange(int(RATE * duration)) / RATE
    vibrato = .0038 * (1 - np.exp(-t * 2)) * np.sin(2 * np.pi * 4.9 * t)
    scoop = -.012 * np.exp(-t * 8)
    phase = 2 * np.pi * np.cumsum(freq * (1 + vibrato + scoop)) / RATE
    y = np.sin(phase) + .18 * np.sin(2 * phase + .2) + .065 * np.sin(3 * phase) + .02 * np.sin(4 * phase)
    breath = sosfilt(butter(2, [650, 3600], btype='bandpass', fs=RATE, output='sos'), rng.standard_normal(len(t)))
    envelope = (1 - np.exp(-t * 9)) * np.minimum(1, np.maximum(0, (duration - t) / .8))
    return (y + breath * .035) * envelope * (1 + .035 * np.sin(2 * np.pi * .8 * t))


def gong(freq):
    t = np.arange(RATE * 12) / RATE
    y = np.zeros_like(t)
    for ratio, strength in [(1, .8), (1.51, .3), (2.03, .17), (2.79, .10), (3.94, .045)]:
        y += np.sin(2 * np.pi * freq * ratio * t + .1 * np.sin(t * 7)) * strength * np.exp(-t * (.42 + ratio * .08))
    return y * (1 - np.exp(-t * 20)) * np.minimum(1, (t[-1] - t) / .1)


def ching(open_ring):
    t = np.arange(int(RATE * (2 if open_ring else .7))) / RATE
    y = sum(np.sin(2 * np.pi * f * t) * a for f, a in [(1841, .25), (2797, .22), (4171, .15), (6113, .08)])
    return y * (1 - np.exp(-t * 600)) * np.exp(-t * (4 if open_ring else 15)) * np.minimum(1, (t[-1] - t) / .03)


# 32 bars, 60 BPM. The eight original phrases leave space between breaths.
phrases = [
    [(0, 2.7), (2, 1.8), (3, 2.4), (1, 2.6), (0, 2.2)],
    [(2, 2.2), (4, 2.7), (3, 1.8), (2, 2.1), (1, 2.4)],
    [(3, 2.6), (4, 1.6), (2, 2.8), (0, 2.5)],
    [(1, 2.4), (2, 2.5), (0, 3.6)],
    [(0, 2.0), (1, 1.7), (3, 2.8), (4, 2.0), (2, 2.7)],
    [(4, 2.6), (3, 2.3), (1, 2.7), (2, 2.0)],
    [(2, 3.0), (0, 2.2), (1, 2.0), (3, 2.2)],
    [(1, 2.7), (2, 1.7), (0, 4.0)],
]
patterns = [[0, 3, 2, 1], [2, 4, 3, 1], [0, 2, 4, 3], [1, 3, 2, 0]]
for phrase_index, melody in enumerate(phrases):
    when = phrase_index * 16 + 1.0
    for degree, hold in melody:
        add(flute(frequency(degree), hold), when, .075, .12 * np.sin(phrase_index))
        when += hold + .45
for bar in range(32):
    pattern = patterns[(bar // 2) % 4]
    for beat, degree in enumerate(pattern):
        add(mallet(frequency(degree, -1)), bar * 4 + beat + .03, .068 * rng.uniform(.75, 1), -.35)
        if beat % 2 == 0:
            add(mallet(frequency((degree + 2) % 5), True), bar * 4 + beat + .5, .033 * rng.uniform(.8, 1), .4)
    if bar % 2 == 1:
        add(mallet(frequency(pattern[-1] + 1), True), bar * 4 + 3.5, .024, .25)
    add(ching(bar % 2 == 0), bar * 4 + 2, .012, -.15)
    if bar % 4 == 0:
        add(gong(73.416192), bar * 4, .055, .1)

# A quiet, periodic bed and circular reflections preserve the seam when looped.
t = np.arange(N) / RATE
for f, level, pan in [(146.832384, .007, -.25), (220, .004, .2), (293.664768, .003, .05)]:
    periodic_f = round(f * SECONDS) / SECONDS
    tone = np.sin(2 * np.pi * periodic_f * t) * (1 + .1 * np.sin(2 * np.pi * t / 32))
    add(tone, 0, level, pan)
wet = np.zeros_like(mix)
for i, delay in enumerate([.073, .113, .181, .277, .397, .557, .761, 1.037, 1.379, 1.817, 2.291]):
    reflected = mix[:, ::-1] if i % 2 else mix
    wet += np.roll(reflected, int(delay * RATE), axis=0) * .13 * np.exp(-delay / 1.8)
mix += wet
mix -= mix.mean(axis=0)
peak = np.max(np.abs(mix)); rms = np.sqrt(np.mean(mix ** 2))
mix *= min(.88 / peak, .16 / rms)
out = Path('assets/ganesha/music'); out.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryDirectory(prefix='ganesha-music-') as scratch:
    wav = Path(scratch) / 'thai-dawn.wav'
    wavfile.write(wav, RATE, np.int16(np.clip(mix, -1, 1) * 32767))
    subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', str(wav), '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', '128k', '-metadata', 'title=Thai Dawn', '-metadata', 'artist=Ganesha LIVE original instrumental', str(out / 'thai-dawn.mp3')], check=True)
print({'seconds': SECONDS, 'peak': float(np.max(np.abs(mix))), 'rms': float(np.sqrt(np.mean(mix ** 2))), 'seam_delta': float(np.max(np.abs(mix[0] - mix[-1]))), 'bytes': (out / 'thai-dawn.mp3').stat().st_size})
