"""
按参考图风格重新生成全部图标：
- 圆形底（不是圆角矩形）
- 柔和低饱和马卡龙色
- 简洁线条卡通小人/物品，有黑色描边，清晰可见
- 输出 192x192 不透明 PNG
"""
import os, math
from PIL import Image, ImageDraw

ICON_DIR = "C:/Users/grass/WorkBuddy/2026-07-26-11-33-30/miniprogram-todo/assets/icons"
SIZE = 192
CENTER = SIZE // 2
R = SIZE // 2 - 4  # 圆的半径 ~92px

# 柔和低饱和马卡龙色（参考图风格：灰调、不刺眼）
SOFT_COLORS = [
    "#A8C5B5", "#8B9296", "#B8A9A0", "#C4A4A4",  # 1-4 灰绿/灰/灰棕/灰粉
    "#7BA3B5", "#D4A574", "#95ADAA", "#C8DBC4",  # 5-8 雾霾蓝/脏橘/青灰/薄荷
    "#E8D5B7", "#B5AFA8", "#9EBFBF", "#D4B5A4",  # 9-12 奶油/暖灰/青绿/杏色
    "#A4B8BF", "#C9B8A8", "#B8C5B0", "#D0BFC8",  # 13-16 蓝灰/驼色/橄榄/淡紫
    "#C4B5A4", "#A8B5C0", "#B5C4AE", "#C8BDB8",  # 17-20 沙色/钢蓝/草绿/玫瑰灰
    # h21~h34 用户定制
    "#F2B8B0", "#E8C47C", "#98D9B0", "#90C4D8",  # 21-24 练背(粉)/哑铃(黄)/核心(绿)/垫脚尖(蓝)
    "#F0A8A8", "#E89B7C", "#87CEEB", "#98D9B0",  # 25-28 呼吸(红)/臀腿(橙)/头皮(蓝)/穴位(绿)
    "#87CEEB", "#F5D77A", "#B0C4DE", "#98D9B0",  # 29-32 喝水(蓝)/钙片(黄)/阅读(蓝灰)/备课(绿)
    "#D4A5A5",                                          # 33 听课(粉)
    "#C9B8A8"                                           # 34 备用
]

def hex_to_rgb(h):
    h = h.lstrip('#')
    return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def make_circle_base(color_hex):
    """创建圆形柔和底色"""
    img = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    rgb = hex_to_rgb(color_hex)
    draw.ellipse([4, 4, SIZE-4, SIZE-4], fill=(*rgb, 255))
    return img, draw

# ===== 绘制函数：简洁线条风，黑色描边，清晰可见 =====

def draw_back_exercise(draw):
    """练背 - 俯身拉/划船姿势"""
    c = CENTER
    # 头
    draw.ellipse([c-12, c-44, c+10, c-22], fill='#FFE4C4', outline='#333', width=2)
    # 身体(前倾)
    draw.line([c-2, c-18, c-20, c+14], fill='#333', width=4)
    # 手臂(向后拉)
    draw.line([c-4, c-10, c-28, c-4], fill='#333', width=3)
    draw.line([c-4, c-10, c+12, c-6], fill='#333', width=3)
    # 腿
    draw.line([c-20, c+14, c-30, c+42], fill='#333', width=4)
    draw.line([c-20, c+14, c-4, c+42], fill='#333', width=4)

def draw_dumbbell(draw):
    """哑铃"""
    cx, cy = CENTER, CENTER
    # 杆
    draw.rounded_rectangle([cx-32, cy-4, cx+32, cy+4], radius=2, fill='#888', outline='#333', width=2)
    # 左配重
    draw.rounded_rectangle([cx-38, cy-14, cx-30, cy+14], radius=3, fill='#E74C3C', outline='#333', width=2)
    # 右配重
    draw.rounded_rectangle([cx+30, cy-14, cx+38, cy+14], radius=3, fill='#E74C3C', outline='#333', width=2)

