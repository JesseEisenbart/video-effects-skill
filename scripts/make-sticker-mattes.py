"""Bake the Paper Cutout sticker border for every frame of a take, once, instead of filtering live in the browser.

Rendering the border live with an SVG feMorphology dilate + two blurs on a full 1080×1920 layer was far too slow to render.
This reads each per-frame person cut-out (RGBA webp from make-fg.py), grows its silhouette into a thick rounded white
border with a soft drop shadow, and writes one small RGBA webp per frame at half resolution (the border is a flat white
shape, so it scales up cleanly). The effect draws shadow + border, then the full-resolution cut-out on top.

usage: python3 scripts/make-sticker-mattes.py <fg_dir> <sticker_dir>
   e.g. python3 scripts/make-sticker-mattes.py public/takes/<name>/fg public/takes/<name>/sticker
"""
import os
import sys
from concurrent.futures import ProcessPoolExecutor

import numpy as np
from PIL import Image, ImageFilter

W, H = 540, 960  # half of 1080×1920
BORDER = 10  # px at 540 wide → 20 px at 1080
SHADOW = (6, 10, 8)  # dx, dy, blur (px at 540)


def shift(a: np.ndarray, s: int, axis: int) -> np.ndarray:
	"""np.roll without the wrap-around (np.roll would carry the shoulders over to the top edge as a white band)."""
	out = np.zeros_like(a)
	src = [slice(None)] * 2
	dst = [slice(None)] * 2
	src[axis], dst[axis] = (slice(0, -s), slice(s, None)) if s > 0 else (slice(-s, None), slice(0, s))
	out[tuple(dst)] = a[tuple(src)]
	return out


def dilate(mask: np.ndarray, r: int) -> np.ndarray:
	"""Square max-filter by separable shifts (fast in numpy), rounded afterwards by blur + threshold."""
	out = mask.copy()
	for axis in (0, 1):
		acc = out.copy()
		for s in range(1, r + 1):
			acc = np.maximum(acc, shift(out, s, axis))
			acc = np.maximum(acc, shift(out, -s, axis))
		out = acc
	return out


def one(args):
	src, dst = args
	alpha = Image.open(src).getchannel('A').resize((W, H), Image.BILINEAR)
	solid = (np.asarray(alpha) > 110).astype(np.uint8) * 255
	fat = dilate(solid, BORDER)
	rounded = Image.fromarray(fat).filter(ImageFilter.GaussianBlur(3))
	edge = np.clip((np.asarray(rounded).astype(np.int16) - 90) * 3, 0, 255).astype(np.uint8)
	shadow = Image.fromarray(edge).filter(ImageFilter.GaussianBlur(SHADOW[2]))
	sh = np.zeros((H, W), np.uint8)
	dx, dy = SHADOW[0], SHADOW[1]
	sh[dy:, dx:] = (np.asarray(shadow)[: H - dy, : W - dx] * 0.38).astype(np.uint8)
	# Composite: dark navy shadow under a white border.
	rgba = np.zeros((H, W, 4), np.uint8)
	rgba[..., :3] = (10, 14, 40)
	rgba[..., 3] = sh
	white = edge.astype(np.float32) / 255
	for c in range(3):
		rgba[..., c] = (rgba[..., c] * (1 - white) + 255 * white).astype(np.uint8)
	rgba[..., 3] = np.maximum(sh, edge)
	Image.fromarray(rgba, 'RGBA').save(dst, quality=85, alpha_quality=90, method=4)


if __name__ == '__main__':
	src_dir, dst_dir = sys.argv[1], sys.argv[2]
	os.makedirs(dst_dir, exist_ok=True)
	names = sorted(n for n in os.listdir(src_dir) if n.endswith('.webp'))
	jobs = [(os.path.join(src_dir, n), os.path.join(dst_dir, n)) for n in names]
	with ProcessPoolExecutor() as ex:
		for i, _ in enumerate(ex.map(one, jobs, chunksize=16)):
			if i % 200 == 0:
				print(f'{i}/{len(jobs)}', flush=True)
	print(f'done {len(jobs)}')
