import type { FC } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { ARoll, CLAUDE_ORANGE, type FxEntry, type FxProps, FX_H, FX_W, fonts, fxSpring, progress } from './shared'
import { Backdrop, AssistantMark, pop, colors, themeFonts } from './theme'

// 09 B-roll Overlay: the full-frame shot shrinks into the preview of a light glass video-editor window on the grey
// Backdrop. A blue playhead runs along a timeline holding the talking-head clip (blue) and its audio (mint); a dark
// terminal-style B-roll clip drops onto the empty V2 track, and when the playhead crosses into it the preview cuts to the
// overlay (a dark command card over the lower half of the shot). The window title, clip names and the card's lines are
// on-screen copy; change them to fit the video. No cut-out, no face position.
// Motion: the shrink and the window are critically damped; the clip drop (30) is the one lightly bouncy spring here, since
// a dropped object carries momentum. The playhead moves 6.2 px per frame and enters the clip around frame 52.
// SFX: 'whoosh' at 0 (shrink into the editor), 'click' at 36 (the clip snaps onto V2).
const WIN = { x: 40, y: 300, w: 1000, h: 1270 } // roughly centred on the 1920 frame
const PREVIEW = { y: WIN.y + 64, h: 744 }
const VID_H = 700
const VID_S = VID_H / FX_H
const VID_W = FX_W * VID_S
const VID_X = FX_W / 2 - VID_W / 2
const VID_Y = PREVIEW.y + (PREVIEW.h - VID_H) / 2
const TL_X = 140 // timeline content starts after the track-label column
const TL_R = WIN.x + WIN.w - 20
const TRACK = { v2: 1262, v1: 1366, a1: 1470 }
const TRACK_H = 86
const CLIP = { x0: 470, x1: 820 }
const DROP_AT = 30
const head = (frame: number) => 150 + frame * 6.2 // the playhead reaches the B-roll at frame 50

const Label = ({ y, text }: { y: number, text: string }) => <div style={{ position: 'absolute', left: WIN.x + 20, top: y, width: 70, height: TRACK_H, display: 'flex', alignItems: 'center', fontFamily: fonts.mono, fontWeight: 600, fontSize: 24, color: colors.navy400 }}>{text}</div>

// Fixed pseudo-random waveform bars.
const BARS = Array.from({ length: 170 }, (_, i) => 0.25 + 0.75 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.43 + 1)))
const CLAUDE_BG = '#1F1E1D' // dark terminal surface for the B-roll clip and the overlay card

