// Sense.js
// store/sense


import m from 'mithril'
import _ from 'lodash'
const uuidv4 = require('uuid/v4');
import {scales} from '../../services/scales'
import Store from '../Store'

function Sense (id, opts = {}) {
	Store.call(this, id, opts)
	this.defaultView = 'list'
	this.placeIds = place => {
		
	}
}
Sense.prototype = Object.create(Store.prototype)

export default Sense