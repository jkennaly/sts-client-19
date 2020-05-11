// places.js
// services/vm

import _ from 'lodash'
import Place from '../../store/entity/place/Place'

import registry from '../registry'

const placeRegistry = registry('Place')

export function create(basePlace, targetScale, templates, connections) {
	if(basePlace && basePlace.scale >= targetScale) return basePlace
	//choose a template
	const template = _.find(templates, t => t.scale === (basePlace.scale + 1) || t.scales && t.scales.includes((basePlace.scale + 1)))

	const nextPlace = new Place(basePlace, connections, template)
	placeRegistry.upsertItem(nextPlace)
	//console.dir('places create', template, templates, nextPlace)
	return create(nextPlace, targetScale, templates, connections)
}

export function getOne({baseId, targetScale, targetId, templates}) {
	const targetPlace = placeRegistry.getItem({id: targetId})
	//if the targetScale is given and does not match the scale for a defined targetPlkace, throw
	if(targetPlace && _.isNumber(targetScale) && targetPlace.scale !== targetScale) throw new Error(
		'Target Overspecified',
		`Given targetScale: ${targetScale}`,
		targetPlace
	)
	//if the target is defined but not found, throw
	if(!targetPlace && targetId) throw new Error(
		'Target Undefined',
		`Given targetScale: ${targetScale}`,
		`Given targetId: ${targetId}`,
		`Given baseId: ${baseId}`
	)
	//if the Place has already been created return it
	if(targetPlace) return targetPlace
	//if the targetScale is not defined, throw
	if(!_.isNumber(targetScale)) throw new Error(
		'Target Scale Invalid',
		`Given targetScale: ${targetScale}`,
		`Given targetId: ${targetId}`,
		`Given baseId: ${baseId}`
	)

	const basePlace = placeRegistry.getItem({id: baseId})
	//if the basePlace is not registered, throw
	if(!basePlace) throw new Error(
		'Base Undefined',
		`Given targetScale: ${targetScale}`,
		`Given targetId: ${targetId}`,
		`Given baseId: ${baseId}`
	)
	//if the basePlace scale is greater than targetScale, throw
	if(basePlace.scale >= targetScale) throw new Error(
		'Base Scale Too High',
		`Given targetScale: ${targetScale}`,
		`Given targetId: ${targetId}`,
		basePlace
	)
	return create(basePlace, targetScale, templates)
}

export function getAll() {
	const places = placeRegistry.getItems(x => true)
	//console.dir('getAll Registry', places)
	return places
}

export function createSetpieces({baseId, templates, setpieces}) {
	const basePlace = placeRegistry.getItem({id: baseId})
	//if the basePlace is not registered, throw
	if(!basePlace) throw new Error(
		'Base Undefined',
		`Given targetScale: ${targetScale}`,
		`Given targetId: ${targetId}`,
		`Given baseId: ${baseId}`
	)
	const setpieceTemplates = setpieces.map(s => [...(_.filter(templates, t => t.scale < _.max(s.scales))), s])	
	const setScales = setpieces.map((v, i) => _.max(setpieces[i].scales))
	//console.dir('createSetpieces scale and templates', setScales, setpieceTemplates)
	return setpieceTemplates.map((t, i) => getOne({baseId: baseId, targetScale: setScales[i], templates: t}))
}

export function registerGame(game) {
	return placeRegistry.upsertItem(game)
}