"""Rename ImageGen icons to h01~h20 by creation time order + resize 256x256 RGBA."""
import os
from PIL import Image

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"

# Get all Cute_ files sorted by creation time (generation order)
files = [
    f for f in os.listdir(ICON_DIR)
    if f.startswith("Cute_") and f.endswith(".png")
]
files.sort(key=lambda f: os.path.getmtime(os.path.join(ICON_DIR, f)))

print(f"Found {len(files)} files, sorted by time:")
for i, f in enumerate(files):
    print(f"  [{i+1:2d}] {f}")

# Target names in generation order:
# 1=running, 2=dumbbell, 3=yoga, 4=bicycle, 5=book,
# 6=pen/writing, 7=palette/painting, 8=piano, 9=water, 10=food,
# 11=moon/sleep, 12=sun/early, 13=pill/medicine, 14=broom/cleaning,
# 15=calculator/accounting, 16=clipboard/review, 17=smartphone/nophone,
# 18=cigarette/nosmoking, 19=target/goal, 20=sprout/growth

total_before = 0
total_after = 0

for i, src_name in enumerate(files):
    target_name = f"h{i+1:02d}.png"
    src_path = os.path.join(ICON_DIR, src_name)
    target_path = os.path.join(ICON_DIR, target_name)

    size_before = os.path.getsize(src_path)
    total_before += size_before

    # Resize to 256x256 RGBA (keep true color!)
    img = Image.open(src_path).convert("RGBA")
    img_resized = img.resize((256, 256), Image.LANCZOS)

    # Remove old target if exists
    if os.path.exists(target_path):
        os.remove(target_path)

    img_resized.save(target_path, "PNG")

    # Delete source
    os.remove(src_path)

    size_after = os.path.getsize(target_path)
    total_after += size_after
    print(f"  {src_name[:30]:30s} -> {target_name}: {size_before//1024}KB -> {size_after//1024}KB")

print(f"\nTotal: {total_before//1024}KB -> {total_after//1024}KB ({100*(1-total_after/total_before):.1f}% reduction)")
