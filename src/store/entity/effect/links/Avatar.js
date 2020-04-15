// Avatar.js
// store/entity/effect/links


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

//import {forces} from '../../../services/forces'
import {Link} from './Link.js'


function Avatar (id, opts = {}) {
	Link.call(this, id, {
		scale: 0
	})
	this.value = 'Avatar'
	this.tag = 'Avatar Link'
	this.name = 'avatar'

	this.degree = 100
	this.doms = [opts.playerId]
	this.forces = {divine: 1}
	this.senseChange = 'target'
}

Avatar.prototype = Object.create(Link.prototype)


export {Avatar}