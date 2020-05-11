// Nothing.js
// store/effect/nothing


import _ from 'lodash'

//import {forces} from '../../../services/forces'
import Effect from '../Effect.js'


function Nothing (id, opts = {}) {
	Effect.call(this, id, {
		scale: 0,
		instant: true
	})
	this.value = 'Nothing'
	this.tag = 'Nothing Effect'
	this.name = 'nothing'
}

Nothing.prototype = Object.create(Effect.prototype)


export {Nothing}