def draw_core_plank(draw):
    """练核心 - 平板支撑"""
    c = CENTER
    # 身体(水平线)
    draw.line([c-36, c+8, c+36, c+8], fill='#F39C12', width=10)
    draw.line([c-36, c+8, c+36, c+8], fill='#333', width=2)  # 描边效果
    # 头
    draw.ellipse([c+36, c, c+52, c+16], fill='#FFE4C4', outline='#333', width=2)
    # 手臂支撑
    draw.line([c-20, c+8, c-20, c+26], fill='#333', width=4)
    draw.line([c+8, c+8, c+8, c+26], fill='#333', width=4)
    # 脚
    draw.line([c-36, c+8, c-40, c+18], fill='#333', width=4)
    draw.line([c-36, c+8, c-32, c+18], fill='#333', width=4)

def draw_tiptoe(draw):
    """垫脚尖 - 小人踮脚"""
    c = CENTER
    # 头
    draw.ellipse([c-12, c-46, c+10, c-24], fill='#FFE4C4', outline='#333', width=2)
    # 身体
    draw.line([c-2, c-20, c-2, c+12], fill='#3498DB', width=8)
    # 腿(踮脚姿势 - 细长)
    draw.line([c-2, c+12, c-8, c+48], fill='#333', width=4)
    draw.line([c-2, c+12, c+6, c+48], fill='#333', width=4)
    # 手臂(平衡)
    draw.line([c-2, c-12, c-22, c-8], fill='#333', width=3)
    draw.line([c-2, c-12, c+18, c-8], fill='#333', width=3)
    # 箭头向上表示垫脚
    draw.polygon([(c+28, c-30), (c+22, c-16), (c+34, c-16)], fill='#E74C3C')

def draw_belly_breath(draw):
    """腹式呼吸 - 肺部/呼吸"""
    cx, cy = CENTER, CENTER
    # 身体轮廓
    draw.ellipse([cx-28, cy-28, cx+28, cy+28], fill='#E8F4FD', outline='#333', width=2)
    # 肺部形状(两个叶)
    draw.ellipse([cx-22, cy-18, cx-2, cy+14], fill='#ADD8E6', outline='#333', width=2)
    draw.ellipse([cx+2, cy-18, cx+22, cy+14], fill='#ADD8E6', outline='#333', width=2)
    # 气流箭头(上下)
    draw.polygon([(cx, cy-38), (cx-6, cy-26), (cx+6, cy-26)], fill='#87CEEB')
    draw.polygon([(cx, cy+38), (cx-6, cy+26), (cx+6, cy+26)], fill='#87CEEB')

def draw_squat_leg(draw):
    """练臀腿 - 深蹲小人"""
    c = CENTER
    # 头
    draw.ellipse([c-12, c-46, c+10, c-24], fill='#FFE4C4', outline='#333', width=2)
    # 身体
    draw.line([c-2, c-20, c-2, c+8], fill='#E74C3C', width=10)
    # 腿(深蹲 - 弯曲)
    draw.line([c-2, c+8, c-18, c+28], fill='#333', width=5)
    draw.line([c-18, c+28, c-14, c+48], fill='#333', width=5)
    draw.line([c-2, c+8, c+14, c+28], fill='#333', width=5)
    draw.line([c+14, c+28, c+10, c+48], fill='#333', width=5)
    # 手臂(前伸平衡)
    draw.line([c-2, c-12, c-26, c-4], fill='#333', width=4)
    draw.line([c-2, c-12, c+22, c-4], fill='#333', width=4)

