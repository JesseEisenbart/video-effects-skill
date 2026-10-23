import type { CSSProperties, FC } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import type { FxEntry, FxProps } from './shared'
import { ARoll, Cutout, FX_W, fonts, fxSpring, progress } from './shared'
import { pop, colors, themeFonts } from './theme'

// 11 Magazine Cover: the room fades to cover stock and the speaker becomes the cover star. The masthead drops in letter
// by letter behind the head, then the issue strip, cover lines, barcode and a round badge land around them, and a gloss
// sheen sweeps the "printed" cover. Light paper, ink and blue, Inter heads. MAST and every string in the JSX are
// on-screen copy; change them to fit the video. Needs the cut-out.
// Motion: paper fades 0 to 8; masthead letters from 3, two frames apart; issue strip 8; cover lines 12 and 15; barcode
// 18; badge 24 (materializes from its centre, already at its final tilt); bottom headline 28; sheen 40 to 62. A slow push
// runs under everything.
// SFX: 'whoosh' at 3 (masthead), 'bubble' at 24 (badge).

const INKC = colors.navy
const PAPER = '#F4F4F2'
const ACCENT = colors.blue
const MAST = 'BUILT'

const t = (frame: number, at: number) => fxSpring(frame, at, { stiffness: 170 })
const slide = (frame: number, at: number, dx: number): CSSProperties => {
	const p = t(frame, at)
	return { opacity: p, transform: `translateX(${(1 - p) * dx}px)` }
}

const Barcode = () => {
	const bars = Array.from({ length: 38 }, (_, i) => ((i * 7919) % 5) + 1)
	return (
		<div style={{ background: '#fff', padding: '14px 16px 8px', width: 230, boxShadow: '0 2px 0 rgba(0,0,0,0.1)' }}>
			<div style={{ display: 'flex', gap: 2, height: 92, alignItems: 'stretch' }}>
				{bars.map((w, i) => <div key={i} style={{ width: w, background: i % 2 ? 'transparent' : INKC }} />)}
			</div>
			<div style={{ fontFamily: fonts.mono, fontSize: 15, letterSpacing: '0.04em', color: INKC, textAlign: 'center', marginTop: 6 }}>0 74470 26107 7</div>
		</div>
	)
}

