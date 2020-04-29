// Place.js
// store/entity/place

import _ from 'lodash'
import XXH from 'xxhashjs'
const uuidv4 = require('uuid/v4');

import Entity from '../Entity'
import {forces as placeValueTypes} from '../../../services/forces'




const initialValues = settings => placeValueTypes.reduce((vals, pvt) => {vals[pvt] = XXH.h64(pvt, settings.seed.value).toString(2); return vals}, {})
const derivativeValues = parentPlace => _.clone(parentPlace.placeValues)


function Place(parentPlace, connections = [], template = {}) {
	//console.dir('Place', parentPlace, template)
	Entity.call(this)
	this.parentId = parentPlace.id
	
	this.type = template.type ? template.type : 'ShortText'
	this.tag = template.tag ? template.tag : 'Player'
	this.name = template.name ? template.name : 'player'
	this.scale = parentPlace && parentPlace.scale ? parentPlace.scale + 1 : 1
	//if this.scale is 1, create intital universe values from the seed
	//if this scale is greater than 1, create derivative place values from the parentPlace
	
	const baseValues = this.scale === 1 ? initialValues(parentPlace) : derivativeValues(parentPlace)
	//execute each connection function to modify values as needed by existing places
	this.placeValues = connections.reduce((pv, cv) => cv(pv), baseValues)


}
Place.prototype = Object.create(Entity.prototype)

Place.prototype.dims = function () {

	return {
		x: [0, 99],
		y: [0, 99],
		z: [-10, 10]
	}
}

Place.prototype.biome = function () {
	if(this.biome) return this.biome
	//how the Place appears from it's parentPlace
	return 'grass'
}

export default Place