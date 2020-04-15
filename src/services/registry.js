// services/registry.js

import _ from 'lodash'
import localforage from 'localforage'

localforage.config({
	name: "STS-OOI",
	storeName: "current-savegame"
})

let initRegistries = {}

let initKeys = []

localforage.keys()
	.then(keys => initKeys = keys)
	.then(keys => Promise.all(keys.map(k => localforage.getItem(k))))
	.then(regs => initRegistries = initKeys.reduce((all, key, i) => _.set(all, key, regs[i]), {}))
	.catch(err => {
		console.error('Initial Data load failed', err)
	})

let registries = _.cloneDeep(initRegistries)


//if there is no data, run acquire and then try again

const get = registryName => () => _.get(registries, registryName, {})
const getItem = registryName => filter => _.find(get(registryName)(), filter)
const getItems = registryName => filter => _.filter(get(registryName)(), filter)
const upsert = registryName => newRegistry => {
	_.set(registries, registryName, _.cloneDeep(newRegistry))
	localforage.setItem(registryName, JSON.stringify(get(registryName)()))
		.catch(err => console.error(`Registry update error for ${registryName}`, err))
}
const upsertItem = registryName =>  item => {
	//console.dir('registry upsertItem', registryName, item)
	if(!item || !item.id) throw new Error(`Invalid registry item error for ${registryName}`, item)
	_.set(registries, `${registryName}.${item.id}`, item)
	localforage.setItem(registryName, JSON.stringify(get(registryName)()))
		.catch(err => console.error(`Registry update error for ${registryName}`, err, item))
}
export default function (registryName) {
	return {
		get: get(registryName),
		getItem: getItem(registryName),
		getItems: getItems(registryName),

		upsert: upsert(registryName),
		upsertItem: upsertItem(registryName)
	} 
		//.then(data => console.dir('getList data ' + registryName) && false || data)
}