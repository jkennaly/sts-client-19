// Biological.js
// store/sense/forces


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import Sense from '../Sense.js'


function Biological (id, opts = {}) {
	Sense.call(this, id, {
		scale: opts.scale ? opts.scale : 0, 
		forces: {biological: opts.strength ? opts.strength : 1}
	})
	this.value = opts.value ? opts.value : 'Biological'
	this.tag = opts.tag ? opts.tag : 'Sense Biological Entities'
	this.name = opts.name ? opts.name : 'biological'
}

Biological.prototype = Object.create(Sense.prototype)


export {Biological}