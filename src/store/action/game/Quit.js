// Quit.js
// store/action/player


import m from 'mithril'
import _ from 'lodash'
import ActionClass from '../ActionClass.js'



function Quit (id, opts = {}) {
	ActionClass.call(this, id, {scale: 0, source: opts.source})
	this.value = 'Quit'
	this.tag = 'Control Entity'
	this.name = 'quit'
	this.forces = {}
	this.effective = false

	this.action = () => {
		m.route.set('/launcher')
		
	} 




	//prepare activation energy
	//consume energy from actor
	//convert activation enrgy into action effects

	//resolve effects to actor
	//resolve effects to targets
	//resolve effects to secondary affected

}

Quit.prototype = Object.create(ActionClass.prototype)


export default Quit