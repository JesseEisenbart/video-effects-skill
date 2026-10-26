import type { CSSProperties, FC, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolateColors, useCurrentFrame } from 'remotion'
import { ARoll, CLAUDE_ORANGE, Cutout, type FxEntry, type FxProps, FX_FPS, fonts, progress } from './shared'
import { pop } from './theme'

// 19 Glass Widgets: five light frosted iOS-style widgets float around the speaker's head. The two that overlap the head
// and shoulders (a bar chart and a progress ring) sit behind the cut-out, so the set reads as depth around the speaker,
// not stickers on top; a count, a profile card and a wide render bar sit in front. The layout is fixed and suits a
// speaker centred in frame. Everything in COPY is on-screen copy; change it to fit the video. Needs the cut-out.
// Motion: each widget materializes in turn (rise + fade + scale on the critically damped UI spring), 2 to 10, then its
// data animates: the counts run up, the bars grow, the ring fills to 100% by 50 and the render bar finishes at 64 (a
// progress bar, so linear) and turns green. A slow drift keeps them alive.
// SFX: 'cascade' at 2 (the widgets arrive), 'chime' at 50 (the ring completes).
const DURATION = 90
const INK = '#141413'
const MUTED = 'rgba(20,20,19,0.55)'
const GREEN = '#30D158'

const COPY = {
	count: { value: '21', label: 'effects', sub: 'in one skill' },
	profile: { name: 'Your name', line: 'Your title',barLabel: 'Face tracked', barValue: '100%' },
	chart: { title: 'Person mask', value: '1,714', unit: 'frames' },
	ring: { label: 'Sound synced' },
	render: { title: 'Rendering', file: 'glass-widgets.mp4', detail: '1080 × 1920 · 30 fps' },
}

const GLASS: CSSProperties = {
	position: 'absolute', boxSizing: 'border-box', borderRadius: 46, padding: 30, color: INK, fontFamily: fonts.ui,
	background: 'rgba(255,255,255,0.58)', backdropFilter: 'blur(26px) saturate(1.8)', WebkitBackdropFilter: 'blur(26px) saturate(1.8)',
	boxShadow: 'inset 0 1.5px 0 rgba(255,255,255,0.9), inset 0 0 0 1.5px rgba(255,255,255,0.5), 0 34px 60px -30px rgba(15,30,20,0.5)',
}
const ease = Easing.out(Easing.cubic)
const count = (frame: number, start: number, duration: number) => ease(progress(frame, start, duration))

