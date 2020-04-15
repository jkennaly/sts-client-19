// services/focus.js

// this service provides both tools to change current focus and report it

import _ from 'lodash'

//self focus
//active focus
//sense focus

let setSelfFocusOptions = {}



export function setSelfFocus(id) {
	//console.dir('setSelfFocus', id, setSelfFocusOptions)
	_.forEach(setSelfFocusOptions, opt => opt.id === id ? opt.focus.set() : opt.focus.clear())
}
export function getSelfFocusId() {
	return _.find(setSelfFocusOptions, opt => opt.focus.value).id
}
export function getSelfFocusOptionIds() {
	return _.map(setSelfFocusOptions, opt => opt.id)
}

export function setActiveFocus() {}
export function getActiveFocus() {}
export function getActiveFocusOptions() {}

export function setSenseFocus() {}
export function getSenseFocus() {}
export function getSenseFocusOptions() {}

export function setSelfOptions(cards = {}) {
	setSelfFocusOptions = cards
}