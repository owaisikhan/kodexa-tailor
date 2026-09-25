"""Original score for the Kodexa Tailor reel, synthesised from scratch.

    python3 scripts/marketing/music.py /tmp/reel/out/score.wav

120 BPM, D minor, 11 bars of 2 s = 22 s, cut to the reel's scenes:
  bar 0      intro      pad swells in, riser into the first cut
  bars 1-4   desktop    impact, sub bass, 8th-note pluck arpeggio, soft kick, stitch ticks
  bars 5-8   phone      impact, 16th-note arpeggio, four-on-the-floor kick, hats, brighter pad
  bars 9-10  end card   impact, held D minor chord with a bell line, fade out
Needs numpy only.
"""

import sys
import wave

import numpy as np

SR = 48000
BPM = 120
BEAT = 60 / BPM
BAR = 4 * BEAT
BARS = 11
LENGTH = BARS * BAR
N = int(LENGTH * SR)
rng = np.random.default_rng(7)


def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)


def t_of(n):
    return np.arange(n) / SR


def lowpass(x, fc, order=4):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(spec / np.sqrt(1 + (f / fc) ** (2 * order)), len(x))


def highpass(x, fc, order=2):
    spec = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = (f / fc) ** order / np.sqrt(1 + (f / fc) ** (2 * order))
    return np.fft.irfft(spec * g, len(x))


def env(n, attack, release):
    e = np.ones(n)
    a = min(n, int(attack * SR))
    r = min(n - a, int(release * SR))
    if a:
        e[:a] = np.linspace(0, 1, a) ** 2
    if r:
        e[n - r :] *= np.linspace(1, 0, r) ** 2
    return e


def add(bus, sig, start, gain=1.0, pan=0.0):
    i = int(start * SR)
    if i >= N:
        return
    sig = sig[: N - i]
    left = np.cos((pan + 1) * np.pi / 4)
    right = np.sin((pan + 1) * np.pi / 4)
    bus[0, i : i + len(sig)] += sig * gain * left
    bus[1, i : i + len(sig)] += sig * gain * right


# ---------- harmony -------------------------------------------------------
CHORDS = {
    "Dm": ([50, 53, 57, 62], 38),
    "Bb": ([50, 53, 58, 62], 34),
    "F": ([48, 53, 57, 60], 41),
    "C": ([48, 52, 55, 60], 36),
}
PROG = ["Dm", "Bb", "F", "C"]
bar_chord = [PROG[b % 4] for b in range(BARS)]
bar_chord[9] = bar_chord[10] = "Dm"

# ---------- instruments ---------------------------------------------------


def saw(f, n, detune=0.0):
    ph = (t_of(n) * f * (1 + detune)) % 1.0
    return 2 * ph - 1


def pad(notes, dur, bright=1.0):
    n = int(dur * SR)
    x = np.zeros(n)
    for m in notes:
        for d in (-0.004, 0.0, 0.0045):
            x += saw(hz(m), n, d)
    x = lowpass(x, 900 * bright, 2) / (len(notes) * 3)
    return x * env(n, 0.7, 0.9)


def sub(m, dur):
    n = int(dur * SR)
    t = t_of(n)
    x = np.sin(2 * np.pi * hz(m) * t) + 0.25 * np.sin(4 * np.pi * hz(m) * t)
    return np.tanh(1.4 * x) * env(n, 0.03, 0.4)


def pluck(m, dur=0.7):
    n = int(dur * SR)
    t = t_of(n)
    f = hz(m)
    x = np.zeros(n)
    for k in range(1, 9):
        if f * k > 12000:
            break
        x += np.sin(2 * np.pi * f * k * t) * np.exp(-t * (4 + 2.2 * k)) / k
    return x * env(n, 0.002, 0.05)


def bell(m, dur=2.5):
    n = int(dur * SR)
    t = t_of(n)
    f = hz(m)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 1.6)
    x += 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t * 3.2)
    x += 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t * 6)
    return x * env(n, 0.004, 0.3)


def kick(soft=1.0):
    n = int(0.45 * SR)
    t = t_of(n)
    f = 45 + 80 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 7) * soft


def hat(open_=False):
    n = int((0.18 if open_ else 0.05) * SR)
    x = highpass(rng.standard_normal(n), 7000, 3)
    return x * np.exp(-t_of(n) * (18 if open_ else 70))


def tick():
    n = int(0.03 * SR)
    x = highpass(rng.standard_normal(n), 3000, 2) * np.exp(-t_of(n) * 160)
    return x


def impact():
    n = int(2.2 * SR)
    t = t_of(n)
    boom = np.sin(2 * np.pi * (38 + 30 * np.exp(-t * 6)) * t) * np.exp(-t * 2.2)
    air = lowpass(rng.standard_normal(n), 2500, 2) * np.exp(-t * 5) * 0.35
    return np.tanh(1.6 * boom) + air


