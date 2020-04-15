// Link.js
// store/entity/effect/links


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

//import {forces} from '../../../services/forces'
import Effect from '../Effect.js'


function Link (id, opts = {}) {
	Effect.call(this, id, {
		scale: 0
	})
	this.value = 'Link'
	this.tag = 'Link Effect'
	this.name = 'link'

	this.degree = 0
	this.peers = []
	this.doms = []
	this.subs = []
	this.forces = {}

}

Link.prototype = Object.create(Effect.prototype)


export {Link}