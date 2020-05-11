// ActionClass.js
// store/action


import m from 'mithril'
import _ from 'lodash'
const uuidv4 = require('uuid/v4')
import Store from '../Store'

import {Avatar} from '../effect/links/Avatar'
import {Player} from '../effect/links/Player'
import {Relocate} from '../effect/relocate/Relocate'
import {Reposition} from '../effect/reposition/Reposition'
import {Nothing} from '../effect/nothing/Nothing'

function ActionClass (id, opts = {}) {
	Store.call(this, id, opts)
	this.source = opts.source
	this.effective = true
	this.display = false

	this.activation = {
		energy: 0
	}
}
ActionClass.prototype = Object.create(Store.prototype)

ActionClass.prototype.effectInterlock = function(effects) {
	return false
}

ActionClass.prototype.effects = {
	LinkPlayer: Player,
	LinkAvatar: Avatar,
	Relocate: Relocate,
	Reposition: Reposition,
	Nothing: Nothing
}

ActionClass.prototype.targetable = function(profile, effects, reqs = []) {
	const forcesMatch = _.intersection(_.keys(profile.forces), _.keys(this.forces))
	if(!forcesMatch) return false
	if(effects && this.effectInterlock(effects)) return false
	return true
}

ActionClass.prototype.actionFactory = function (opts) {
	const sourceEffect = opts.sourceEffect
	if(!this.effects[sourceEffect]) throw new Error('Unknown Source Effect')
	const targetEffect = opts.targetEffect
	if(!this.effects[targetEffect]) throw new Error('Unknown Target Effect')
	const sourceConnectionName = opts.sourceConnectionName
	if(!sourceConnectionName) throw new Error('Unknown Source Connect Name')
	const targetConnectionName = opts.targetConnectionName
	if(!targetConnectionName) throw new Error('Unknown Target Connect Name')

	let sourceOpts = {}
	let targetOpts = {}

	const SourceEffect = this.effects[sourceEffect]
	const TargetEffect = this.effects[targetEffect]
	return (engine) => (targetId, targetValue) => {
		sourceOpts[sourceConnectionName] = targetId
		targetOpts[targetConnectionName] = this.source
		this.effects = {
			source: new SourceEffect(undefined, sourceOpts),
			target: new TargetEffect(undefined, _.assign({}, targetOpts, (targetValue || {})))
		}	
		engine.queue.add([{action: this, targetIds: [targetId]}])
	
}}

export default ActionClass