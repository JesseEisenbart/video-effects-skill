import { loadFont } from '@remotion/fonts'
import { staticFile } from 'remotion'

// All three faces are variable fonts under the SIL Open Font License (see public/fonts/).
export const fontsReady = Promise.all([
	loadFont({ family: 'Inter', url: staticFile('fonts/Inter.ttf'), weight: '100 900' }),
	loadFont({ family: 'Montserrat', url: staticFile('fonts/Montserrat.ttf'), weight: '100 900' }),
	loadFont({ family: 'Caveat', url: staticFile('fonts/Caveat.ttf'), weight: '400 700' }),
])
