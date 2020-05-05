// Move.js
// store/action/reposition


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import ActionClass from '../ActionClass.js'



function Move (id, opts = {}) {
	ActionClass.call(this, id, {scale: 0, source: opts.source})
	this.value = 'Move'
	this.tag = 'Reposition Entity'
	this.name = 'move'
	this.forces = {mechanical: 1}
	this.display = true


	this.activation = {
		energy: 0
	}

	this.action = ActionClass.prototype.actionFactory.call(this, {
		sourceEffect: 'Nothing',
		targetEffect: 'Reposition',
		sourceConnectionName: 'moved',
		targetConnectionName: 'mover'
		/*
		targetValue: {
			reference: opts.reference,
			coords: opts.coords,
			display: opts.display,
			serial: ++serial
		}
		*/
	})

	//prepare activation energy
	//consume energy from actor
	//convert activation enrgy into action effects

	//resolve effects to actor
	//resolve effects to targets
	//resolve effects to secondary affected

}

Move.prototype = Object.create(ActionClass.prototype)


Move.prototype.effectInterlock = function(effects) {
	return false
}

/*

Move.prototype.action = function (engine) { return targetId => {
	this.effects = {
		source: new this.effects.LinkPlayer(undefined, {avatarId: targetId}),
		target: new this.effects.LinkAvatar(undefined, {playerId: this.source.id})
	}	
	engine.queue.add([{action: this, targetIds: [targetId]}])
	
}}

*/

export default Move