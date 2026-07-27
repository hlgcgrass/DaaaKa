"""Generate 20 flat-style habit icons with PIL - free, no credits needed."""
import os, math
from PIL import Image, ImageDraw

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"
SIZE = 256

# 马卡龙清新色系
COLORS = [
    "#FF9AA2", "#FFB7B2", "#FFDAC1", "#FAE3B5", "#B5EAD7",
    "#C7CEEA", "#A8E6CF", "#FFAAA5", "#FFD3B6", "#C8E6FF",
]

def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def make_base(color_hex):
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    r = SIZE // 6
    bg = hex_to_rgb(color_hex)
    draw.rounded_rectangle([8, 8, SIZE-8, SIZE-8], radius=r, fill=(*bg, 230))
    return img, draw

# ---- 图标绘制函数 ----

def draw_running(draw):
    c = SIZE // 2
    draw.ellipse([c-22, c-50, c+6, c-22], fill="white")
    draw.line([c-8, c-18, c-16, c+20], fill="white", width=7)
    draw.line([c-16, c+20, c-4, c+48], fill="white", width=7)
    draw.line([c-16, c+20, c-28, c+38], fill="white", width=7)
    draw.line([c-10, c-8, c+8, c+4], fill="white", width=6)
    draw.line([c-10, c-8, c-24, c+4], fill="white", width=6)

