// ThirdPerson.jsx
// Components/Frames/Sense

import m from 'mithril'
import _ from 'lodash'


import RPG from '../../../../services/displays/rpg/RPG'


const ThirdPerson = {
	oncreate ({dom, attrs}) {
		const rpg = new RPG({
			container: dom,
			scenario: attrs.scenario,
			engine: attrs.engine,
			place: attrs.place,
			sensor: attrs.sensor
		})
		window.rpg = rpg;//For debugging only
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
        {
        	_.get(
	        	attrs.engine.getById(attrs.sensor.id)[0], //sensor
	        	'briefcase.contents',
	        	[]
        	)
        	.concat([''])
        	
			.reduce((pv, cv, i, arr) => {
					if((i + 1) > attrs.sensor.briefcase.slots) return pv
				if((i + 1) < arr.length) return [...pv, cv]
				//console.dir('ThirdPerson briefcase infill', attrs.sensor.briefcase.slots, arr.length)
				return [...pv, cv, ...Array(attrs.sensor.briefcase.slots - arr.length).map(x => '')]
			}, [])
			.map(src => src ? <li><img src={src}></img></li> : <li><img></img></li>)

	}
            </ul>
        </div>
	</div>,
	onremove: () => rpg.stopSound()
}
export default ThirdPerson;