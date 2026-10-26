import type { FC } from 'react'
import { AbsoluteFill, interpolate, spring, useCurrentFrame } from 'remotion'
import { ARoll, Cutout, FX_FPS, type FxEntry, type FxProps, fonts } from './shared'
import { colors } from './theme'

// 06 Headline Storm: headline banners slam in from alternating sides, tilted, and pile up around the speaker; the ones
// marked `back` sit behind the cut-out so the speaker stays in front of the storm. White strips with ink type or ink
// strips with white type, a blue tag, 12 px radius and a long soft navy shadow. The copy is BANNERS; change each tag and
// text to fit the video. Needs the cut-out.
// Motion: seven banners, one focal slam at a time. The slam is a slightly under-damped spring (ratio 0.8: thrown objects
// carry momentum, so a small settle is honest) and speed shows as a short motion blur. No camera shake, only a slow push
// over the whole effect; the banners keep creeping the way they came, so the pile never freezes.
// SFX: 'hit' at 2 and 28 (the two big banners).
type Banner = { at: number, tag: string, text: string, y: number, x: number, rot: number, from: -1 | 1, size: number, dark?: boolean, back?: boolean }
const BANNERS: Banner[] = [
	{ at: 2, tag: 'BREAKING', text: 'CLAUDE CUT THIS REEL', y: 300, x: 20, rot: -4, from: -1, size: 62 },
	{ at: 8, tag: 'JUST IN', text: '21 EFFECTS. ZERO KEYFRAMES.', y: 450, x: 230, rot: 3, from: 1, size: 44, back: true },
	{ at: 14, tag: 'LIVE', text: 'THE TIMELINE IS A PROMPT NOW', y: 640, x: 20, rot: -3, from: -1, size: 42, dark: true, back: true },
	{ at: 21, tag: 'NEW', text: 'EDITED IN REACT', y: 1170, x: 20, rot: -3, from: -1, size: 56 },
	{ at: 28, tag: 'BREAKING', text: 'SHIPPED BEFORE LUNCH', y: 1320, x: 130, rot: 4, from: 1, size: 52, dark: true },
	{ at: 35, tag: 'UPDATE', text: 'ONE PROMPT. ONE REEL.', y: 1510, x: 20, rot: -3, from: -1, size: 54 },
	{ at: 42, tag: 'JUST IN', text: 'SHIPPED FROM A TERMINAL', y: 1670, x: 210, rot: 3, from: 1, size: 46, dark: true },
]

// Slam: stiffness 900 (response ≈ 0.21 s), damping ratio 0.8.
const slam = (frame: number, at: number) => spring({ frame: frame - at, fps: FX_FPS, config: { stiffness: 900, damping: 48, mass: 1 } })

const Strip = ({ b, frame }: { b: Banner, frame: number }) => {
	if (frame < b.at) return null
	const p = slam(frame, b.at)
	const prev = slam(frame - 1, b.at)
	const off = (1 - p) * 1400 * b.from
	const blur = Math.min(12, Math.abs(p - prev) * 1400 * 0.03)
	const drift = (frame - b.at) * 0.6 * -b.from
	const pad = b.size * 0.34
	const bg = b.dark ? colors.navy : '#FFFFFF'
	const fg = b.dark ? '#FFFFFF' : colors.navy
	return <div style={{ position: 'absolute', left: b.x + off + drift, top: b.y, transform: `rotate(${b.rot}deg)`, transformOrigin: 'left center', display: 'flex', alignItems: 'stretch', filter: blur > 0.5 ? `blur(${blur.toFixed(1)}px)` : undefined, borderRadius: 12, overflow: 'hidden', border: b.dark ? undefined : `1px solid ${colors.navy200}`, boxShadow: '0 30px 60px -28px rgba(15,23,42,0.6), 0 3px 10px rgba(15,23,42,0.14)', whiteSpace: 'nowrap' }}>
		<div style={{ background: colors.blue, color: '#fff', fontFamily: fonts.ui, fontWeight: 800, fontSize: Math.max(24, b.size * 0.5), letterSpacing: '0.04em', padding: `0 ${pad * 0.8}px`, display: 'flex', alignItems: 'center' }}>{b.tag}</div>
		<div style={{ background: bg, color: fg, padding: `${pad * 0.6}px ${pad}px ${pad * 0.5}px`, fontFamily: fonts.display, fontWeight: 800, fontSize: b.size, lineHeight: 1, letterSpacing: '-0.02em' }}>{b.text}</div>
	</div>
}

export const HeadlineStorm: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const zoom = interpolate(frame, [0, 75], [1, 1.05])
	return <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
		<AbsoluteFill style={{ transform: `scale(${zoom})`, transformOrigin: '50% 40%' }}>
			<ARoll from={from} />
			{BANNERS.filter(b => b.back).map(b => <Strip key={b.text} b={b} frame={frame} />)}
			<Cutout from={from} />
			{BANNERS.filter(b => !b.back).map(b => <Strip key={b.text} b={b} frame={frame} />)}
		</AbsoluteFill>
	</AbsoluteFill>
}

export const headlineStormFx: FxEntry = { id: 'headline-storm', name: 'Headline Storm', duration: 75, Component: HeadlineStorm,
	sfx: [{ at: 2, sound: 'hit', volume: 0.3 }, { at: 28, sound: 'hit', volume: 0.25 }],
}
