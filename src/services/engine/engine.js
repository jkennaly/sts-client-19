// engine.js
//services/engine

import _ from 'lodash'

import evalTick from './evalTick'

//startup


//run
//register objects
//queue actions
//execute tick
//write to affected objects

//when the act method is called on an ActionClass object, 
//a new Action object is created and added to the queue
let starters
//let game
//let players
//let entities
let actionQueue
let senseQueue
let gameState

const nextTick = notify => {
	gameState = evalTick(gameState, actionQueue, senseQueue)
	actionQueue = []
	notify(gameState)
	//console.dir('nextTick', gameState.game)

}
const queue = {
	add: (actions) => {
		if(!actionQueue) return false
		actionQueue = _.uniqBy([...actionQueue, ...actions], 'id')
		//console.dir('queue', actionQueue)
		return true
	},
	addSense: senses => {
		if(!senseQueue) return false
		senseQueue = _.uniqBy([...senseQueue, ...senses], 'id')
		//console.dir('queue', actionQueue)
		return true

	}
}
const start = (startObjects, notify) => {
	starters = startObjects
	actionQueue = []
	senseQueue = []
	gameState = evalTick(undefined, actionQueue, senseQueue, {registry: starters})
	setInterval(nextTick, 1000, notify)
	global.game = gameState
	//console.dir('engine start starters' , starters)
	//console.dir(players)
}
const sense = forces => {
	if(!gameState) return []
	return gameState.entities.filter(e => e.detectable(forces))

}
export default {
	queue: queue,
	start: start,
	sense: sense
}