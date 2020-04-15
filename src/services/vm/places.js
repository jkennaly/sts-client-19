// places.js
// services/vm

import _ from 'lodash'
import Place from '../../store/entity/place/Place'

import registry from '../registry'

const placeRegistry = registry('Place')

export function create(basePlace, targetScale, templates) {
	if(basePlace && basePlace.scale >= targetScale) return basePlace
	const nextPlace = new Place(basePlace)
	placeRegistry.upsertItem(nextPlace)
	return create(nextPlace, targetScale, templates)
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

export function registerGame(game) {
	return placeRegistry.upsertItem(game)
}