import { Video } from '@remotion/media'
import { type FC, useCallback, useRef } from 'react'
import { AbsoluteFill, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from 'remotion'
import type { FxEntry, FxProps } from './shared'
import { FX_H, FX_W, progress, useFace, useFxSource } from './shared'

// 13 Zoom Through Cut: a punch-in that accelerates into the face with a radial zoom blur, cuts on the peak of the blur
// to a different moment of the take (12 s later, or 12 s earlier if that would run off the end), and decelerates back out
// of the blur to a clean frame. With a continuous source (voice in sync) the cut lands on the same moment, so the lips
// still match. Needs the face position; no cut-out.
// Render cost: each half decodes the take once. The <Video> draws the sharp shot as usual and hands every decoded frame
// (onVideoFrame) to a quarter-res 270x480 canvas, where the radial streak is built by drawing that frame six times at
// growing scales about the face. The canvas is scaled up 4x and masked so the face stays sharp while the edges stream.
// Motion: zoom in 4 to 20 (ease in, 1x to 4.2x), cut at 20 with a short white bloom, zoom out 20 to 38 (3.6x to 1x).
// SFX: 'whip' at 10 (the punch-in).

const IN_START = 4
const CUT = 20
const OUT_LEN = 18
const DUR = 60
const DS = 4 // streak canvas downscale
const CW = FX_W / DS
const CH = FX_H / DS
const COPIES = 6

const ZoomLayer = ({ from, scale, blur }: { from: number; scale: number; blur: number }) => {
	const { video } = useFxSource()
	const face = useFace()
	const Z = { x: face.x, y: face.y + 100 } // between the eyes
	const zRef = useRef(Z)
	zRef.current = Z
	const canvas = useRef<HTMLCanvasElement>(null)
	const amount = useRef(blur)
	amount.current = blur
	const scratch = useRef<{ small: HTMLCanvasElement, streak: HTMLCanvasElement } | null>(null)
	const onFrame = useCallback((img: CanvasImageSource) => {
		const ctx = canvas.current?.getContext('2d')
		if (!ctx) return
		const b = amount.current
		const Z = zRef.current
		ctx.clearRect(0, 0, CW, CH)
		if (b <= 0.02) return
		if (!scratch.current) {
			const mk = () => Object.assign(document.createElement('canvas'), { width: CW, height: CH })
			scratch.current = { small: mk(), streak: mk() }
		}
		const { small, streak } = scratch.current
		// 1) downscale the decoded frame once
		const sctx = small.getContext('2d')!
		sctx.drawImage(img, 0, 0, CW, CH)
		// 2) radial streak: equal-weight average of the copies (copy k drawn at alpha 1/(k+1) over the ones before it)
		const tctx = streak.getContext('2d')!
		tctx.clearRect(0, 0, CW, CH)
		for (let k = 0; k < COPIES; k++) {
			const s = 1 + 0.085 * k * b
			tctx.globalAlpha = 1 / (k + 1)
			tctx.drawImage(small, Z.x / DS * (1 - s), Z.y / DS * (1 - s), CW * s, CH * s)
		}
		tctx.globalAlpha = 1
		// 3) one small gaussian to smooth the steps between copies
		ctx.filter = `blur(${(1 + 2.2 * b).toFixed(2)}px)`
		ctx.drawImage(streak, 0, 0)
		ctx.filter = 'none'
	}, [])
	const on = blur > 0.02
	// mask radii are in screen pixels, so divide out the layer's zoom
	const mask = `radial-gradient(circle at ${Z.x}px ${Z.y}px, transparent ${(70 + 90 * (1 - blur)) / scale}px, black ${470 / scale}px)`
	return <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: `${Z.x}px ${Z.y}px` }}>
		<Video src={staticFile(video)} muted trimBefore={from} objectFit="cover" onVideoFrame={onFrame} style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: FX_H }} />
		<canvas ref={canvas} width={CW} height={CH} style={{ position: 'absolute', left: 0, top: 0, width: FX_W, height: FX_H, opacity: on ? Math.min(1, blur * 1.6) : 0, maskImage: mask, WebkitMaskImage: mask }} />
	</AbsoluteFill>
}

export const ZoomThroughCut: FC<FxProps> = ({ from }) => {
	const frame = useCurrentFrame()
	// Second moment of the take: 12 s later, or 12 s earlier if that would run off the end.
	// With the voice in sync (continuous source) the cut stays on the same moment so the lips still match.
	const { frames, continuous } = useFxSource()
	const face = useFace()
	const Z = { x: face.x, y: face.y + 100 }
	const from2 = continuous ? from : from + 360 + DUR < frames ? from + 360 : Math.max(0, from - 360)
	const inP = Easing.in(Easing.cubic)(progress(frame, IN_START, CUT - IN_START))
	const inScale = interpolate(inP, [0, 1], [1, 4.2])
	const inBlur = Easing.in(Easing.quad)(progress(frame, IN_START + 4, CUT - IN_START - 4))
	const outP = Easing.out(Easing.cubic)(progress(frame, CUT, OUT_LEN))
	const outScale = interpolate(outP, [0, 1], [3.6, 1])
	const outBlur = 1 - Easing.out(Easing.quad)(progress(frame, CUT, OUT_LEN - 4))
	// A soft white bloom on the cut: peaks on the cut frame, gone 3 frames later.
	const flash = interpolate(frame, [CUT - 2, CUT, CUT + 3], [0, 0.3, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
	return (
		<AbsoluteFill style={{ background: '#F6F6F7', overflow: 'hidden' }}>
			<Sequence durationInFrames={CUT} layout="none">
				<ZoomLayer from={from} scale={inScale} blur={inBlur} />
			</Sequence>
			<Sequence from={CUT} layout="none">
				<ZoomLayer from={from2 + CUT} scale={outScale} blur={outBlur} />
			</Sequence>
			{flash > 0 && <AbsoluteFill style={{ background: `radial-gradient(60% 45% at ${Z.x}px ${Z.y}px, rgba(255,255,255,${flash}), rgba(255,255,255,${flash * 0.5}))` }} />}
		</AbsoluteFill>
	)
}

export const zoomThroughCutFx: FxEntry = { id: 'zoom-through-cut', name: 'Zoom Through Cut', duration: DUR, Component: ZoomThroughCut,
	sfx: [{ at: 10, sound: 'whip', volume: 0.35 }],
}
