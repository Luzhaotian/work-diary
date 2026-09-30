#!/usr/bin/env python3
"""生成 tabBar 图标：4 个图标 × (常态 #9CA3AF / 激活态 #2563EB) = 8 张 81×81 PNG。

用 4× 超采样绘制后 LANCZOS 降采样，得到平滑的抗锯齿边缘。
所有绘制先在 'L' 模式遮罩上完成（白=不透明），再上色，
这样「挖孔」（齿轮中心、圆环内圈）可以直接用黑色覆盖。
"""
from PIL import Image, ImageDraw
import math
import os

import os.path as _osp
REPO_ROOT = _osp.dirname(_osp.dirname(_osp.abspath(__file__)))
OUT = _osp.join(REPO_ROOT, "src", "static", "tabs")
SIZE = 81          # 微信小程序 tabBar 推荐尺寸
SS = 4             # 超采样倍数
S = SIZE * SS      # 324

COLOR_NORMAL = (0x9C, 0xA3, 0xAF, 255)   # #9CA3AF  pages.json tabBar.color
COLOR_ACTIVE = (0x25, 0x63, 0xEB, 255)   # #2563EB  pages.json tabBar.selectedColor

STROKE = 22        # 4× 空间的线宽 ≈ 5.5px @81
CX = CY = S // 2   # 162


def new_mask():
    return Image.new("L", (S, S), 0), ImageDraw.Draw(Image.new("L", (S, S), 0))


def capped_line(d, p1, p2, w):
    """画线并在两端加圆头，避免缩放后出现方角。"""
    d.line([p1, p2], fill=255, width=w)
    r = w // 2
    for (x, y) in (p1, p2):
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)


def ring(d, cx, cy, r_out, w):
    """圆环：外圆挖掉内圆。"""
    d.ellipse([cx - r_out, cy - r_out, cx + r_out, cy + r_out], fill=255)
    r_in = r_out - w
    d.ellipse([cx - r_in, cy - r_in, cx + r_in, cy + r_in], fill=0)


def rounded_outline(d, box, radius, w):
    """圆角矩形描边：外框填白后挖掉内框。"""
    x0, y0, x1, y1 = box
    d.rounded_rectangle(box, radius=radius, fill=255)
    d.rounded_rectangle([x0 + w, y0 + w, x1 - w, y1 - w], radius=max(0, radius - w), fill=0)


# ── 图标 1：记录（首页打卡）——时钟 ──────────────────────────────
def draw_record(d):
    ring(d, CX, CY, 132, STROKE)
    # 分针指向 12 点，时针指向约 3 点半，读数清晰
    capped_line(d, (CX, CY), (CX, CY - 72), STROKE)
    capped_line(d, (CX, CY), (CX + 52, CY + 34), STROKE)
    d.ellipse([CX - 14, CY - 14, CX + 14, CY + 14], fill=255)


# ── 图标 2：历史（记录列表）——项目符号列表 ──────────────────────
def draw_history(d):
    for y in (92, 162, 232):
        d.ellipse([52 - 17, y - 17, 52 + 17, y + 17], fill=255)
        capped_line(d, (110, y), (272, y), STROKE)


# ── 图标 3：日历 ──────────────────────────────────────────────
def draw_calendar(d):
    # 顶部两个挂环（先画，让主体描边压住其下端）
    for x in (104, 220):
        capped_line(d, (x, 30), (x, 100), 24)
    rounded_outline(d, (30, 62, 294, 294), 26, STROKE)
    # 表头分隔线
    d.rectangle([30, 116, 294, 116 + STROKE], fill=255)
    # 3×2 日期点阵
    for y in (182, 244):
        for x in (98, 162, 226):
            d.ellipse([x - 16, y - 16, x + 16, y + 16], fill=255)


# ── 图标 4：设置——齿轮 ────────────────────────────────────────
def draw_settings(d):
    teeth, r_body, r_tip, half_w = 8, 100, 134, 27
    for i in range(teeth):
        a = 2 * math.pi * i / teeth - math.pi / 2
        dx, dy = math.cos(a), math.sin(a)
        px, py = -dy, dx          # 垂直方向
        pts = []
        for r in (r_body - 14, r_tip):
            for s in (1, -1):
                pts.append((CX + dx * r + px * half_w * s, CY + dy * r + py * half_w * s))
        # 按 (外,外,内,内) 顺序构成梯形齿
        p_out_a = (CX + dx * r_tip + px * half_w, CY + dy * r_tip + py * half_w)
        p_out_b = (CX + dx * r_tip - px * half_w, CY + dy * r_tip - py * half_w)
        p_in_b = (CX + dx * (r_body - 14) - px * half_w, CY + dy * (r_body - 14) - py * half_w)
        p_in_a = (CX + dx * (r_body - 14) + px * half_w, CY + dy * (r_body - 14) + py * half_w)
        d.polygon([p_out_a, p_out_b, p_in_b, p_in_a], fill=255)
    # 轮盘
    d.ellipse([CX - r_body, CY - r_body, CX + r_body, CY + r_body], fill=255)
    # 中心孔
    r_hole = 46
    d.ellipse([CX - r_hole, CY - r_hole, CX + r_hole, CY + r_hole], fill=0)


ICONS = {
    "record": draw_record,
    "history": draw_history,
    "calendar": draw_calendar,
    "settings": draw_settings,
}


def render(fn, color):
    mask = Image.new("L", (S, S), 0)
    fn(ImageDraw.Draw(mask))
    mask = mask.resize((SIZE, SIZE), Image.LANCZOS)
    out = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    out.paste(color, (0, 0), mask)
    return out


os.makedirs(OUT, exist_ok=True)
for name, fn in ICONS.items():
    for suffix, color in (("", COLOR_NORMAL), ("-active", COLOR_ACTIVE)):
        path = os.path.join(OUT, f"{name}{suffix}.png")
        img = render(fn, color)
        img.save(path, "PNG", optimize=True)
        px = sum(1 for p in img.getdata() if p[3] > 0)
        print(f"  {path:38s} {img.size[0]}x{img.size[1]}  {os.path.getsize(path):>5}B  非透明像素 {px}")

print("\n完成：8 张图标")
