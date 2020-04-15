// Solid.js
// store/entity/diffuse

import _ from 'lodash'


import Entity from '../Entity'

export function Solid(opts = {}) {
	Entity.call(this, undefined, {scale: opts.scale ? opts.scale : 8})
	this.value = 'Solid'
	this.type = 'ShortText'
	this.tag = 'Solid'
	this.name = 'solid'
	this.currentTick = 0
}

Solid.prototype = Object.create(Entity.prototype)


export default Solid;