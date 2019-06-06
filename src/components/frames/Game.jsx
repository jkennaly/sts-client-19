// Game.jsx
// Components/Frames


import m from 'mithril'
import _ from 'lodash'
import Button from  '../elements/Button.jsx'

import Active from './active/Active.jsx'
import Self from './self/Self.jsx'
import Sense from './sense/Sense.jsx'

const Game = (vnode) => {
	return {
	view: () => <div class="frame-game">
		<Self />
		<div class="frame-main">
			<Active />
			<Sense />
		</div>
		 
    </div>

}}
export default Game;
