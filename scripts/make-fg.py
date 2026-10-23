"""Build the per-frame person cut-out (RGBA webp) from a take and its per-frame person masks.

The masks are 8-bit grayscale PNGs named NNNN.png (0000.png first), one per frame, at the take's own size, with the person
white. tools/matte writes them on macOS; any other segmentation tool works if it produces the same files.

Each mask gets a 3-tap temporal smooth (segmentation flickers frame to frame), a 1 px erode and a soft feather, then
becomes the alpha of the take's own frame. Output matches what the fx library's Cutout expects: one webp per source frame,
NNNN.webp.

usage: python3 scripts/make-fg.py take.mp4 mask_dir out_dir
"""
import os, subprocess, sys
from concurrent.futures import ProcessPoolExecutor
import numpy as np
from PIL import Image, ImageFilter

def save(args):
	i, rgb, a, out = args
	alpha = Image.fromarray(a).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(1.2))
	im = Image.fromarray(rgb, 'RGB'); im.putalpha(alpha)
	im.save(f'{out}/{i:04d}.webp', quality=88, alpha_quality=92, method=4)

if __name__ == '__main__':
	take, masks, out = sys.argv[1:4]
	os.makedirs(out, exist_ok=True)
	n = len([f for f in os.listdir(masks) if f.endswith('.png')])
	mask = lambda k: np.asarray(Image.open(f'{masks}/{min(max(k, 0), n - 1):04d}.png').convert('L'), np.float32)
	w, h = Image.open(f'{masks}/0000.png').size
	pipe = subprocess.Popen(['ffmpeg', '-loglevel', 'error', '-i', take, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
	with ProcessPoolExecutor() as pool:
		futs = []
		for i in range(n):
			rgb = np.frombuffer(pipe.stdout.read(w * h * 3), np.uint8).reshape(h, w, 3)
			a = (0.25 * mask(i - 1) + 0.5 * mask(i) + 0.25 * mask(i + 1)).astype(np.uint8)
			futs.append(pool.submit(save, (i, rgb, a, out)))
			if len(futs) > 24: futs.pop(0).result()
		for f in futs: f.result()
	print('done', n)
