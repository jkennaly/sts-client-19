// Divine.js
// store/action/player


import m from 'mithril'
import _ from 'lodash'
import localforage from 'localforage'

import {forces} from '../../../services/forces'
import Sense from '../Sense.js'


function Divine (id, opts = {}) {
	Sense.call(this, id, {scale: 0, forces: {divine: 1}})
	this.value = 'Divine'
	this.tag = 'Sense Divine Entities'
	this.name = 'divine'
	this.primary = true
}

Divine.prototype = Object.create(Sense.prototype)


export default Divine;