//factorial/scenario.js
import _ from 'lodash'


import places from './place/places.json'
import factory from './place/factory.json'


let senses = {}
let actions = {}
let entities = {}

function importSenses (r) {
  r.keys().forEach(key => senses[key] = r(key))
  senses = _.mapKeys(senses, v => v.name)
}
function importActions (r) {
  r.keys().forEach(key => actions[key] = r(key))
  actions = _.mapKeys(actions, v => v.name)
}
function importEntities (r) {
  r.keys().forEach(key => entities[key] = r(key))
  entities = _.mapKeys(entities, v => v.name)
}

importSenses(require.context('./sense/', true, /\.json$/))
importActions(require.context('./action/', true, /\.json$/))
importEntities(require.context('./entity/', true, /\.json$/))
// At build-time scenarios will be populated with all required modules.

function Scentity (Entity, data, startPlace) {
	const entitySenses = data.senses ? data.senses.map(s => [s[0], _.find(senses, ss => ss.reference === s[1])]) : []
	const entityActions = data.actions ? data.actions.map(s => _.find(actions, ss => ss.reference === s)) : []
	const entityDisplayActions = data.displayActions ? data.displayActions.map(s => _.find(actions, ss => ss.reference === s)) : []
	
	const entityOpts = _.assign({}, data, {
		startPlace: startPlace, 
		senses: entitySenses,
		actions: entityActions,
		displayActions: entityDisplayActions
	})
	try {

	Entity.call(this, undefined, entityOpts)
} catch (err) {
	console.dir(err, this, entityOpts)
}
	//this.actions = Actions.map(Action => new Action(ActionClass, {source: this.id}))
	//this.displayActions = DisplayActions.map(Action => new Action(ActionClass, {source: this.id}))
	this.briefcase = {
		slots: 3,
		contents: [],
		add: function(src) {
			//console.dir('Scentity scenario briefcase add', src, this)
			if(this.contents.length >= this.slots) return false
			return this.contents.push(src)
		}
	}
}

export function scenario (seed) {
	//console.dir('Factorial scenario.js', factory.profiles)
	return {
		id: 'sts-setting-scenario',
		name: 'scenario',
		tag: 'Scenario',
		type: 'Selector',
		value: 'Factorial',
		assetFiles: {
			anims: ["ascend-stairs", "gather-objects", "look-around", "push-button", "run"],
			sfx: ['gliss', 'button', 'door', 'fan', ...factory.profiles.filter(p => p[0] === 'mechanical' && p[1].radiation.assetType === 'sfx').map(p => p[1].radiation.assetName)],
			entities: ['girl-walk', 'usb'],
			places: ['environment']
		},
		starterFunc: function({Entity, ActionClass, createPlaces, universe}) {
			const starterPlaces = {
				baseId: universe.id, 
				templates: places,
				setpieces: [factory]
			}
			//Collect.prototype = Object.create(ActionClass.prototype)
			Scentity.prototype = Object.create(Entity.prototype)
			try {

				const firstPlace = createPlaces(starterPlaces)[0]
				return {
					entities: _.map(entities, e => new Scentity(Entity, e, firstPlace)),
					senses: senses,
					actions: actions	
				} 
				//const first = new Scentity(Entity, firstPlace)
				//const firstStatic = new USB(Entity, firstPlace)
				//console.dir('scenario', first, firstStatic)
				//return [ first, firstStatic ]
			} catch (err) {
				console.error(err)
			}
			
			return []
			
		}
	}
}

scenario.settingName = 'Factorial'