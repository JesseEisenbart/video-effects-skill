import { Audio } from '@remotion/media'
import { Sequence, staticFile } from 'remotion'

/** The sound library in public/sfx. */
export const SOUNDS = ['whoosh', 'whip', 'bubble', 'click', 'reveal', 'stamp', 'chime', 'riser', 'cascade', 'hit', 'crack', 'shatter', 'typing'] as const
export type Sound = (typeof SOUNDS)[number]

/** One sound at a frame. `frames` cuts it short with a fade (for long sounds such as typing or the riser). */
export type Cue = { at: number; sound: Sound; volume?: number; frames?: number }

const FADE = 6

export const Sfx = ({ cues }: { cues: Cue[] }) => <>
	{cues.map((cue, i) => {
		const src = staticFile(`sfx/${cue.sound}.mp3`)
		const gain = cue.volume ?? 0.4
		const frames = cue.frames
		return <Sequence key={i} from={cue.at} durationInFrames={frames} premountFor={30}>
			{frames ? <Audio src={src} volume={f => gain * Math.min(1, (frames - f) / FADE)} /> : <Audio src={src} volume={gain} />}
		</Sequence>
	})}
</>
