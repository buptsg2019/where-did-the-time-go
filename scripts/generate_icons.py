#!/usr/bin/env python3
"""
生成 Tauri 所需的图标文件
从现有的 icon128x128.png 和 icon32x32.png 生成所有需要的格式
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    print("需要安装 Pillow: pip install Pillow")
    sys.exit(1)


def generate_icons():
    icons_dir = Path(__file__).parent.parent / "src-tauri" / "icons"
    
    if not icons_dir.exists():
        print(f"错误: 图标目录不存在: {icons_dir}")
        sys.exit(1)
    
    # 读取源文件
    icon_128_path = icons_dir / "icon128x128.png"
    icon_32_path = icons_dir / "icon32x32.png"
    
    # 优先使用 128x128 作为源文件
    source_path = icon_128_path if icon_128_path.exists() else icon_32_path
    
    if not source_path.exists():
        print(f"错误: 找不到源图标文件")
        sys.exit(1)
    
    print(f"使用源文件: {source_path}")
    
    # 打开源图像
    img = Image.open(source_path)
    
    # 确保是 RGBA 模式
    if img.mode != 'RGBA':
        img = img.convert('RGBA')
    
    # 生成不同尺寸的图标
    sizes = [
        (32, 32, "32x32.png"),
        (128, 128, "128x128.png"),
        (256, 256, "128x128@2x.png"),  # 2x 版本
        (256, 256, "icon.png"),  # 主图标
    ]
    
    for width, height, filename in sizes:
        resized = img.resize((width, height), Image.Resampling.LANCZOS)
        output_path = icons_dir / filename
        resized.save(output_path, "PNG")
        print(f"生成: {filename} ({width}x{height})")
    
    # 生成 Windows ICO 文件（包含多个尺寸）
    ico_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    ico_images = []
    
    for size in ico_sizes:
        resized = img.resize(size, Image.Resampling.LANCZOS)
        ico_images.append(resized)
    
    ico_path = icons_dir / "icon.ico"
    ico_images[0].save(
        ico_path,
        format='ICO',
        sizes=[(img.width, img.height) for img in ico_images],
        append_images=ico_images[1:]
    )
    print(f"生成: icon.ico (多尺寸)")
    
    print("\n图标生成完成!")
    
    # 列出所有生成的文件
    print("\n图标目录内容:")
    for f in sorted(icons_dir.iterdir()):
        if f.is_file():
            size = f.stat().st_size
            print(f"  {f.name}: {size} bytes")


if __name__ == "__main__":
    generate_icons()
