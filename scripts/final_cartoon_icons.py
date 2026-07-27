"""
最终处理：ImageGen 卡通图标 -> 192x192 -> 去背景 -> 圆形柔和马卡龙底
解决"暗沉看不清"问题，同时保留用户喜欢的卡通质感。
"""
import os, glob
from PIL import Image, ImageDraw

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"
SIZE = 192
CENTER = SIZE // 2
R = SIZE // 2 - 3

# 前缀 -> 目标文件名 映射
PREFIX_MAP = {
    "G1Run": "h01.png", "G2Dumb": "h02.png", "G3Yoga": "h03.png", "G4Bike": "h04.png",
    "G5Book": "h05.png", "G6Write": "h06.png", "G7Paint": "h07.png", "G8Piano": "h08.png",
    "G9Water": "h09.png", "G10Food": "h10.png", "G11Moon": "h11.png", "G12Sun": "h12.png",
    "G13Pill": "h13.png", "G14Broom": "h14.png", "G15Calc": "h15.png", "G16Check": "h16.png",
    "G17Phone": "h17.png", "G18Smoke": "h18.png", "G19Target": "h19.png", "G20Sprout": "h20.png",
    "S21Back": "h21.png", "S22Dumb": "h22.png", "S23Core": "h23.png", "S24Tip": "h24.png",
    "S25Breath": "h25.png", "S26Squat": "h26.png", "S27Scalp": "h27.png", "S28Acup": "h28.png",
    "S29Water": "h29.png", "S30Calc": "h30.png", "S31Vitd": "h31.png", "S32Book": "h32.png",
    "S33Plan": "h33.png", "S34Listen": "h34.png",
}

# 柔和马卡龙色（参考图风格：低饱和、灰调、不刺眼）
SOFT = [
    "#A8C5B5", "#9DB4C0", "#C9B8A8", "#B5C4AE",  # h01-04 灰绿/灰蓝/驼色/橄榄
    "#8FB8C9", "#D4C4A8", "#B0C0B8", "#C8BDB8",  # h05-08 雾霾蓝/奶油/青灰/玫瑰灰
    "#9FC0C8", "#E0C9A0", "#B8A9A0", "#C4A4A4",  # h09-12 水蓝/杏/灰棕/灰粉
    "#A8B5C0", "#D4B5A4", "#9EBFBF", "#C9B8A8",  # h13-16 钢蓝/沙/青绿/驼
    "#B8C5B0", "#C8BDB8", "#A4B8BF", "#D0BFC8",  # h17-20 草绿/玫瑰灰/蓝灰/淡紫
    # h21-34 用户定制
    "#F2C4B8", "#F0D49A", "#A8D8B8", "#A8C8D8",  # 21-24 粉/黄/绿/蓝
    "#F2B8B0", "#E8B89A", "#A8D0E0", "#A8D8B8",  # 25-28 红/橙/蓝/绿
    "#A8D0E0", "#F5E0A0", "#B8C4D8", "#A8D8B8",  # 29-32 蓝/黄/蓝灰/绿
    "#D4B0B8", "#C0B0A0",                       # 33-34 粉/驼
]

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def make_circle(color_hex):
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    ImageDraw.Draw(img).ellipse([3, 3, SIZE-3, SIZE-3], fill=(*hex_to_rgb(color_hex), 255))
    return img

def remove_bg(img, tol=42):
    """flood fill from 4 corners to remove background"""
    img = img.convert('RGBA')
    # sample corner colors
    corners = [(0,0), (SIZE-1,0), (0,SIZE-1), (SIZE-1,SIZE-1)]
    pxs = list(img.getdata())
    W, H = img.size
    bg_samples = [pxs[c[1]*W + c[0]] for c in corners]
    # Use the average of corner colors as bg reference, but better to use each corner
    # Simple approach: use the top-left-ish lightest
    def near(c, ref):
        return all(abs(c[i]-ref[i]) <= tol for i in range(3))
    # collect background pixels via BFS from corners
    visited = set()
    from collections import deque
    bg_pixels = set()
    for cstart in corners:
        if cstart in visited: continue
        q = deque([cstart])
        while q:
            x, y = q.popleft()
            if (x,y) in visited: continue
            visited.add((x,y))
            idx = y*W + x
            r,g,b,a = pxs[idx]
            # check against any corner sample
            is_bg = any(near((r,g,b), s) for s in bg_samples)
            if is_bg:
                bg_pixels.add((x,y))
                for dx,dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                    nx, ny = x+dx, y+dy
                    if 0<=nx<W and 0<=ny<H and (nx,ny) not in visited:
                        q.append((nx,ny))
    # set bg transparent
    new = []
    for i, p in enumerate(pxs):
        x, y = i % W, i // W
        if (x,y) in bg_pixels:
            new.append((p[0], p[1], p[2], 0))
        else:
            new.append(p)
    img.putdata(new)
    return img

total = 0
for prefix, target in PREFIX_MAP.items():
    matches = glob.glob(os.path.join(ICON_DIR, prefix + "*.png"))
    if not matches:
        print(f"MISSING: {prefix} -> {target}")
        continue
    src = matches[0]
    img = Image.open(src).convert('RGBA').resize((SIZE, SIZE), Image.LANCZOS)
    img = remove_bg(img)
    color = SOFT[int(target[1:3]) - 1]
    base = make_circle(color)
    base.paste(img, (0, 0), img)
    dst = os.path.join(ICON_DIR, target)
    base.convert('RGB').save(dst, "PNG", optimize=True)
    sz = os.path.getsize(dst)
    total += sz
    print(f"{target}: {os.path.basename(src)[:18]} -> {sz//1024}KB bg={color}")
    # remove original
    os.remove(src)

print(f"\n总计: {total//1024}KB")
