// Inspire.js
// store/action/player


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import ActionClass from '../ActionClass.js'

import {Avatar} from '../../entity/effect/links/Avatar'
import {Player} from '../../entity/effect/links/Player'


function Inspire (id, opts = {}) {
	ActionClass.call(this, id, {scale: 0, source: opts.source})
	this.value = 'Inspire'
	this.tag = 'Control Entity'
	this.name = 'inspire'
	this.forces = {divine: 1}

	this.action = (engine) => targetId => {
		this.effects = {
			source: new Player(undefined, {avatarId: targetId}),
			target: new Avatar(undefined, {playerId: _.get(opts, 'source.id')})
		}	
		engine.queue.add([{action: this, targetIds: [targetId]}])
		
	} 

	this.activation = {
		energy: 0
	}



	//prepare activation energy
	//consume energy from actor
	//convert activation enrgy into action effects

	//resolve effects to actor
	//resolve effects to targets
	//resolve effects to secondary affected

}

Inspire.prototype = Object.create(ActionClass.prototype)

Inspire.prototype.effectInterlock = function(effects) {
	return effects.some(e => e.value === 'Avatar')
}

export default Inspire