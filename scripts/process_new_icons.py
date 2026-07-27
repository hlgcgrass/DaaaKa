import os
from PIL import Image

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"
SIZE = 192
BG = (223, 223, 221)  # 与 h01~h20 一致的干净浅灰底

# 习惯 -> 文件名关键词前缀 -> 目标文件名
MAPPING = [
    ("练背",   "BackTraining", "h21.png"),
    ("哑铃",   "Dumbbell",     "h22.png"),
    ("练核心", "CorePlank",    "h23.png"),
    ("垫脚尖", "Tiptoe",       "h24.png"),
    ("腹式呼吸","DeepBreath",   "h25.png"),
    ("练臀腿", "SquatLeg",     "h26.png"),
    ("头皮按摩","ScalpMassage", "h27.png"),
    ("穴位按摩","Acupressure",  "h28.png"),
    ("喝水",   "WaterCup",     "h29.png"),
    ("吃钙片", "CalciumPill",  "h30.png"),
    ("吃vd",   "Vitamind",     "h31.png"),
    ("阅读",   "OpenBook",     "h32.png"),
    ("备课",   "LessonPlan",   "h33.png"),
    ("听课",   "ListenClass",  "h34.png"),
]

def flood_remove_bg(img, tol=48):
    """从四角 flood-fill 去除近似背景色 -> RGBA"""
    img = img.convert("RGBA")
    W, H = img.size
    px = img.load()
    bg_sample = px[0, 0][:3]
    def close(c):
        return all(abs(c[i] - bg_sample[i]) <= tol for i in range(3))
    # 标记背景像素
    from collections import deque
    visited = set()
    queue = deque([(0,0),(W-1,0),(0,H-1),(W-1,H-1)])
    while queue:
        x, y = queue.popleft()
        if (x,y) in visited: continue
        if not (0 <= x < W and 0 <= y < H): continue
        visited.add((x,y))
        if close(px[x,y][:3]):
            r,g,b,a = px[x,y]
            px[x,y] = (r,g,b,0)
            for dx,dy in ((1,0),(-1,0),(0,1),(0,-1)):
                nx,ny = x+dx, y+dy
                if (nx,ny) not in visited:
                    queue.append((nx,ny))
    return img

for habit, prefix, target in MAPPING:
    src = None
    for f in os.listdir(ICON_DIR):
        if f.startswith(prefix) and f.endswith(".png"):
            src = os.path.join(ICON_DIR, f)
            break
    if not src:
        print(f"[缺失] {habit} ({prefix}) 未找到源文件")
        continue
    img = Image.open(src).convert("RGBA")
    img = img.resize((SIZE, SIZE), Image.LANCZOS)
    img = flood_remove_bg(img, tol=48)
    # 合成浅灰底 -> 不透明
    base = Image.new("RGB", img.size, BG)
    base.paste(img, (0, 0), img)
    out = os.path.join(ICON_DIR, target)
    base.save(out, "PNG", optimize=True)
    # 删除原始大图
    os.remove(src)
    print(f"{target}  <- {habit}  ({os.path.getsize(out)//1024}KB)")

print("\n完成。新文件 h21~h34 已生成，原始大图已清理。")
