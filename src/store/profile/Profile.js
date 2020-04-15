// Profile.js
// store/profile


import m from 'mithril'
import _ from 'lodash'
const uuidv4 = require('uuid/v4')
import {scales} from '../../services/scales'
import Store from '../Store'

function Profile (id, opts = {}) {
	Store.call(this, id, opts)
}
Profile.prototype = Object.create(Store.prototype)

export default Profile