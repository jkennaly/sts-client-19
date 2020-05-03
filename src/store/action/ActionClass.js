// ActionClass.js
// store/action


import m from 'mithril'
import _ from 'lodash'
const uuidv4 = require('uuid/v4')
import Store from '../Store'

import {Avatar} from '../entity/effect/links/Avatar'
import {Player} from '../entity/effect/links/Player'
import {Relocate} from '../entity/effect/relocate/Relocate'
import {Nothing} from '../entity/effect/nothing/Nothing'

function ActionClass (id, opts = {}) {
	Store.call(this, id, opts)
	this.source = opts.source
	this.effective = true
}
ActionClass.prototype = Object.create(Store.prototype)

ActionClass.prototype.effectInterlock = function(effects) {
	return false
}

ActionClass.prototype.effects = {
	LinkPlayer: Player,
	LinkAvatar: Avatar,
	Relocate: Relocate,
	Nothing: Nothing
}

ActionClass.prototype.targetable = function(profile, effects, reqs = []) {
	const forcesMatch = _.intersection(_.keys(profile.forces), _.keys(this.forces))
	if(!forcesMatch) return false
	if(effects && this.effectInterlock(effects)) return false
	return true
}

ActionClass.prototype.actionFactory = function (opts) {
	return (engine) => targetId => {
		const sourceEffect = opts.sourceEffect
		if(!this.effects[sourceEffect]) throw new Error('Unknown Source Effect')
		const targetEffect = opts.targetEffect
		if(!this.effects[targetEffect]) throw new Error('Unknown Target Effect')
		const sourceConnectionName = opts.sourceConnectionName
		if(!sourceConnectionName) throw new Error('Unknown Source Connect Name')
		const targetConnectionName = opts.targetConnectionName
		if(!targetConnectionName) throw new Error('Unknown Target Connect Name')
		let sourceOpts = {}
		sourceOpts[sourceConnectionName] = targetId
		let targetOpts = {}
		targetOpts[sourceConnectionName] = this.source.id
		this.effects = {
			source: new this.effects[sourceEffect](undefined, sourceOpts),
			target: new this.effects[targetEffect](undefined, targetOpts)
		}	
		engine.queue.add([{action: this, targetIds: [targetId]}])
	
}}

export default ActionClass