// Mechanical.js
// store/sense/forces


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import Sense from '../Sense.js'


function Mechanical (id, opts = {}) {
	Sense.call(this, id, {
		scale: opts.scale ? opts.scale : 0, 
		forces: {mechanical: opts.strength ? opts.strength : 1}
	})
	this.value = opts.value ? opts.value : 'Mechanical'
	this.tag = opts.tag ? opts.tag : 'Sense Mechanical Entities'
	this.name = opts.name ? opts.name : 'mechanical'
}

Mechanical.prototype = Object.create(Sense.prototype)


export {Mechanical}