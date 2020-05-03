// Collect.js
// scenarios/factorial/action


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import ActionClass from '../ActionClass.js'


function Collect (id, opts = {}) {
	ActionClass.call(this, id, {scale: 0, source: opts.source})
	this.value = 'Collect'
	this.tag = 'Control Entity'
	this.name = 'collect'
	this.forces = {mechanical: 1}


	this.activation = {
		energy: 0
	}

	this.action = ActionClass.prototype.actionFactory.call(this, {
		sourceEffect: 'Nothing',
		targetEffect: 'Nothing',
		sourceConnectionName: 'mover',
		targetConnectionName: 'relocated'
	})



	//prepare activation energy
	//consume energy from actor
	//convert activation enrgy into action effects

	//resolve effects to actor
	//resolve effects to targets
	//resolve effects to secondary affected

}

Collect.prototype = Object.create(ActionClass.prototype)


Collect.prototype.effectInterlock = function(effects) {
	return false
}

export default Collect