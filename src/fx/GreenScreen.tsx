import type { FC } from 'react'
import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { ARoll, Cutout, FX_H, FX_W, type FxEntry, type FxProps, progress } from './shared'

// 14 Green Screen: the room behind the speaker is keyed out. A chroma-green backdrop wipes down behind the cut-out
// (frame 4), holds like a studio cyc, then the light grey scene rises up from the bottom in an arc (frame 34). It ends
// still on that scene, which is exactly what Frame Break opens on, so the two chain. Needs the cut-out.
// SFX: 'whoosh' at 4 (green wipes down).
const GREEN_IN = 4
const SCENE_IN = 34

const rand = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }

/** Chroma-green studio backdrop: soft vertical fabric folds and a key light falling off to the edges. */
export const ChromaGreen = () => <div style={{ position: 'absolute', inset: 0, background: '#1FAE48' }}>
	<div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${Array.from({ length: 13 }, (_, i) => `rgba(0,0,0,${(0.02 + 0.09 * rand(i + 7)).toFixed(3)}) ${(i * 100 / 12).toFixed(1)}%`).join(', ')})` }} />
	<div style={{ position: 'absolute', inset: 0, background: 'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0) 40px, rgba(0,0,0,0.06) 80px, rgba(255,255,255,0) 120px)' }} />
	<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 70% 45% at 50% 42%, rgba(160,255,150,0.28), rgba(0,0,0,0) 70%)' }} />
	<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 90% 70% at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,40,10,0.35) 100%)' }} />
</div>

// The grey <Backdrop> from theme.tsx (#F6F6F7, soft grey blobs, faint dot grid), frozen and drawn with plain radial gradients
// instead of an 80px filter blur, so Frame Break can paint it inside fifty clipped shards cheaply. Same blob colours and placement.
const BLOBS = [
	{ x: 210, y: 170, size: 1000, color: '233,234,236', opacity: 0.9 },
	{ x: 900, y: 290, size: 1000, color: '223,225,228', opacity: 0.7 },
	{ x: 150, y: 910, size: 950, color: '212,214,218', opacity: 0.7 },
	{ x: 800, y: 780, size: 1100, color: '201,204,209', opacity: 0.35 },
	{ x: 640, y: 1500, size: 1200, color: '223,225,228', opacity: 0.5 },
]
export const StillBackdrop = () => <div style={{ position: 'absolute', inset: 0, background: '#F6F6F7', backgroundImage: [
	'radial-gradient(rgba(52,54,58,0.06) 0.9px, transparent 0.9px)',
	...BLOBS.map(b => `radial-gradient(circle ${b.size / 2}px at ${b.x}px ${b.y}px, rgba(${b.color},${b.opacity}) 0%, rgba(${b.color},${b.opacity * 0.8}) 30%, rgba(${b.color},0) 100%)`),
].join(', '), backgroundSize: ['16px 16px', ...BLOBS.map(() => 'auto')].join(', ') }} />


/** The light scene behind the speaker (shared with Frame Break): just the still backdrop. */
export const StudioScene = () => <StillBackdrop />

export const GreenScreen: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const g = Easing.inOut(Easing.cubic)(progress(frame, GREEN_IN, 7))
	const c = Easing.inOut(Easing.cubic)(progress(frame, SCENE_IN, 14))
	// The scene rises as a circle centred well below the frame, so its leading edge is a gentle arc.
	const R = interpolate(c, [0, 1], [0, 2900])
	return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
		<ARoll from={from} />
		{g > 0 && <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 0 ${(1 - g) * 100}% 0)` }}><ChromaGreen /></div>}
		{g > 0 && g < 1 && <div style={{ position: 'absolute', left: 0, right: 0, top: g * FX_H - 2, height: 4, background: '#E9FFEF', boxShadow: '0 0 24px 6px rgba(167,243,208,0.6)' }} />}
		{c > 0 && <div style={{ position: 'absolute', inset: 0, clipPath: `circle(${R}px at 50% ${FX_H + 700}px)` }}>
			<StudioScene />
		</div>}
		{/* the leading edge: a thin bright rim, like light catching the edge of the new surface */}
		{c > 0 && c < 1 && <svg width={FX_W} height={FX_H} style={{ position: 'absolute', inset: 0 }}>
			<circle cx={FX_W / 2} cy={FX_H + 700} r={R} fill="none" stroke="#FFFFFF" strokeWidth={5} opacity={0.95} />
		</svg>}
		{g > 0 && <Cutout from={from} />}
	</div>
}

export const greenScreenFx: FxEntry = { id: 'green-screen', name: 'Green Screen', duration: 72, Component: GreenScreen,
	sfx: [{ at: 4, sound: 'whoosh', volume: 0.4 }],
}
