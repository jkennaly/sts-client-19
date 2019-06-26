// Entity.js
// store/entity


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'
const uuidv4 = require('uuid/v4');

//a player can be:
	//created from an existing Object
	//a new Object will be created using the default player


function Entity (id, opts = {}) {
	this.id = id ? id : uuidv4()
	

}

export default Entity;