const Widget = ({ frame, at, x, y, w, h, phase, children, style }: { frame: number, at: number, x: number, y: number, w: number, h: number, phase: number, children: ReactNode, style?: CSSProperties }) => {
	const p = pop(frame, at)
	const drift = Math.sin((frame / FX_FPS) * (Math.PI * 2) / 3.4 + phase) * 6 * p
	return <div style={{ ...GLASS, left: x, top: y, width: w, height: h, opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 28 + drift}px) scale(${0.92 + 0.08 * p})`, ...style }}>{children}</div>
}

/** A neutral avatar: a person silhouette on a soft grey disc. */
const Avatar = ({ size }: { size: number }) => <svg width={size} height={size} viewBox="0 0 82 82" style={{ flexShrink: 0, borderRadius: size / 2 }}>
	<defs><linearGradient id="gw-avatar" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#E9E7E3" /><stop offset="1" stopColor="#C9C6C0" /></linearGradient></defs>
	<circle cx={41} cy={41} r={41} fill="url(#gw-avatar)" />
	<circle cx={41} cy={33} r={14} fill="#fff" fillOpacity={0.9} />
	<path d="M15 76c3-15 13-24 26-24s23 9 26 24a41 41 0 0 1-52 0Z" fill="#fff" fillOpacity={0.9} />
</svg>

/** "1,714" → counts up from 0 keeping the thousands separator. */
const countUp = (value: string, t: number) => {
	const n = Number(value.replace(/,/g, ''))
	return Number.isFinite(n) ? Math.round(n * t).toLocaleString('en-US') : value
}

const BARS = [0.42, 0.58, 0.5, 0.74, 0.66, 0.88, 1] // the chart widget's shape (decorative)

export const GlassWidgets: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const ring = count(frame, 14, 36)
	const render = progress(frame, 16, 48)
	const R = 92
	const circ = 2 * Math.PI * R
	return <AbsoluteFill>
		<ARoll from={from} />
		{/* behind the speaker: these two overlap the head and shoulders */}
		<Widget frame={frame} at={6} x={48} y={560} w={330} h={330} phase={2.1}>
			<div style={{ fontSize: 26, fontWeight: 600, color: MUTED }}>{COPY.chart.title}</div>
			<div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 64, letterSpacing: '-0.03em', marginTop: 6, fontVariantNumeric: 'tabular-nums' }}>{countUp(COPY.chart.value, count(frame, 10, 30))}</div>
			<div style={{ fontSize: 24, color: MUTED, marginTop: -2 }}>{COPY.chart.unit}</div>
			<div style={{ position: 'absolute', left: 30, right: 30, bottom: 30, height: 96, display: 'flex', alignItems: 'flex-end', gap: 10 }}>
				{BARS.map((b, i) => <div key={i} style={{ flex: 1, height: `${b * 100 * ease(progress(frame, 12 + i * 2, 14))}%`, borderRadius: 6, background: i === BARS.length - 1 ? CLAUDE_ORANGE : 'rgba(20,20,19,0.78)' }} />)}
			</div>
		</Widget>
		<Widget frame={frame} at={8} x={688} y={590} w={320} h={320} phase={4.4} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
			<div style={{ position: 'relative', width: 2 * R + 20, height: 2 * R + 20 }}>
				<svg width={2 * R + 20} height={2 * R + 20} style={{ position: 'absolute', inset: 0, transform: 'rotate(-90deg)' }}>
					<circle cx={R + 10} cy={R + 10} r={R} fill="none" stroke="rgba(20,20,19,0.1)" strokeWidth={18} />
					<circle cx={R + 10} cy={R + 10} r={R} fill="none" stroke={GREEN} strokeWidth={18} strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={circ * (1 - ring)} />
				</svg>
				<div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: fonts.display, fontWeight: 800, fontSize: 50, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>{Math.round(ring * 100)}%</div>
			</div>
			<div style={{ fontSize: 25, fontWeight: 600, color: MUTED, marginTop: 14 }}>{COPY.ring.label}</div>
		</Widget>
		<Cutout from={from} />
		{/* in front: top left, above the head on the right, and across the chest */}
		<Widget frame={frame} at={2} x={56} y={200} w={300} h={300} phase={0}>
			<div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 150, lineHeight: 1, letterSpacing: '-0.05em', marginLeft: -6, fontVariantNumeric: 'tabular-nums' }}>{Math.round(Number(COPY.count.value) * count(frame, 4, 26))}</div>
			<div style={{ fontSize: 34, fontWeight: 700, marginTop: 18 }}>{COPY.count.label}</div>
			<div style={{ fontSize: 25, color: MUTED, marginTop: 4 }}>{COPY.count.sub}</div>
		</Widget>
		<Widget frame={frame} at={4} x={600} y={250} w={424} h={196} phase={1.2}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
				<Avatar size={82} />
				<div style={{ minWidth: 0 }}>
					<div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>{COPY.profile.name}</div>
					<div style={{ fontSize: 24, color: MUTED, marginTop: 2, whiteSpace: 'nowrap' }}>{COPY.profile.line}</div>
				</div>
			</div>
			<div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 21, fontWeight: 600, color: MUTED, marginTop: 18 }}><span>{COPY.profile.barLabel}</span><span style={{ color: INK }}>{COPY.profile.barValue}</span></div>
			<div style={{ height: 10, borderRadius: 5, background: 'rgba(20,20,19,0.1)', marginTop: 8, overflow: 'hidden' }}>
				<div style={{ height: '100%', width: `${100 * count(frame, 8, 26)}%`, borderRadius: 5, background: CLAUDE_ORANGE }} />
			</div>
		</Widget>
		<Widget frame={frame} at={10} x={56} y={1596} w={968} h={170} phase={3.3} style={{ padding: '26px 34px' }}>
			<div style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
				<div style={{ width: 62, height: 62, borderRadius: 16, background: INK, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
					<svg width={30} height={30} viewBox="0 0 24 24"><path d="M8 5.5v13l10.5-6.5z" fill="#fff" /></svg>
				</div>
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ fontSize: 28, fontWeight: 700 }}>{COPY.render.title}</div>
					<div style={{ fontSize: 22, color: MUTED, marginTop: 2, fontFamily: fonts.mono }}>{COPY.render.file} · {COPY.render.detail}</div>
				</div>
				<div style={{ fontFamily: fonts.display, fontWeight: 800, fontSize: 44, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{Math.round(render * 100)}%</div>
			</div>
			<div style={{ height: 10, borderRadius: 5, background: 'rgba(20,20,19,0.1)', marginTop: 18, overflow: 'hidden' }}>
				<div style={{ height: '100%', width: `${100 * render}%`, borderRadius: 5, background: interpolateColors(frame, [64, 68], [INK, GREEN]) }} />
			</div>
		</Widget>
	</AbsoluteFill>
}

export const glassWidgetsFx: FxEntry = { id: 'glass-widgets', name: 'Glass Widgets', duration: DURATION, Component: GlassWidgets,
	sfx: [{ at: 2, sound: 'cascade', volume: 0.35 }, { at: 50, sound: 'chime', volume: 0.35 }],
}
