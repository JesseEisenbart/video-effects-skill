import type { FC } from 'react'
import { Easing, interpolate, useCurrentFrame } from 'remotion'
import { StudioScene } from './GreenScreen'
import { ARoll, Cutout, FX_H, FX_W, type FxEntry, type FxProps, progress } from './shared'

// 15 Frame Break: picks up on the grey scene Green Screen ends on. Cracks race out across it behind the speaker (frame 5)
// with a brief building tremor, then it shatters (frame 14): most shards fall away behind the speaker, a few fly past the
// lens in front, and the real room is underneath. Shading is a cheap white/ink polygon tint per shard (no per-shard
// filters) and the cracks are drawn for a light surface (ink hairline under a white line). Shard layout: rays from a
// fixed impact point C, cut by two jittered rings, full frame. Needs the cut-out.
// SFX: 'crack' at 5, 'shatter' at 14.
const CRACK = 5
const BREAK = 14
const C = { x: 770, y: 560 }

const rand = (i: number) => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x) }
type Pt = { x: number, y: number }
const N = 13
const ANGLES = Array.from({ length: N }, (_, i) => (i + 0.55 * (rand(i) - 0.5)) * Math.PI * 2 / N)
const edgeT = (a: number) => {
	const dx = Math.cos(a), dy = Math.sin(a)
	return Math.min(dx > 0 ? (FX_W - C.x) / dx : dx < 0 ? -C.x / dx : Infinity, dy > 0 ? (FX_H - C.y) / dy : dy < 0 ? -C.y / dy : Infinity)
}
const ray = (a: number, t: number): Pt => ({ x: C.x + Math.cos(a) * t, y: C.y + Math.sin(a) * t })
// Two rings, placed as a fraction of the distance to the frame edge along each ray so they always stay inside.
const R1 = ANGLES.map((a, i) => ray(a, Math.min(edgeT(a) * 0.85, 120 + 90 * rand(i + 40))))
const R2 = ANGLES.map((a, i) => ray(a, edgeT(a) * (0.4 + 0.2 * rand(i + 60))))
const EDGE = ANGLES.map(a => ray(a, edgeT(a)))
const norm = (a: number) => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)
const CORNERS = [{ x: 0, y: 0 }, { x: FX_W, y: 0 }, { x: FX_W, y: FX_H }, { x: 0, y: FX_H }].map(p => ({ ...p, a: norm(Math.atan2(p.y - C.y, p.x - C.x)) }))
const SHARDS: Pt[][] = ANGLES.flatMap((a0, i) => {
	const j = (i + 1) % N
	const a1 = j === 0 ? ANGLES[0] + Math.PI * 2 : ANGLES[j]
	const span = (a: number) => { const d = norm(a - norm(a0)); return d > 0 && d < a1 - a0 }
	const corners = CORNERS.filter(c => span(c.a)).sort((p, q) => norm(p.a - norm(a0)) - norm(q.a - norm(a0)))
	// split the mid band at a jittered point on its leading edge so the pieces are not all wedge-shaped
	const f = 0.35 + 0.3 * rand(i + 90)
	const m0 = { x: R1[i].x + (R2[i].x - R1[i].x) * f, y: R1[i].y + (R2[i].y - R1[i].y) * f }
	return [[C, R1[i], R1[j]], [R1[i], m0, R1[j]], [m0, R2[i], R2[j], R1[j]], [R2[i], EDGE[i], ...corners, EDGE[j], R2[j]]]
})
const centroid = (pts: Pt[]) => ({ x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length })
const EDGES: [Pt, Pt][] = ANGLES.flatMap((_, i) => {
	const j = (i + 1) % N
	return [[C, R1[i]], [R1[i], R2[i]], [R2[i], EDGE[i]], [R1[i], R1[j]], [R2[i], R2[j]]] as [Pt, Pt][]
})

// A few small shards from around the impact fly toward the lens in front of the speaker; the rest fall away behind them.
const isFront = (i: number) => i % 4 === 0 && Math.floor(i / 4) % 2 === 0

