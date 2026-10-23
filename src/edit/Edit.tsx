import { Audio } from '@remotion/media'
import { AbsoluteFill, Sequence, staticFile } from 'remotion'
import { fxById } from '../fx/index'
import { type Cue, Sfx } from '../fx/sfx'
import { ARoll, type FxSource, FxSourceContext } from '../fx/shared'
import { GlassBlur } from '../fx/theme'

/** A cut list over one take. `at` is the source frame the segment starts on, `frames` its length on the timeline.
 * `kind: 'fx'` plays the effect `id` from `at` (cut short if `frames` is less than the effect's duration). */
export type Segment = { kind: 'aroll' | 'fx'; at: number; frames: number; id?: string }
export type EditSpec = { source: FxSource; segments: Segment[]; music?: { file: string; volume: number; trimBefore?: number } }

const timeline = (spec: EditSpec) => {
	let start = 0
	return spec.segments.map(s => {
		const item = { ...s, start }
		start += s.frames
		return item
	})
}
export const editDuration = (spec: EditSpec) => Math.max(1, spec.segments.reduce((sum, s) => sum + s.frames, 0))

export const Edit = ({ spec }: { spec: EditSpec }) => {
	const segs = timeline(spec)
	const total = editDuration(spec)
	const cues: Cue[] = segs.flatMap(s => s.kind === 'fx' ? (fxById(s.id!)?.sfx ?? []).filter(c => c.at < s.frames).map(c => ({ ...c, at: c.at + s.start })) : [])
	return <FxSourceContext.Provider value={spec.source}><GlassBlur.Provider value={false}><AbsoluteFill style={{ background: '#000' }}>
		{segs.map((s, i) => {
			const entry = s.kind === 'fx' ? fxById(s.id!) : undefined
			return <Sequence key={i} from={s.start} durationInFrames={s.frames} premountFor={30}>
				{entry ? <entry.Component from={s.at} /> : <ARoll from={s.at} />}
				<Audio src={staticFile(spec.source.video)} trimBefore={s.at} />
			</Sequence>
		})}
		<Sfx cues={cues} />
		{spec.music && <Audio src={staticFile(spec.music.file)} trimBefore={spec.music.trimBefore ?? 0} volume={f => spec.music!.volume * Math.min(1, f / 15, Math.max(0, (total - f) / 45))} />}
	</AbsoluteFill></GlassBlur.Provider></FxSourceContext.Provider>
}
