# -*- coding: utf-8 -*-
"""生成计时器所需的三个音效 WAV 文件（22050Hz / 16bit / 单声道）"""
import wave
import struct
import math
import os

SR = 22050
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'assets', 'audio')


def write_wav(path, samples):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        buf = bytearray()
        for s in samples:
            v = int(max(-1.0, min(1.0, s)) * 32767)
            buf += struct.pack('<h', v)
        w.writeframes(bytes(buf))
    print('%-28s %6.1f KB' % (os.path.basename(path), os.path.getsize(path) / 1024.0))


def tick(dur=0.07):
    """秒针滴答：极短促的高频点击音"""
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 65)
        s = (math.sin(2 * math.pi * 2600 * t) * 0.6
             + math.sin(2 * math.pi * 3900 * t) * 0.28)
        out.append(s * env * 0.42)
    return out


def dong(dur=1.3):
    """噔的一声：钟/木鱼质感，基音+泛音，长衰减"""
    n = int(SR * dur)
    out = []
    for i in range(n):
        t = i / SR
        env = math.exp(-t * 3.4)
        s = (math.sin(2 * math.pi * 700 * t) * 1.0
             + math.sin(2 * math.pi * 1400 * t) * 0.42
             + math.sin(2 * math.pi * 2100 * t) * 0.20
             + math.sin(2 * math.pi * 350 * t) * 0.48)
        attack = min(1.0, t / 0.004)
        out.append(s * env * attack * 0.40)
    return out


def cheer(dur=2.2):
    """庆祝：C5-E5-G5-C6 上行琶音 + 尾音和弦"""
    n = int(SR * dur)
    notes = [(0.0, 523.25), (0.13, 659.25), (0.26, 783.99), (0.39, 1046.50)]
    out = []
    for i in range(n):
        t = i / SR
        s = 0.0
        for start, freq in notes:
            if t >= start:
                lt = t - start
                env = math.exp(-lt * 5.2)
                if t > 0.55:
                    env *= math.exp(-(t - 0.55) * 2.6)
                s += (math.sin(2 * math.pi * freq * lt) * 0.5
                      + math.sin(2 * math.pi * freq * 2 * lt) * 0.14) * env
        out.append(s * 0.28)
    return out


if __name__ == '__main__':
    write_wav(os.path.join(OUT_DIR, 'tick.wav'), tick())
    write_wav(os.path.join(OUT_DIR, 'dong.wav'), dong())
    write_wav(os.path.join(OUT_DIR, 'cheer.wav'), cheer())
    print('done ->', OUT_DIR)
