// Game.js
// store/entity/diffuse

import _ from 'lodash'

import Quit from '../../action/game/Quit'

import Entity from '../Entity'
//import Divine from '../discrete/Divine'

export function Game(settings) {
	//console.dir('Game construction begins')
	Entity.call(this, undefined, {scale: 0})
	_.assign(this, settings)
	this.value = this.scenario.value
	//console.dir('Game scenario', Divine)
	//this.scenario.starters = this.scenario.starterFunc({Divine: Divine})
	//console.dir('Game scenario starts made')
	this.type = 'ShortText'
	this.tag = 'Game'
	this.name = 'game'
	this.actions.push(new Quit(undefined, {source: this.id}))
	this.currentTick = 0
	//console.dir('Game construction ends')
}

Game.prototype = Object.create(Entity.prototype)


export default Game