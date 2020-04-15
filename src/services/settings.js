// services/settings.js

// this service provides the settings to use for a new game
// there is also an update function for changing the current settings
// changes here have no effect on a game already in progress

import _ from 'lodash'
import seedrandom from 'seedrandom'

import {scenario} from '../scenarios/earthican/scenario.js'

const rng = seedrandom()

const seed = {
	value: rng.int32(),
	type: 'Numeric',
	tag: 'Seed',
	name: 'seed',
	id: 'sts-setting-game-seed'
}


let settings = {
	seed: seed,
	scenario: scenario(seed)
}

export function getAll() {
	//console.dir('getAll', settings)
	return _.cloneDeep(settings)

}
export function getOne(name) {return _.clone(settings[name])}
export function setAll(newSettings) {
	//console.dir('setAll pre', settings)
	settings = _.cloneDeep(newSettings)
	//console.dir('setAll post', settings)
}
export function setOne(newSetting) {settings[newSetting.name] = _.clone(newSetting)}