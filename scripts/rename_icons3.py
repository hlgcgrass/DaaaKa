"""Final rename: match Cute_ files by unique prefix to h01-h20, resize 256x256 RGBA."""
import os, re
from PIL import Image

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"

# Each (unique_prefix_in_filename, target_name) - prefix is from the truncated prompt in filename
MAPPING = [
    # Batch 1 (first 10 calls)
    ("_of_a_pe_2026-07-26T14-59-16", "h01.png"),   # running (person)
    ("_of_dumb_2026-07-26T14-59-17", "h02.png"),  # dumbbell
    ("_of_yoga_2026-07-26T14-59-17", "h03.png"),  # yoga
    ("_of_bicy_2026-07-26T14-59-17", "h04.png"),  # bicycle
    ("_of_open_2026-07-26T14-59-17", "h05.png"),  # open book
    ("_of_pen__2026-07-26T14-59-16", "h06.png"),  # pen writing (double underscore)
    ("_of_art__2026-07-26T14-59-17", "h07.png"),  # art palette
    ("_of_pian_2026-07-26T14-59-17", "h08.png"),  # piano
    ("_of_wate_2026-07-26T14-59-17", "h09.png"),  # water
    ("_of_heal_2026-07-26T14-59-17", "h10.png"),  # healthy food
    # Batch 2 (next 5 calls)
    ("_of_cres_2026-07-26T14-59-17", "h11.png"),  # crescent moon
    ("_of_risi_2026-07-26T14-59-17", "h12.png"),  # rising sun
    ("_of_medi_2026-07-26T14-59-16", "h13.png"),  # medicine pill
    ("_of_broo_2026-07-26T14-59-17", "h14.png"),  # broom cleaning
    ("_of_calc_2026-07-26T14-59-27", "h15.png"),  # calculator
    # Batch 3 (last 5 calls)
    ("_of_clip_2026-07-26T15-00-00", "h16.png"),  # clipboard review
    ("_of_smar_2026-07-26T15-00-00", "h17.png"),  # smartphone nophone
    ("_of_ciga_2026-07-26T15-00-00", "h18.png"),  # cigarette nosmoking
    ("_of_targ_2026-07-26T15-00-00", "h19.png"),  # target goal
    ("_of_smal_2026-07-26T15-00-00", "h20.png"),  # sprout growth
]

total_before = 0
total_after = 0
matched = 0

for prefix, target_name in MAPPING:
    # Find file containing this prefix
    found = None
    for f in os.listdir(ICON_DIR):
        if f.startswith("Cute_") and prefix[1:] in f:  # skip leading _
            found = f
            break

    if not found:
        print(f"  NOT FOUND: {target_name} (prefix: {prefix})")
        continue

    src_path = os.path.join(ICON_DIR, found)
    target_path = os.path.join(ICON_DIR, target_name)

    size_before = os.path.getsize(src_path)
    total_before += size_before

    # Resize to 256x256 RGBA (true color, no palette!)
    img = Image.open(src_path).convert("RGBA")
    img_resized = img.resize((256, 256), Image.LANCZOS)

    if os.path.exists(target_path):
        os.remove(target_path)
    img_resized.save(target_path, "PNG")
    os.remove(src_path)  # delete source

    size_after = os.path.getsize(target_path)
    total_after += size_after
    matched += 1
    print(f"  OK {found[:35]:35s} -> {target_name}: {size_before//1024}KB -> {size_after//1024}KB")

print(f"\nMatched {matched}/{len(MAPPING)} files")
print(f"Total: {total_before//1024}KB -> {total_after//1024}KB ({100*(1-total_after/total_before):.1f}% reduction)")

# Check for leftover Cute_ files
leftover = [f for f in os.listdir(ICON_DIR) if f.startswith("Cute_")]
if leftover:
    print(f"\nWarning: {len(leftover)} leftover Cute_ files: {leftover}")
else:
    print("\nAll source files cleaned up.")
