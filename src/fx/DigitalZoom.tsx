import type { FC } from 'react'
import { interpolate, spring, useCurrentFrame } from 'remotion'
import { ARoll, FX_FPS, FX_W, type FxEntry, type FxProps, fonts, progress, useFace } from './shared'
import { colors, themeFonts } from './theme'

// 16 Digital Zoom: a camera viewfinder (corner brackets, REC, timecode, zoom readout and scale) sits over the take while
// the shot punches in on the face in hard digital steps, 1.0x to 1.8x to 3.0x, each step landing soft and pulling focus;
// then it snaps back out to 1.0x. The readout (a glass pill, blue figure while a step lands) counts with the zoom; the AF
// box is white while hunting and mint once locked. Needs the face position; no cut-out.
// Motion: steps at 10, 28 and 48 on a critically damped spring (no overshoot); each lands out of focus and pulls sharp
// over about 8 frames.
// SFX: 'click' at 10, 28 and 48 (each zoom step).
const STEPS = [{ at: 10, z: 1.8 }, { at: 28, z: 3.0 }, { at: 48, z: 1.0 }]
const VF = { top: 236, bottom: 1690, left: 56, right: FX_W - 56 }
// Where the face lands at full zoom: framed eyes-to-mouth, a little above centre of the viewfinder.
const TARGET = { x: 540, y: 930 }
const ZMAX = 3
const MINT = colors.mint

const zoomAt = (frame: number) => {
	let z = 1
	for (const s of STEPS) {
		const p = spring({ frame: frame - s.at, fps: FX_FPS, config: { damping: 32, stiffness: 420, mass: 0.6 } }) // ratio 1.0: lands without overshoot
		z += (s.z - z) * p
	}
	return z
}

const Bracket = ({ x, y, sx, sy }: { x: number, y: number, sx: 1 | -1, sy: 1 | -1 }) => <div style={{ position: 'absolute', left: sx > 0 ? x : x - 80, top: sy > 0 ? y : y - 80, width: 80, height: 80, borderLeft: sx > 0 ? '6px solid #fff' : undefined, borderRight: sx < 0 ? '6px solid #fff' : undefined, borderTop: sy > 0 ? '6px solid #fff' : undefined, borderBottom: sy < 0 ? '6px solid #fff' : undefined, [`border${sy > 0 ? 'Top' : 'Bottom'}${sx > 0 ? 'Left' : 'Right'}Radius`]: 22, filter: 'drop-shadow(0 1px 4px rgba(15,23,42,0.4))' }} />

