// Entity.js
// store/entity


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'
import Store from '../Store'
import ActionClass from '../action/ActionClass'
import {Electrical as ElectricalSense} from '../sense/forces/Electrical'
import {Mechanical as MechanicalSense} from '../sense/forces/Mechanical'
import {Chemical as ChemicalSense} from '../sense/forces/Chemical'
import {Divine as DivineProfile} from '../profile/forces/Divine'
import {Mechanical as MechanicalProfile} from '../profile/forces/Mechanical'
import {Electrical as ElectricalProfile} from '../profile/forces/Electrical'


const Sense = {
	electrical: ElectricalSense,
	mechanical: MechanicalSense,
	chemical: ChemicalSense
}
const Profile = {
	divine: DivineProfile,
	electrical: ElectricalProfile,
	mechanical: MechanicalProfile
}

const index = type => instance => new type[instance[0]](undefined, instance[1])


//a player can be:
	//created from an existing Object
	//a new Object will be created using the default player

function ActionMap(data, source) {
	//console.dir('Entity', data)
	ActionClass.call(this, undefined, _.assign({source: source.id} ,data))

	this.action = ActionClass.prototype.actionFactory.call(this, data.actionEffects)
	
}
ActionMap.prototype = Object.create(ActionClass.prototype)


function Entity (id, opts = {}) {
	//console.dir('Entity construction begins', id, opts)
	if(opts.scale && (!opts.startPlace || !opts.startPlace.id)) throw 'Cannot create Entity without start place'
	//console.dir('Store.call')
	Store.call(this, id, opts)
	//console.dir('Store.called')
	this.startPlace = opts.startPlace ? opts.startPlace.id : undefined
	this.appliedEffects = []
	Object.defineProperties(this, {
        "effects": {
            "get": function() {
				const toolEffects = (_.isArray(this.tools) ? this.tools : [])
					.flatMap(t => _.isArray(this.toolEffects) ? this.toolEffects : [])
				return [...this.appliedEffects, ...toolEffects]
			},
		    "set": function(newEffects) {
				this.appliedEffects = newEffects
			}
        },
        "place": {
            "get": function() {
				const newPlace = _.get(this.effects.find(e => _.get(e, `newPlace`)), `newPlace`)
				return newPlace ? newPlace : this.startPlace
			}
        },
        "pos": {
            "get": function() {
				if(!this.place) return undefined
				const scentityInitPos = _.find(_.get(this, `located`, {default: []}), x => true)
				const scentityRePos = _.get(this.effects.find(e => _.get(e, `newPosition`)), `newPosition`, [])
				return scentityRePos.length ? scentityRePos : scentityInitPos

			}
        }
    })
	this.actions = opts.actions ? opts.actions.filter(x => x).map(data => new ActionMap(data, this)) : []
	this.displayActions = opts.displayActions ? opts.displayActions.filter(x => x).map(data => new ActionMap(data, this)) : []
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
	this.value = opts.value ? opts.value : 'Entity 1'
	this.type = opts.type ? opts.type : 'ShortText'
	this.tag = opts.tag ? opts.tag : 'Discrete Entity'
	this.name = opts.name ? opts.name : 'entity'
	this.memory = (!_.isArray(opts.memory) ? [] : opts.memory)
	this.senses = (!_.isArray(opts.senses) ? [] : opts.senses)
		.map(index(Sense))
		.filter(_.isObject)
	//console.dir('Entity profiles', opts.profiles)
	this.profiles = (!_.isArray(opts.profiles) ? [] : opts.profiles)
		.map(index(Profile))
		.filter(_.isObject)
	this.tool = false
}

Entity.prototype = Object.create(Store.prototype)


export default Entity;