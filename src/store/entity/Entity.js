// Entity.js
// store/entity


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'
import Store from '../Store'

//a player can be:
	//created from an existing Object
	//a new Object will be created using the default player


function Entity (id, opts = {}) {
	//console.dir('Entity construction begins', id, opts)
	if(opts.scale && !opts.startPlace) throw 'Cannot create Entity without start place'
	//console.dir('Store.call')
	Store.call(this, id, opts)
	//console.dir('Store.called')
	this.actions = []
	this.senses = []
	this.profiles = []
	this.effects = []
	this.place = opts.startPlace
	this.energy = {
		available: 0,
		channel: amount => {
			if(amount > this.energy.available) return false
			this.energy.available -= amount
			return true
		}
	}
	this.detectable = senseForces => _.some(this.profiles, p => _.some(p.forces, (strength, force) => senseForces[force] <= strength))
	this.sensedPlaceIds = {
		current: () => _.flatMap(this.senses, s => s.placeIds(this.place)),
		all: () => []
	}
	this.located = opts.located
	this.assets = opts.assets
	this.maxLocationScale = opts.maxLocationScale ? opts.maxLocationScale : this.scale - 1
	this.scaleFactor = opts.scaleFactor ? opts.scaleFactor : 1
	//console.dir('Entity construction ends')
}
Entity.prototype = Object.create(Store.prototype)

export default Entity;