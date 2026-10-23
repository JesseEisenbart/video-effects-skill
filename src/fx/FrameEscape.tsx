import type { FC } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { ARoll, Cutout, FX_H, FX_W, type FxEntry, type FxProps, fxSpring, useFace } from './shared'
import { Backdrop, colors } from './theme'

// 03 Frame Escape: the take settles into a tilted white print on the grey Backdrop, then the print tightens down to the
// speaker's chest while the cut-out stays put, so their head and shoulders break out over the top border and cast a soft
// shadow on it. Needs the cut-out; the face position sets the pivot the print tilts about.
// Motion: two critically damped springs on one continuous path (shrink + tilt from 0, then drop + counter-tilt from 20),
// no idle wobble; the print's shadow deepens as it lifts off the backdrop.
// SFX: 'whoosh' at 0 (the print forms), 'reveal' at 20 (the print drops and the head breaks out).
const DURATION = 75
const BORDER = 18
const R = 16 // print corner radius (GlassCard inner radius)
type Box = { x0: number, y0: number, x1: number, y1: number }
// Print bounds in footage coords (the footage itself never moves inside the group).
const FULL: Box = { x0: 0, y0: 0, x1: FX_W, y1: FX_H }
const PRINT: Box = { x0: 50, y0: 150, x1: 1030, y1: 1790 }
const ESCAPE: Box = { x0: 140, y0: 1075, x1: 940, y1: 1800 }
const mix = (a: Box, b: Box, t: number): Box => ({ x0: a.x0 + (b.x0 - a.x0) * t, y0: a.y0 + (b.y0 - a.y0) * t, x1: a.x1 + (b.x1 - a.x1) * t, y1: a.y1 + (b.y1 - a.y1) * t })

export const FrameEscape: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const FACE = useFace()
	const a = fxSpring(frame, 0, { stiffness: 130 })
	const b = fxSpring(frame, 20, { stiffness: 150 })
	const box = mix(mix(FULL, PRINT, a), ESCAPE, b)
	// Group transform: shrink + tilt into the print, then tilt back the other way as it drops.
	const scale = interpolate(a, [0, 1], [1, 0.8]) + 0.1 * b
	const rot = -4 * a + 7 * b
	const ty = -70 * b
	const origin = `${FACE.x}px ${FACE.y + 100}px`
	const clipVideo = `inset(${box.y0}px ${FX_W - box.x1}px ${FX_H - box.y1}px ${box.x0}px round ${(R - BORDER / 2) * a}px)`
	// Cut-out: everything inside the print (matches the video) plus the column above its top edge (the escape).
	const clipCut = `polygon(${box.x0}px -2000px, ${box.x1}px -2000px, ${box.x1}px ${box.y1}px, ${box.x0}px ${box.y1}px)`
	return <AbsoluteFill style={{ overflow: 'hidden' }}>
		<Backdrop />
		<div style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: FX_H, transformOrigin: origin, transform: `translateY(${ty}px) rotate(${rot}deg) scale(${scale})` }}>
			{/* The print: white card with a soft shadow, the footage cropped to its window. */}
			<div style={{ position: 'absolute', left: box.x0 - BORDER, top: box.y0 - BORDER, width: box.x1 - box.x0 + BORDER * 2, height: box.y1 - box.y0 + BORDER * 2, background: '#fff', borderRadius: R * a, outline: `1px solid ${colors.navy200}`, boxShadow: `0 ${40 + 30 * b}px ${90 + 40 * b}px -40px rgba(15,23,42,${0.55 * a}), 0 4px 12px rgba(15,23,42,${0.1 * a})` }} />
			<div style={{ position: 'absolute', inset: 0, clipPath: clipVideo }}><ARoll from={from} /></div>
			{/* Shadow wrapper outside the clip so the escaped head shades the border and the footage under it. */}
			<div style={{ position: 'absolute', inset: 0, filter: b > 0.02 ? `drop-shadow(0 ${18 * b}px ${22 * b}px rgba(15,23,42,${0.35 * b}))` : undefined }}>
				<div style={{ position: 'absolute', inset: 0, clipPath: clipCut }}><Cutout from={from} /></div>
			</div>
		</div>
	</AbsoluteFill>
}

export const frameEscapeFx: FxEntry = { id: 'frame-escape', name: 'Frame Escape', duration: DURATION, Component: FrameEscape,
	sfx: [{ at: 0, sound: 'whoosh', volume: 0.4 }, { at: 20, sound: 'reveal', volume: 0.4 }],
}
