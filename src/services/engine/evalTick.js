// evalTick.js
//services/engine

import _ from 'lodash'

import * as triggers from './evals/trigger.js'

function filterInPlace(a, condition, thisArg) {
  let j = 0;

  a.forEach((e, i) => { 
    if (condition.call(thisArg, e, i, a)) {
      if (i!==j) a[j] = e; 
      j++;
    }
  });

  a.length = j;
  return a;
}


//import Place from '../../store/entity/place/Place'

export default function (currentState = {}, actions, senses, scenario = {}) {
	let newState = {}

	newState.game = scenario.registry ? _.find(scenario.registry, so => so.name === 'game') : currentState.game
	newState.player1 = scenario.registry ? _.find(scenario.registry, so => so.name === 'player') : currentState.player1
	newState.entities = currentState.entities ? _.uniqBy(currentState.entities, 'id') : 
		scenario.registry ? scenario.registry : 
		[]
	newState.actions = currentState.actions ? currentState.actions : scenario.actions
	newState.senses = currentState.senses ? currentState.senses : scenario.senses

	if(!newState.game) {
		console.dir('evalTick currentState', currentState)
		throw 'no Scenario'

	}
	newState.game.currentTick = newState.game.currentTick + 1

	//review currently conferred actions
		//if the trigger condition or the maintained condition is true, the action stays

	const deferringEntities = newState.entities
		.filter(e => e.conferredActions && e.conferredActions.length)
		.sort((a, b) => a.id.localeCompare(b.id))

	_.forEach(deferringEntities, de => {
		//console.log('triggers', triggers)
		const removeIndexes = de.conferredActions.reduce((indexes, da, i) => {
			const conferer = newState.entities.find(e => e.id === da.conferredBy)
			if(!conferer) return indexes
			const conferred = conferer.confers.find(c => c.actionReference === da.name && conferer.id === da.conferredBy)
			if(!conferred) return indexes
			const maintained = triggers[conferred.maintained.type](conferer, newState.entities.find(p => p.id === de.place), conferred.maintained[conferred.maintained.type])(de)
			if(maintained) return indexes
			const triggered = triggers[conferred.trigger.type](conferer, newState.entities.find(p => p.id === de.place), conferred.trigger[conferred.trigger.type])(de)
			if(triggered) return indexes
			return [...indexes, i]


		}, []).sort((a, b) => b - a)
		_.forEach(removeIndexes, i => {
			de.conferredActions.splice(i, 1)
		})

	})

	//check for new conferred actions
	const conferringEntities = newState.entities
		.filter(e => e.confers && e.confers.length && e.confers.some(c => c.action))
		.sort((a, b) => a.id.localeCompare(b.id))

	_.forEach(conferringEntities, ce => {
		_.forEach(ce.confers, conferred => {
			const possibleConferred = newState.entities.filter(triggers[conferred.to.type](conferred.to[conferred.to.type]))
			const triggeredConferred = possibleConferred.filter(triggers[conferred.trigger.type](ce, newState.entities.find(p => p.id === ce.place), conferred.trigger[conferred.trigger.type]))
			const notConferred = triggeredConferred.filter(e => !e.conferredActions.some(ca => ca.conferredBy === ce.id && ca.name === conferred.actionReference))
			_.forEach(notConferred, c => {
				const a = conferred.action(c, newState.actions)
				c.conferredActions.push(a)
				c.memory.push(JSON.stringify(a))

			})
		})
	})


	//execute each action
	const sortedActions = actions
	//filter out actions that are coming in faster than the game engine ticks
		.filter((a, i, arr) => !a.serial || !arr.some(b => b.serial && b.serial > a.serial && a.value === b.value && a.display === b.display))
		.sort((a, b) => a.id.localeCompare(b.id))
	
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
		
		source.effects = [...(source.effects.filter(
				(e, i, arr) => !a.action.effects.source.instant || e.value !== a.action.effects.source.value)
			), a.action.effects.source]
		source.memory.push(JSON.stringify(a.action))
		newState.entities[sourceIndex] = source
		//resolve effects to targets
		_.forEach(validTargets, t => {
			const tIndex = newState.entities.findIndex(e => e.id === t.id)
			
			t.effects = [...(t.effects.filter((e, i, arr) => !a.action.effects.target.instant || e.value !== a.action.effects.target.value)), a.action.effects.target]
			t.memory.push(JSON.stringify(a.action.effects.target))
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