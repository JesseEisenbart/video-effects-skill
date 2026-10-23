import type { FC } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'
import { ARoll, FX_W, type FxEntry, type FxProps, fxSpring, progress } from './shared'
import { Backdrop, GlassBlur, GlassCard, green, ink, AssistantMark, materialize, pop, colors, themeFonts } from './theme'

// 02 Chat Takeover: the full-frame take shrinks into an attachment inside a chat window (grey Backdrop, GlassCard window,
// ink type, blue prompt bubble). The prompt asks for the edit, the assistant answers "On it." and three steps spin then
// tick off green while the clip keeps playing in the corner. The header text, prompt, reply, STEPS labels and the
// attachment caption are on-screen copy; change them to fit the video. No cut-out, no face position.
// Motion: one critically damped spring family (`pop`); the window materializes behind the shrinking take, the prompt
// bubble grows from its tail corner, the reply rows rise out of the assistant mark (46, 56, 66) and each tick draws on
// 8 frames after its row.
// SFX: 'whoosh' at 0 (the shrink), 'bubble' at 12 (prompt bubble) and at 40 (the reply).
const DURATION = 90
const WIN = { x: 44, y: 430, w: 992, h: 1120 }
const PAD = 12 // GlassCard rim
const VID = { x: 618, y: 724, w: 372 } // final attachment rect (9:16), frame coords
const MUTED = colors.navy500

const STEPS = [
	{ label: 'Cut the pauses', at: 46 },
	{ label: 'Caption every word', at: 56 },
	{ label: 'Add 18 effects', at: 66 },
]
const TICK_DELAY = 8

const Spinner = ({ frame }: { frame: number }) => <svg width={40} height={40} viewBox="0 0 34 34" style={{ transform: `rotate(${frame * 24}deg)`, flexShrink: 0 }}>
	<circle cx={17} cy={17} r={13} fill="none" stroke={colors.navy200} strokeWidth={3.6} />
	<path d="M17 4a13 13 0 0 1 13 13" fill="none" stroke={colors.blue} strokeWidth={3.6} strokeLinecap="round" />
</svg>

const Tick = ({ t }: { t: number }) => <svg width={40} height={40} viewBox="0 0 34 34" style={{ transform: `scale(${0.7 + 0.3 * t})`, flexShrink: 0 }}>
	<circle cx={17} cy={17} r={16} fill={green} />
	<path d="M10 17.5l4.6 4.6L24.5 12" fill="none" stroke="#fff" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={22} strokeDashoffset={22 * (1 - t)} />
</svg>

const Dots = ({ frame }: { frame: number }) => <div style={{ display: 'flex', gap: 10, padding: '14px 0' }}>
	{[0, 1, 2].map(i => <div key={i} style={{ width: 13, height: 13, borderRadius: 7, background: colors.navy400, opacity: 0.35 + 0.65 * Math.max(0, Math.sin((frame - i * 3) / 3)) }} />)}
</div>

