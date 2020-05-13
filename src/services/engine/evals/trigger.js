// trigger.js
// services/engine/evals

import _ from 'lodash'

const coordsDistance = {
	rectangular: (xb, yb, zb) => (xt, yt, zt) => Math.hypot(xb -xt, yb - yt, zb - zt)
}

export function proximity(baseEntity, environment, range) {
	if(!baseEntity.place || environment.id !== baseEntity.place) return () => false
	const coordsSystem = environment.coords

	return testEntity => {
		return coordsDistance[coordsSystem].apply(null, baseEntity.)
	}
}