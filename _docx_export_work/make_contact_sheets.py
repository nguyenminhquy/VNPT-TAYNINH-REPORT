import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


source = Path(sys.argv[1]) if len(sys.argv) > 1 else Path(__file__).with_name("rendered-pages")
output = Path(sys.argv[2]) if len(sys.argv) > 2 else Path(__file__).with_name("contact-sheets")
output.mkdir(exist_ok=True)
pages = sorted(source.glob("page-*.png"), key=lambda path: int(path.stem.split("-")[-1]))
font = ImageFont.load_default(size=24)

for sheet_index in range(0, len(pages), 4):
    group = pages[sheet_index : sheet_index + 4]
    images = [Image.open(path).convert("RGB") for path in group]
    width = max(image.width for image in images)
    height = max(image.height for image in images)
    label_height = 40
    canvas = Image.new("RGB", (width * 2 + 30, (height + label_height) * 2 + 30), "#d7dee6")
    draw = ImageDraw.Draw(canvas)
    for item_index, (path, image) in enumerate(zip(group, images)):
        column = item_index % 2
        row = item_index // 2
        x = column * (width + 20)
        y = row * (height + label_height + 20)
        canvas.paste(image, (x, y + label_height))
        draw.text((x + 8, y + 7), f"Trang {int(path.stem.split('-')[-1])}", fill="#12253b", font=font)
    canvas.save(output / f"contact-{sheet_index // 4 + 1:02d}.jpg", quality=88)

print(f"Created {len(list(output.glob('contact-*.jpg')))} contact sheets")