export const DigitalZoom: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const face = useFace()
	const FOCUS = { x: face.x, y: (face.y + face.mouthY) / 2 - 40 }
	const z = zoomAt(frame)
	const k = (z - 1) / (ZMAX - 1)
	const tx = FOCUS.x + (TARGET.x - FOCUS.x) * k - z * FOCUS.x
	const ty = FOCUS.y + (TARGET.y - FOCUS.y) * k - z * FOCUS.y
	// Each step lands out of focus and pulls sharp over ~8 frames.
	const blur = STEPS.reduce((b, s) => b + (frame >= s.at ? 8 * Math.exp(-(frame - s.at) / 2.5) : 0), 0)
	const ui = 0.6 + 0.4 * progress(frame, 0, 4)
	const lastStep = STEPS.filter(s => frame >= s.at).at(-1)
	const flash = lastStep ? 1 - progress(frame, lastStep.at, 8) : 0
	const rec = Math.floor(frame / 12) % 2 === 0
	const secs = Math.floor((from + frame) / 30)
	const tc = `00:00:${String(secs).padStart(2, '0')}:${String((from + frame) % 30).padStart(2, '0')}`
	const mono = { fontFamily: fonts.ui, fontVariantNumeric: 'tabular-nums' as const, fontWeight: 600, letterSpacing: '0.01em', color: '#fff', textShadow: '0 1px 6px rgba(15,23,42,0.45)' }
	// AF box: grows with the zoom, white while hunting, mint when locked.
	const afSize = interpolate(z, [1, 1.8, 3], [260, 360, 470])
	const afLocked = !lastStep || frame - lastStep.at > 7
	return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
		<div style={{ position: 'absolute', inset: 0, transformOrigin: '0 0', transform: `translate(${tx}px, ${ty}px) scale(${z})`, filter: blur > 0.3 ? `blur(${blur / z}px)` : undefined }}>
			<ARoll from={from} />
		</div>
		{/* slight vignette like a monitor feed */}
		<div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(0,0,0,0) 60%, rgba(15,23,42,0.3) 100%)' }} />
		<div style={{ position: 'absolute', inset: 0, opacity: ui }}>
			<Bracket x={VF.left} y={VF.top} sx={1} sy={1} />
			<Bracket x={VF.right} y={VF.top} sx={-1} sy={1} />
			<Bracket x={VF.left} y={VF.bottom} sx={1} sy={-1} />
			<Bracket x={VF.right} y={VF.bottom} sx={-1} sy={-1} />
			{/* REC + timecode */}
			<div style={{ position: 'absolute', left: VF.left + 30, top: VF.top + 30, display: 'flex', alignItems: 'center', gap: 14, ...mono, fontSize: 34 }}>
				<div style={{ width: 24, height: 24, borderRadius: 12, background: '#EF4444', opacity: rec ? 1 : 0.3 }} />REC
			</div>
			<div style={{ position: 'absolute', right: FX_W - VF.right + 30, top: VF.top + 30, ...mono, fontSize: 34 }}>{tc}</div>
			<div style={{ position: 'absolute', left: VF.left + 30, top: VF.bottom - 72, ...mono, fontSize: 28, opacity: 0.85 }}>4K · 30 FPS</div>
			<div style={{ position: 'absolute', right: FX_W - VF.right + 30, top: VF.bottom - 72, ...mono, fontSize: 28, opacity: 0.85 }}>ISO 400 · 1/60</div>
			{/* zoom readout: a glass pill (translucent rim, white card, ink type, blue figure while a step lands) */}
			<div style={{ position: 'absolute', left: 540, top: VF.top + 86, transform: 'translateX(-50%)', padding: 6, borderRadius: 999, background: 'rgba(255,255,255,0.45)', outline: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 24px 60px -30px rgba(15,23,42,0.5)' }}>
				<div style={{ minWidth: 168, padding: '10px 26px', borderRadius: 999, background: '#fff', border: `1px solid ${colors.navy200}`, display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 2, fontFamily: themeFonts.heading, fontWeight: 500, fontSize: 52, letterSpacing: '-0.02em', color: flash > 0.05 ? colors.blue : colors.navy, fontVariantNumeric: 'tabular-nums' }}>{z.toFixed(1)}<span style={{ fontSize: 38 }}>×</span></div>
			</div>
			<div style={{ position: 'absolute', left: 540 - 220, top: VF.top + 196, width: 440, height: 30 }}>
				{Array.from({ length: 21 }, (_, i) => <div key={i} style={{ position: 'absolute', left: i * 22 - 1.5, top: i % 5 === 0 ? 0 : 8, width: 3, height: i % 5 === 0 ? 30 : 14, borderRadius: 2, background: 'rgba(255,255,255,0.75)', boxShadow: '0 1px 4px rgba(15,23,42,0.3)' }} />)}
				<div style={{ position: 'absolute', left: (z - 1) / (ZMAX - 1) * 440 - 5, top: -8, width: 10, height: 46, borderRadius: 5, background: '#fff', boxShadow: '0 2px 10px rgba(15,23,42,0.45)' }} />
			</div>
			{/* AF box */}
			<div style={{ position: 'absolute', left: FOCUS.x + (TARGET.x - FOCUS.x) * k - afSize / 2, top: FOCUS.y + (TARGET.y - FOCUS.y) * k - afSize / 2 - 10, width: afSize, height: afSize, border: `5px solid ${afLocked ? MINT : "#fff"}`, borderRadius: 18, clipPath: 'polygon(0 0, 22% 0, 22% 4%, 78% 4%, 78% 0, 100% 0, 100% 22%, 96% 22%, 96% 78%, 100% 78%, 100% 100%, 78% 100%, 78% 96%, 22% 96%, 22% 100%, 0 100%, 0 78%, 4% 78%, 4% 22%, 0 22%)' }} />
		</div>
	</div>
}

export const digitalZoomFx: FxEntry = { id: 'digital-zoom', name: 'Digital Zoom', duration: 66, Component: DigitalZoom,
	sfx: [10, 28, 48].map(at => ({ at, sound: 'click' as const, volume: 0.4 })),
}