export const ChatTakeover: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	// Footage: full frame → attachment rect.
	const shrink = fxSpring(frame, 0, { stiffness: 110 })
	const s = interpolate(shrink, [0, 1], [1, VID.w / FX_W])
	const vx = interpolate(shrink, [0, 1], [0, VID.x])
	const vy = interpolate(shrink, [0, 1], [0, VID.y])
	const radius = interpolate(shrink, [0, 1], [0, 16])
	const win = pop(frame, 4)
	const bubble = pop(frame, 12)
	const markIn = pop(frame, 24)
	const typing = frame >= 26 && frame < 40
	const reply = pop(frame, 40)
	return <AbsoluteFill style={{ overflow: 'hidden', fontFamily: themeFonts.body }}>
		<Backdrop />
		<GlassBlur.Provider value={false}>
			<GlassCard style={{ position: 'absolute', left: WIN.x, top: WIN.y, width: WIN.w, height: WIN.h, boxSizing: 'border-box', padding: PAD, boxShadow: '0 60px 120px -50px rgba(15,23,42,0.45)', ...materialize(win) }} innerStyle={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
				{/* Header */}
				<div style={{ height: 96, display: 'flex', alignItems: 'center', padding: '0 32px', borderBottom: `1px solid ${colors.navy200}`, gap: 16 }}>
					<AssistantMark size={48} />
					<span style={{ fontFamily: themeFonts.heading, fontSize: 36, fontWeight: 500, color: ink, letterSpacing: '-0.01em' }}>Claude</span>
					<span style={{ marginLeft: 'auto', fontSize: 25, color: MUTED, fontWeight: 500 }}>Edit my reel</span>
				</div>
				{/* Prompt bubble, growing from its tail corner */}
				<div style={{ position: 'absolute', right: 36, top: 130, width: 600, boxSizing: 'border-box', background: colors.blue50, border: `1px solid ${colors.blue100}`, color: ink, fontSize: 33, lineHeight: 1.35, padding: '20px 28px', borderRadius: '22px 22px 6px 22px', transform: `scale(${0.9 + 0.1 * bubble})`, transformOrigin: '100% 100%', opacity: Math.min(1, bubble * 1.4) }}>
					Cut the dead air, caption every word, then add the effects.
				</div>
				{/* Reply column */}
				<div style={{ position: 'absolute', left: 36, top: 360, width: 560 }}>
					<div style={{ display: 'flex', alignItems: 'center', gap: 18, height: 60 }}>
						<div style={{ transform: `scale(${0.6 + 0.4 * markIn})`, opacity: markIn, transformOrigin: '0 50%' }}><AssistantMark size={50} /></div>
						{typing && <Dots frame={frame} />}
						{frame >= 40 && <span style={{ fontFamily: themeFonts.heading, fontSize: 40, fontWeight: 500, color: ink, letterSpacing: '-0.015em', ...materialize(reply) }}>On it.</span>}
					</div>
					<div style={{ marginTop: 34, display: 'flex', flexDirection: 'column', gap: 32 }}>
						{STEPS.map(step => {
							if (frame < step.at) return null
							const p = pop(frame, step.at)
							const done = frame >= step.at + TICK_DELAY
							return <div key={step.label} style={{ display: 'flex', alignItems: 'center', gap: 18, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * -16}px)` }}>
								{done ? <Tick t={pop(frame, step.at + TICK_DELAY)} /> : <Spinner frame={frame} />}
								<span style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.005em', color: done ? ink : MUTED }}>{step.label}</span>
							</div>
						})}
					</div>
				</div>
				{/* Composer */}
				<div style={{ position: 'absolute', left: 24, right: 24, bottom: 24, height: 100, borderRadius: 16, background: colors.cloud, border: `1px solid ${colors.navy200}`, display: 'flex', alignItems: 'center', padding: '0 18px 0 30px' }}>
					<span style={{ fontSize: 28, color: colors.navy400 }}>Reply to Claude…</span>
					<div style={{ marginLeft: 'auto', width: 64, height: 64, borderRadius: 32, background: ink, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
						<svg width={28} height={28} viewBox="0 0 24 24"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5" fill="none" stroke="#fff" strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
					</div>
				</div>
			</GlassCard>
		</GlassBlur.Provider>
		{/* The take: full frame shrinking into the attachment slot (drawn above the window, inside its bounds at rest). */}
		<div style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: 1920, transformOrigin: '0 0', transform: `translate(${vx}px, ${vy}px) scale(${s})`, borderRadius: radius / s, overflow: 'hidden', boxShadow: shrink > 0.05 ? `0 ${18 / s}px ${44 / s}px -${10 / s}px rgba(15,23,42,${0.4 * shrink})` : undefined }}>
			<ARoll from={from} />
			<div style={{ position: 'absolute', left: 22 / s, bottom: 22 / s, background: 'rgba(15,23,42,0.72)', color: '#fff', fontSize: 21 / s, fontWeight: 600, letterSpacing: '0.01em', padding: `${7 / s}px ${14 / s}px`, borderRadius: 999, opacity: progress(frame, 14, 6), display: 'flex', alignItems: 'center', gap: 8 / s }}>
				<svg width={15 / s} height={15 / s} viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" fill="#fff" /></svg>
				take-03.mp4 · 0:42
			</div>
		</div>
	</AbsoluteFill>
}

export const chatTakeoverFx: FxEntry = { id: 'chat-takeover', name: 'Chat Takeover', duration: DURATION, Component: ChatTakeover,
	sfx: [{ at: 0, sound: 'whoosh', volume: 0.4 }, { at: 12, sound: 'bubble', volume: 0.4 }, { at: 40, sound: 'bubble', volume: 0.35 }],
}
