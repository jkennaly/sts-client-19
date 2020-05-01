// Divine.js
// store/entity/discrete

import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import Entity from '../Entity'
import Inspire from '../../action/player/Inspire'
function Divine (id, opts = {}) {
	//console.dir('Divine construction', id, opts)
	Entity.call(this, id, opts)
	this.value = opts.value ? opts.value : 'Divine 1'
	this.type = opts.type ? opts.type : 'ShortText'
	this.tag = opts.tag ? opts.tag : 'Divine Discrete Entity'
	this.name = opts.name ? opts.name : 'divine'
	//console.dir('Divine constructed', this, opts)
}

Divine.prototype = Object.create(Entity.prototype)

export default Divine