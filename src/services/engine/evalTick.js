// evalTick.js
//services/engine

import _ from 'lodash'

//import Place from '../../store/entity/place/Place'

export default function (currentState = {}, actions, senses, scenario = {}) {
	let newState = {}

	newState.game = scenario.registry ? _.find(scenario.registry, so => so.name === 'game') : currentState.game
	newState.player1 = scenario.registry ? _.find(scenario.registry, so => so.name === 'player') : currentState.player1
	newState.entities = currentState.entities ? currentState.entities : 
		scenario.registry ? scenario.registry : 
		[]

	if(!newState.game) {
		console.dir('evalTick currentState', currentState)
		throw 'no Scenario'

	}
	newState.game.currentTick = newState.game.currentTick + 1


	//execute each action
	const sortedActions = actions.sort((a, b) => a.source.localeCompare(b.source))
	
	_.forEach(sortedActions, a => {
		//console.dir('evalTick sortedActions', a)
		//prepare execution plan
		const targets = a.targetIds.map(t => newState.entities.find(e => e.id === t))
		//if there are any undefined targets then end
		if(_.some(targets, _.isUndefined)) return true
		//if there are any invalid targets remove them from the list
		const validTargets =  _.filter(targets, t => a.action.targetable(t))
		if(!validTargets.length) return true
		const source = newState.entities.find(e => e.id === a.action.source)
		const sourceIndex = newState.entities.findIndex(e => e.id === a.action.source)
		
		//console.dir('evalTick action execution', a, source, sourceIndex)
		if(!source || !sourceIndex) return true
		const energyRequired = a.action.activation.energy
		const sourceEnergy = source.energy.available
		const energyAvailable = sourceEnergy >= energyRequired
		if(!energyAvailable) return true

		//resolve effects to actor
		source.energy.channel(energyRequired)
		source.effects.push(a.action.effects.source)
		newState.entities[sourceIndex] = source
		//resolve effects to targets
		_.forEach(validTargets, t => {
			const tIndex = newState.entities.findIndex(e => e.id === t.id)
			t.effects.push(a.action.effects.target)
			newState.entities[tIndex] = t
			//console.dir('evalTick action execution target effects resolution', a.action.effects, t)
		
		})
			//future: resolve effects to secondary affected

	})

	//check for avatar update
	//console.dir('evalTick actions', actions, newState.entities)
	newState.avatar = actions.length ?  newState.entities.find(e => e.effects.find(ef => ef.name === 'avatar')) : currentState.avatar

	//check for new places sensed by controlled
	//find controlled with senses that detect places
	_.forEach(senses, s => {
		
	})
	/*
	//universe
	const universe = new Place()
	//galaxy
	const galaxy = new Place(universe)
	//star
	const star = new Place(galaxy)
	//planet
	const planet = new Place(star)
	//region
	const region = new Place(planet)
	//area
	const area = new Place(region)
	//location
	const location = new Place(area)
*/

	//if(actions.length) console.dir('evalTick newState.avatar', newState.avatar)
	return newState

}