// Game.js
// store/entity/diffuse

import _ from 'lodash'


import Entity from '../Entity'
//import Divine from '../discrete/Divine'
import {getAll as getSettings} from  '../../../services/settings'

export function Game() {
	//console.dir('Game construction begins')
	Entity.call(this, undefined, {scale: 0})
	_.assign(this, getSettings())
	this.value = this.scenario.value
	//console.dir('Game scenario', Divine)
	//this.scenario.starters = this.scenario.starterFunc({Divine: Divine})
	//console.dir('Game scenario starts made')
	this.type = 'ShortText'
	this.tag = 'Game'
	this.name = 'game'
	this.currentTick = 0
	//console.dir('Game construction ends')
}

Game.prototype = Object.create(Entity.prototype)


export default Game