def riser(dur):
    n = int(dur * SR)
    t = t_of(n) / dur
    noise = rng.standard_normal(n)
    lo = lowpass(noise, 800)
    hi = lowpass(noise, 6000)
    x = lo * (1 - t) + hi * t
    sweep = np.sin(2 * np.pi * np.cumsum(200 + 900 * t**2) / SR) * 0.15
    return (x * 0.5 + sweep) * t**2.2


# ---------- arrangement ---------------------------------------------------
dry = np.zeros((2, N))
send = np.zeros((2, N))  # reverb send

for b in range(BARS):
    notes, root = CHORDS[bar_chord[b]]
    start = b * BAR
    phone = 5 <= b <= 8
    end = b >= 9
    voicing = [m + 12 for m in notes] if phone else notes
    p = pad(voicing, BAR + 1.0, 1.6 if phone else 1.0)
    gain = 0.5
    add(dry, p, start, gain * 0.55, -0.25)
    add(dry, p, start + 0.011, gain * 0.55, 0.25)
    add(send, p, start, gain * 0.5)

    if 1 <= b <= 8:
        add(dry, sub(root, BAR), start, 0.55)

    if 1 <= b <= 8:
        steps = 16 if phone else 8
        arp = [voicing[i] + 12 for i in (0, 1, 2, 3, 2, 1, 2, 3)]
        for s in range(steps):
            m = arp[s % 8] + (12 if phone and s % 4 == 3 else 0)
            accent = 1.0 if s % (steps // 4) == 0 else 0.7
            when = start + s * (BAR / steps)
            pan = -0.45 if s % 2 else 0.45
            add(dry, pluck(m, 0.6), when, 0.22 * accent, pan)
            add(send, pluck(m, 0.6), when, 0.18 * accent)

    if 1 <= b <= 4:
        for beat in (0, 2):
            add(dry, kick(0.8), start + beat * BEAT, 0.7)
        for s in range(8):
            if s % 2:
                add(dry, tick(), start + s * BEAT / 2, 0.12, 0.3 if s % 4 == 1 else -0.3)
    if phone:
        for beat in range(4):
            add(dry, kick(1.0), start + beat * BEAT, 0.8)
            add(dry, hat(), start + beat * BEAT + BEAT / 2, 0.12, 0.35)
            add(dry, hat(True), start + beat * BEAT + BEAT / 2, 0.04, -0.2)
        for s in range(16):
            if s % 2:
                add(dry, hat(), start + s * BEAT / 4, 0.05, -0.35)

    if end:
        # bell line over the final chord: D5 A4 F5 E5 D5
        if b == 9:
            for m, beat in ((74, 0), (69, 1), (77, 2), (76, 3)):
                add(dry, bell(m), start + beat * BEAT, 0.16, 0.2)
                add(send, bell(m), start + beat * BEAT, 0.22)
        else:
            add(dry, bell(74, 3.0), start, 0.18, -0.1)
            add(send, bell(74, 3.0), start, 0.3)
            add(dry, sub(38, BAR), start, 0.4)

# opening: a low bell and a soft boom so the first second is not silent
add(dry, bell(62, 2.4), 0.05, 0.2, -0.15)
add(send, bell(62, 2.4), 0.05, 0.3)
add(dry, impact(), 0.0, 0.35)
for bar in (1, 5, 9):
    add(dry, impact(), bar * BAR, 0.75)
    add(send, impact(), bar * BAR, 0.35)
for bar, dur in ((1, 1.6), (5, 1.8), (9, 1.8)):
    r = riser(dur)
    add(dry, r, bar * BAR - dur, 0.28)
    add(send, r, bar * BAR - dur, 0.25)

# ---------- reverb (convolution with a decaying noise tail) ---------------
ir_n = int(2.2 * SR)
ir_t = t_of(ir_n)
wet = np.zeros_like(send)
for ch in range(2):
    ir = rng.standard_normal(ir_n) * np.exp(-ir_t * 3.0)
    ir = lowpass(ir, 5000)
    ir /= np.sqrt(np.sum(ir**2))
    size = 1 << int(np.ceil(np.log2(N + ir_n)))
    y = np.fft.irfft(np.fft.rfft(send[ch], size) * np.fft.rfft(ir, size), size)[:N]
    wet[ch] = y

mix = dry + 0.55 * wet

# ---------- master ---------------------------------------------------------
fade_in = np.clip(t_of(N) / 0.25, 0, 1)
fade_out = np.clip((LENGTH - t_of(N)) / 2.2, 0, 1) ** 1.5
mix *= fade_in * fade_out
mix = np.tanh(mix / np.max(np.abs(mix)) * 1.6)
mix *= 10 ** (-1 / 20) / np.max(np.abs(mix))
mix *= 10 ** (-3 / 20)  # about -14 LUFS, where Facebook normalises

out = sys.argv[1] if len(sys.argv) > 1 else "score.wav"
pcm = (mix.T * 32767).astype("<i2")
with wave.open(out, "wb") as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes(pcm.tobytes())
print(f"wrote {out}: {LENGTH:.1f} s, {BPM} BPM")
