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

const nextTick = notify => {
	gameState = evalTick(gameState, actionQueue, senseQueue)
	actionQueue = []
	notify(gameState)
	localforage.setItem('gameState', JSON.stringify(gameState))

}
const queue = {
	add: (actions) => {
		if(!actionQueue) return false
		actionQueue = _.uniqBy([...actionQueue, ...actions], 'id')
		console.dir('queue', actionQueue)
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
	starters = startObjects
	actionQueue = []
	senseQueue = []
	try {
		gameState = evalTick(undefined, actionQueue, senseQueue, {registry: starters})
	} catch (err) {
		throw (err)
	}
	//console.dir('save gameState', gameState)
	//console.dir('save gameState isCyclic', isCyclic(gameState))
	if(isCyclic(gameState)) console.error('circular gameState', gameState)
	localforage.setItem('gameState', JSON.stringify(gameState))
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