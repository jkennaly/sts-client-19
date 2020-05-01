// Mechanical.js
// store/profile/forces


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import Profile from '../Profile.js'


function Mechanical (id, opts = {}) {
	Profile.call(this, id, {
		scale: 0
	})
	this.value = 'Mechanical'
	this.tag = 'Mechanical Profile'
	this.name = 'mechanical'

	this.forces = {mechanical: 1}
	this.sense = opts.sense ? opts.sense : 1
	this.target = opts.target ? opts.target : 1
	this.action = opts.action ? opts.action : 1

	///console.dir('Mechanical Profile', this, opts)
}

Mechanical.prototype = Object.create(Profile.prototype)


export {Mechanical}