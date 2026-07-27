"""Batch remove background from all h01-h20 icons -> transparent PNG."""
import os
from PIL import Image
from collections import deque

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"
TOL = 48

def color_dist(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1, c2)) ** 0.5

def make_transparent(src_path, dst_path, tol=TOL):
    img = Image.open(src_path).convert("RGBA")
    W, H = img.size
    px = img.load()
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
    for y in range(H):
        for x in range(W):
            if is_bg[y][x]:
                r, g, b, a = px[x, y]
                px[x, y] = (r, g, b, 0)
    img.save(dst_path, "PNG")
    bg_count = sum(row.count(True) for row in is_bg)
    return bg_count / (W * H) * 100

# Process all h01-h20
total_before = 0
total_after = 0
for i in range(1, 21):
    fname = f"h{i:02d}.png"
    src = os.path.join(ICON_DIR, fname)
    if not os.path.exists(src):
        print(f"SKIP {fname}: not found")
        continue
    size_before = os.path.getsize(src)
    total_before += size_before
    pct = make_transparent(src, src)  # overwrite in place
    size_after = os.path.getsize(src)
    total_after += size_after
    print(f"{fname}: {size_before//1024}KB -> {size_after//1024}KB  (bg removed: {pct:.0f}%)")

print(f"\nTotal: {total_before//1024}KB -> {total_after//1024}KB")

# Clean up test file
test_file = os.path.join(ICON_DIR, "_test_transp.png")
if os.path.exists(test_file):
    os.remove(test_file)

# Clean up Isolated_ file
for f in os.listdir(ICON_DIR):
    if f.startswith("Isolated_"):
        os.remove(os.path.join(ICON_DIR, f))
        print(f"Cleaned up {f}")
