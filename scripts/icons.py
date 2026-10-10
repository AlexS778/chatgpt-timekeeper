"""Generate our original clock icons with Python's standard library; no third-party art."""
from pathlib import Path
import math
import struct
import zlib

OUTPUT = Path(__file__).resolve().parent.parent / 'icons'
OUTPUT.mkdir(exist_ok=True)


def distance_to_segment(x, y, ax, ay, bx, by):
    t = max(0, min(1, ((x-ax)*(bx-ax)+(y-ay)*(by-ay)) / ((bx-ax)**2+(by-ay)**2)))
    return math.hypot(x-ax-t*(bx-ax), y-ay-t*(by-ay))


def pixel(x, y):
    # Artwork occupies 96x96 within the 128px canvas (16px transparent padding).
    qx, qy = abs(x-64)-30, abs(y-64)-30
    rounded = math.hypot(max(qx, 0), max(qy, 0)) + min(max(qx, qy), 0)-18
    if rounded > 0:
        return (0, 0, 0, 0)
    ring = abs(math.hypot(x-64, y-64)-30) <= 3.5
    hands = min(distance_to_segment(x, y, 64, 43, 64, 64),
                distance_to_segment(x, y, 64, 64, 79, 73)) <= 3.5
    return (255, 255, 255, 255) if ring or hands else (15, 118, 110, 255)


def chunk(kind, data):
    return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind+data))


for size in [16, 32, 48, 128]:
    rows = bytearray()
    for y in range(size):
        rows.append(0)
        for x in range(size):
            samples = [pixel((x+(sx+.5)/4)*128/size, (y+(sy+.5)/4)*128/size)
                       for sy in range(4) for sx in range(4)]
            alpha = sum(p[3] for p in samples)
            rows.extend([round(sum(p[c]*p[3] for p in samples)/alpha) if alpha else 0
                         for c in range(3)] + [round(alpha/16)])
    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(rows))) + chunk(b'IEND', b'')
    (OUTPUT / f'icon-{size}.png').write_bytes(png)
    print(f'Generated icons/icon-{size}.png')
