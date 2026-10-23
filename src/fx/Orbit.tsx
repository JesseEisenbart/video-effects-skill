import type { FC, ReactNode } from 'react'
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from 'remotion'
import { ARoll, Cutout, type FxEntry, type FxProps, progress, useFace } from './shared'
import { AssistantMark, colors, pop } from './theme'

// 01 Orbit: a ring of editing-tool tiles (assistant mark, cut, captions, waveform, type, play, frame, sparkle) circles
// the speaker's head on a tilted ellipse. Tiles on the far half of the ring pass behind the cut-out, tiles on the near
// half pass in front, so the ring wraps around the speaker. White app tiles with a hairline border and a soft navy
// shadow, ink glyphs, at most one blue accent per tile. Needs the cut-out and the face position (the ring is centred
// below the face).
// Motion: the ring grows out of the face on a critically damped spring and each tile materializes (scale + opacity
// together) in turn, 1.5 frames apart; a quick spin-up settles into a steady drift that never stops.
// SFX: 'cascade' at 2, under the tiles arriving (frames 2 to 13).
const DURATION = 75
const RX = 470
const RY = 150
const TILT = -10 // degrees
const TILE = 112

const glyph = (d: ReactNode, fg: string = colors.navy) => ({ fg, d })

// Tool glyphs drawn on a 48-unit grid, ink on white (one brand-blue accent per tile at most).
const GLYPHS = {
	cut: glyph(<g fill="none" strokeWidth={3.4} strokeLinecap="round"><circle cx={15} cy={33} r={6} /><circle cx={33} cy={33} r={6} /><path d="M19 28 36 9M29 28 12 9" /></g>),
	cc: glyph(<g><rect x={6} y={11} width={36} height={26} rx={7} fill="none" strokeWidth={3.2} /><text x={24} y={30.5} textAnchor="middle" fontFamily="Inter" fontWeight={800} fontSize={14} stroke="none" fill="currentColor">CC</text></g>),
	type: glyph(<text x={24} y={33} textAnchor="middle" fontFamily="Inter" fontWeight={500} fontSize={24} letterSpacing={-0.5} fill="currentColor" stroke="none">Aa</text>),
	wave: glyph(<g strokeWidth={3.6} strokeLinecap="round">{[10, 16, 22, 28, 34, 40].map((x, i) => { const h = [6, 14, 22, 12, 18, 7][i]; return <path key={x} d={`M${x - 1} ${24 - h / 2}v${h}`} /> })}</g>, colors.blue),
	play: glyph(<path d="M18 14.5v19l16-9.5z" fill="currentColor" stroke="currentColor" strokeWidth={2.4} strokeLinejoin="round" />, colors.blue),
	frame: glyph(<g fill="none" strokeWidth={3.4} strokeLinecap="round"><path d="M14 8v26h26M8 14h26v26" /></g>),
	spark: glyph(<path d="M24 8l3.6 11.4L39 23l-11.4 3.6L24 38l-3.6-11.4L9 23l11.4-3.6z" fill="currentColor" stroke="none" />),
} as const
type GlyphName = keyof typeof GLYPHS | 'assistant'

const SHADOW = '0 22px 40px -18px rgba(15,23,42,0.55), 0 3px 8px rgba(15,23,42,0.14)'

/** A white app tile (corner radius 24% of its size), hairline border, soft long navy shadow, one glyph or the assistant mark. */
const ToolTile = ({ name, size = TILE }: { name: GlyphName, size?: number }) => {
	const r = size * 0.24
	if (name === 'assistant') return <AssistantMark size={size} style={{ boxShadow: SHADOW }} />
	const body = <svg viewBox="0 0 48 48" width={size * 0.78} height={size * 0.78} style={{ position: 'absolute', left: size * 0.11, top: size * 0.11, color: GLYPHS[name].fg }} stroke="currentColor">{GLYPHS[name].d}</svg>
	return <div style={{ position: 'relative', width: size, height: size, borderRadius: r, background: '#fff', border: `1.5px solid ${colors.navy200}`, boxSizing: 'border-box', boxShadow: SHADOW }}>{body}</div>
}

const TILES: GlyphName[] = ['assistant', 'cut', 'cc', 'wave', 'type', 'play', 'frame', 'spark']

// Ring angle over time: a quick spin-up that settles into a steady drift (never stops, so the hard cut out stays alive).
const spin = (frame: number) => Math.PI * 2 * (0.32 * Easing.out(Easing.cubic)(progress(frame, 0, 26)) + frame / 150)

type Pt = { x: number, y: number }
const project = (c: Pt, theta: number, grow: number) => {
	const t = (TILT * Math.PI) / 180
	const x0 = Math.cos(theta) * RX * grow
	const y0 = Math.sin(theta) * RY * grow
	return { x: c.x + x0 * Math.cos(t) - y0 * Math.sin(t), y: c.y + x0 * Math.sin(t) + y0 * Math.cos(t), depth: Math.sin(theta) }
}

const Ring = ({ c, half, grow, opacity }: { c: Pt, half: 'back' | 'front', grow: number, opacity: number }) => {
	// Back half = the upper arc (sin < 0, further from camera), front half = the lower arc.
	const pts = Array.from({ length: 49 }, (_, i) => project(c, (half === 'back' ? Math.PI : 0) + (i / 48) * Math.PI, grow))
	return <svg width={1080} height={1920} style={{ position: 'absolute', inset: 0, opacity }}>
		<path d={pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join('')} fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth={half === 'front' ? 3 : 2.2} strokeDasharray="2 12" strokeLinecap="round" />
	</svg>
}

export const Orbit: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	const face = useFace()
	const c = { x: face.x + 8, y: face.y + 250 }
	const grow = interpolate(pop(frame, 0), [0, 1], [0.55, 1]) // the ring opens out of the face, no overshoot
	const ringIn = progress(frame, 0, 8)
	const base = spin(frame)
	const tiles = TILES.map((name, i) => {
		const theta = base + (i / TILES.length) * Math.PI * 2
		const p = project(c, theta, grow)
		const m = pop(frame, 2 + i * 1.5)
		const scale = (0.8 + 0.28 * (p.depth + 1) / 2) * (0.6 + 0.4 * m)
		const back = p.depth < 0
		const node = <div key={name} style={{ position: 'absolute', left: p.x - TILE / 2, top: p.y - TILE / 2, opacity: Math.min(1, m * 1.4), transform: `scale(${scale})`, filter: back ? `brightness(${0.86 + 0.14 * (1 + p.depth)}) blur(${(-p.depth * 1.1).toFixed(2)}px)` : undefined, zIndex: Math.round((p.depth + 1) * 100) }}>
			<ToolTile name={name} />
		</div>
		return { node, back }
	})
	return <AbsoluteFill style={{ overflow: 'hidden' }}>
		<ARoll from={from} />
		<Ring c={c} half="back" grow={grow} opacity={ringIn * 0.75} />
		<AbsoluteFill style={{ isolation: 'isolate' }}>{tiles.filter(t => t.back).map(t => t.node)}</AbsoluteFill>
		<Cutout from={from} />
		<Ring c={c} half="front" grow={grow} opacity={ringIn} />
		<AbsoluteFill style={{ isolation: 'isolate' }}>{tiles.filter(t => !t.back).map(t => t.node)}</AbsoluteFill>
	</AbsoluteFill>
}

export const orbitFx: FxEntry = { id: 'orbit', name: 'Orbit', duration: DURATION, Component: Orbit,
	sfx: [{ at: 2, sound: 'cascade', volume: 0.35 }],
}
