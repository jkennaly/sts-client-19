// Electrical.js
// store/profile/forces


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import Profile from '../Profile.js'


function Electrical (id, opts = {}) {
	Profile.call(this, id, {
		scale: 0
	})
	this.value = 'Electrical'
	this.tag = 'Electrical Profile'
	this.name = 'electrical'

	this.forces = {electrical: 1}
	this.sense = opts.sense ? opts.sense : 1
	this.target = opts.target ? opts.target : 1
	this.action = opts.action ? opts.action : 1

	///console.dir('Electrical Profile', this, opts)
}

Electrical.prototype = Object.create(Profile.prototype)


export {Electrical}