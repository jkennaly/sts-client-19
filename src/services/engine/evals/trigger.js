// trigger.js
// services/engine/evals

import _ from 'lodash'

const coordsDistance = {
	rectangular: (xb, yb, zb) => (xt, yt, zt) => Math.hypot(xb -xt, yb - yt, zb - zt)
}

export function proximity(baseEntity, environment, range) {
	if(!baseEntity.place || environment.id !== baseEntity.place) return () => false
	const coordsSystem = environment.coords
	if(!coordsDistance[coordsSystem]) return () => false

	const baseDist = coordsDistance[coordsSystem].apply(null, baseEntity.pos)
	return testEntity => baseDist.apply(null, testEntity.pos) <= range
}

export function technique(nique) {
	return testEntity => testEntity.techniques && testEntity.techniques.length && testEntity.techniques.some(t => t[1].value === nique)
}