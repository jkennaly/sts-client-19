// Player.js
// store/entity/Player


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import Entity from '../Entity.js'

//a player can be:
	//created from an existing Object
	//a new Object will be created using the default player


function Player (id) {
	Entity.call(this, id, {playable: true})

}

Player.prototype = Object.create(Entity.prototype)


export default Player;