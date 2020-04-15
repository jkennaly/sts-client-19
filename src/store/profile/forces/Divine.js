// Divine.js
// store/profiler/forces


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import Profile from '../Profile.js'


function Divine (id, opts = {}) {
	Profile.call(this, id, {
		scale: 0
	})
	this.value = 'Divine'
	this.tag = 'Divine Profile'
	this.name = 'divine'

	this.forces = {divine: 1}
	this.sense = opts.sense ? opts.sense : 1
	this.target = opts.target ? opts.target : 1
	this.action = opts.action ? opts.action : 1

	///console.dir('Divine Profile', this, opts)
}

Divine.prototype = Object.create(Profile.prototype)


export {Divine}