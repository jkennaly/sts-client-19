// Player.js
// store/entity/effect/links


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

//import {forces} from '../../../services/forces'
import {Link} from './Link.js'


function Player (id, opts = {}) {
	Link.call(this, id, {
		scale: 0
	})
	this.value = 'Player'
	this.tag = 'Player Link'
	this.name = 'player'

	this.degree = 100
	this.subs = [opts.avatarId]
	this.forces = {divine: 1}

}

Player.prototype = Object.create(Link.prototype)


export {Player}