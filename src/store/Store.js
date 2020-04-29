// Store.js
// store


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'
const uuidv4 = require('uuid/v4');

import {scales} from '../services/scales'

//a player can be:
	//created from an existing Object
	//a new Object will be created using the default player


function Store (id, opts = {}) {
	//console.dir('Store construction begins')
	this.id = id ? id : uuidv4()
	this.scale = _.isInteger(opts.scale) ? opts.scale : scales.indexOf('Object')
	//console.dir('Store construction ends')
}

export default Store;