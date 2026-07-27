"""Rename ImageGen icons to h01~h20 and resize to 256x256 RGBA (keep true color, no palette)."""
import os, glob, shutil
from PIL import Image

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"

# Mapping: filename pattern -> target hXX name
# Order matches store.js ICONS array:
# h01=跑步, h02=健身, h03=瑜伽, h04=骑行, h05=阅读,
# h06=写作, h07=画画, h08=练琴, h09=喝水, h10=饮食,
# h11=早睡, h12=早起, h13=服药, h14=打扫, h15=记账,
# h16=复盘, h17=戒手机, h18=戒烟, h19=目标, h20=成长

MAPPING = {
    "running": "h01.png",    # person running/jogging
    "dumbbell": "h02.png",   # dumbbell/weightlifting
    "yoga": "h03.png",       # yoga meditation
    "bicycle": "h04.png",    # bicycle cycling
    "book": "h05.png",       # open book reading
    "pen": "h06.png",        # pen writing (use the second one, larger)
    "palette": "h07.png",    # art palette painting
    "piano": "h08.png",      # piano keys music
    "water": "h09.png",      # water drop hydration
    "food": "h10.png",       # healthy food nutrition
    "moon": "h11.png",       # moon sleeping
    "rising": "h12.png",     # rising sun morning
    "medicine": "h13.png",   # medicine pill
    "broom": "h14.png",      # broom cleaning
    "calculator": "h15.png", # calculator accounting
    "clipboard": "h16.png",  # clipboard review
    "smartphone": "h17.png", # smartphone no phone
    "cigarette": "h18.png",  # cigarette no smoking
    "target": "h19.png",     # target goal
    "sprout": "h20.png",     # sprout growth
}

# Find all Cute_ files and match by keyword in filename
files = glob.glob(os.path.join(ICON_DIR, "Cute_*.png"))
print(f"Found {len(files)} ImageGen files")

# Build keyword -> filepath mapping
file_map = {}
for f in files:
    basename = os.path.basename(f)
    lower = basename.lower()
    for key in MAPPING:
        if key in lower:
            if key not in file_map:
                file_map[key] = f
            else:
                # Keep the larger file (better quality)
                if os.path.getsize(f) > os.path.getsize(file_map[key]):
                    file_map[key] = f
            break

print(f"Matched {len(file_map)} keywords")

# Process: rename + resize to 256x256 RGBA
total_before = 0
total_after = 0

for key, src_path in sorted(file_map.items()):
    target_name = MAPPING[key]
    target_path = os.path.join(ICON_DIR, target_name)

    size_before = os.path.getsize(src_path)
    total_before += size_before

    img = Image.open(src_path).convert("RGBA")
    img_resized = img.resize((256, 256), Image.LANCZOS)

    # Remove old hXX if exists
    if os.path.exists(target_path):
        os.remove(target_path)

    img_resized.save(target_path, "PNG")
    size_after = os.path.getsize(target_path)
    total_after += size_after

    print(f"{target_name} ({key}): {size_before//1024}KB -> {size_after//1024}KB")

print(f"\nTotal: {total_before//1024}KB -> {total_after//1024}KB (ratio {100*(1-total_after/total_before):.1f}%)")

# Clean up original Cute_ files
for f in files:
    os.remove(f)
print(f"\nCleaned up {len(files)} original files")
