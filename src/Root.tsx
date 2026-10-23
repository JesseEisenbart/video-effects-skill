import { Composition } from 'remotion'
import { Edit, type EditSpec, editDuration } from './edit/Edit'
import edit from './edit/edit.json'
import { fxById, FxPreview, type FxPreviewProps } from './fx/index'
import { FxShowcase, showcaseDuration } from './fx/FxShowcase'
import { FX_FPS, FX_H, FX_W } from './fx/shared'
import './fonts'

const spec = edit as EditSpec

export const Root = () => <>
	<Composition id="FxShowcase" component={FxShowcase} width={FX_W} height={FX_H} fps={FX_FPS} durationInFrames={showcaseDuration()} />
	<Composition id="FxPreview" component={FxPreview} width={FX_W} height={FX_H} fps={FX_FPS} durationInFrames={90}
		defaultProps={{ id: 'orbit', from: 0 } satisfies FxPreviewProps}
		calculateMetadata={({ props }) => ({ durationInFrames: fxById(props.id)?.duration ?? 90 })} />
	<Composition id="ExampleEdit" component={Edit} width={FX_W} height={FX_H} fps={FX_FPS} durationInFrames={editDuration(spec)} defaultProps={{ spec }} />
</>
