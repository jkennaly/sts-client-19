// Fluid.js
// store/entity/diffuse

import _ from 'lodash'


import Entity from '../Entity'
import {getAll as getSettings} from  '../../../services/settings'

export function Fluid(opts = {}) {
	Entity.call(this, undefined, {scale: opts.scale ? opts.scale : 8})
	this.value = 'Fluid'
	this.type = 'ShortText'
	this.tag = 'Fluid'
	this.name = 'fluid'
	this.currentTick = 0
}

Fluid.prototype = Object.create(Entity.prototype)


export default Fluid;