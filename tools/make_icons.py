# SPDX-License-Identifier: AGPL-3.0-or-later
"""Generate original document/camera icons; requires Pillow only for maintainers."""
from pathlib import Path
from PIL import Image,ImageDraw

ROOT=Path(__file__).resolve().parents[1]
out=ROOT/'assets';out.mkdir(exist_ok=True)
image=Image.new('RGBA',(512,512),(0,0,0,0));draw=ImageDraw.Draw(image)
draw.rounded_rectangle((16,16,496,496),radius=108,fill='#175CD3')
draw.rounded_rectangle((126,88,350,397),radius=22,fill='white')
for y in (158,204,250):draw.rounded_rectangle((164,y,310,y+12),radius=6,fill='#93B9F5')
draw.rounded_rectangle((238,285,436,422),radius=25,fill='#113568',outline='white',width=10)
draw.rounded_rectangle((279,266,344,305),radius=10,fill='#113568')
draw.ellipse((294,309,382,397),fill='white')
draw.ellipse((311,326,365,380),fill='#48D2BE')
for size in (16,32,64,128):image.resize((size,size),Image.Resampling.LANCZOS).save(out/f'snapshot-{size}.png')
svg='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect x="16" y="16" width="480" height="480" rx="108" fill="#175CD3"/><rect x="126" y="88" width="224" height="309" rx="22" fill="white"/><path d="M170 164h134M170 210h134M170 256h134" stroke="#93B9F5" stroke-width="12" stroke-linecap="round"/><rect x="279" y="266" width="65" height="39" rx="10" fill="#113568"/><rect x="238" y="285" width="198" height="137" rx="25" fill="#113568" stroke="white" stroke-width="10"/><circle cx="338" cy="353" r="44" fill="white"/><circle cx="338" cy="353" r="27" fill="#48D2BE"/></svg>'''
(out/'snapshot.svg').write_text(svg,encoding='utf-8')
print('Generated original icons at 16/32/64/128 pixels')
