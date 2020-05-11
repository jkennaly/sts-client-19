// Relocate.js
// store/effect/relocate


import _ from 'lodash'

//import {forces} from '../../../services/forces'
import Effect from '../Effect.js'


function Relocate (id, opts = {}) {
	if(!opts.newPlace) throw new Error('No Place to relocate to')
	Effect.call(this, id, {
		scale: opts.newPlace.scale,
		instant: true
	})
	this.value = 'Relocate'
	this.tag = 'Relocate Effect'
	this.name = 'relocate'

	this.newPlace = opts.newPlace
	this.display = opts.display
	this.serial = opts.serial


}

Relocate.prototype = Object.create(Effect.prototype)

/*

*/

export {Relocate}