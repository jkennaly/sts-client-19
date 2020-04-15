// Divine.js
// store/entity/discrete

import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import Entity from '../Entity'
import Inspire from '../../action/player/Inspire'
import {Electrical as ElectricalSense} from '../../sense/forces/Electrical'
import {Mechanical as MechanicalSense} from '../../sense/forces/Mechanical'
import {Chemical as ChemicalSense} from '../../sense/forces/Chemical'
import {Divine as DivineProfile} from '../../profile/forces/Divine'


const Sense = {
	electrical: ElectricalSense,
	mechanical: MechanicalSense,
	chemical: ChemicalSense
}
const Profile = {
	divine: DivineProfile
}

const index = type => instance => new type[instance[0]](undefined, instance[1])

function Divine (id, opts = {}) {
	//console.dir('Divine construction', id, opts)
	Entity.call(this, id, opts)
	this.value = opts.value ? opts.value : 'Divine 1'
	this.type = opts.type ? opts.type : 'ShortText'
	this.tag = opts.tag ? opts.tag : 'Divine Discrete Entity'
	this.name = opts.name ? opts.name : 'divine'
	this.senses = (!_.isArray(opts.senses) ? this.senses : opts.senses)
		.map(index(Sense))
		.filter(_.isObject)
	this.profiles = (!_.isArray(opts.profiles) ? this.profiles : opts.profiles)
		.map(index(Profile))
		.filter(_.isObject)
	//console.dir('Divine constructed', this, opts)
}

Divine.prototype = Object.create(Entity.prototype)

export default Divine