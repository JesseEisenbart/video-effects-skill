import type { FC } from 'react'
import { AbsoluteFill, Easing, interpolate, interpolateColors, useCurrentFrame } from 'remotion'
import { ARoll, CLAUDE_ORANGE, type FxEntry, type FxProps, fonts, progress } from './shared'
import { pop, SPARKLE } from './theme'

// 20 Checklist: a dark frosted card rises over the speaker's chest and ticks off five steps. Each row goes pending (grey
// ring), then working (an orange arc spinning on the ring), then done (the green disc pops in and its check draws on),
// and the "N of 5" counter keeps count. The sparkle in the header turns while the work runs and settles when the last row
// lands. TITLE and ROWS (a label and a short tag each) are on-screen copy; change them to fit the video, and keep five
// rows unless you check the layout in a still. No cut-out, no face position.
// Motion: the card materializes at 0 on the critically damped UI spring; rows finish at DONE (10, 21, 42, 53, 64), each
// row's label lights as it becomes the working step, and the check draws on 2 frames after its disc.
// SFX: 'click' at 10, 21, 42, 53 (rows done), 'chime' at 64 (the last row).
const DURATION = 90
const TITLE = 'Claude is editing your clip'
const ROWS = [
	{ label: 'Found you in every frame', tag: '1,714 frames' },
	{ label: 'Cut you out', tag: 'person mask' },
	{ label: 'Wrote the effect in React', tag: 'Remotion' },
	{ label: 'Timed sound to the motion', tag: 'sfx' },
	{ label: 'Rendered to MP4', tag: '1080×1920' },
]
const DONE = [10, 21, 42, 53, 64]
const CARD = { x: 56, y: 1100, w: 968 }
const GREEN = '#30D158'
const TAG_GREEN = '#4ADE80'
const ARC = '#E8795A'

const Status = ({ frame, done, active }: { frame: number, done: number, active: boolean }) => {
	const size = 50
	const r = size / 2 - 2
	if (frame >= done) {
		const p = pop(frame, done)
		const draw = Easing.out(Easing.cubic)(progress(frame, done + 2, 7))
		return <div style={{ width: size, height: size, borderRadius: size / 2, background: GREEN, transform: `scale(${0.9 + 0.1 * p})`, opacity: Math.min(1, p * 2), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
			<svg width={28} height={28} viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} /></svg>
		</div>
	}
	const circ = 2 * Math.PI * r
	return <svg width={size} height={size} style={{ flexShrink: 0 }}>
		<circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth={3} />
		{active && <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={ARC} strokeWidth={3.5} strokeLinecap="round" strokeDasharray={`${circ * 0.28} ${circ}`} transform={`rotate(${frame * 14} ${size / 2} ${size / 2})`} />}
	</svg>
}

export const Checklist: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const p = pop(frame, 0)
	const done = DONE.filter(d => frame >= d).length
	const finished = done === DONE.length
	// The sparkle turns while the work runs and eases to a stop on the last tick.
	const last = DONE[DONE.length - 1]
	const spin = (Math.min(frame, last) * 5) + 40 * Easing.out(Easing.cubic)(progress(frame, last, 14))
	return <AbsoluteFill>
		<ARoll from={from} />
		<div style={{ position: 'absolute', left: CARD.x, top: CARD.y, width: CARD.w, boxSizing: 'border-box', borderRadius: 46, padding: '30px 38px 18px', fontFamily: fonts.ui, color: '#fff',
			background: 'rgba(22,22,20,0.6)', backdropFilter: 'blur(28px) saturate(1.4)', WebkitBackdropFilter: 'blur(28px) saturate(1.4)',
			boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.14), 0 40px 80px -40px rgba(0,0,0,0.6)',
			opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 60}px) scale(${0.96 + 0.04 * p})` }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 20, paddingBottom: 24, borderBottom: '1.5px solid rgba(255,255,255,0.12)' }}>
				<svg width={46} height={46} viewBox="0 0 24 24" style={{ transform: `rotate(${spin}deg)`, flexShrink: 0 }}><path d={SPARKLE} fill={CLAUDE_ORANGE} /></svg>
				<div style={{ flex: 1, fontSize: 42, fontWeight: 700, letterSpacing: '-0.015em' }}>{TITLE}</div>
				<div style={{ fontSize: 31, color: finished ? TAG_GREEN : 'rgba(255,255,255,0.55)', fontVariantNumeric: 'tabular-nums' }}>{done} of {DONE.length}</div>
			</div>
			{ROWS.map((row, i) => {
				const at = DONE[i]
				const isDone = frame >= at
				const active = !isDone && (i === 0 || frame >= DONE[i - 1])
				const litAt = i === 0 ? 0 : DONE[i - 1] // the row lights as it becomes the working step
				return <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 26, height: 96 }}>
					<Status frame={frame} done={at} active={active} />
					<div style={{ flex: 1, fontSize: 39, fontWeight: 650, letterSpacing: '-0.01em', color: '#fff', opacity: interpolate(frame, [litAt, litAt + 4], [0.42, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>{row.label}</div>
					<div style={{ fontFamily: fonts.mono, fontSize: 29, color: interpolateColors(frame, [at, at + 4], ['rgba(255,255,255,0.32)', TAG_GREEN]) }}>{row.tag}</div>
				</div>
			})}
		</div>
	</AbsoluteFill>
}

export const checklistFx: FxEntry = { id: 'checklist', name: 'Checklist', duration: DURATION, Component: Checklist,
	sfx: DONE.map((at, i) => ({ at, sound: i === DONE.length - 1 ? 'chime' as const : 'click' as const, volume: 0.4 })),
}