def draw_scalp_massage(draw):
    """头皮按摩 - 双手在头上"""
    c = CENTER
    # 头(大一点表示重点)
    draw.ellipse([c-20, c-40, c+20, c-4], fill='#FFE4C4', outline='#333', width=2)
    # 头发
    draw.arc([c-22, c-44, c+22, c-8], 200, 340, fill='#8B4513', width=4)
    # 双手在头顶按摩
    draw.ellipse([c-28, c-54, c-12, c-40], fill='#FFE4C4', outline='#333', width=2)
    draw.ellipse([c+12, c-54, c+28, c-40], fill='#FFE4C4', outline='#333', width=2)
    # 手指(小椭圆)
    for dx in [-26, -20, -14]:
        draw.ellipse([c+dx-2, c-56, c+dx+4, c-48], fill='#FFE4C4', outline='#333', width=1)
    for dx in [14, 20, 26]:
        draw.ellipse([c+dx-2, c-56, c+dx+4, c-48], fill='#FFE4C4', outline='#333', width=1)
    # 身体(简化)
    draw.line([c, c-2, c, c+28], fill='#333', width=3)

def draw_acupressure(draw):
    """穴位按摩 - 手指按压穴位点"""
    cx, cy = CENTER, CENTER
    # 身体轮廓(简化)
    draw.ellipse([cx-24, cy-20, cx+24, cy+36], fill='#FFF0E0', outline='#333', width=2)
    # 手指按压
    draw.ellipse([cx-6, cy-8, cx+10, cy+16], fill='#FFE4C4', outline='#333', width=2)
    # 穴位点(红色圆点 + 波纹)
    draw.ellipse([cx-2, cy+14, cx+6, cy+22], fill='#E74C3C', outline='#333', width=1)
    draw.ellipse([cx-6, cy+10, cx+10, cy+26], outline='#E74C3C', width=1)
    draw.ellipse([cx-10, cy+6, cx+14, cy+30], outline='#E74C3C', width=1)

def draw_water_cup(draw):
    """喝水 - 水杯"""
    cx, cy = CENTER, CENTER
    # 杯子
    draw.rounded_rectangle([cx-18, cy-20, cx+18, cy+24], radius=4, fill='#E8F4FD', outline='#333', width=2)
    # 杯口
    draw.ellipse([cx-18, cy-24, cx+18, cy-18], fill='#B0D4F1', outline='#333', width=2)
    # 水(蓝色填充下半部分)
    draw.ellipse([cx-15, cy, cx+15, cy+21], fill='#87CEEB', outline='#333', width=1)
    # 吸管
    draw.line([cx+6, cy-8, cx+16, cy-36], fill='#FFB6C1', width=5)
    draw.line([cx+6, cy-8, cx+16, cy-36], fill='#333', width=1)

def draw_calcium_pill(draw):
    """钙片 - 药丸"""
    cx, cy = CENTER, CENTER
    # 胶囊形
    draw.rounded_rectangle([cx-30, cy-10, cx+30, cy+10], radius=10, fill='#FFFACD', outline='#333', width=2)
    # 左半(白色)
    draw.rounded_rectangle([cx-30, cy-10, cx, cy+10], radius=10, fill='white', outline='#333', width=1)
    # Ca 字样
    draw.text((cx-6, cy-8), "Ca", fill='#333')

def draw_vitamin_d(draw):
    """VD - 太阳+药瓶"""
    cx, cy = CENTER, CENTER
    # 小太阳(右上角)
    sx, sy = cx+16, cy-24
    draw.ellipse([sx-10, sy-10, sx+10, sy+10], fill='#FFD700', outline='#333', width=2)
    for i in range(8):
        angle = math.radians(i * 45)
        x1 = sx + int(13 * math.cos(angle))
        y1 = sy + int(13 * math.sin(angle))
        x2 = sx + int(19 * math.cos(angle))
        y2 = sy + int(19 * math.sin(angle))
        draw.line([x1, y1, x2, y2], fill='#FFD700', width=2)
    # 药瓶(左下)
    bx, by = cx-16, cy+4
    draw.rounded_rectangle([bx-12, by-8, bx+12, by+22], radius=4, fill='white', outline='#333', width=2)
    # 瓶盖
    draw.rectangle([bx-6, by-14, bx+6, by-8], fill='#E74C3C')
    # D 标签
    draw.text((bx-5, by-2), "D", fill='#333')

