import { Video } from '@remotion/media'
import { type CSSProperties, type FC, createContext, useContext } from 'react'
import { Img, spring, staticFile, useCurrentFrame } from 'remotion'
import type { Cue } from './sfx'

export const FX_W = 1080
export const FX_H = 1920
export const FX_FPS = 30
export const CLAUDE_ORANGE = '#D97757'
export const INK = '#111827'

/** Face geometry in 1080×1920 frame coords: x = face centre, y = top of the face box, mouthY = mouth line. */
export type Face = { x: number; y: number; mouthY: number }
export const DEFAULT_FACE: Face = { x: 540, y: 700, mouthY: 1000 }

/** The take an effect plays. `video` is the 9:16 take, `matte` the per-frame cut-out folder (make-fg.py), `sticker` the
 * baked sticker-border folder (make-sticker-mattes.py), `frames` the matte count, `face` where the face sits in the frame
 * (tools/face). `continuous`: the voice plays in sync under the effect, so effects must not jump to another moment. */
export type FxSource = { video: string; matte: string; sticker: string; frames: number; face?: Face; continuous?: boolean }
export const SAMPLE_SOURCE: FxSource = { video: 'sample/take.mp4', matte: 'sample/fg', sticker: 'sample/sticker', frames: 300, face: { x: 540, y: 640, mouthY: 900 } }
export const FxSourceContext = createContext<FxSource>(SAMPLE_SOURCE)
export const useFxSource = () => useContext(FxSourceContext)
export const useFace = () => useFxSource().face ?? DEFAULT_FACE

export type FxProps = { from: number }
export type FxEntry = { id: string; name: string; duration: number; Component: FC<FxProps>; sfx?: Cue[] }

/** Source-frame index for the current local frame, clamped to the matte range. */
export const useSrcFrame = (from: number) => Math.min(from + useCurrentFrame(), useFxSource().frames - 1)

/** The take, muted (the voice is laid once underneath the whole edit). */
export const ARoll = ({ from, style }: { from: number; style?: CSSProperties }) => (
	<Video src={staticFile(useFxSource().video)} muted trimBefore={from} objectFit="cover" style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: FX_H, ...style }} />
)

/** The person cut out of the current frame (transparent everywhere else). */
export const Cutout = ({ from, style }: { from: number; style?: CSSProperties }) => {
	const src = useSrcFrame(from)
	return <Img src={staticFile(`${useFxSource().matte}/${String(src).padStart(4, '0')}.webp`)} style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: FX_H, ...style }} />
}

/** Critically damped by default (no overshoot unless the motion carries momentum). */
export const fxSpring = (frame: number, at: number, { damping = 200, stiffness = 120, mass = 1 } = {}) =>
	spring({ frame: frame - at, fps: FX_FPS, config: { damping, stiffness, mass } })

/** A slightly bouncy spring for things that pop in (pills, stickers, badges). */
export const popSpring = (frame: number, at: number) => spring({ frame: frame - at, fps: FX_FPS, config: { damping: 13, stiffness: 180, mass: 0.6 } })

export const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
export const progress = (frame: number, start: number, duration: number) => clamp01((frame - start) / duration)

export const fonts = {
	display: "'Montserrat', sans-serif",
	ui: "'Inter', sans-serif",
	mono: "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
	hand: "'Caveat', cursive",
}
