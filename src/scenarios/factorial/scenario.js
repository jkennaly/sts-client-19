//factorial/scenario.js
import _ from 'lodash'

import air from './entity/diffuse/air.json'
import ground from './entity/diffuse/ground.json'

import human from './entity/discrete/divine/human.json'
import wolf from './entity/discrete/fauna/wolf.json'
import tree from './entity/discrete/flora/tree.json'
import rock from './entity/discrete/inanimate/rock.json'

import places from './entity/place/places.json'
import savanna from './entity/place/savanna.json'

function Human (Divine, startPlace) {
	//console.dir('Human scenario', Divine, human)
	Divine.call(this, undefined, _.set(human, 'startPlace', startPlace))
}
/*
function Savanna (Place, parentPlace) {
	const allowedParentScales = _.isArray(savanna.scales) ? savanna.scales.map(x => x - 1) : [savanna.scale - 1]
	if(!allowedParentScales.some(aps => aps < parentPlace.scale)) throw new Error('parentPlace scale invalid', parentPlace, savanna)
	Place.call(this, parentPlace, undefined, savanna)
}
*/
export function scenario (seed) {
	return {
		value: 'Factorial',
		type: 'Selector',
		tag: 'Scenario',
		name: 'scenario',
		id: 'sts-setting-scenario',
		starterFunc: function({Divine, getPlace, universe}) {
			const firstPlace = getPlace({
				baseId: universe.id, 
				targetScale: human.scale, 
				templates: places
			})
			/*
			return []
			*/
			const first = new Human(Divine, firstPlace)
			return [ first ]
		}
	}
}

scenario.settingName = 'Factorial'