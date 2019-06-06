// Launcher.jsx
// Components/Launcher


import m from 'mithril'
import _ from 'lodash'

import Button from  '../elements/Button.jsx'

const newGame = e => m.route.set('/game')

const Launcher = (vnode) => {
	return {
		//onupdate: () => console.log('Launcher update'),
	view: () => <div class="main-stage">
		<Button buttonName={`New Game`} action={newGame} />

	</div>
}}
export default Launcher;
