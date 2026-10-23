import type { FC, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import type { FxEntry, FxProps } from './shared'
import { ARoll, type Face, FX_H, FX_W, fxSpring, progress, useFace } from './shared'

// 12 Liquid Glass: a drop of clear glass glides in from the left on a critically damped spring, parks over the speaker's
// face (magnifying it, the rim bending the room like a thick lens), breathes very slightly, then leaves the way it came.
// Built from copies of the take: an outer refraction ring (minified + softened) and a magnified core, both clipped to a
// gently morphing blob, then a neutral specular rim, inner shadow and highlight on top. The footage under it stays
// untouched, so the first and last frames are plain footage and it hard-cuts both ways. Needs the face position; no
// cut-out.
// Motion: in from 0 (settled by about 18), hold and drift 16 to 48, out 48 to 68; the blob stretches slightly along its
// direction of travel.
// SFX: 'whoosh' at 0 (glides in), 'whoosh' at 48 (exits left).

const R = 250 // lens radius
const DUR = 72

// Path: in from the left (0–~18, critically damped), hold and drift over the face (16–48), back out to the left (48–68).
const OFF_X = -R - 60
const lensPos = (f: number, FACE: Face) => {
	const inP = fxSpring(f, 0, { stiffness: 150 })
	const outP = Easing.in(Easing.cubic)(progress(f, 48, 20))
	const park = FACE.x - 30 + interpolate(progress(f, 16, 32), [0, 1], [0, 40])
	const x = interpolate(inP, [0, 1], [OFF_X, park]) + outP * (OFF_X - park)
	const y = FACE.y + 110 + Math.sin(f / 10) * 8
	const prev = interpolate(fxSpring(f - 1, 0, { stiffness: 150 }), [0, 1], [OFF_X, park]) + Easing.in(Easing.cubic)(progress(f - 1, 48, 20)) * (OFF_X - park)
	const v = Math.min(1, Math.abs(x - prev) / 90) // speed proxy for the stretch along the motion
	return { x, y, v }
}

// A full-frame layer of footage scaled about the lens centre, positioned inside a lens-sized clip box.
const Optic = ({ from, cx, cy, scale, filter, children }: { from: number; cx: number; cy: number; scale: number; filter?: string; children?: ReactNode }) => (
	<div style={{ position: 'absolute', left: R - cx, top: R - cy, width: FX_W, height: FX_H, transform: `scale(${scale})`, transformOrigin: `${cx}px ${cy}px`, filter }}>
		<ARoll from={from} />
		{children}
	</div>
)

export const LiquidGlass: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const { x, y, v } = lensPos(frame, useFace())
	const squash = 1 + v * 0.14
	const w = (k: number) => 50 + Math.sin(frame / 8 + k) * 2.5
	const blob = `${w(0)}% ${100 - w(0)}% ${w(1)}% ${100 - w(1)}% / ${w(2)}% ${w(3)}% ${100 - w(3)}% ${100 - w(2)}%`
	const clip = { position: 'absolute' as const, inset: 0, borderRadius: blob, overflow: 'hidden' }
	return (
		<AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
			<ARoll from={from} />
			<div style={{ position: 'absolute', left: x - R, top: y - R, width: R * 2, height: R * 2, transform: `scale(${squash}, ${1 / squash})`, filter: 'drop-shadow(0 40px 50px rgba(15,23,42,0.3))' }}>
				{/* Edge refraction: the scene minified and smeared, seen through the thick rim. */}
				<div style={clip}>
					<Optic from={from} cx={x} cy={y} scale={0.72} filter="blur(2px) brightness(1.1)" />
				</div>
				{/* Magnified core, feathered into the rim. */}
				<div style={{ ...clip, WebkitMaskImage: 'radial-gradient(closest-side, #000 62%, transparent 86%)', maskImage: 'radial-gradient(closest-side, #000 62%, transparent 86%)' }}>
					<Optic from={from} cx={x} cy={y} scale={1.38} />
				</div>
				{/* Glass body: inner shadow low, bright rim high, specular streak, hairline edge. */}
				<div style={{ position: 'absolute', inset: 0, borderRadius: blob, boxShadow: 'inset 0 -20px 40px rgba(15,23,42,0.22), inset 0 16px 28px rgba(255,255,255,0.5), inset 0 0 0 2px rgba(255,255,255,0.75)' }} />
				<div style={{ position: 'absolute', left: R * 0.32, top: R * 0.16, width: R * 0.75, height: R * 0.32, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,255,255,0.75), rgba(255,255,255,0))', transform: 'rotate(-22deg)' }} />
				<div style={{ position: 'absolute', right: R * 0.3, bottom: R * 0.22, width: R * 0.22, height: R * 0.1, borderRadius: '50%', background: 'radial-gradient(closest-side, rgba(255,255,255,0.6), rgba(255,255,255,0))', transform: 'rotate(-22deg)' }} />
			</div>
		</AbsoluteFill>
	)
}

export const liquidGlassFx: FxEntry = { id: 'liquid-glass', name: 'Liquid Glass', duration: DUR, Component: LiquidGlass,
	sfx: [{ at: 0, sound: 'whoosh', volume: 0.35 }, { at: 48, sound: 'whoosh', volume: 0.3 }],
}
