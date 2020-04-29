//factorial/scenario.js
import _ from 'lodash'



import air from './entity/diffuse/air.json'
import ground from './entity/diffuse/ground.json'

import human from './entity/discrete/divine/human.json'
import usb from './entity/discrete/inanimate/usb.json'

import places from './entity/place/places.json'
import factory from './entity/place/factory.json'

function Human (Divine, startPlace) {
	Divine.call(this, undefined, _.set(human, 'startPlace', startPlace))
	//console.dir('Human scenario', this)
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
		starterFunc: function({Divine, createPlaces, universe}) {
			const starterPlaces = {
				baseId: universe.id, 
				templates: places,
				setpieces: [factory]
			}
			try {

				const firstPlace = createPlaces(starterPlaces)[0]
				const first = new Human(Divine, firstPlace)
				return [ first ]
			} catch (err) {
				console.error(err)
			}
			
			return []
			
		}
	}
}

scenario.settingName = 'Factorial'