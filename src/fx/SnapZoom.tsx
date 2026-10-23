import type { FC } from 'react'
import { AbsoluteFill, spring, useCurrentFrame } from 'remotion'
import { ARoll, FX_FPS, type FxEntry, type FxProps, useFace } from './shared'

// 04 Snap Zoom: a slow creep, then a hard punch-in on the face on frame 12, then a tight hold with a slight continuing
// push. The snap is one stiff critically damped spring (lands in about 4 frames, no overshoot); speed shows as a motion
// blur that scales with the per-frame zoom change, plus a soft white bloom on impact. The zoom scales about a point
// between the eyes and the mouth, so the face never leaves the frame. Needs the face position; no cut-out.
// SFX: 'whip' at 10 (lead-in), 'hit' at 12 (the snap).
const DURATION = 60
const SNAP = 12
const PUNCH = 0.62

const snap = (f: number) => spring({ frame: f - SNAP, fps: FX_FPS, config: { stiffness: 2700, damping: 104, mass: 1 } }) // ratio 1.0
const zoomAt = (f: number) => {
	const creep = 0.03 * Math.min(1, Math.max(0, f) / SNAP)
	const push = 0.05 * Math.max(0, (f - SNAP - 4) / (DURATION - SNAP - 4))
	return 1 + creep + PUNCH * snap(f) + push
}

export const SnapZoom: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const face = useFace()
	const ORIGIN = { x: face.x, y: face.y + 90 } // between the eyes and the mouth
	const z = zoomAt(frame)
	const v = Math.abs(z - zoomAt(frame - 1))
	const blur = Math.min(5, v * 16)
	const bloom = frame < SNAP ? 0 : Math.max(0, 0.22 * (1 - (frame - SNAP) / 7))
	return <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
		<AbsoluteFill style={{ transformOrigin: `${ORIGIN.x}px ${ORIGIN.y}px`, transform: `scale(${z})`, filter: blur > 0.3 ? `blur(${blur.toFixed(2)}px)` : undefined }}>
			<ARoll from={from} />
		</AbsoluteFill>
		{bloom > 0 && <AbsoluteFill style={{ background: `radial-gradient(60% 45% at ${ORIGIN.x}px ${ORIGIN.y}px, rgba(255,255,255,${bloom}), rgba(255,255,255,${bloom * 0.4}) 100%)` }} />}
	</AbsoluteFill>
}

export const snapZoomFx: FxEntry = { id: 'snap-zoom', name: 'Snap Zoom', duration: DURATION, Component: SnapZoom,
	sfx: [{ at: 10, sound: 'whip', volume: 0.35 }, { at: 12, sound: 'hit', volume: 0.3 }],
}
