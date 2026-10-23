import type { FC, ReactNode } from 'react'
import { AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import type { FxEntry, FxProps } from './shared'
import { Cutout, FX_H, FX_W, fxSpring, popSpring, useFace, useFxSource, useSrcFrame } from './shared'
import { colors } from './theme'

// 10 Paper Cutout: the speaker becomes a die-cut sticker (thick white border + cast shadow) slapped onto a flat paper
// poster in blue, ink and white. A big blue disc sits behind the head so the white sticker edge reads; the smaller shapes
// sway on a stepped 7.5 fps clock like stop-motion paper. Needs the cut-out, the baked sticker border
// (scripts/make-sticker-mattes.py) and the face position (the disc is centred on it).
// Motion: the sticker holds still apart from one critically damped settle from the bottom edge (1.1x to 1x). The shapes
// are slapped down, so they alone get the small pop overshoot.
// SFX: 'stamp' at 2 (the sticker lands).

const PAPER = '#F4F4F2'
const BLUE = colors.blue
const INKY = colors.navy
const WHITE = '#FFFFFF'
const SHADOW = 'rgba(15,23,42,0.16)'

// Deterministic per-step jitter in [-1, 1].
const jit = (step: number, seed: number) => Math.sin(step * 12.9898 + seed * 78.233) * 0.5 + Math.sin(step * 4.1 + seed * 1.7) * 0.5

type Shape = { at: number; x: number; y: number; rot: number; sway: number; el: (s: number) => ReactNode }
const Star = ({ size, fill }: { size: number; fill: string }) => {
	const pts = Array.from({ length: 10 }, (_, i) => {
		const r = i % 2 === 0 ? size / 2 : size / 4.6
		const a = (Math.PI / 5) * i - Math.PI / 2
		return `${size / 2 + r * Math.cos(a)},${size / 2 + r * Math.sin(a)}`
	}).join(' ')
	return <svg width={size} height={size} style={{ overflow: 'visible' }}><polygon points={pts} fill={SHADOW} transform="translate(9 12)" /><polygon points={pts} fill={fill} stroke={INKY} strokeWidth={6} strokeLinejoin="round" /></svg>
}

const SHAPES: Shape[] = [
	// The focal shape: a blue disc behind the head (centred on the face) for the white sticker edge to read against.
	{ at: 0, x: 167, y: 300, rot: 0, sway: 0, el: () => <div style={{ width: 720, height: 720, borderRadius: '50%', background: BLUE, boxShadow: `12px 16px 0 ${SHADOW}` }} /> },
	{ at: 2, x: 40, y: 290, rot: -12, sway: 1, el: () => <Star size={190} fill={WHITE} /> },
	{ at: 4, x: -90, y: 900, rot: -10, sway: 1, el: () => <div style={{ width: 500, height: 84, background: WHITE, border: `6px solid ${INKY}`, boxShadow: `10px 14px 0 ${SHADOW}` }} /> },
	{ at: 5, x: 720, y: 870, rot: -10, sway: 1, el: () => <div style={{ width: 480, height: 84, background: INKY, boxShadow: `10px 14px 0 ${SHADOW}` }} /> },
	{ at: 7, x: 910, y: 330, rot: 0, sway: 1, el: () => <div style={{ width: 84, height: 84, borderRadius: '50%', background: WHITE, border: `6px solid ${INKY}`, boxShadow: `8px 10px 0 ${SHADOW}` }} /> },
	{ at: 9, x: 830, y: 700, rot: 0, sway: 1, el: () => <svg width={240} height={70} style={{ overflow: 'visible' }}><path d="M5 35 Q 37 0 70 35 T 135 35 T 200 35 T 235 35" fill="none" stroke={INKY} strokeWidth={13} strokeLinecap="round" /></svg> },
	{ at: 11, x: 70, y: 650, rot: 45, sway: 1, el: () => <div style={{ width: 80, height: 80, background: BLUE, border: `6px solid ${INKY}`, boxShadow: `8px 10px 0 ${SHADOW}` }} /> },
]

export const PaperCutout: FC<FxProps> = ({ from }) => {
	const { sticker } = useFxSource()
	const face = useFace()
	const frame = useCurrentFrame()
	const step = Math.floor(frame / 4) // 30 fps → 7.5 fps paper clock
	const src = useSrcFrame(from)
	const land = fxSpring(frame, 0, { stiffness: 260 })
	// Never below 1: the matte is cut by the frame edges, and shrinking it would expose those straight cut lines as border.
	const stickerScale = interpolate(land, [0, 1], [1.1, 1])
	return (
		<AbsoluteFill style={{ background: PAPER, overflow: 'hidden' }}>
			{/* Fine halftone dots for a printed-paper feel (static: the background never jitters). */}
			<AbsoluteFill style={{ backgroundImage: 'radial-gradient(rgba(15,23,42,0.07) 2.5px, transparent 3px)', backgroundSize: '30px 30px' }} />
			{SHAPES.map((s, i) => {
				const p = popSpring(frame, s.at)
				// Stop-motion sway: small, stepped, only on the satellite shapes (the disc stays put behind the head).
				const r = s.rot + jit(step, 20 + i) * 1.2 * s.sway
				return (
					<div key={i} style={{ position: 'absolute', left: i === 0 ? face.x - 360 : s.x, top: i === 0 ? face.y - 400 : s.y, opacity: Math.min(1, p * 2), transform: `scale(${p}) rotate(${r}deg)`, transformOrigin: 'center' }}>
						{s.el(p)}
					</div>
				)
			})}
			{/* Sticker border + shadow, baked per frame by scripts/make-sticker-mattes.py into the source's `sticker` folder (a
			    live SVG dilate on the full frame was far too slow). Half-res flat white shape, scaled up, then the full-res cut-out on top. */}
			<div style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: FX_H, transform: `scale(${stickerScale})`, transformOrigin: '540px 1920px' }}>
				{/* The bake leaves a white band along the frame's top edge and slivers down the sides where the matte touches them;
				    clip those off (the head never reaches the top, and the cut-out itself still runs to the edges). */}
				<Img src={staticFile(`${sticker}/${String(src).padStart(4, '0')}.webp`)} style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: FX_H, clipPath: 'inset(90px 28px 0 28px)' }} />
				<Cutout from={from} />
			</div>
			{/* Paper grain over everything: one static noise texture (static so nothing on the sticker or paper shimmers). */}
			<Img src={staticFile('textures/paper-grain.png')} style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: FX_H, opacity: 0.12, mixBlendMode: 'multiply' }} />
		</AbsoluteFill>
	)
}

export const paperCutoutFx: FxEntry = { id: 'paper-cutout', name: 'Paper Cutout', duration: 75, Component: PaperCutout,
	sfx: [{ at: 2, sound: 'stamp', volume: 0.35 }],
}