def draw_reading_book(draw):
    """阅读 - 打开的书"""
    cx, cy = CENTER, CENTER
    # 左页
    draw.polygon([(cx, cy-24), (cx-32, cy-8), (cx-32, cy+24), (cx, cy+8)], fill='white', outline='#333', width=2)
    # 右页
    draw.polygon([(cx, cy-24), (cx+32, cy-8), (cx+32, cy+24), (cx, cy+8)], fill='#FFF8E8', outline='#333', width=2)
    # 中缝
    draw.line([cx, cy-24, cx, cy+8], fill='#333', width=2)
    # 文字横线
    for yo in [-12, 0, 10]:
        draw.line([cx-24, cy+yo, cx-6, cy+yo-3], fill='#CCC', width=1)
        draw.line([cx+6, cy+yo-3, cx+24, cy+yo], fill='#CCC', width=1)

def draw_lesson_plan(draw):
    """备课 - 笔记本+笔"""
    cx, cy = CENTER, CENTER
    # 笔记本
    draw.rounded_rectangle([cx-24, cy-28, cx+24, cy+28], radius=3, fill='#FFF8DC', outline='#333', width=2)
    # 书脊线
    draw.line([cx-24, cy-12, cx+24, cy-12], fill='#DDD', width=1)
    # 横线
    for yo in [-18, -4, 8, 20]:
        draw.line([cx-18, cy+yo, cx+18, cy+yo], fill='#EEE', width=1)
    # 笔(斜放右上角)
    draw.polygon([(cx+16, cy-38), (cx+36, cy-4), (cx+30, cy+2), (cx+10, cy-32)], fill='#FF6B6B', outline='#333', width=1)

def draw_listen_class(draw):
    """听课 - 戴耳机听讲的小人"""
    c = CENTER
    # 头
    draw.ellipse([c-14, c-42, c+14, c-14], fill='#FFE4C4', outline='#333', width=2)
    # 耳机
    draw.arc([c-18, c-46, c+18, c-10], 180, 360, fill='#333', width=5)
    draw.ellipse([c-20, c-32, c-14, c-20], fill='#333')  # 左耳罩
    draw.ellipse([c+14, c-32, c+20, c-20], fill='#333')   # 右耳罩
    # 身体
    draw.line([c, c-12, c, c+18], fill='#3498DB', width=8)
    # 手臂(托腮思考状)
    draw.line([c, c-4, c-18, c+4], fill='#333', width=3)
    draw.ellipse([c-20, c+2, c-12, c+10], fill='#FFE4C4', outline='#333', width=1)
    # 腿
    draw.line([c, c+18, c-10, c+44], fill='#333', width=4)
    draw.line([c, c+18, c+10, c+44], fill='#333', width=4)


# ===== 通用图标 h01~h20 (保留原有场景但用新风格) =====
def draw_running_new(draw):
    c = CENTER
    draw.ellipse([c-12, c-44, c+10, c-22], fill='#FFE4C4', outline='#333', width=2)
    draw.line([c-2, c-18, c-12, c+16], fill='#E74C3C', width=7)
    draw.line([c-12, c+16, c-2, c+42], fill='#333', width=4)
    draw.line([c-12, c+16, c-22, c+34], fill='#333', width=4)
    draw.line([c-6, c-10, c+12, c+4], fill='#333', width=3)
    draw.line([c-6, c-10, c-20, c+4], fill='#333', width=3)

def draw_gym_new(draw): draw_dumbbell(draw)

def draw_yoga_new(draw):
    c = CENTER
    draw.ellipse([c-14, c-42, c+14, c-14], fill='#FFE4C4', outline='#333', width=2)
    draw.polygon([(c, c-8), (c-30, c+40), (c+30, c+40)], fill='#9B59B6', outline='#333', width=2)
    draw.arc([c-20, c+24, c+20, c+50], 0, 180, fill='#333', width=3)

