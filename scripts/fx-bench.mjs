// Times every effect: renders its first 24 frames through FxPreview and reports render fps.
// usage: node scripts/fx-bench.mjs <outDir> [concurrency]
import fs from 'node:fs'
import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { renderMedia, selectComposition } from '@remotion/renderer'

// Same order as FX_ALL in src/fx/index.tsx.
const EFFECT_IDS = ['orbit', 'chat-takeover', 'frame-escape', 'snap-zoom', 'checklist-pop', 'headline-storm', 'zoom-portal', 'growth-curve', 'broll-overlay',
	'paper-cutout', 'magazine-cover', 'liquid-glass', 'zoom-through-cut', 'green-screen', 'frame-break', 'digital-zoom', 'phone-mockup', 'checklist-tally']
const [outDir = 'out/bench', conc = '8'] = process.argv.slice(2)
fs.mkdirSync(outDir, { recursive: true })
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), symlinkPublicDir: true })
try {
	for (const id of EFFECT_IDS) {
		const inputProps = { id, from: 0 }
		const composition = await selectComposition({ serveUrl, id: 'FxPreview', inputProps })
		const t = Date.now()
		await renderMedia({ serveUrl, composition, inputProps, codec: 'h264', frameRange: [0, 23], concurrency: Number(conc), outputLocation: path.join(outDir, `${id}.mp4`), logLevel: 'error' })
		console.log(`${id.padEnd(18)} ${(24 / ((Date.now() - t) / 1000)).toFixed(1)} fps`)
	}
} finally { fs.rmSync(serveUrl, { recursive: true, force: true }) }
