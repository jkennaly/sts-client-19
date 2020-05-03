// Effect.js
// store/effect


import m from 'mithril'
import _ from 'lodash'
const uuidv4 = require('uuid/v4')
//import {scales} from '../../services/scales'
import Store from '../../Store'

function Effect (id, opts = {}) {
	Store.call(this, id, opts)
	this.instant = opts.instant || false
}
Effect.prototype = Object.create(Store.prototype)

export default Effect