def draw_gym(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.rounded_rectangle([cx-36, cy-6, cx+36, cy+6], radius=3, fill="white")
    draw.rounded_rectangle([cx-44, cy-18, cx-32, cy+18], radius=4, fill="white")
    draw.rounded_rectangle([cx+32, cy-18, cx+44, cy+18], radius=4, fill="white")

def draw_yoga(draw):
    c = SIZE // 2
    draw.ellipse([c-18, c-48, c+18, c-12], fill="white")
    draw.polygon([(c, c-8), (c-34, c+48), (c+34, c+48)], fill="white")
    draw.arc([c-28, c+24, c+28, c+56], 0, 180, fill="#dddddd", width=5)

def draw_cycling(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.ellipse([cx-46, cy+8, cx+14, cy+68], outline="white", width=5)
    draw.ellipse([cx+14, cy+8, cx+74, cy+68], outline="white", width=5)
    draw.line([cx-16, cy+38, cx+12, cy+38], fill="white", width=5)
    draw.line([cx-16, cy+38, cx+8, cy+10], fill="white", width=5)
    draw.line([cx+12, cy+38, cx+44, cy+14], fill="white", width=5)
    draw.line([cx+8, cy+10, cx+44, cy+14], fill="white", width=5)
    draw.line([cx+44, cy+14, cx+52, cy-2], fill="white", width=5)
    draw.line([cx-2, cy+8, cx+8, cy+10], fill="white", width=6)

def draw_book(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.polygon([(cx, cy-32), (cx-40, cy-16), (cx-40, cy+32), (cx, cy+16)], fill="white")
    draw.polygon([(cx, cy-32), (cx+40, cy-16), (cx+40, cy+32), (cx, cy+16)], fill="white")
    draw.line([cx, cy-32, cx, cy+16], fill="#cccccc", width=2)
    for y_off in [-16, -4, 8]:
        draw.line([cx-32, cy+y_off, cx-8, cy+y_off-4], fill="#dddddd", width=2)
        draw.line([cx+8, cy+y_off-4, cx+32, cy+y_off], fill="#dddddd", width=2)

def draw_writing(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.rounded_rectangle([cx-32, cy-28, cx+32, cy+32], radius=4, fill="white")
    for yo in [-12, 0, 12, 24]:
        draw.line([cx-24, cy+yo, cx+24, cy+yo], fill="#dddddd", width=1)
    draw.polygon([(cx+28, cy-36), (cx+48, cy+8), (cx+42, cy+14), (cx+22, cy-30)], fill="white")

def draw_painting(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.ellipse([cx-36, cy-16, cx+36, cy+24], fill="white")
    bg4 = (*hex_to_rgb(COLORS[4]), 230)
    draw.ellipse([cx-10, cy-4, cx+14, cy+16], fill=bg4)
    for dx, dy, dc in [(-20,-4,"#FF6B6B"), (-8,-10,"#FFE66D"), (8,-10,"#4ECDC4"), (20,-4,"#45B7D1")]:
        draw.ellipse([cx+dx-6, cy+dy-4, cx+dx+6, cy+dy+4], fill=dc)
    draw.line([cx+24, cy-28, cx+44, cy+4], fill="white", width=6)

def draw_piano(draw):
    cx, cy = SIZE//2, SIZE//2
    for i in range(5):
        x = cx - 40 + i * 20
        draw.rectangle([x, cy-8, x+17, cy+32], fill="white", outline="#eeeeee")
    for bx in [-22, 2, 26]:
        draw.rectangle([cx+bx, cy-8, cx+bx+12, cy+16], fill="#333333")

def draw_water(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.ellipse([cx-24, cy-12, cx+24, cy+36], fill="white")
    draw.polygon([(cx, cy-44), (cx-24, cy-4), (cx+24, cy-4)], fill="white")
    draw.ellipse([cx-10, cy+4, cx, cy+18], fill="#dddddd")

def draw_food(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.arc([cx-32, cy-8, cx+32, cy+36], 0, 180, fill="white", width=8)
    draw.line([cx-34, cy+12, cx+34, cy+12], fill="white", width=4)
    draw.ellipse([cx-4, cy-36, cx+16, cy-18], fill="#A8E6CF")
    draw.line([cx+4, cy-24, cx+8, cy-40], fill="#88cc88", width=3)

def draw_sleep(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.polygon([
        (cx-8, cy-36), (cx+24, cy-24), (cx+24, cy+16),
        (cx-8, cy+4), (cx-16, cy-10)
    ], fill="white")
    try:
        draw.text((cx+20, cy-32), "z", fill="white")
        draw.text((cx+32, cy-22), "z", fill="white")
        draw.text((cx+40, cy-12), "z", fill="white")
    except Exception:
        pass

def draw_sunrise(draw):
    cx, cy = SIZE//2, SIZE//2
    for i in range(8):
        angle = math.radians(i * 45)
        x1 = cx + int(28 * math.cos(angle))
        y1 = cy + int(28 * math.sin(angle))
        x2 = cx + int(42 * math.cos(angle))
        y2 = cy + int(42 * math.sin(angle))
        draw.line([x1, y1, x2, y2], fill="white", width=4)
    draw.ellipse([cx-24, cy-24, cx+24, cy+24], fill="white")

def draw_pill(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.rounded_rectangle([cx-36, cy-12, cx+36, cy+12], radius=12, fill="white")
    draw.rounded_rectangle([cx-36, cy-12, cx, cy+12], radius=12, fill="#dddddd")

def draw_cleaning(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.rounded_rectangle([cx-18, cy-8, cx+18, cy+36], radius=6, fill="white")
    draw.rectangle([cx-6, cy-20, cx+6, cy-8], fill="white")
    draw.rounded_rectangle([cx-12, cy-28, cx+12, cy-20], radius=3, fill="white")
    for dx, dy in [(-16, -36), (0, -40), (16, -36)]:
        draw.line([cx+dx, cy+dy-4, cx+dx, cy+dy+8], fill="#dddddd", width=2)

def draw_accounting(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.rounded_rectangle([cx-28, cy-36, cx+28, cy+32], radius=6, fill="white")
    draw.rounded_rectangle([cx-22, cy-30, cx+22, cy-10], radius=3, fill="#dddddd")
    for row in range(3):
        for col in range(3):
            x = cx - 18 + col * 16
            y = cy - 2 + row * 14
            draw.ellipse([x, y, x+11, y+11], fill="#eeeeee")

def draw_review(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.rounded_rectangle([cx-24, cy-32, cx+24, cy+32], radius=4, fill="white")
    draw.polygon([(cx+8, cy+20), (cx+24, cy+32), (cx+24, cy+16)], fill="#dddddd")
    for yo in [-16, -4, 8]:
        draw.line([cx-16, cy+yo, cx+12, cy+yo], fill="#dddddd", width=2)
    green = hex_to_rgb("#07c160")
    draw.line([cx-14, cy+12, cx-2, cy+26], fill=green, width=4)
    draw.line([cx-2, cy+26, cx+18, cy+4], fill=green, width=4)

def draw_nophone(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.rounded_rectangle([cx-18, cy-32, cx+18, cy+32], radius=4, fill="white")
    draw.rounded_rectangle([cx-13, cy-24, cx+13, cy+18], radius=2, fill="#dddddd")
    draw.ellipse([cx-5, cy+23, cx+5, cy+31], fill="#eeeeee")
    draw.line([cx-28, cy-36, cx+28, cy+36], fill="#FF6B6B", width=6)

def draw_nosmoking(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.rounded_rectangle([cx-32, cy-6, cx+20, cy+6], radius=3, fill="white")
    draw.rounded_rectangle([cx+12, cy-6, cx+24, cy+6], radius=3, fill="#dddddd")
    draw.arc([cx+20, cy-24, cx+44, cy+12], 200, 340, fill="#dddddd", width=2)
    draw.ellipse([cx-28, cy-28, cx+28, cy+28], outline="#FF6B6B", width=6)
    draw.line([cx-20, cy-20, cx+20, cy+20], fill="#FF6B6B", width=5)

def draw_target(draw):
    cx, cy = SIZE//2, SIZE//2
    for i, cr in enumerate(["white", "#dddddd", "white"]):
        r = 36 - i * 11
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=cr)
    draw.ellipse([cx-4, cy-4, cx+4, cy+4], fill="#FF6B6B")

def draw_growth(draw):
    cx, cy = SIZE//2, SIZE//2
    draw.line([cx, cy+40, cx, cy-4], fill="white", width=4)
    draw.ellipse([cx-26, cy-8, cx-2, cy+16], fill="white")
    draw.ellipse([cx+2, cy-16, cx+26, cy+8], fill="white")
    draw.ellipse([cx-8, cy-20, cx+8, cy-4], fill="#A8E6CF")


ICONS = [
    ("h01.png", COLORS[0], draw_running),
    ("h02.png", COLORS[1], draw_gym),
    ("h03.png", COLORS[2], draw_yoga),
    ("h04.png", COLORS[3], draw_cycling),
    ("h05.png", COLORS[4], draw_book),
    ("h06.png", COLORS[5], draw_writing),
    ("h07.png", COLORS[6], draw_painting),
    ("h08.png", COLORS[7], draw_piano),
    ("h09.png", COLORS[8], draw_water),
    ("h10.png", COLORS[0], draw_food),
    ("h11.png", COLORS[1], draw_sleep),
    ("h12.png", COLORS[2], draw_sunrise),
    ("h13.png", COLORS[3], draw_pill),
    ("h14.png", COLORS[4], draw_cleaning),
    ("h15.png", COLORS[5], draw_accounting),
    ("h16.png", COLORS[6], draw_review),
    ("h17.png", COLORS[7], draw_nophone),
    ("h18.png", COLORS[8], draw_nosmoking),
    ("h19.png", COLORS[0], draw_target),
    ("h20.png", COLORS[1], draw_growth),
]

total_size = 0
for fname, color, draw_fn in ICONS:
    img, draw = make_base(color)
    draw_fn(draw)
    fpath = os.path.join(ICON_DIR, fname)
    img.save(fpath, "PNG")
    sz = os.path.getsize(fpath)
    total_size += sz
    print(f"{fname}: {sz//1024}KB  color={color}")

print(f"\nTotal: {total_size//1024}KB ({total_size} bytes)")
