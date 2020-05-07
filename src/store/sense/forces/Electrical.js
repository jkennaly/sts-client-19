// Electrical.js
// store/sense/forces


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import Sense from '../Sense.js'


function Electrical (id, opts = {}) {
	Sense.call(this, id, _.assign({}, opts, {
			scale: opts.scale ? opts.scale : 0, 
			forces: {electrical: opts.strength ? opts.strength : 1}
		}))
	this.value = opts.value ? opts.value : 'Electrical'
	this.tag = opts.tag ? opts.tag : 'Sense Electrical Entities'
	this.name = opts.name ? opts.name : 'electrical'
	this.places = opts.places ? opts.places : this.places
	this.defaultView = 'voxel'
}

Electrical.prototype = Object.create(Sense.prototype)


export {Electrical}