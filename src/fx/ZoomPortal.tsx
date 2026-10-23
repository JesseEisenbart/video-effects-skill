import type { FC } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { ARoll, type FxEntry, type FxProps, FX_H, FX_W, progress, useFace } from './shared'
import { pop } from './theme'

// 07 Zoom Portal: a glass-rimmed circular inset of the speaker (a smaller copy of the same shot) pops up in the empty
// space above their shoulder, swells, then the camera flies through it: the outer shot scales up around the ring while the
// circle opens to cover the frame, landing on a 1.25x punch-in of the inset shot that hard-cuts cleanly. Needs the face
// position (the inset frames the head); no cut-out. The ring floats at C0, upper left, which suits a speaker who is
// centred or right of centre.
// Motion: the inset materializes at 4 on the critically damped UI spring, swells 12 to 32, and the fly-through runs 34 to
// 60 on an exponential radius so it reads as constant-speed flight.
// SFX: 'bubble' at 4 (inset pops), 'whoosh' at 34 (the fly-through).
const C0 = { x: 250, y: 390 } // ring centre while it floats (upper left, clear of the showcase label)
const R_POP = 120
const R_HOLD = 150
const R_END = 1200 // covers the 1080×1920 frame from the centre
const K_HOLD = 0.4
const K_END = 1.25
const ZOOM_AT = 34
const ZOOM_LEN = 26

export const ZoomPortal: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const face = useFace()
	const ANCHOR = { x: face.x, y: face.y + 80 } // head centre; sits at the ring centre in the inset
	// Materializes (scale + opacity + shadow together) on Apple's critically damped UI spring, from its own centre.
	const appear = pop(frame, 4)
	const swell = Easing.inOut(Easing.cubic)(progress(frame, 12, 20))
	const z = Easing.inOut(Easing.cubic)(progress(frame, ZOOM_AT, ZOOM_LEN))
	const zPrev = Easing.inOut(Easing.cubic)(progress(frame - 1, ZOOM_AT, ZOOM_LEN))
	const rHold = R_POP + (R_HOLD - R_POP) * swell
	// Exponential interpolation reads as constant-speed flight.
	const r = frame < 4 ? 0 : z > 0 ? R_HOLD * (R_END / R_HOLD) ** z : rHold * (0.7 + 0.3 * appear)
	const cx = interpolate(z, [0, 1], [C0.x, FX_W / 2])
	const cy = interpolate(z, [0, 1], [C0.y, FX_H / 2])
	// Outer shot: the point under the ring rides with it and scales by the ring's growth (the camera moving through).
	const outerScale = z > 0 ? r / R_HOLD : 1
	const outerBlur = Math.min(18, Math.abs(z - zPrev) * 220)
	// Inner shot: head anchored at the ring centre, scale and anchor easing to the final punch-in framing.
	const k = K_HOLD * (K_END / K_HOLD) ** z
	const ax = interpolate(z, [0, 1], [cx, ANCHOR.x])
	const ay = interpolate(z, [0, 1], [cy, ANCHOR.y])
	const innerBlur = Math.min(8, Math.abs(z - zPrev) * 60)
	const ringOpacity = 1 - progress(z, 0.55, 0.35)
	return <AbsoluteFill style={{ overflow: 'hidden', background: '#000' }}>
		<AbsoluteFill style={{ transformOrigin: `${C0.x}px ${C0.y}px`, transform: `translate(${cx - C0.x}px, ${cy - C0.y}px) scale(${outerScale})`, filter: outerBlur > 0.5 ? `blur(${outerBlur}px)` : undefined }}>
			<ARoll from={from} />
		</AbsoluteFill>
		{r > 1 && <>
			{/* Soft long shadow under the floating inset (GlassCard's shadow, scaled up for a larger surface). */}
			<div style={{ position: 'absolute', left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: '50%', opacity: appear * ringOpacity, boxShadow: `0 ${34 * (1 - z)}px ${90 * (1 - z)}px -${30 * (1 - z)}px rgba(15,23,42,0.55)` }} />
			<AbsoluteFill style={{ clipPath: `circle(${r}px at ${cx}px ${cy}px)`, opacity: z > 0 ? 1 : appear }}>
				<AbsoluteFill style={{ background: '#000' }} />
				<AbsoluteFill style={{ transformOrigin: '0 0', transform: `translate(${ax - ANCHOR.x * k}px, ${ay - ANCHOR.y * k}px) scale(${k})`, filter: innerBlur > 0.5 ? `blur(${innerBlur / k}px)` : undefined }}>
					<ARoll from={from} />
				</AbsoluteFill>
			</AbsoluteFill>
			{/* Glass rim: translucent white outer band + bright hairline, like GlassCard's outline. */}
			{ringOpacity > 0 && <div style={{ position: 'absolute', left: cx - r - 12, top: cy - r - 12, width: r * 2 + 24, height: r * 2 + 24, borderRadius: '50%', boxSizing: 'border-box', border: '12px solid rgba(255,255,255,0.55)', outline: '2px solid rgba(255,255,255,0.95)', outlineOffset: -2, boxShadow: 'inset 0 0 0 1px rgba(226,232,240,0.9)', opacity: ringOpacity * appear }} />}
		</>}
	</AbsoluteFill>
}

export const zoomPortalFx: FxEntry = { id: 'zoom-portal', name: 'Zoom Portal', duration: 66, Component: ZoomPortal,
	sfx: [{ at: 4, sound: 'bubble', volume: 0.4 }, { at: 34, sound: 'whoosh', volume: 0.4 }],
}
