import os
from PIL import Image

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"
# 21:51 那版的浅灰底（原图带噪点，这里用干净纯色还原）
BG = (223, 223, 221)

total_before = 0
total_after = 0

for f in sorted(os.listdir(ICON_DIR)):
    if not f.endswith(".png"):
        continue
    p = os.path.join(ICON_DIR, f)
    total_before += os.path.getsize(p)

    img = Image.open(p).convert("RGBA")          # 当前透明版
    bg = Image.new("RGB", img.size, BG)          # 干净纯色底
    # 用透明版的 alpha 作遮罩，把图标主体贴到纯色底上 -> 实心图标
    bg.paste(img, (0, 0), img)
    bg.save(p, "PNG", optimize=True)             # 输出为不透明 RGB

    total_after += os.path.getsize(p)
    print(f"{f}: {os.path.getsize(p)//1024}KB  (opaque, bg={BG})")

print(f"\n总计: {total_before//1024}KB -> {total_after//1024}KB")