const Shard = ({ pts, i, t }: { pts: Pt[], i: number, t: number }) => {
	const c = centroid(pts)
	const len = Math.hypot(c.x - C.x, c.y - C.y) || 1
	const front = isFront(i)
	const speed = (front ? 26 : 10) + 14 * rand(i + 80)
	const k = t * (1 - 0.01 * t)
	const dx = (c.x - C.x) / len * speed * k
	const dy = (c.y - C.y) / len * speed * k + (front ? 0.4 : 2.6) * t * t
	const rot = (rand(i + 120) - 0.5) * (front ? 60 : 50) * t / 10
	const scale = front ? 1 + 0.18 * t : 1 - 0.022 * Math.min(t, 30)
	const opacity = front ? 1 - progress(t, 3, 6) : 1 - progress(t, 12, 8)
	const poly = pts.map(p => `${p.x}px ${p.y}px`).join(', ')
	const shade = 0.22 * Math.sin(i * 1.9 + t * 0.5) * Math.min(1, t / 3)
	return <div style={{ position: 'absolute', inset: 0, transformOrigin: `${c.x}px ${c.y}px`, transform: `translate(${dx}px, ${dy}px) rotate(${rot}deg) scale(${scale})`, opacity }}>
		<div style={{ position: 'absolute', inset: 0, clipPath: `polygon(${poly})` }}><StudioScene /></div>
		<svg width={FX_W} height={FX_H} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
			{/* each pane catches the light differently as it turns: a white or ink tint, plus a bright cut edge */}
			<polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill={shade > 0 ? '#FFFFFF' : '#0F172A'} fillOpacity={Math.abs(shade)} stroke="rgba(255,255,255,0.95)" strokeWidth={3} strokeLinejoin="round" />
			<polygon points={pts.map(p => `${p.x},${p.y}`).join(' ')} fill="none" stroke="rgba(15,23,42,0.18)" strokeWidth={1.5} strokeLinejoin="round" transform="translate(1.5 1.5)" />
		</svg>
	</div>
}

export const FrameBreak: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const t = frame - BREAK
	const draw = Easing.out(Easing.cubic)(progress(frame, CRACK, BREAK - CRACK))
	// a short, building tremor while the glass gives (the one place a shake is the effect itself)
	const shake = frame >= CRACK && frame < BREAK ? (frame - CRACK + 1) * 1.1 : 0
	const sx = shake * Math.sin(frame * 2.3), sy = shake * Math.cos(frame * 3.1)
	const flash = interpolate(frame, [BREAK, BREAK + 1, BREAK + 6], [0, 0.85, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
	// The real room settles in from slightly dark/zoomed once the glass is gone.
	const settle = Easing.out(Easing.cubic)(progress(frame, BREAK, 24))
	return <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#000' }}>
		<div style={{ position: 'absolute', inset: 0, transform: `scale(${1.04 - 0.04 * settle})` }}><ARoll from={from} /></div>
		<div style={{ position: 'absolute', inset: 0, background: '#0F172A', opacity: 0.3 * (1 - settle) }} />
		{frame < BREAK && <div style={{ position: 'absolute', inset: 0, transform: `translate(${sx}px, ${sy}px)` }}>
			<StudioScene />
			{draw > 0 && <svg width={FX_W} height={FX_H} style={{ position: 'absolute', inset: 0 }}>
				{EDGES.map(([a, b], i) => {
					// cracks travel outward: segments nearer the impact draw first
					const d0 = Math.hypot(a.x - C.x, a.y - C.y) / 1500
					const p = Math.min(1, Math.max(0, (draw - d0 * 0.6) / 0.5))
					if (p <= 0) return null
					const x2 = a.x + (b.x - a.x) * p, y2 = a.y + (b.y - a.y) * p
					// on a light surface a crack reads as a dark hairline with a bright refracted edge beside it
					return <g key={i} strokeLinecap="round">
						<line x1={a.x + 1.5} y1={a.y + 1.5} x2={x2 + 1.5} y2={y2 + 1.5} stroke="rgba(15,23,42,0.45)" strokeWidth={2.5} />
						<line x1={a.x} y1={a.y} x2={x2} y2={y2} stroke="#FFFFFF" strokeWidth={3} />
					</g>
				})}
				<circle cx={C.x} cy={C.y} r={14 * draw} fill="#FFFFFF" stroke="rgba(15,23,42,0.35)" strokeWidth={2} />
			</svg>}
		</div>}
		{frame >= BREAK && t < 22 && SHARDS.map((pts, i) => isFront(i) ? null : <Shard key={i} pts={pts} i={i} t={t} />)}
		<Cutout from={from} />
		{frame >= BREAK && t < 12 && SHARDS.map((pts, i) => isFront(i) ? <Shard key={i} pts={pts} i={i} t={t} /> : null)}
		{flash > 0 && <div style={{ position: 'absolute', left: C.x - 700, top: C.y - 700, width: 1400, height: 1400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(220,235,255,0.6) 30%, rgba(255,255,255,0) 70%)', opacity: flash }} />}
	</div>
}

export const frameBreakFx: FxEntry = { id: 'frame-break', name: 'Frame Break', duration: 66, Component: FrameBreak,
	sfx: [{ at: 5, sound: 'crack', volume: 0.45 }, { at: 14, sound: 'shatter', volume: 0.45 }],
}
