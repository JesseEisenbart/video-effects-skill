"""Generate a synthetic sample take so the project renders without anyone's footage.

Writes <out>/take.mp4 (1080×1920, 30 fps, 10 s, silent audio track) and <out>/masks/NNNN.png, the exact person mask
for every frame, in the same format tools/matte produces. Feed them to make-fg.py and make-sticker-mattes.py as usual.

usage: python3 scripts/make-sample.py public/sample
"""
import math
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter

W, H, FPS, N = 1080, 1920, 30, 300


def room(draw: ImageDraw.ImageDraw) -> None:
	for y in range(H):
		t = y / H
		draw.line([(0, y), (W, y)], fill=(int(70 + 40 * t), int(92 + 30 * t), int(128 + 10 * t)))
	draw.rectangle([0, 1500, W, H], fill=(96, 78, 64))
	for x0, y0, w, h, c in [(60, 260, 300, 22, (200, 190, 170)), (720, 420, 300, 22, (200, 190, 170)), (90, 160, 60, 100, (226, 120, 90)),
							 (180, 200, 40, 60, (120, 170, 140)), (800, 330, 90, 90, (240, 220, 120)), (60, 1180, 160, 320, (60, 72, 96))]:
		draw.rounded_rectangle([x0, y0, x0 + w, y0 + h], radius=8, fill=c)


def person(i: int):
	"""Head, neck and torso with a gentle sway; returns (shapes, mouth openness)."""
	sway = 10 * math.sin(i / 23)
	nod = 6 * math.sin(i / 11)
	cx = 540 + sway
	head = [cx - 150, 600 + nod, cx + 150, 960 + nod]
	neck = [cx - 62, 900 + nod, cx + 62, 1080]
	torso = [cx - 390, 1040, cx + 390, H + 200]
	talk = max(0.0, math.sin(i / 2.3)) * (0.5 + 0.5 * math.sin(i / 17))
	return head, neck, torso, talk, cx, nod


def main(out: str) -> None:
	os.makedirs(f'{out}/masks', exist_ok=True)
	bg = Image.new('RGB', (W, H))
	room(ImageDraw.Draw(bg))
	enc = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-',
							'-f', 'lavfi', '-i', 'anullsrc=r=48000:cl=stereo', '-t', str(N / FPS), '-c:v', 'libx264', '-crf', '18',
							'-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', f'{out}/take.mp4'], stdin=subprocess.PIPE)
	for i in range(N):
		head, neck, torso, talk, cx, nod = person(i)
		frame = bg.copy()
		d = ImageDraw.Draw(frame)
		d.rounded_rectangle(torso, radius=260, fill=(38, 44, 58))
		d.rectangle(neck, fill=(214, 168, 140))
		d.ellipse(head, fill=(228, 182, 152))
		d.chord([head[0] - 6, head[1] - 20, head[2] + 6, head[1] + 200], 180, 360, fill=(58, 42, 34))  # hair
		for ex in (cx - 62, cx + 62):
			d.ellipse([ex - 15, 760 + nod, ex + 15, 790 + nod], fill=(40, 36, 40))
		d.rounded_rectangle([cx - 55, 880 + nod, cx + 55, 892 + nod + 34 * talk], radius=14, fill=(120, 52, 52))
		enc.stdin.write(frame.tobytes())
		mask = Image.new('L', (W, H), 0)
		m = ImageDraw.Draw(mask)
		m.rounded_rectangle(torso, radius=260, fill=255)
		m.rectangle(neck, fill=255)
		m.ellipse(head, fill=255)
		m.chord([head[0] - 6, head[1] - 20, head[2] + 6, head[1] + 200], 180, 360, fill=255)
		mask.filter(ImageFilter.GaussianBlur(1)).save(f'{out}/masks/{i:04d}.png')
	enc.stdin.close()
	enc.wait()
	print('done', N)


if __name__ == '__main__':
	main(sys.argv[1])
