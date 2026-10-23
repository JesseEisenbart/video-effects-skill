import type { FC } from 'react'
import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { ARoll, type FxEntry, type FxProps, fonts } from './shared'
import { green, ink, pop, colors } from './theme'

// 05 Checklist Pop: four large glass pills (translucent white rim, solid white body, hairline border, long soft navy
// shadow) arrive one after another beside the speaker; each has an empty ring that fills green and ticks a beat later, so
// the list builds and completes while they talk. Sized to read on a phone (52 px Inter semibold on solid white). The
// labels are ITEMS; change them to fit the video. No cut-out, no face position.
// Motion: critically damped `pop`; each pill materializes (scale + opacity + shadow) from its left edge, 12 frames apart,
// and its tick draws on 7 frames later with the same spring. No overshoot.
// SFX: 'bubble' at 4, 16, 28, 40 (one per pill).
const DURATION = 72
const ITEMS = ['Trim', 'Captions', 'Effects', 'Post']
const START = 4
const GAP = 12
const TICK = 7
const LEFT = 590 // the stack sits on the right half of the frame below chin height, which suits a speaker who is centred
// or left of centre (beside the head there is too little room for phone-legible pills); move it for a speaker on the right
const TOP = 1040
const ROW = 124
const CHECK = 60

const Check = ({ t }: { t: number }) => <svg width={CHECK} height={CHECK} viewBox="0 0 44 44" style={{ flexShrink: 0 }}>
	<circle cx={22} cy={22} r={19} fill="none" stroke={colors.navy200} strokeWidth={3} />
	<circle cx={22} cy={22} r={20.5 * t} fill={green} />
	<path d="M13.5 22.5l5.7 5.7L31 16.5" fill="none" stroke="#fff" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={28} strokeDashoffset={28 * (1 - Math.min(1, Math.max(0, (t - 0.3) / 0.7)))} />
</svg>

export const ChecklistPop: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	return <AbsoluteFill style={{ overflow: 'hidden' }}>
		<ARoll from={from} />
		{ITEMS.map((label, i) => {
			const at = START + i * GAP
			if (frame < at) return null
			const p = pop(frame, at)
			const t = pop(frame, at + TICK)
			return <div key={label} style={{ position: 'absolute', left: LEFT, top: TOP + i * ROW, transformOrigin: '0 50%', transform: `translateX(${(1 - p) * -36}px) scale(${0.9 + 0.1 * p})`, opacity: Math.min(1, p * 1.4) }}>
				<div style={{ padding: 7, borderRadius: 999, background: 'rgba(255,255,255,0.42)', outline: '1.5px solid rgba(255,255,255,0.9)', boxShadow: `0 28px 50px -24px rgba(15,23,42,${0.6 * p}), 0 3px 10px rgba(15,23,42,${0.12 * p})` }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 18, padding: '14px 40px 14px 14px', borderRadius: 999, background: '#fff', border: `1px solid ${colors.navy200}` }}>
						<Check t={t} />
						<span style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: 52, lineHeight: 1, color: ink, letterSpacing: '-0.015em' }}>{label}</span>
					</div>
				</div>
			</div>
		})}
	</AbsoluteFill>
}

export const checklistPopFx: FxEntry = { id: 'checklist-pop', name: 'Checklist Pop', duration: DURATION, Component: ChecklistPop,
	sfx: [4, 16, 28, 40].map(at => ({ at, sound: 'bubble' as const, volume: 0.35 })),
}
