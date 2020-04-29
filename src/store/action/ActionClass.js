// ActionClass.js
// store/action


import m from 'mithril'
import _ from 'lodash'
const uuidv4 = require('uuid/v4')
import Store from '../Store'

function ActionClass (id, opts = {}) {
	Store.call(this, id, opts)
	this.source = opts.source
	this.effective = true
}
ActionClass.prototype = Object.create(Store.prototype)

ActionClass.prototype.effectInterlock = function(effects) {
	return false
}

ActionClass.prototype.targetable = function(profile, effects) {
	const forcesMatch = _.intersection(_.keys(profile.forces), _.keys(this.forces))
	if(!forcesMatch) return false
	if(effects && this.effectInterlock(effects)) return false
	return true
}

export default ActionClass