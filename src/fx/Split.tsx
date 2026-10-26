import type { FC } from 'react'
import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { ARoll, CLAUDE_ORANGE, type FxEntry, type FxProps, FX_H, FX_W, fonts, progress, useFace } from './shared'

// 21 Split: the frame splits in two. A cream paper chart panel slides down into the top half while the shot slides down
// with it, so the speaker's head lands in the bottom half (one shared motion: panel and shot travel together on the same
// curve). Then the bars grow left to right with their values counting up, the first bar in orange, and a dashed average
// line draws across with its label. TITLE, ACCENT (handwritten, Caveat), BARS, VALUE_SUFFIX and AVG_LABEL are on-screen
// copy; change them to fit the video (the bars are scaled to the largest value). Needs the face position (how far the
// shot drops), not the cut-out.
// Motion: the split runs 4 to 18 on an iOS-sheet-like curve; the accent underline draws 16 to 28; the bars grow from 20,
// 2 frames apart; the average line draws 46 to 58 and its label rises in at the end of the draw.
// SFX: 'whoosh' at 4 (the split), 'cascade' at 20 (the bars), 'click' at 46 (the average line).
const DURATION = 90
const SEAM = FX_H / 2
const HEADROOM = 200 // how far above the top of the face box the seam lands: the hair clears it with a little air
const INK = '#1F1E1C'
const PAPER = '#F4EEE3'
const TITLE = 'Lines Claude wrote'
const ACCENT = 'per effect'
const BARS = [ // line counts of GlassWidgets, BrollOverlay, Orbit, Checklist and Split.tsx when this effect was added
	{ label: 'widgets', value: 124 },
	{ label: 'b-roll', value: 109 },
	{ label: 'orbit', value: 95 },
	{ label: 'list', value: 82 },
	{ label: 'split', value: 78 },
]
const VALUE_SUFFIX = ''
const AVG_LABEL = 'avg'
const PLOT = { x: 120, w: 840, base: 860, h: 420 }
const BAR_W = 116

const curve = Easing.bezier(0.32, 0.72, 0, 1) // iOS sheet-like: quick start, long soft landing

export const Split: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const shift = Math.min(SEAM, Math.max(0, SEAM + HEADROOM - useFace().y))
	const s = curve(progress(frame, 4, 14))
	const max = Math.max(...BARS.map(b => b.value))
	const avg = BARS.reduce((sum, b) => sum + b.value, 0) / BARS.length
	const gap = (PLOT.w - BAR_W * BARS.length) / (BARS.length - 1)
	const avgY = PLOT.base - (avg / max) * PLOT.h
	const line = Easing.inOut(Easing.cubic)(progress(frame, 46, 12))
	const label = interpolate(line, [0.8, 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
	const underline = Easing.out(Easing.cubic)(progress(frame, 16, 12))
	return <AbsoluteFill style={{ background: '#000' }}>
		<ARoll from={from} style={{ transform: `translateY(${shift * s}px)` }} />
		<div style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: SEAM, transform: `translateY(${-SEAM * (1 - s)}px)`, background: PAPER, overflow: 'hidden', boxShadow: '0 18px 40px -12px rgba(0,0,0,0.45)' }}>
			<Img src={staticFile('textures/paper-grain.png')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', mixBlendMode: 'multiply', opacity: 0.16 }} />
			<div style={{ position: 'absolute', left: PLOT.x, top: 96, fontFamily: fonts.display, fontWeight: 800, fontSize: 76, letterSpacing: '-0.03em', color: INK }}>{TITLE}</div>
			<div style={{ position: 'absolute', left: PLOT.x + 4, top: 186, fontFamily: fonts.hand, fontWeight: 700, fontSize: 64, color: CLAUDE_ORANGE }}>
				{ACCENT}
				<svg width={260} height={20} viewBox="0 0 260 20" style={{ position: 'absolute', left: 0, top: 66 }}>
					<path d="M4 12 C 60 4, 140 4, 256 10" fill="none" stroke={CLAUDE_ORANGE} strokeWidth={5} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - underline} />
				</svg>
			</div>
			{BARS.map((b, i) => {
				const g = Easing.out(Easing.cubic)(progress(frame, 20 + i * 2, 16))
				const h = (b.value / max) * PLOT.h * g
				const x = PLOT.x + i * (BAR_W + gap)
				return <div key={b.label}>
					<div style={{ position: 'absolute', left: x, top: PLOT.base - h, width: BAR_W, height: h, borderRadius: '14px 14px 4px 4px', background: i === 0 ? CLAUDE_ORANGE : INK }} />
					<div style={{ position: 'absolute', left: x - 20, width: BAR_W + 40, top: PLOT.base - h - 52, textAlign: 'center', fontFamily: fonts.display, fontWeight: 800, fontSize: 36, color: INK, opacity: Math.min(1, g * 3), fontVariantNumeric: 'tabular-nums' }}>{Math.round(b.value * g)}{VALUE_SUFFIX}</div>
					<div style={{ position: 'absolute', left: x - 20, width: BAR_W + 40, top: PLOT.base + 14, textAlign: 'center', fontFamily: fonts.ui, fontWeight: 600, fontSize: 26, color: 'rgba(31,30,28,0.6)' }}>{b.label}</div>
				</div>
			})}
			<div style={{ position: 'absolute', left: PLOT.x - 20, top: PLOT.base, width: PLOT.w + 40, height: 3, background: 'rgba(31,30,28,0.18)' }} />
			<svg width={FX_W} height={SEAM} style={{ position: 'absolute', inset: 0 }}>
				<line x1={PLOT.x - 20} x2={PLOT.x - 20 + (PLOT.w + 40) * line} y1={avgY} y2={avgY} stroke={CLAUDE_ORANGE} strokeWidth={4} strokeDasharray="14 12" />
			</svg>
			<div style={{ position: 'absolute', right: FX_W - PLOT.x - PLOT.w - 20, top: avgY - 46, fontFamily: fonts.ui, fontWeight: 700, fontSize: 26, color: CLAUDE_ORANGE, opacity: label, transform: `translateY(${6 * (1 - label)}px)` }}>{AVG_LABEL} {Math.round(avg)}{VALUE_SUFFIX}</div>
		</div>
	</AbsoluteFill>
}

export const splitFx: FxEntry = { id: 'split', name: 'Split', duration: DURATION, Component: Split,
	sfx: [{ at: 4, sound: 'whoosh', volume: 0.35 }, { at: 20, sound: 'cascade', volume: 0.35 }, { at: 46, sound: 'click', volume: 0.4 }],
}
