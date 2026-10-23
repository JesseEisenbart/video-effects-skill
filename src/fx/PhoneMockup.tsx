import type { FC } from 'react'
import { interpolate, useCurrentFrame } from 'remotion'
import { ARoll, CLAUDE_ORANGE, FX_H, FX_W, type FxEntry, type FxProps, fxSpring, fonts, progress } from './shared'
import { Backdrop, GlassBlur, colors } from './theme'

// 17 Phone Mockup: the full-frame shot shrinks into the screen of a phone (a CSS-drawn handset, no brand marks) on the
// light grey Backdrop. Once it lands, a short-video UI fades in on the screen and the phone eases into a resting 3D tilt.
// The handle, caption and counts in ScreenUi are on-screen copy; change them to fit the video. No cut-out, no face
// position.
// Motion: the shrink starts at 4 on a critically damped spring; the tilt settles once from 18 (no looping float); the UI
// fades in 22 to 30.
// SFX: 'whoosh' at 4 (the shrink).
const SHRINK = 4
const SCREEN = { w: 500, h: 1083 }
const CENTER = { x: 540, y: 900 }
const BEZEL = 16

const Icon = ({ d, label }: { d: string, label: string }) => <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
	<svg width={46} height={46} viewBox="0 0 24 24" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }}><path d={d} fill="#fff" /></svg>
	<div style={{ fontFamily: fonts.ui, fontWeight: 600, fontSize: 17, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>{label}</div>
</div>
const HEART = 'M12 21s-7.5-4.6-9.6-9.3C1 8.4 3 5 6.4 5c2 0 3.6 1.1 4.4 2.6h2.4C14 6.1 15.6 5 17.6 5 21 5 23 8.4 21.6 11.7 19.5 16.4 12 21 12 21z'
const BUBBLE = 'M12 3C6.5 3 2 6.8 2 11.5c0 2.4 1.2 4.6 3.1 6.1L4 21l4.2-1.8c1.2.4 2.5.6 3.8.6 5.5 0 10-3.8 10-8.5S17.5 3 12 3z'
const SEND = 'M2 11l20-8-8 20-2.5-8.5L2 11z'

/** The short-video UI drawn on the phone screen (status bar, right rail, creator row). `o` = opacity. */
const ScreenUi = ({ o }: { o: number }) => <div style={{ position: 'absolute', inset: 0, opacity: o, fontFamily: fonts.ui, color: '#fff' }}>
	<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 14%, rgba(0,0,0,0) 72%, rgba(0,0,0,0.55) 100%)' }} />
	<div style={{ position: 'absolute', left: 40, top: 26, fontWeight: 700, fontSize: 24 }}>10:23</div>
	<div style={{ position: 'absolute', right: 36, top: 30, display: 'flex', gap: 8, alignItems: 'flex-end' }}>
		{[8, 12, 16, 20].map(h => <div key={h} style={{ width: 5, height: h, borderRadius: 2, background: '#fff' }} />)}
		<div style={{ marginLeft: 8, width: 38, height: 19, borderRadius: 6, border: '2px solid rgba(255,255,255,0.8)', padding: 2, boxSizing: 'border-box' }}><div style={{ width: '78%', height: '100%', borderRadius: 3, background: '#fff' }} /></div>
	</div>
	<div style={{ position: 'absolute', left: 30, top: 84, fontWeight: 800, fontSize: 30 }}>Feed</div>
	<div style={{ position: 'absolute', right: 22, bottom: 190, display: 'flex', flexDirection: 'column', gap: 26 }}>
		<Icon d={HEART} label="12.4k" />
		<Icon d={BUBBLE} label="318" />
		<Icon d={SEND} label="Share" />
	</div>
	<div style={{ position: 'absolute', left: 28, bottom: 108, display: 'flex', alignItems: 'center', gap: 14 }}>
		<div style={{ width: 52, height: 52, borderRadius: 26, border: '2px solid #fff', boxSizing: 'border-box', background: 'linear-gradient(135deg, #93C5FD, #2563EB)' }} />
		<div style={{ fontWeight: 700, fontSize: 24 }}>yourhandle</div>
		<div style={{ padding: '6px 16px', borderRadius: 10, border: '2px solid rgba(255,255,255,0.85)', fontWeight: 700, fontSize: 20 }}>Follow</div>
	</div>
	<div style={{ position: 'absolute', left: 28, right: 110, bottom: 62, fontWeight: 500, fontSize: 22, opacity: 0.95 }}>Edited end to end with Claude <span style={{ color: CLAUDE_ORANGE }}>✦</span></div>
	<div style={{ position: 'absolute', left: 0, right: 0, bottom: 34, height: 4, background: 'rgba(255,255,255,0.3)' }}><div style={{ width: '42%', height: '100%', background: '#fff' }} /></div>
</div>

export const PhoneMockup: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const p = fxSpring(frame, SHRINK, { stiffness: 110 })
	// Screen rect: full frame → phone screen.
	const w = interpolate(p, [0, 1], [FX_W, SCREEN.w])
	const h = interpolate(p, [0, 1], [FX_H, SCREEN.h])
	const cx = interpolate(p, [0, 1], [FX_W / 2, CENTER.x])
	const cy = interpolate(p, [0, 1], [FX_H / 2, CENTER.y])
	const r = interpolate(p, [0, 1], [0, 66])
	const bz = BEZEL * p
	// After landing the phone turns into a resting three-quarter tilt and stays there (one settle, no looping float).
	const tilt = fxSpring(frame, SHRINK + 14, { stiffness: 60 })
	const rotY = -10 * tilt
	const rotX = 4 * tilt
	const lift = -10 * tilt
	const phoneBottom = CENTER.y + SCREEN.h / 2 + BEZEL
	return <GlassBlur.Provider value={false}><div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#F6F6F7' }}>
		<div style={{ position: 'absolute', inset: 0, opacity: Math.min(1, p * 1.4) }}><Backdrop /></div>
		{/* contact shadow on the backdrop: deeper as the phone lands (a big surface casts a long, soft shadow) */}
		<div style={{ position: 'absolute', left: CENTER.x - 250, top: phoneBottom + 6, width: 500, height: 60, borderRadius: '50%', background: 'radial-gradient(ellipse, rgba(15,23,42,0.28), rgba(15,23,42,0) 70%)', opacity: progress(frame, SHRINK + 6, 10) }} />
		<div style={{ position: 'absolute', inset: 0, perspective: 2400 }}>
			<div style={{ position: 'absolute', left: cx - w / 2 - bz, top: cy - h / 2 - bz, width: w + 2 * bz, height: h + 2 * bz, borderRadius: r + bz, transform: `translateY(${lift}px) rotateX(${rotX}deg) rotateY(${rotY}deg)`, transformStyle: 'preserve-3d', background: 'linear-gradient(140deg, #3A3D46 0%, #1A1B20 22%, #0C0D10 50%, #22242B 80%, #4A4D57 100%)', boxShadow: p > 0.05 ? `0 ${70 * p}px ${140 * p}px -${40 * p}px rgba(15,23,42,0.45), 0 ${16 * p}px ${36 * p}px -${12 * p}px rgba(15,23,42,0.3), 0 0 0 ${2 * p}px rgba(255,255,255,0.1) inset` : undefined }}>
				{/* side buttons */}
				{p > 0.3 && <>
					<div style={{ position: 'absolute', left: -6, top: 220, width: 6, height: 70, borderRadius: '3px 0 0 3px', background: '#2C2E35' }} />
					<div style={{ position: 'absolute', left: -6, top: 320, width: 6, height: 120, borderRadius: '3px 0 0 3px', background: '#2C2E35' }} />
					<div style={{ position: 'absolute', right: -6, top: 300, width: 6, height: 160, borderRadius: '0 3px 3px 0', background: '#2C2E35' }} />
				</>}
				<div style={{ position: 'absolute', left: bz, top: bz, width: w, height: h, borderRadius: r, overflow: 'hidden', background: '#000' }}>
					<ARoll from={from} style={{ width: w, height: h }} />
					<ScreenUi o={progress(frame, SHRINK + 18, 8)} />
					{/* camera pill */}
					<div style={{ position: 'absolute', left: w / 2 - 66, top: 18, width: 132, height: 38, borderRadius: 19, background: '#000', opacity: p }}>
						<div style={{ position: 'absolute', right: 14, top: 11, width: 16, height: 16, borderRadius: 8, background: 'radial-gradient(circle at 35% 35%, #2A3550, #05060A 70%)' }} />
					</div>
					{/* glass sheen, travelling once with the tilt */}
					<div style={{ position: 'absolute', inset: 0, background: `linear-gradient(${110 + 14 * tilt}deg, rgba(255,255,255,0) 30%, rgba(255,255,255,0.12) 42%, rgba(255,255,255,0) 54%)`, opacity: tilt }} />
				</div>
			</div>
		</div>
	</div></GlassBlur.Provider>
}

export const phoneMockupFx: FxEntry = { id: 'phone-mockup', name: 'Phone Mockup', duration: 72, Component: PhoneMockup,
	sfx: [{ at: 4, sound: 'whoosh', volume: 0.35 }],
}