export const MagazineCover: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const paper = Easing.out(Easing.cubic)(progress(frame, 0, 8))
	const push = interpolate(frame, [0, 75], [1, 1.035])
	const badge = pop(frame, 24)
	const sheen = Easing.inOut(Easing.cubic)(progress(frame, 40, 22))
	const lbl: CSSProperties = { fontFamily: themeFonts.body, fontWeight: 700, fontSize: 24, letterSpacing: '0.08em', color: ACCENT }
	const line: CSSProperties = { fontFamily: themeFonts.heading, fontSize: 56, lineHeight: 0.98, color: INKC, letterSpacing: '-0.02em' }
	const sub: CSSProperties = { fontFamily: themeFonts.body, fontWeight: 500, fontSize: 25, lineHeight: 1.3, color: colors.navy500, marginTop: 12 }
	return (
		<AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
			<ARoll from={from} />
			<AbsoluteFill style={{ transform: `scale(${push})`, transformOrigin: '540px 900px' }}>
				<AbsoluteFill style={{ opacity: paper, background: `radial-gradient(90% 70% at 50% 45%, #FFFFFF, ${PAPER} 60%, #E6E7EA)` }} />
				{/* Issue strip */}
				<div style={{ position: 'absolute', left: 48, right: 48, top: 300, display: 'flex', justifyContent: 'space-between', fontFamily: themeFonts.body, fontWeight: 700, fontSize: 25, letterSpacing: '0.08em', color: INKC, borderBottom: `3px solid ${INKC}`, paddingBottom: 10, ...slide(frame, 8, 0) }}>
					<span>THE AGENT ISSUE</span>
					<span>VOL. 07 · OCT 2026</span>
				</div>
				{/* Masthead, letter by letter, behind the cut-out. */}
				<div style={{ position: 'absolute', left: 0, width: FX_W, top: 330, display: 'flex', justifyContent: 'center', fontFamily: themeFonts.heading, fontSize: 330, letterSpacing: '-0.04em', lineHeight: 1, color: ACCENT }}>
					{MAST.split('').map((ch, i) => {
						const p = t(frame, 3 + i * 2)
						return <span key={i} style={{ display: 'inline-block', opacity: p, transform: `translateY(${(1 - p) * -90}px)` }}>{ch}</span>
					})}
				</div>
				<Cutout from={from} />
				{/* Left cover line */}
				<div style={{ position: 'absolute', left: 48, top: 680, width: 300, ...slide(frame, 12, -60) }}>
					<div style={lbl}>COVER STORY</div>
					<div style={{ ...line, marginTop: 8 }}>ONE<br />BUILDER.<br /><span style={{ color: ACCENT }}>ZERO</span><br />EDITORS.</div>
					<div style={sub}>A creator on shipping every video with Claude.</div>
				</div>
				{/* Right cover line */}
				<div style={{ position: 'absolute', right: 48, top: 680, width: 290, textAlign: 'right', ...slide(frame, 15, 60) }}>
					<div style={lbl}>EXCLUSIVE</div>
					<div style={{ ...line, marginTop: 8 }}>CLAUDE<br />CUTS<br />THE EDIT</div>
					<div style={sub}>Every frame, every caption. No timeline.</div>
				</div>
				{/* Barcode */}
				<div style={{ position: 'absolute', left: 48, top: 1410, ...slide(frame, 18, -40) }}><Barcode /></div>
				{/* Badge: materializes from its own centre on the critically damped UI spring, already at its final tilt. */}
				<div style={{ position: 'absolute', left: 790, top: 1330, width: 230, height: 230, borderRadius: '50%', background: ACCENT, opacity: Math.min(1, badge * 1.4), transform: `scale(${0.8 + 0.2 * badge}) rotate(-10deg)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: themeFonts.heading, boxShadow: `0 ${30 * badge}px 60px -24px rgba(15,23,42,0.45)`, border: '6px solid #fff' }}>
					<div style={{ fontFamily: themeFonts.body, fontWeight: 700, fontSize: 24, letterSpacing: '0.08em' }}>SPECIAL</div>
					<div style={{ fontSize: 84, lineHeight: 0.95, letterSpacing: '-0.03em' }}>AI</div>
					<div style={{ fontFamily: themeFonts.body, fontWeight: 700, fontSize: 24, letterSpacing: '0.08em' }}>EDITION</div>
				</div>
				{/* Bottom headline, over the shoulders: white with a light-blue second line, for contrast on dark clothing. */}
				<div style={{ position: 'absolute', left: 48, right: 48, top: 1650, textAlign: 'center', fontFamily: themeFonts.heading, fontSize: 72, lineHeight: 1, letterSpacing: '-0.02em', color: '#fff', textShadow: '0 4px 24px rgba(15,23,42,0.5)', ...slide(frame, 28, 0) }}>
					The prompt is the<br /><span style={{ color: '#93C5FD' }}>new timeline</span>
				</div>
				{/* Gloss sheen across the cover stock */}
				<AbsoluteFill style={{ background: `linear-gradient(115deg, rgba(255,255,255,0) ${-40 + sheen * 160}%, rgba(255,255,255,0.35) ${-25 + sheen * 160}%, rgba(255,255,255,0) ${-10 + sheen * 160}%)`, mixBlendMode: 'screen', opacity: sheen > 0 && sheen < 1 ? 1 : 0 }} />
			</AbsoluteFill>
		</AbsoluteFill>
	)
}

export const magazineCoverFx: FxEntry = { id: 'magazine-cover', name: 'Magazine Cover', duration: 75, Component: MagazineCover,
	sfx: [{ at: 3, sound: 'whoosh', volume: 0.4 }, { at: 24, sound: 'bubble', volume: 0.4 }],
}
