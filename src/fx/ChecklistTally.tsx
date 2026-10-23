import type { FC } from 'react'
import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { type FxEntry, type FxProps, fonts, progress } from './shared'
import { Backdrop, GlassBlur, GlassCard, materialize, pop, colors, themeFonts } from './theme'

// 18 Checklist Tally: a closing card on the light grey Backdrop. A big "N / 18 effects" counter climbs while a glass card
// listing every effect ticks them off in order (mint ticks), speeding up as it goes. On the last one the progress bar
// completes and the count turns blue. Holds for the outro. Plays no footage, so it needs neither cut-out nor face.
// EFFECT_NAMES and the line under the counter are on-screen copy; change them to fit the video.
// Motion: everything critically damped (no per-tick bump, no glow, no light sweep). Ticks run from 14 to 80 with the gaps
// shrinking from about 5 frames to 2.
// SFX: 'cascade' at 14 (ticks start), 'chime' at 80 (the last tick).
export const EFFECT_NAMES = [
	'Orbit', 'Chat Takeover', 'Frame Escape', 'Snap Zoom', 'Checklist Pop', 'Headline Storm', 'Zoom Portal', 'Growth Curve', 'B-roll Overlay',
	'Paper Cutout', 'Magazine Cover', 'Liquid Glass', 'Zoom Through Cut', 'Green Screen', 'Frame Break', 'Digital Zoom', 'Phone Mockup', 'Checklist Tally',
]
const FIRST = 14
const LAST = 80
// Tick frames: accelerating (gaps shrink from ~5 frames to ~2).
const TICKS = EFFECT_NAMES.map((_, i) => Math.round(FIRST + (LAST - FIRST) * Math.pow(i / (EFFECT_NAMES.length - 1), 0.72)))
const DONE = TICKS[EFFECT_NAMES.length - 1]
const HALF = Math.ceil(EFFECT_NAMES.length / 2)

const LEFT = 80
const WIDTH = 920
const HEAD_TOP = 380
const CARD_TOP = 830
const ROW = 72

const Check = ({ frame, at }: { frame: number, at: number }) => {
	const p = pop(frame, at)
	const draw = Easing.out(Easing.cubic)(progress(frame, at, 6))
	return <div style={{ position: 'relative', width: 40, height: 40, flex: 'none' }}>
		<div style={{ position: 'absolute', inset: 0, borderRadius: 12, border: `2.5px solid ${colors.navy200}`, boxSizing: 'border-box' }} />
		{frame >= at && <div style={{ position: 'absolute', inset: 0, borderRadius: 12, background: colors.mint, opacity: Math.min(1, p * 1.5), transform: `scale(${0.7 + 0.3 * p})` }}>
			<svg width={40} height={40} viewBox="0 0 40 40" style={{ position: 'absolute', inset: 0 }}>
				<path d="M11 20.5 L17.5 27 L29.5 14" fill="none" stroke={colors.mintText} strokeWidth={4.5} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
			</svg>
		</div>}
	</div>
}

export const ChecklistTally: FC<FxProps> = () => {
	const frame = useCurrentFrame()
	const n = TICKS.filter(t => frame >= t).length
	const head = pop(frame, 0)
	const card = pop(frame, 4)
	const fill = interpolate(frame, [TICKS[0], DONE], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
	return <GlassBlur.Provider value={false}><div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#F6F6F7' }}>
		<Backdrop />
		{/* counter */}
		<div style={{ position: 'absolute', left: LEFT + 12, top: HEAD_TOP, width: WIDTH - 24, ...materialize(head) }}>
			<div style={{ display: 'flex', alignItems: 'baseline', gap: 26 }}>
				<div style={{ fontFamily: themeFonts.heading, fontWeight: 500, fontSize: 250, lineHeight: 0.9, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', color: frame >= DONE ? colors.blue : colors.navy }}>{n}</div>
				<div style={{ fontFamily: themeFonts.heading, fontWeight: 500, fontSize: 64, letterSpacing: '-0.02em', color: colors.navy500 }}>/ {EFFECT_NAMES.length} effects</div>
			</div>
			<div style={{ fontFamily: fonts.ui, fontWeight: 500, fontSize: 40, letterSpacing: '-0.005em', color: colors.navy500, marginTop: 22 }}>Every one coded with Claude.</div>
			<div style={{ marginTop: 34, height: 14, borderRadius: 7, background: colors.navy200, overflow: 'hidden' }}>
				<div style={{ width: `${fill * 100}%`, height: '100%', borderRadius: 7, background: colors.blue }} />
			</div>
		</div>
		{/* the list, in one glass card */}
		<GlassCard style={{ position: 'absolute', left: LEFT, top: CARD_TOP, width: WIDTH, boxSizing: 'border-box', transformOrigin: '50% 0%', ...materialize(card) }} innerStyle={{ position: 'relative', height: HALF * ROW + 48, padding: 0 }}>
			{EFFECT_NAMES.map((name, i) => {
				const col = i < HALF ? 0 : 1
				const r = i % HALF
				const on = frame >= TICKS[i]
				return <div key={name} style={{ position: 'absolute', left: col ? 470 : 30, top: 24 + r * ROW, height: ROW, display: 'flex', alignItems: 'center', gap: 16 }}>
					<Check frame={frame} at={TICKS[i]} />
					<div style={{ fontFamily: fonts.ui, fontWeight: 500, fontSize: 21, letterSpacing: '0.01em', color: colors.navy400, fontVariantNumeric: 'tabular-nums', width: 28 }}>{String(i + 1).padStart(2, '0')}</div>
					<div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: 34, letterSpacing: '-0.01em', color: on ? colors.navy : colors.navy400, whiteSpace: 'nowrap' }}>{name}</div>
				</div>
			})}
			{/* column divider */}
			<div style={{ position: 'absolute', left: 448, top: 32, bottom: 32, width: 1, background: colors.navy200 }} />
		</GlassCard>
	</div></GlassBlur.Provider>
}

export const checklistTallyFx: FxEntry = { id: 'checklist-tally', name: 'Checklist Tally', duration: 120, Component: ChecklistTally,
	sfx: [{ at: 14, sound: 'cascade', volume: 0.35 }, { at: 80, sound: 'chime', volume: 0.4 }],
}
