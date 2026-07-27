"""Remove light/white background from ImageGen icons -> make transparent.
Strategy: flood-fill from 4 corners with a color tolerance. Background is light
grey/white (~220-255). Subject has saturated colors (pink, red, etc) so won't
be flooded. White body parts connected to edges may get removed, which is acceptable
for icon use on light card backgrounds.
"""
import os
from PIL import Image
from collections import deque

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"
TOL = 48  # color distance tolerance for background flood fill

def color_dist(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5

def make_transparent(src_path, dst_path, tol=TOL):
    img = Image.open(src_path).convert("RGBA")
    W, H = img.size
    px = img.load()

    # Get corner seed colors
    seeds = [(0, 0), (W - 1, 0), (0, H - 1), (W - 1, H - 1)]
    seed_colors = [px[x, y][:3] for x, y in seeds]

    visited = [[False] * W for _ in range(H)]
    is_bg = [[False] * W for _ in range(H)]
    q = deque()

    for (x, y), sc in zip(seeds, seed_colors):
        if not visited[y][x]:
            visited[y][x] = True
            q.append((x, y, sc))

    while q:
        x, y, sc = q.popleft()
        is_bg[y][x] = True
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < W and 0 <= ny < H and not visited[ny][nx]:
                cur = px[nx, ny][:3]
                if color_dist(cur, sc) <= tol:
                    visited[ny][nx] = True
                    q.append((nx, ny, sc))

    # Set background pixels to transparent
    for y in range(H):
        for x in range(W):
            if is_bg[y][x]:
                r, g, b, a = px[x, y]
                px[x, y] = (r, g, b, 0)

    img.save(dst_path, "PNG")
    bg_count = sum(row.count(True) for row in is_bg)
    total = W * H
    return bg_count / total * 100

if __name__ == "__main__":
    import sys
    # Test on h01 first
    test = os.path.join(ICON_DIR, "h01.png")
    tmp = os.path.join(ICON_DIR, "_test_transp.png")
    pct = make_transparent(test, tmp)
    print(f"h01 transparent: {pct:.1f}%")
    print(f"Test saved to {tmp}")
