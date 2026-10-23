// Stills of one effect. usage: node scripts/fx-stills.mjs <outDir> <effectId> <from> <frame,frame,...> [public/takes/<name>/source.json]
// Bundles once (public/ symlinked, never copied) and deletes the bundle afterwards.
import fs from 'node:fs'
import path from 'node:path'
import { bundle } from '@remotion/bundler'
import { renderStill, selectComposition } from '@remotion/renderer'

const [outDir, id, from = '0', frames = '0,15,30,45', sourceJson] = process.argv.slice(2)
if (!outDir || !id) throw new Error('usage: node scripts/fx-stills.mjs <outDir> <effectId> [from] [frame,frame,...]')
fs.mkdirSync(outDir, { recursive: true })
const serveUrl = await bundle({ entryPoint: path.resolve('src/index.ts'), symlinkPublicDir: true })
try {
	const inputProps = { id, from: Number(from), ...(sourceJson ? { source: JSON.parse(fs.readFileSync(sourceJson, 'utf8')) } : {}) }
	const composition = await selectComposition({ serveUrl, id: 'FxPreview', inputProps })
	for (const f of frames.split(',')) {
		const output = path.join(outDir, `${id}-f${f}.jpg`)
		await renderStill({ serveUrl, composition, inputProps, frame: Number(f), scale: 0.5, output, imageFormat: 'jpeg', jpegQuality: 85 })
		console.log(output)
	}
} finally { fs.rmSync(serveUrl, { recursive: true, force: true }) }
