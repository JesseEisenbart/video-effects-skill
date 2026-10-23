import { type CSSProperties, type ReactNode, createContext, useContext } from 'react'
import { AbsoluteFill, spring, useCurrentFrame } from 'remotion'
import { FX_FPS } from './shared'

export const colors = {
	navy: '#0F172A',
	navy700: '#334155',
	navy500: '#526078',
	navy400: '#94A3B8',
	navy200: '#E2E8F0',
	navy100: '#F1F5F9',
	blue: '#2563EB',
	blue100: '#DBEAFE',
	blue50: '#EFF6FF',
	mint: '#A7F3D0',
	mintText: '#047857',
	cloud: '#F8FAFC',
	white: '#FFFFFF',
} as const

export const themeFonts = {
	heading: "'Inter', sans-serif",
	body: "'Inter', sans-serif",
} as const

export const ink = '#111827'
export const green = '#15803D'

/** Critically damped UI spring (response ≈ 0.35 s): starts moving on its first frame, settles in ~12 frames. */
export const pop = (frame: number, start: number) => spring({ frame: frame - start, fps: FX_FPS, config: { stiffness: 322, damping: 36, mass: 1 } })
/** Cards arrive as a material: rise, fade and scale up together. */
export const materialize = (p: number) => ({ opacity: Math.min(1, p * 1.4), transform: `translateY(${(1 - p) * 20}px) scale(${0.96 + 0.04 * p})` })

/** Glass cards on a flat backdrop can switch the frosted blur off (it adds nothing there and costs render time). */
export const GlassBlur = createContext(true)

export const GlassCard = ({ children, style, innerStyle }: { children: ReactNode; style?: CSSProperties; innerStyle?: CSSProperties }) => {
	const blur = useContext(GlassBlur)
	return <div style={{ background: 'rgba(255,255,255,0.38)', backdropFilter: blur ? 'blur(20px)' : undefined, outline: '1.5px solid rgba(255,255,255,0.9)', borderRadius: 24, padding: 12, boxShadow: '0 30px 80px -40px rgba(15,23,42,0.35)', ...style }}>
		<div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 16, boxShadow: '0 18px 50px -35px rgba(15,23,42,0.35)', ...innerStyle }}>
			{children}
		</div>
	</div>
}

const BLOBS = [
	{ x: 210, y: 170, size: 900, color: '#E9EAEC', opacity: 0.9, period: 11 },
	{ x: 900, y: 290, size: 900, color: '#DFE1E4', opacity: 0.7, period: 7 },
	{ x: 150, y: 910, size: 850, color: '#D4D6DA', opacity: 0.7, period: 6 },
	{ x: 800, y: 780, size: 1000, color: '#C9CCD1', opacity: 0.35, period: 8 },
]

/** Light grey backdrop: slow drifting blobs under a faint dot grid. */
export const Backdrop = () => {
	const frame = useCurrentFrame()
	return (
		<AbsoluteFill style={{ background: '#F6F6F7', overflow: 'hidden' }}>
			<AbsoluteFill style={{ filter: 'blur(80px)' }}>
				{BLOBS.map((blob, i) => {
					const phase = frame / FX_FPS / blob.period * Math.PI * 2
					return <div key={i} style={{ position: 'absolute', left: blob.x - blob.size / 2, top: blob.y - blob.size / 2, width: blob.size, height: blob.size, borderRadius: '50%', background: `radial-gradient(circle, ${blob.color} 0%, ${blob.color} 25%, transparent 72%)`, opacity: blob.opacity, transform: `translate(${Math.sin(phase + i * 1.7) * 95}px, ${Math.cos(phase + i * 0.9) * 70}px)` }} />
				})}
			</AbsoluteFill>
			<AbsoluteFill style={{ backgroundImage: 'radial-gradient(#34363A 0.9px, transparent 0.9px)', backgroundSize: '16px 16px', opacity: 0.06 }} />
		</AbsoluteFill>
	)
}

/** A neutral assistant mark (a four-point sparkle on a rounded tile), used wherever a chat or tool needs an avatar. */
export const AssistantMark = ({ size, dark = false, style }: { size: number; dark?: boolean; style?: CSSProperties }) => (
	<div style={{ width: size, height: size, borderRadius: size * 0.24, flexShrink: 0, background: dark ? '#2A2927' : colors.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
		<svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24"><path d="M12 2C12.8 8 16 11.2 22 12 16 12.8 12.8 16 12 22 11.2 16 8 12.8 2 12 8 11.2 11.2 8 12 2Z" fill="#fff" /></svg>
	</div>
)
