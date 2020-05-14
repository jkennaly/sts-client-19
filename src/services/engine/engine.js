// engine.js
//services/engine

import _ from 'lodash'
import localforage from 'localforage'

import evalTick from './evalTick'

localforage.config({
	name: "STS-OOI",
	storeName: "last-gamestate"
})

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
let interval
let senses
let actions

const nextTick = notify => {
	gameState = evalTick(gameState, actionQueue, senseQueue)
	actionQueue = []
	//console.dir('nextTick time', Date.now() % 10000)
	notify(gameState)
	localforage.setItem('gameState', JSON.stringify(gameState))

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
function isCyclic(obj) {
  var keys = [];
  var stack = [];
  var stackSet = new Set();
  var detected = false;

  function detect(obj, key) {
    if (obj && typeof obj != 'object') { return; }

    if (stackSet.has(obj)) { // it's cyclic! Print the object and its locations.
      var oldindex = stack.indexOf(obj);
      var l1 = keys.join('.') + '.' + key;
      var l2 = keys.slice(0, oldindex + 1).join('.');
      console.log('CIRCULAR: ' + l1 + ' = ' + l2 + ' = ' + obj);
      console.log(obj);
      detected = true;
      return;
    }

    keys.push(key);
    stack.push(obj);
    stackSet.add(obj);
    for (var k in obj) { //dive on the object's children
      if (Object.prototype.hasOwnProperty.call(obj, k)) { detect(obj[k], k); }
    }

    keys.pop();
    stack.pop();
    stackSet.delete(obj);
    return;
  }

  detect(obj, 'obj');
  return detected;
}

const start = (startObjects, notify, scenario) => {
	starters = startObjects.entities

	actionQueue = []
	senseQueue = []
	try {
		gameState = evalTick(undefined, actionQueue, senseQueue, {registry: starters, actions: startObjects.actions, senses: startObjects.senses})
	} catch (err) {
		throw (err)
	}
	//console.dir('save gameState', gameState)
	//console.dir('save gameState isCyclic', isCyclic(gameState))
	if(isCyclic(gameState)) console.error('circular gameState', gameState)
	localforage.setItem('gameState', JSON.stringify(gameState))
	if(interval) clearInterval(interval)
	interval = setInterval(nextTick, 1000, notify)
	//global.gameInitState = gameState
	//console.dir('engine start starters' , starters)
	//console.dir(players)
}

const stop = () => clearInterval(interval)

const sense = forces => {
	if(!gameState) return []
	return gameState.entities.filter(e => e.detectable(forces))

}

const getById = idsRaw => {
	if(!idsRaw) return undefined
	const ids = _.isString(idsRaw) ? [idsRaw] : idsRaw
	//console.dir('engine.getById', idsRaw, ids, gameState.entities.map(e => e.id))
	return gameState.entities[_.isString(idsRaw) ? 'find' : 'filter'](e => ids.includes(e.id))
}

const topChild = (env, child) => {
	if(child.place === env.id) return child
	return topChild(env, getById(child.place))
}

const engine = {
	queue: queue,
	start: start,
	stop: stop,
	sense: sense,
	gameState: () => gameState,
	at: placeId => gameState.entities.filter(e => {
		if(!e.place) return false

		//console.dir('engine.at', e)
		return !e.effects.some(f => f.newPlace) && (e.place === placeId) || e.effects.length && e.effects.some(f => f.newPlace === placeId)
	}),
	//getById works with string or array of stings
	getById: getById,
	posWithin: environmentId => posEntityId => {
		if(!environmentId || !posEntityId || environmentId === posEntityId) return undefined
		
		const env = gameState.entities.find(e => e.id === environmentId)
		const posE = gameState.entities.find(e => e.id === posEntityId)
		if(!env || ! posE) return undefined
		const topChildE = topChild(env, posE)
		if(!topChildE) return undefined
		return topChildE.pos

	},
	distWithinBetween: environmentId => (posEntityId1, posEntityId2) => {
		if(!environmentId || !posEntityId1 || environmentId === posEntityId1 || environmentId === posEntityId2) return undefined
		
		const env = gameState.entities.find(e => e.id === environmentId)
		const posE1 = gameState.entities.find(e => e.id === posEntityId1)
		const posE2 = gameState.entities.find(e => e.id === posEntityId2)
		if(!env || !posE1 || !posE2) return undefined
		const topChildE1 = topChild(env, posE1)
		if(!topChildE1) return undefined
		const topChildE2 = topChild(env, posE2)
		if(!topChildE2) return undefined
		const [x1, y1, z1] = topChildE1.pos
		const [x2, y2, z2] = topChildE2.pos
		return Math.hypot(x1 - x2, y1 - y2, z1-z2)

	}

}
window.engine = engine
export default engine