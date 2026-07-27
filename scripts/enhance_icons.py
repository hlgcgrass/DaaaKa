"""
批量增强图标：给每个图标垫上马卡龙彩色圆角矩形底 + 增强对比度
处理 h01~h34 全部图标
"""
import os
from PIL import Image, ImageEnhance, ImageFilter

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"
SIZE = 192
RADIUS = SIZE // 5  # 圆角半径 ~38px

# 马卡龙色盘 - 每个图标一个鲜明的底色
PASTEL_COLORS = [
    # h01~h20 通用图标底色
    "#FFB5B5", "#FFCBA4", "#FFEAA7", "#B8E994", "#81ECEC",  # 1-5
    "#74B9FF", "#A29BFE", "#FD79A8", "#FDCB6E", "#55EFC4",  # 6-10
    "#FF7675", "#6C5CE7", "#00B894", "#E17055", "#0984E3",  # 11-15
    "#F8B500", "#E84393", "#00CEC9", "#D63031", "#2D3436",  # 16-20
    # h21~h34 用户定制图标底色 (更鲜艳)
    "#FF6B6B", "#FFA502", "#7BED9F", "#70A1FF", "#FF69B4",  # 21-25 练背/哑铃/核心/垫脚尖/呼吸
    "#EE5A24", "#1E90FF", "#2ED573", "#FF4757", "#ffa502",  # 26-30 臀腿/头皮/穴位/喝水/钙片
    "#3742FA", "#2F3542", "#ff6348", "#1abc9c"               # 31-34 VD/阅读/备课/听课
]

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def make_color_base(color_hex):
    """创建圆角矩形彩色底"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    from PIL import ImageDraw
    draw = ImageDraw.Draw(img)
    rgb = hex_to_rgb(color_hex)
    # 圆角矩形
    draw.rounded_rectangle([4, 4, SIZE-4, SIZE-4], radius=RADIUS, fill=(*rgb, 255))
    return img

def enhance_icon(icon_img):
    """增强图标对比度和饱和度"""
    # 提升对比度
    icon_img = ImageEnhance.Contrast(icon_img).enhance(1.35)
    # 提升颜色饱和度
    icon_img = ImageEnhance.Color(icon_img).enhance(1.3)
    # 轻微锐化
    icon_img = icon_img.filter(ImageFilter.SHARPEN)
    return icon_img

def process_icon(src_path, color_hex, dst_path):
    """处理单个图标：去灰底 → 垫彩底 → 叠加主体"""
    img = Image.open(src_path).convert('RGBA')
    
    # Step 1: 把浅灰背景变透明 (flood fill from corners)
    bg_color = (223, 223, 221, 255)
    tol = 35
    datas = list(img.getdata())
    new_data = []
    for item in datas:
        r, g, b, a = item
        if abs(r - bg_color[0]) <= tol and abs(g - bg_color[1]) <= tol and abs(b - bg_color[2]) <= tol:
            new_data.append((r, g, b, 0))  # 变透明
        else:
            new_data.append((r, g, b, a))
    img.putdata(new_data)
    
    # Step 2: 增强主体
    img = enhance_icon(img)
    
    # Step 3: 创建彩色底
    base = make_color_base(color_hex)
    
    # Step 4: 叠加
    base.paste(img, (0, 0), img)
    
    # Step 5: 保存为 RGB (不透明，带彩色底)
    result = base.convert('RGB')
    result.save(dst_path, "PNG", optimize=True)

# 处理所有 h01~h34
total_before = 0
total_after = 0

for i in range(1, 35):
    fname = f"h{i:02d}.png"
    fpath = os.path.join(ICON_DIR, fname)
    if not os.path.exists(fpath):
        print(f"SKIP {fname} (not found)")
        continue
    
    color_idx = (i - 1) % len(PASTEL_COLORS)
    color = PASTEL_COLORS[color_idx]
    
    size_before = os.path.getsize(fpath)
    total_before += size_before
    
    process_icon(fpath, color, fpath)
    
    size_after = os.path.getsize(fpath)
    total_after += size_after
    
    print(f"{fname}: {size_before//1024}KB -> {size_after//1024}KB  bg={color}")

print(f"\n总计: {total_before//1024}KB -> {total_after//1024}KB")
