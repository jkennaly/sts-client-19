//factorial/scenario.js
import _ from 'lodash'



import air from './entity/diffuse/air.json'
import ground from './entity/diffuse/ground.json'

import human from './entity/discrete/divine/human.json'
import usb from './entity/discrete/inanimate/usb.json'


import collect from './action/collect.json'


import places from './entity/place/places.json'
import factory from './entity/place/factory.json'


const senses = {}
const actions = {}

function importSenses (r) {
  r.keys().forEach(key => senses[key] = r(key));
}
function importActions (r) {
  r.keys().forEach(key => actions[key] = r(key));
}

importSenses(require.context('./sense/', true, /\.json$/));
importActions(require.context('./action/', true, /\.json$/));
// At build-time scenarios will be populated with all required modules.


/*
function Collect (ActionClass, opts) {
	ActionClass.call(this, undefined, _.assign({}, collect, opts))

	this.action = ActionClass.prototype.actionFactory.call(this, {
		sourceEffect: 'Nothing',
		targetEffect: 'Relocate',
		sourceConnectionName: 'collected',
		targetConnectionName: 'collector'

		
	})
	
}
*/
function Human (Entity, startPlace) {
	const entitySenses = human.senses.map(s => [s[0], _.find(senses, ss => ss.reference === s[1])])
	const entityActions = human.actions.map(s => _.find(actions, ss => ss.reference === s))
	const entityDisplayActions = human.displayActions.map(s => _.find(actions, ss => ss.reference === s))
	//console.dir('human', human, actions)
	const entityOpts = _.assign({}, human, {
		startPlace: startPlace, 
		senses: entitySenses,
		actions: entityActions,
		displayActions: entityDisplayActions
	})
	Entity.call(this, undefined, entityOpts)
	//this.actions = Actions.map(Action => new Action(ActionClass, {source: this.id}))
	//this.displayActions = DisplayActions.map(Action => new Action(ActionClass, {source: this.id}))
	this.briefcase = {
		slots: 3,
		contents: [],
		add: function(src) {
			//console.dir('Human scenario briefcase add', src, this)
			if(this.contents.length >= this.slots) return false
			return this.contents.push(src)
		}
	}
}

function USB (Entity, startPlace) {
	Entity.call(this, undefined, _.set(usb, 'startPlace', startPlace))
	//console.dir('USB scenario', this)
}



/*
function Savanna (Place, parentPlace) {
	const allowedParentScales = _.isArray(savanna.scales) ? savanna.scales.map(x => x - 1) : [savanna.scale - 1]
	if(!allowedParentScales.some(aps => aps < parentPlace.scale)) throw new Error('parentPlace scale invalid', parentPlace, savanna)
	Place.call(this, parentPlace, undefined, savanna)
}
*/

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
			Human.prototype = Object.create(Entity.prototype)
			USB.prototype = Object.create(Entity.prototype)
			try {

				const firstPlace = createPlaces(starterPlaces)[0]
				const first = new Human(Entity, firstPlace)
				const firstStatic = new USB(Entity, firstPlace)
				//console.dir('scenario', first, firstStatic)
				return [ first, firstStatic ]
			} catch (err) {
				console.error(err)
			}
			
			return []
			
		}
	}
}

scenario.settingName = 'Factorial'