def draw_cycling_new(draw):
    cx, cy = CENTER, CENTER
    r = 26
    draw.ellipse([cx-38, cy+6, cx+14, cy+58], outline='#333', width=3)
    draw.ellipse([cx+14, cy+6, cx+66, cy+58], outline='#333', width=3)
    draw.line([cx-12, cy+32, cx+10, cy+32], fill='#333', width=3)
    draw.line([cx-12, cy+32, cx+6, cy+8], fill='#333', width=3)
    draw.line([cx+10, cy+32, cx+38, cy+12], fill='#333', width=3)
    draw.line([cx+6, cy+8, cx+38, cy+12], fill='#333', width=3)
    draw.line([cx+38, cy+12, cx+44, cy-2], fill='#333', width=3)

def draw_book_new(draw): draw_reading_book(draw)

def draw_writing_new(draw):
    cx, cy = CENTER, CENTER
    draw.rounded_rectangle([cx-26, cy-24, cx+26, cy+28], radius=3, fill='white', outline='#333', width=2)
    for yo in [-10, 4, 18]:
        draw.line([cx-18, cy+yo, cx+18, cy+yo], fill='#DDD', width=1)
    draw.polygon([(cx+22, cy-32), (cx+40, cy+6), (cx+34, cy+12), (cx+16, cy-26)], fill='#3498DB', outline='#333', width=1)

def draw_painting_new(draw):
    cx, cy = CENTER, CENTER
    draw.ellipse([cx-30, cy-12, cx+30, cy+20], fill='#FFF0E0', outline='#333', width=2)
    draw.ellipse([cx-8, cy-2, cx+14, cy+12], fill='#87CEEB')
    dots = [(-18,-2,'#FF6B6B'), (-6,-8,'#FFE66D'), (8,-8,'#4ECDC4'), (18,-2,'#45B7D1')]
    for dx, dy, dc in dots:
        draw.ellipse([cx+dx-4, cy+dy-2, cx+dx+4, cy+dy+2], fill=dc)
    draw.line([cx+20, cy-24, cx+38, cy+4], fill='#333', width=4)

def draw_piano_new(draw):
    cx, cy = CENTER, CENTER
    for i in range(5):
        x = cx - 34 + i * 17
        draw.rectangle([x, cy-6, x+14, cy+28], fill='white', outline='#333', width=1)
    for bp in [-20, 2, 26]:
        draw.rectangle([cx+bp, cy-6, cx+bp+10, cy+14], fill='#333')

def draw_water_new(draw): draw_water_cup(draw)

def draw_food_new(draw):
    cx, cy = CENTER, CENTER
    draw.arc([cx-28, cy-6, cx+28, cy+32], 0, 180, fill='#E74C3C', width=8)
    draw.line([cx-30, cy+12, cx+30, cy+12], fill='#E74C3C', width=4)
    draw.ellipse([cx-4, cy-32, cx+14, cy-16], fill='#4CAF50', outline='#333', width=1)
    draw.line([cx+4, cy-22, cx+8, cy-36], fill='#4CAF50', width=3)

def draw_sleep_new(draw):
    c = CENTER
    draw.polygon([(c-6, c-32), (c+20, c-22), (c+20, c+14), (c-6, c+2), (c-14, c-10)], fill='#FFD700', outline='#333', width=2)
    draw.text((c+18, c-28), "z", fill='#333')
    draw.text((c+28, c-20), "z", fill='#333')
    draw.text((c+36, c-12), "z", fill='#333')

def draw_sunrise_new(draw):
    cx, cy = CENTER, CENTER
    for i in range(12):
        angle = math.radians(i * 30)
        x1 = cx + int(22 * math.cos(angle))
        y1 = cy + int(22 * math.sin(angle))
        x2 = cx + int(32 * math.cos(angle))
        y2 = cy + int(32 * math.sin(angle))
        draw.line([x1, y1, x2, y2], fill='#FFD700', width=3)
    draw.ellipse([cx-18, cy-18, cx+18, cy+18], fill='#FFD700', outline='#333', width=2)

