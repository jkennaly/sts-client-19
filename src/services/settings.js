// services/settings.js

// this service provides the settings to use for a new game
// there is also an update function for changing the current settings
// changes here have no effect on a game already in progress

import _ from 'lodash'
import seedrandom from 'seedrandom'

//import {scenario} from '../scenarios/earthican/scenario.js'

const scenarios = {};

function importAll (r) {
  r.keys().forEach(key => scenarios[key] = r(key));
}

importAll(require.context('../scenarios/', true, /scenario\.js$/));
// At build-time scenarios will be populated with all required modules.



const rng = seedrandom()

const seed = {
	value: rng.int32(),
	type: 'Numeric',
	tag: 'Seed',
	name: 'seed',
	id: 'sts-setting-game-seed'
}
const gameName = {
	value: 'Game 1',
	type: 'Text',
	tag: 'GameName',
	name: 'gameName',
	id: 'sts-setting-game-seed'
}

//console.dir('settings scenarios', scenarios)
let settings = {
	seed: seed,
	gameName: gameName,
	scenario: _.sample(scenarios).scenario(seed)
}

//available settings
export const selectorSetting = (settingName) => _.filter(settings, (v, k) => k === settingName)
export const selectorValues = (settingName) => _.values(scenarios).map(v => _.get(v, `${settingName}.settingName`))
export const selectorSet = (settingName, scenarioName) => (settings[settingName] = _.find(scenarios, s => s[settingName].settingName === scenarioName)[settingName](settings.seed))


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