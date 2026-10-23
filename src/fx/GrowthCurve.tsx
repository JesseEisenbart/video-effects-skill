import type { FC } from 'react'
import { AbsoluteFill, Easing, useCurrentFrame } from 'remotion'
import { ARoll, Cutout, type FxEntry, type FxProps, FX_H, FX_W, progress } from './shared'
import { Backdrop, GlassBlur, GlassCard, green, materialize, pop, colors, themeFonts } from './theme'

// 08 Growth Curve: the room cross-fades to the light grey Backdrop, then a blue line chart with a soft blue area draws
// up and to the right behind the speaker's cut-out while a glass counter card counts 1x to 10x. When the line lands, a
// mint pill materializes under the number. The axis caption, the counter's unit and the pill text are on-screen copy;
// change them to fit the video. Needs the cut-out.
// Motion: cross-fade 0 to 9, card and caption materialize at 6 and 8, the line draws 10 to 56 on an ease, the pill lands
// at 56 on the critically damped UI spring.
// SFX: 'reveal' at 0 (backdrop), 'chime' at 56 (the counter lands on 10x).
const X0 = 30
const X1 = 1000
const Y0 = 1080
const Y1 = 520
const DRAW_AT = 10
const DRAW_LEN = 46
const N = 60

// Exponential curve with a few deterministic wobbles, so it reads as data rather than a formula.
const growth = (t: number) => (Math.exp(3.6 * t) - 1) / (Math.exp(3.6) - 1)
const curve = (t: number) => {
	const wob = Math.sin(t * 23) * 14 * (1 - t) + Math.sin(t * 9 + 1) * 10
	return { x: X0 + (X1 - X0) * t, y: Y0 - (Y0 - Y1) * growth(t) + wob * (t < 0.98 ? 1 : 0) }
}
const POINTS = Array.from({ length: N + 1 }, (_, i) => curve(i / N))
const LINE = POINTS.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
const AREA = `${LINE} L${X1} ${FX_H} L${X0} ${FX_H} Z`

export const GrowthCurve: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const fade = Easing.inOut(Easing.cubic)(progress(frame, 0, 9))
	const t = Easing.inOut(Easing.quad)(progress(frame, DRAW_AT, DRAW_LEN))
	const head = curve(t)
	const shown = Math.max(1, Math.floor(1 + 9 * growth(t) + 0.001))
	const card = pop(frame, 6)
	const landed = pop(frame, DRAW_AT + DRAW_LEN)
	const label = pop(frame, 8)
	return <AbsoluteFill style={{ overflow: 'hidden', background: '#F6F6F7' }}>
		<Backdrop />
		<svg width={FX_W} height={FX_H} style={{ position: 'absolute', inset: 0 }}>
			<defs>
				<linearGradient id="gc-area" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0" stopColor={colors.blue} stopOpacity={0.22} />
					<stop offset="0.55" stopColor={colors.blue} stopOpacity={0.06} />
					<stop offset="1" stopColor={colors.blue} stopOpacity={0} />
				</linearGradient>
				<clipPath id="gc-clip"><rect x={0} y={0} width={head.x} height={FX_H} /></clipPath>
			</defs>
			{/* Quiet chart grid: four hairlines, no verticals. */}
			{[540, 720, 900, 1080].map(y => <line key={y} x1={40} x2={FX_W - 40} y1={y} y2={y} stroke={colors.navy200} strokeWidth={2} opacity={fade} />)}
			{frame >= DRAW_AT && <g clipPath="url(#gc-clip)">
				<path d={AREA} fill="url(#gc-area)" />
				<path d={LINE} fill="none" stroke={colors.blue} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" />
			</g>}
			{frame >= DRAW_AT && <>
				<circle cx={head.x} cy={head.y} r={26} fill={colors.blue} opacity={0.16} />
				<circle cx={head.x} cy={head.y} r={14} fill="#fff" stroke={colors.blue} strokeWidth={7} />
			</>}
		</svg>
		{/* The room cross-fades out to reveal the backdrop; the speaker stays. */}
		<AbsoluteFill style={{ opacity: 1 - fade }}><ARoll from={from} /></AbsoluteFill>
		<Cutout from={from} />
		{/* Axis caption, left, under the label pill. */}
		<div style={{ position: 'absolute', left: 64, top: 300, ...materialize(label), fontFamily: themeFonts.body, fontWeight: 600, fontSize: 36, letterSpacing: '0', color: colors.navy500 }}>Reels shipped per week</div>
		{/* Counter: a glass card, top right, below the label pill. Grows from its right edge, where the line ends. */}
		<GlassBlur.Provider value={false}>
			<GlassCard style={{ position: 'absolute', right: 52, top: 250, ...materialize(card), transformOrigin: 'right center' }} innerStyle={{ padding: '22px 32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
				<div style={{ fontFamily: themeFonts.heading, fontSize: 132, lineHeight: 0.9, letterSpacing: '-0.03em', color: colors.navy, fontVariantNumeric: 'tabular-nums' }}>{shown}×</div>
				<div style={{ fontFamily: themeFonts.body, fontWeight: 600, fontSize: 26, color: colors.navy500, marginTop: 10 }}>output</div>
				<div style={{ height: 52 * landed, marginTop: 14 * landed, overflow: 'hidden', opacity: landed }}>
					<div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: '#DCFCE7', color: green, fontFamily: themeFonts.body, fontWeight: 600, fontSize: 26, transform: `scale(${0.9 + 0.1 * landed})`, transformOrigin: 'right center' }}>✓ With Claude</div>
				</div>
			</GlassCard>
		</GlassBlur.Provider>
	</AbsoluteFill>
}

export const growthCurveFx: FxEntry = { id: 'growth-curve', name: 'Growth Curve', duration: 72, Component: GrowthCurve,
	sfx: [{ at: 0, sound: 'reveal', volume: 0.35 }, { at: 56, sound: 'chime', volume: 0.35 }],
}