def draw_pill_new(draw):
    cx, cy = CENTER, CENTER
    draw.rounded_rectangle([cx-30, cy-10, cx+30, cy+10], radius=10, fill='white', outline='#333', width=2)
    draw.rounded_rectangle([cx-30, cy-10, cx, cy+10], radius=10, fill='#DDD', outline='#333', width=1)

def draw_cleaning_new(draw):
    cx, cy = CENTER, CENTER
    draw.rounded_rectangle([cx-14, cy-6, cx+14, cy+32], radius=5, fill='#87CEEB', outline='#333', width=2)
    draw.rectangle([cx-5, cy-16, cx+5, cy-6], fill='#87CEEB', outline='#333', width=1)
    draw.rounded_rectangle([cx-10, cy-24, cx+10, cy-16], radius=3, fill='#87CEEB', outline='#333', width=1)
    for dx in [-14, 0, 14]:
        draw.line([cx+dx, cy-28, cx+dx, cy-38], fill='#AAA', width=2)

def draw_accounting_new(draw):
    cx, cy = CENTER, CENTER
    draw.rounded_rectangle([cx-24, cy-30, cx+24, cy+28], radius=5, fill='white', outline='#333', width=2)
    draw.rounded_rectangle([cx-18, cy-24, cx+18, cy-8], radius=2, fill='#E8F4FD', outline='#333', width=1)
    for row in range(3):
        for col in range(3):
            x = cx - 14 + col * 14
            y = cy + row * 13
            draw.ellipse([x, y, x+10, y+10], fill='#EEE', outline='#CCC', width=1)

def draw_review_new(draw):
    cx, cy = CENTER, CENTER
    draw.rounded_rectangle([cx-20, cy-28, cx+20, cy+28], radius=4, fill='white', outline='#333', width=2)
    draw.polygon([(cx+6, cy+18), (cx+20, cy+28), (cx+20, cy+14)], fill='#EEE')
    for yo in [-14, -2, 10]:
        draw.line([cx-14, cy+yo, cx+10, cy+yo], fill='#CCC', width=1)
    draw.line([cx-12, cy+14, cx-2, cy+26], fill='#27AE60', width=3)
    draw.line([cx-2, cy+26, cx+14, cy+8], fill='#27AE60', width=3)

def draw_nophone_new(draw):
    cx, cy = CENTER, CENTER
    draw.rounded_rectangle([cx-14, cy-28, cx+14, cy+28], radius=4, fill='white', outline='#333', width=2)
    draw.rounded_rectangle([cx-10, cy-22, cx+10, cy+16], radius=2, fill='#E8F4FD', outline='#333', width=1)
    draw.ellipse([cx-4, cy+20, cx+4, cy+27], fill='#EEE', outline='#CCC', width=1)
    draw.line([cx-22, cy-32, cx+22, cy+32], fill='#E74C3C', width=5)

def draw_nosmoking_new(draw):
    cx, cy = CENTER, CENTER
    draw.rounded_rectangle([cx-28, cy-6, cx+18, cy+6], radius=3, fill='white', outline='#333', width=1)
    draw.rounded_rectangle([cx+10, cy-6, cx+22, cy+6], radius=3, fill='#DDD', outline='#333', width=1)
    draw.arc([cx+16, cy-18, cx+38, cy+10], 200, 340, fill='#AAA', width=2)
    draw.ellipse([cx-24, cy-24, cx+24, cy+24], outline='#E74C3C', width=5)
    draw.line([cx-17, cy-17, cx+17, cy+17], fill='#E74C3C', width=4)

def draw_target_new(draw):
    cx, cy = CENTER, CENTER
    rings = ['white', '#DDD', 'white']
    for i, cr in enumerate(rings):
        r = 30 - i * 10
        draw.ellipse([cx-r, cy-r, cx+r, cy+r], fill=cr, outline='#333', width=1)
    draw.ellipse([cx-4, cy-4, cx+4, cy+4], fill='#E74C3C', outline='#333', width=1)

