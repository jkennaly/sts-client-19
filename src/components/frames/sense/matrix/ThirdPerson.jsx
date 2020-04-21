// ThirdPerson.jsx
// Components/Frames/Sense

import m from 'mithril'
import _ from 'lodash'


import Game from '../../../../vendor/create-a-3d-rpg-game-with-threejs/losttreasure/v4/game'


const ThirdPerson = {
	oncreate ({dom}) {
		const game = new Game(dom);
		window.game = game;//For debugging only
	},
	view: ({attrs}) => <div class="sts-canvas-wrapper">
		<div id="message">
			<p id="message_text"></p>
			<button id="message_ok">OK</button>
		</div>
		<div id="overlay"></div>
        <button id="sfx-btn"><i class="fas fa-volume-up"></i></button>
		<button id="camera-btn"><i class="fas fa-camera"></i></button>
		<button id="action-btn"><i class="fas fa-hand-point-up"></i></button>
		<button id="briefcase-btn"><i class="fas fa-briefcase"></i></button>
        <div id="briefcase">
            <ul>
                <li><a href="#"><img></img></a></li>
                <li><a href="#"><img></img></a></li>
                <li><a href="#"><img></img></a></li>
            </ul>
        </div>
	</div>
}
export default ThirdPerson;