// Chemical.js
// store/sense/forces


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import Sense from '../Sense.js'


function Chemical (id, opts = {}) {
	Sense.call(this, id, {
		scale: opts.scale ? opts.scale : 0, 
		forces: {chemical: opts.strength ? opts.strength : 1}
	})
	this.value = opts.value ? opts.value : 'Chemical'
	this.tag = opts.tag ? opts.tag : 'Sense Chemical Entities'
	this.name = opts.name ? opts.name : 'chemical'
}

Chemical.prototype = Object.create(Sense.prototype)


export {Chemical}