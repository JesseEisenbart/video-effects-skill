import { AbsoluteFill, Sequence, useCurrentFrame } from 'remotion'
import { FX_ALL } from './index'
import { Sfx } from './sfx'
import { fxSpring, useFxSource } from './shared'
import { colors, themeFonts } from './theme'

// Every effect back to back, each labelled "NN Name". The take runs forward across the effects and wraps, so the footage
// never repeats within an effect.
export const showcaseTimeline = (frames: number) => {
	let at = 0
	return FX_ALL.map((entry, i) => {
		const span = Math.max(1, frames - entry.duration - 1)
		const item = { entry, i, at, from: at % span }
		at += entry.duration
		return item
	})
}
export const showcaseDuration = () => Math.max(1, FX_ALL.reduce((sum, e) => sum + e.duration, 0))

const Label = ({ n, name }: { n: number; name: string }) => {
	const frame = useCurrentFrame()
	const s = fxSpring(frame, 0, { stiffness: 220 })
	return <div style={{ position: 'absolute', top: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 50 }}>
		<div style={{ padding: 6, borderRadius: 999, background: 'rgba(255,255,255,0.45)', outline: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 24px 60px -30px rgba(15,23,42,0.45)', transform: `scale(${0.92 + 0.08 * s})`, opacity: s }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px', borderRadius: 999, background: '#fff', border: `1px solid ${colors.navy200}`, color: colors.navy, fontFamily: themeFonts.heading, fontWeight: 600, fontSize: 38, letterSpacing: '-0.02em' }}>
				<span style={{ color: colors.blue, fontVariantNumeric: 'tabular-nums' }}>{String(n).padStart(2, '0')}</span>
				{name}
			</div>
		</div>
	</div>
}

export const FxShowcase = () => {
	const { frames } = useFxSource()
	const items = showcaseTimeline(frames)
	return <AbsoluteFill style={{ background: '#000' }}>
		{items.map(({ entry, i, at, from }) => (
			<Sequence key={entry.id} from={at} durationInFrames={entry.duration} premountFor={30}>
				<entry.Component from={from} />
				<Label n={i + 1} name={entry.name} />
			</Sequence>
		))}
		<Sfx cues={items.flatMap(({ entry, at }) => (entry.sfx ?? []).map(c => ({ ...c, at: c.at + at })))} />
	</AbsoluteFill>
}