export const BrollOverlay: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const shrink = fxSpring(frame, 0, { stiffness: 90 })
	const ui = pop(frame, 2)
	// Shot transform: full frame → preview monitor.
	const s = interpolate(shrink, [0, 1], [1, VID_S])
	const tx = interpolate(shrink, [0, 1], [0, VID_X])
	const ty = interpolate(shrink, [0, 1], [0, VID_Y])
	const radius = interpolate(shrink, [0, 1], [0, 14 / VID_S])
	const px = head(frame)
	// The clip is dropped onto its track, so it carries momentum: a light bounce is allowed here (and only here).
	const drop = fxSpring(frame, DROP_AT, { stiffness: 220, damping: 22 })
	const clipY = interpolate(drop, [0, 1], [TRACK.v2 - 220, TRACK.v2])
	const inBroll = px >= CLIP.x0 && frame >= DROP_AT + 8
	const brollIn = inBroll ? pop(frame, 50) : 0
	const secs = 10 + frame / 30
	const tc = `00:00:${String(Math.floor(secs)).padStart(2, '0')}:${String(Math.floor((secs % 1) * 30)).padStart(2, '0')}`
	return <AbsoluteFill style={{ overflow: 'hidden', background: '#F6F6F7' }}>
		<Backdrop />
		{/* Editor window: GlassCard's material (translucent rim + white body), scaled up for a big surface. */}
		<div style={{ position: 'absolute', left: WIN.x - 12, top: WIN.y - 12, width: WIN.w + 24, height: WIN.h + 24, borderRadius: 36, background: 'rgba(255,255,255,0.38)', outline: '1.5px solid rgba(255,255,255,0.9)', boxShadow: '0 50px 120px -50px rgba(15,23,42,0.45)', opacity: ui, transform: `scale(${1.04 - 0.04 * ui})` }}>
			<div style={{ position: 'absolute', left: 12, top: 12, width: WIN.w, height: WIN.h, borderRadius: 24, background: '#fff', border: `1px solid ${colors.navy200}`, overflow: 'hidden', boxSizing: 'border-box' }}>
				<div style={{ position: 'absolute', left: 0, top: 0, right: 0, height: 64, display: 'flex', alignItems: 'center', gap: 12, padding: '0 22px', borderBottom: `1px solid ${colors.navy200}` }}>
					{[0, 1, 2].map(c => <div key={c} style={{ width: 16, height: 16, borderRadius: 8, background: colors.navy200 }} />)}
					<div style={{ marginLeft: 18, fontFamily: themeFonts.body, fontWeight: 600, fontSize: 24, color: colors.navy }}>my-reel-v3 <span style={{ color: colors.navy500, fontWeight: 500 }}>· edited by Claude</span></div>
					<div style={{ marginLeft: 'auto', fontFamily: themeFonts.body, fontWeight: 600, fontSize: 22, color: '#fff', background: colors.navy, borderRadius: 12, padding: '9px 20px' }}>Export</div>
				</div>
				<div style={{ position: 'absolute', left: 0, right: 0, top: PREVIEW.y - WIN.y, height: PREVIEW.h, background: colors.navy100 }} />
				{/* Transport bar. */}
				<div style={{ position: 'absolute', left: 0, right: 0, top: PREVIEW.y - WIN.y + PREVIEW.h, height: 70, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 34, borderTop: `1px solid ${colors.navy200}`, borderBottom: `1px solid ${colors.navy200}`, fontFamily: fonts.mono, fontSize: 26, color: colors.navy400 }}>
					<span>◀◀</span>
					<span style={{ width: 0, height: 0, borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: `22px solid ${colors.navy}` }} />
					<span>▶▶</span>
					<span style={{ position: 'absolute', right: 26, fontSize: 24, color: colors.navy500, fontVariantNumeric: 'tabular-nums' }}>{tc}</span>
				</div>
				{/* Ruler. */}
				{Array.from({ length: 30 }, (_, i) => <div key={i} style={{ position: 'absolute', left: TL_X - WIN.x + i * 30, top: 1218 - WIN.y + (i % 5 ? 14 : 0), width: 2, height: i % 5 ? 12 : 26, background: colors.navy200 }} />)}
			</div>
		</div>
		{ui > 0 && <div style={{ opacity: ui }}>
			<Label y={TRACK.v2} text="V2" />
			<Label y={TRACK.v1} text="V1" />
			<Label y={TRACK.a1} text="A1" />
			{/* Empty V2 lane, the talking-head clip and its audio. */}
			<div style={{ position: 'absolute', left: TL_X, top: TRACK.v2, width: TL_R - TL_X, height: TRACK_H, borderRadius: 12, border: `2px dashed ${colors.navy200}`, boxSizing: 'border-box' }} />
			<div style={{ position: 'absolute', left: TL_X - 40, top: TRACK.v1, width: TL_R - TL_X + 40, height: TRACK_H, borderRadius: 12, background: colors.blue, display: 'flex', alignItems: 'center', paddingLeft: 60, fontFamily: themeFonts.body, fontWeight: 600, fontSize: 24, color: '#fff', overflow: 'hidden' }}>Talking head · aroll.mp4</div>
			<div style={{ position: 'absolute', left: TL_X - 40, top: TRACK.a1, width: TL_R - TL_X + 40, height: TRACK_H - 10, borderRadius: 12, background: '#ECFDF5', border: `1px solid ${colors.mint}`, display: 'flex', alignItems: 'center', gap: 3, padding: '0 10px', overflow: 'hidden', boxSizing: 'border-box' }}>
				{BARS.map((b, i) => <div key={i} style={{ width: 4, flexShrink: 0, height: b * 50, borderRadius: 2, background: colors.mintText, opacity: 0.55 }} />)}
			</div>
			{/* The B-roll clip drops onto V2 (straight down into its lane, shadow tightening as it lands). */}
			{frame >= DROP_AT && <div style={{ position: 'absolute', left: CLIP.x0, top: clipY, width: CLIP.x1 - CLIP.x0, height: TRACK_H, borderRadius: 12, background: CLAUDE_BG, boxShadow: `0 ${24 * (1 - drop) + 4}px ${50 * (1 - drop) + 10}px -${6 * drop}px rgba(15,23,42,${0.18 + 0.2 * (1 - drop)})`, transform: `scale(${1 + 0.04 * (1 - drop)})`, display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 16, fontFamily: themeFonts.body, fontWeight: 600, fontSize: 24, color: '#F5F3EF', overflow: 'hidden', whiteSpace: 'nowrap', opacity: progress(frame, DROP_AT, 3) }}>
				<AssistantMark size={44} dark style={{ outline: '2px solid #393735' }} />Claude Code · b-roll
			</div>}
		</div>}
		{/* The shot itself, shrinking into the preview monitor. */}
		<div style={{ position: 'absolute', left: tx, top: ty, width: FX_W, height: FX_H, transform: `scale(${s})`, transformOrigin: '0 0', borderRadius: radius, overflow: 'hidden' }}>
			<ARoll from={from} />
			{/* B-roll overlay: a dark command card over the lower half of the shot once the playhead is inside the clip. */}
			{brollIn > 0 && <div style={{ position: 'absolute', left: 60, right: 60, top: 1060, height: 660, borderRadius: 48, background: CLAUDE_BG, border: '3px solid #393735', boxShadow: '0 60px 120px -40px rgba(0,0,0,0.6)', transform: `translateY(${(1 - brollIn) * 60}px) scale(${0.96 + 0.04 * brollIn})`, opacity: Math.min(1, brollIn * 1.4), padding: 56, fontFamily: fonts.mono, fontSize: 46, lineHeight: 1.55, whiteSpace: 'nowrap', color: '#F5F3EF', boxSizing: 'border-box' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 40, fontFamily: themeFonts.heading, fontSize: 52 }}><AssistantMark size={72} dark style={{ outline: '2px solid #393735' }} />Claude Code</div>
				<div><span style={{ color: CLAUDE_ORANGE }}>{'> '}</span>add b-roll at 00:12</div>
				<div style={{ color: colors.mint }}>✓ placed clip on V2</div>
				<div style={{ color: colors.mint }}>✓ synced to “edit”</div>
			</div>}
		</div>
		{/* Playhead over the timeline (drawn last so it crosses the clips). */}
		{ui > 0 && <div style={{ position: 'absolute', left: px - 2, top: 1206, width: 4, height: TRACK.a1 + TRACK_H - 1206, background: colors.blue, opacity: ui }}>
			<div style={{ position: 'absolute', left: -14, top: -14, width: 32, height: 26, borderRadius: '6px 6px 16px 16px', background: colors.blue }} />
		</div>}
	</AbsoluteFill>
}

export const brollOverlayFx: FxEntry = { id: 'broll-overlay', name: 'B-roll Overlay', duration: 90, Component: BrollOverlay,
	sfx: [{ at: 0, sound: 'whoosh', volume: 0.4 }, { at: 36, sound: 'click', volume: 0.45 }],
}