def draw_growth_new(draw):
    c = CENTER
    draw.line([c, c+40, c, c-4], fill='#27AE60', width=4)
    draw.ellipse([c-22, c-6, c-2, c+14], fill='#27AE60', outline='#333', width=1)
    draw.ellipse([c+2, c-14, c+22, c+6], fill='#27AE60', outline='#333', width=1)
    draw.ellipse([c-6, c-18, c+6, c-4], fill='#81C784', outline='#333', width=1)


# 全部 34 个图标定义
ALL_ICONS = [
    ("h01.png", SOFT_COLORS[0], draw_running_new),     # 跑步
    ("h02.png", SOFT_COLORS[1], draw_gym_new),          # 健身/哑铃
    ("h03.png", SOFT_COLORS[2], draw_yoga_new),         # 瑜伽
    ("h04.png", SOFT_COLORS[3], draw_cycling_new),      # 骑行
    ("h05.png", SOFT_COLORS[4], draw_book_new),         # 阅读
    ("h06.png", SOFT_COLORS[5], draw_writing_new),       # 写作
    ("h07.png", SOFT_COLORS[6], draw_painting_new),      # 画画
    ("h08.png", SOFT_COLORS[7], draw_piano_new),         # 练琴
    ("h09.png", SOFT_COLORS[8], draw_water_new),         # 喝水
    ("h10.png", SOFT_COLORS[9], draw_food_new),          # 饮食
    ("h11.png", SOFT_COLORS[10], draw_sleep_new),        # 早睡
    ("h12.png", SOFT_COLORS[11], draw_sunrise_new),      # 早起
    ("h13.png", SOFT_COLORS[12], draw_pill_new),         # 服药
    ("h14.png", SOFT_COLORS[13], draw_cleaning_new),     # 打扫
    ("h15.png", SOFT_COLORS[14], draw_accounting_new),   # 记账
    ("h16.png", SOFT_COLORS[15], draw_review_new),       # 复盘
    ("h17.png", SOFT_COLORS[16], draw_nophone_new),      # 戒手机
    ("h18.png", SOFT_COLORS[17], draw_nosmoking_new),    # 戒烟
    ("h19.png", SOFT_COLORS[18], draw_target_new),       # 目标
    ("h20.png", SOFT_COLORS[19], draw_growth_new),       # 成长
    # 用户定制 h21~h34
    ("h21.png", SOFT_COLORS[20], draw_back_exercise),    # 练背
    ("h22.png", SOFT_COLORS[21], draw_dumbbell),          # 哑铃
    ("h23.png", SOFT_COLORS[22], draw_core_plank),        # 练核心
    ("h24.png", SOFT_COLORS[23], draw_tiptoe),            # 垫脚尖
    ("h25.png", SOFT_COLORS[24], draw_belly_breath),      # 腹式呼吸
    ("h26.png", SOFT_COLORS[25], draw_squat_leg),         # 练臀腿
    ("h27.png", SOFT_COLORS[26], draw_scalp_massage),     # 头皮按摩
    ("h28.png", SOFT_COLORS[27], draw_acupressure),       # 穴位按摩
    ("h29.png", SOFT_COLORS[28], draw_water_cup),         # 喝水
    ("h30.png", SOFT_COLORS[29], draw_calcium_pill),      # 吃钙片
    ("h31.png", SOFT_COLORS[30], draw_vitamin_d),         # 吃VD
    ("h32.png", SOFT_COLORS[31], draw_reading_book),      # 阅读
    ("h33.png", SOFT_COLORS[32], draw_lesson_plan),       # 备课
    ("h34.png", SOFT_COLORS[33], draw_listen_class),      # 听课
]

total_size = 0
for fname, color, draw_fn in ALL_ICONS:
    img, draw = make_circle_base(color)
    draw_fn(draw)
    fpath = os.path.join(ICON_DIR, fname)
    img.save(fpath, "PNG")
    sz = os.path.getsize(fpath)
    total_size += sz
    print(f"{fname}: {sz//1024}KB  bg={color}")

print(f"\n总计: {total_size//1024}KB ({total_size} bytes)")
