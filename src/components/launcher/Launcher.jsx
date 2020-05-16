// Launcher.jsx
// Components/Launcher


import m from 'mithril'
import _ from 'lodash'

import Button from  '../elements/Button.jsx'

const newGame = e => m.route.set('/game')
const settings = e => m.route.set('/settings')

const Launcher = {
		//oncreate: console.log('Launched'),
		//onupdate: () => console.log('Launcher update'),
		view: () => <div class="main-stage">
			<Button buttonName={`New Game`} action={newGame} />
			<Button buttonName={`Settings`} action={settings} />
			<Button buttonName={`Quantize Site`} />

		</div>
}
export default Launcher;
