// data.js
import m from 'mithril'
import _ from 'lodash'
import moment from 'moment-timezone/builds/moment-timezone-with-data-2012-2022.min'
//const Promise = require('promise-polyfill').default
import localforage from 'localforage'

// Services
import {mapActivities, buildTree} from '../services/messageArrayFunctions.js'
import {reqOptionsCreate, tokenFunction} from '../services/requests.js'
import {timeStampSort} from '../services/sorts.js'
import {unionLocalList, calcMeta, defaultMeta, combineMetas} from '../services/localData.js'
import Auth from '../services/auth.js'
const auth = new Auth()

import smartSearch from 'smart-search'
const sortNamesWithIdsByName = ([aName, aId], [bName, bId]) => aName.localeCompare(bName)



const appendData = dataField => data => {
	const retVal = dataField.assignList(dataField.list
		.filter(x => x.id !== data.id)
		.concat([data])
	)
	m.redraw()
	return retVal

}

//TODO: when data is requested:
//if that data is present check cache validity with the server. return local data if valid
//or get an update from the server and supply that

const loadListGen = schema => () => m.request({
	    method: 'GET',
	    url: '/api/' + schema,
})

const ts = () => Math.round((new Date()).getTime() / 1000)

const idFieldFilter = field => field !== 'deleted' && field !== 'timestamp' && field !== 'phptime' && field !== 'festival_series' && field !== 'name' && field !== 'year' && field !== 'content' && field !== 'value' && field !== 'description' && field !== 'level' && field !== 'default' && field !== 'website' && field !== 'language' && field !== 'cost' && field !== 'basedate' && field !== 'mode' && field !== 'start' && field !== 'end'


const fullRequest = options => (url, dataFieldName) => authResult => {

	const filterString = 'filter[order]=id%20DESC&filter[limit]=200'
	const remoteMethod = dataFieldName.replace(/remoteData\./, '')
	const queryString = remoteMethod === 'Messages' ? '?' + filterString : ''
	const baseUrl = url ? url : '/api/' + remoteMethod
	const reqUrl = (baseUrl) + (queryString)
	//console.log('fullRequest to ' + reqUrl + ' for ' + dataFieldName)
	//console.dir(options)
	if(options.debug) {
		console.log('debug: fullRequest to ' + reqUrl + ' for ' + dataFieldName)

	}
	const primaryRequest = m.request({
		method: 'GET',
		//use the dataFieldName after the last dot to access api
		url: reqUrl,
		config: tokenFunction(authResult),
		background: true
	})
	const secondaryRequest = remoteMethod === 'Messages' && options.userId ? m.request({
		method: 'GET',
		//use the dataFieldName after the last dot to access api
		url: baseUrl + '?filter={"where":{"and":[{"or":[{"messageType": 1}, {"messageType": 2}, {"messageType": 3}]}, {"fromuser": ' + options.userId + '}]}}',
		config: tokenFunction(authResult),
		background: true
	}) : Promise.resolve([])
	return Promise.all([primaryRequest, secondaryRequest])
		.then(([primaryResult, secondaryResult]) => [...primaryResult, ...secondaryResult])
}

const updateRequest = (timestamp, options = {}) => (url, dataFieldName) => authResult => {
	const filterString = options && options.filterString ? options.filterString : 'filter[where][timestamp][gte]=' + moment(timestamp).format('YYYY-MM-DD HH:mm:ss')
	const reqUrl = (url ? url : '/api/' + dataFieldName.replace(/remoteData\./, '')) + '?' + filterString
	//console.log('updateRequest to ' + reqUrl + ' for ' + dataFieldName)

	if(options && options.debug) {
	console.log('debug: updateRequest to ' + reqUrl + ' for ' + dataFieldName)

	}
	return m.request({
	    	method: 'GET',
	    	//use the dataFieldName after the last dot to access api
	    	url: reqUrl,
	  		config: tokenFunction(authResult),
	  		background: true
	})
}

const logResult = result => {
	console.log(result)
	return result
}

const logText = text => result => {
	console.log(text)
	return result
}

//returns true if the meta is the same as before the assign, false otherwise
const assignDataToList = (dataField, options = {skipRedraw: false, forceRedraw: false}) => result => {

	const oldMeta = _.clone(dataField.meta)

	dataField.assignList(result)

	if(options && options.debug) {
	console.log('assigningList length to ' + dataField.fieldName)
	console.log(dataField.list.length)
	console.log(options)

	}

	const newMeta = _.clone(dataField.meta)
	const metaChange = _.isEqual(oldMeta, newMeta)
	if(metaChange && (!options || !options.skipRedraw) || options && options.forceRedraw) {
		if(options && options.debug) {
			console.log('assigningList redraw triggered ' + dataField.fieldName)
		}
		m.redraw()

	}
	//console.log(dataField.list.length)
	return !metaChange
}

const localDataPresent = key => localforage.keys()
	//.then(logText('localDataPresent'))
	//.then(keys => {console.log(keys); return keys;})
	.then(keys => keys && keys.indexOf(key) > -1)
	//.then(logResult)
	//.then(logText(key))
	.catch(err => console.log(err))

const stale = (interval, lastRemoteLoad) => {
	const now = ts()
	const nextRemoteCheck = interval + lastRemoteLoad
	return Promise.resolve(now < nextRemoteCheck)
}

const localLastRemoteLoadValid = (key, interval) => localforage.getItem(key + '.lastRemoteLoad')
	//.then(logText('localLastRemoteLoadValid ' + key))
	.then(lastRemoteLoad => stale(interval, lastRemoteLoad))
	//.then(logResult)

const getMeta = dataFieldName => localforage
	.getItem(dataFieldName + '_meta')




//choose between full update and partial update
//use a partial update if dataFieldName_meta.timestamps[1] is defined and truthy in localforage
//if performing a partial update, load the timestamp to the update function and then return it
//otherwise return the full update function
const getUpdateFunctionPromise = (dataFieldName, options = {}) => Promise.all([
	getMeta(dataFieldName), 
	localforage.getItem(dataFieldName + '.lastRemoteLoad')])
	.then(val => {
		const meta = val[0]
		const lastRemoteLoad = val[1]
		const localDataDefined = lastRemoteLoad && meta && meta.timestamps && meta.timestamps.length
		const usePartialUpdate = localDataDefined  && meta.timestamps[1]
		//console.log('usePartialUpdate ' + usePartialUpdate)
		const updateFunction = usePartialUpdate ? updateRequest(meta.timestamps[1], options) : fullRequest(options)
		return updateFunction
	})
	.catch(err => console.log(err))


const localLoad = (dataField, dataFieldName, forceStale) => Promise.all([
	localforage.getItem(dataFieldName), localforage.getItem(dataFieldName + '.lastRemoteLoad')
])
	.then(assignDataToList(dataField))
	.then(result => {
		//loadValid will be swallowed and is only present to spawn the remoteLoad if needed
		const loadValid = localLastRemoteLoadValid(dataFieldName, dataField.remoteInterval)
			.then(localValid => {
				if(!localValid || forceStale) return dataField.remoteLoad()
				return Promise.resolve(true)
			})
		return result
	})
	.catch(err => console.error(dataFieldName, err))

//updateList returns a Promise that
//resolves to true if the list in memory is valid
//resolves to localLoad(dataField) if the local data is newer than the mem data
//also spawns a dataField.remoteLoad() if the local data is stale
//resolves to dataField.remoteLoad() otherwise
const updateList = (dataField, dataFieldName, forceRemoteLoad, options) => {
	//check if the memory list is valid
	const now = ts()
	const nextRemoteCheck = dataField.remoteInterval + dataField.lastRemoteLoad
	//resolves true if mem list is safe
	const memValidPromise = Promise.resolve(now < nextRemoteCheck)
		//check that the lastRemoteLoad mem value matches local
		.then(timeOk => timeOk && localforage
			.getItem(dataFieldName + '_meta')
			.then(localMeta => _.isEqual(dataField.meta, localMeta))
		)
	//check if there is valid local data present
	const localValidPromise = localLastRemoteLoadValid(dataFieldName, dataField.remoteInterval)

	return Promise.all([memValidPromise, localValidPromise])
		.then(([memValid, localValid]) => {
			if(memValid && localValid && !forceRemoteLoad) return true
			if(localValid) return localLoad(dataField, dataFieldName, forceRemoteLoad)
			//if the memory is not valid then force a full reload
			
			return dataField.remoteLoad(_.assign(options, 
				{forceFullLoad: !memValid || options.forceFullLoad}
			))
		})
		/*
		.then(dataPresent => {
			console.log(dataFieldName + ' updateList')
			console.log(dataPresent)
			return dataPresent
		})
		*/
		
		.catch(err => console.log(err))

}



const saveLocalList = (lastRemoteLoad, dataFieldName, dataField) => result => {

	if(!result || !result[0] || !result[0].length) return result

	unionLocalList(dataFieldName, {updateMeta: true})(result[0])
	
	if(false && dataFieldName === 'remoteData.Messages') {
		console.log('remoteData.Messages saveLocalList lastRemoteLoad ' + result[1])
	}
	localforage.setItem(dataFieldName + '.lastRemoteLoad', result[1])
		.catch(err => console.log(err))
	return result
}

//returns a promise that resolves to true if the mem data is unchanged, falsy if the data was changed
const loadRemote = (dataField, dataFieldName, url, options = {}) => {
	
	if(false && dataFieldName === 'remoteData.Messages') {
		console.log('remoteData.Messages loadRemote')
	}
	const authChain = auth.getAccessToken()
		.catch(err => console.log(err))
	const requestFunctionChain = getUpdateFunctionPromise(dataFieldName, options)
		.catch(err => console.log(err))
	
	return Promise.all([authChain, requestFunctionChain])
		.then(values => {
			if(!values[0]) throw "No token supplied for request"
			return values[1](url, dataFieldName)(values[0])

		})
		.then(removeDeletedFilter)
		.then(result => {
			const now = ts()
			return [result, now]
		})
		.then(saveLocalList(dataField.lastRemoteLoad, dataFieldName, dataField))
		//.then(logText('remote assign'))
		.then(assignDataToList(dataField, options))
		.catch(err => console.log(err))
}

const removeDeletedFilter = result => result.filter(d => !d.deleted)

const subjectDataField = type => {return {
	'10': 'Messages',
	'6': 'Series',
	'7': 'Festivals',
	'8': 'Dates',
	'9': 'Days',
	'3': 'Sets',
	'5': 'Venues',
	'4': 'Places',
	'2': 'Artists',
	'1': 'Users'
}[type]}

const messageEventConnection = typeString => {return {
	//a message about a place is connected to an event if:
	//the event is associated with a festival that has/will host(ed) the place
	Places: (m, e) => true,
	//a message about a user is connected to an event if:
	Users: (m, e) => false
}[typeString]}

const simpleDate = str => moment(str, 'YYYY-MM-DD', true).isValid()

const researchApplicable = (content, opt) => {
	if(!content) return true
	if(simpleDate(content)) return moment().isSameOrBefore(moment(content, 'YYYY-MM-DD', true), 'day')
	//if content starts with 'fest' and opt.festival is defined then parse the festivalId
	const optFest = opt.festivalId
	const contentFest = content.indexOf('fest ') === 0
	const contentFestId = contentFest && parseInt(content.slice(5), 10)
	if(optFest) {
		if (optFest === contentFestId) return true
		return false
	} else {
		if(contentFestId) return false
	}
	return true
}

var dateBaseCache = {}
var eventConnectedCache = {}
var bulkUpdateSubjectCache = {}

export const remoteData = {
	Artists: {
		fieldName: 'Artists',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Artists.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Artists.list = _.unionBy(newList, remoteData.Artists.list, 'id')
			remoteData.Artists.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Artists.setMeta(combineMetas(remoteData.Artists.meta, newMeta))
			remoteData.Artists.list = _.unionBy(newList, remoteData.Artists.list, 'id')
			return newList
		},
		append: data => appendData(remoteData.Artists)(data),
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Artists.meta = defaultMeta()
			remoteData.Artists.list = []
			remoteData.Artists.lastRemoteLoad = 0
		},
		reload: () => remoteData.Artists.lastRemoteLoad = ts() - remoteData.Artists.remoteInterval + 1,
		remoteInterval: 3600,
		get: id => _.find(remoteData.Artists.list, p => p.id === id),
		getMany: ids => remoteData.Artists.list.filter(d => ids.indexOf(d.id) > -1),
		getName: id => {
			//console.log('remoteData.Artists.getName ' + id)
			const data = remoteData.Artists.get(id)
			if(!data) return
			return data.name

		},
		getRating: (id, userId) => {
			const ratings = remoteData.Messages.forArtist(id)
				.filter(m => m.messageType === 2)
				.filter(m => !userId || m.fromuser === userId)
				.sort(timeStampSort)
			const ratingContent = ratings.length ? ratings[0].content : '0'
			const intValue = parseInt(ratingContent, 10)
			//console.log('data.js remoteData.Artists.getRating ratings.length ' + ratings.length )
			//console.log('data.js remoteData.Artists.getRating intValue ' + intValue )
			return intValue
		},
		virgins: () => {
			const futures = remoteData.Festivals.future()
					
			return remoteData.Artists.list
				.filter(a => remoteData.Lineups.artistInLineup(a.id))
				.filter(ar => remoteData.Messages.virginSubject({subjectType: 2, subject: ar.id}))
				.sort((a, b) => {
					//primary: in a lineup for a festival in the future
					const aFuture = _.some(futures, f => remoteData.Lineups.artistInFestival(a.id, f.id))
					const bFuture = _.some(futures, f => remoteData.Lineups.artistInFestival(b.id, f.id))
					const usePrimary = aFuture ? !bFuture : bFuture
					if(usePrimary && aFuture) return -1
					if(usePrimary && bFuture) return 1
					//secondary: peak priority level
					const al = remoteData.Lineups.peakArtistPriLevel(a.id)
					const bl = remoteData.Lineups.peakArtistPriLevel(b.id)
					return al -bl
				})
		},
		//no comment
		//no rating
		//no set with a rating
		//no set with a comment
		idFields: () => remoteData.Artists.list.length ? 
			Object.keys(remoteData.Artists.list[0]).filter(idFieldFilter) : 
			[],
		forFestival: festivalId => {
			const artistIds = remoteData.Lineups.getFestivalArtistIds(festivalId)
			return remoteData.Artists.getMany(artistIds)
		},
		getSubjectObject: id => {return {subjectType: 2, subject: id}},
		isArtist: subject => subject.subjectType === 2,

		//a message about an artist is connected to an event if:
		//the event is associated with a festival that has the artist in a lineup
		messageEventConnection: e => m => {
			const mValid = remoteData.Artists.isArtist(m)
			const artistFestivals = remoteData.Lineups.festivalsForArtist(m.subject)
				.map(id => remoteData.Festivals.getSubjectObject(id))
			const retVal = mValid && _.find(
				artistFestivals, 
				f => remoteData.Festivals.messageEventConnection(e)(f)
			)
			//console.log('remoteData.Artists.messageEventConnection')
			//console.log('mValid')
			//console.log(mValid)
			//console.log('artistFestivals')
			//console.log(artistFestivals)
			//console.log('retVal')
			//console.log(retVal)

			return retVal
		},
		patternMatch: (pattern, count = 5) => {
			return _.take(smartSearch(remoteData.Artists.list,
					[pattern], {name: true}
					), count)
					.map(x => x.entry)
		},
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Artists, 'remoteData.Artists', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Artists, 'remoteData.Artists', undefined, options),
		update: (data, id) => {
			const end = 'Artists/update?where={"id":' + id + '}'
			//console.log('update artists')
			//console.log(data)
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Artists.remoteLoad)
				.catch(logResult)
		},
		merge: (id1, id2) => {
			const end = 'Artists/admin/merge/' + id1 + '/' + id2
			//console.log('update artists')
			//console.log(data)
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)()))
				.then(remoteData.Artists.remoteLoad)
				.catch(logResult)

		}
	},
	Messages: {
		fieldName: 'Messages',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Messages.meta = _.clone(meta),
		clear: () => {
			remoteData.Messages.meta = defaultMeta()
			remoteData.Messages.list = []
			remoteData.Messages.lastRemoteLoad = 0
		},
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Messages.list = _.unionBy(newList, remoteData.Messages.list, 'id')
			remoteData.Messages.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			//console.log('remoteData.Messages.backfillList ', newList.length)
			const newMeta = calcMeta(newList)
			remoteData.Messages.setMeta(combineMetas(remoteData.Messages.meta, newMeta))
			remoteData.Messages.list = _.unionBy(newList, remoteData.Messages.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		reload: () => remoteData.Messages.lastRemoteLoad = ts() - remoteData.Messages.remoteInterval + 1,
		remoteInterval: 10,
		get: id => _.find(remoteData.Messages.list, p => p.id === id),
		getMany: ids => remoteData.Messages.list.filter(d => ids.indexOf(d.id) > -1),
		getFiltered: filter => _.filter(remoteData.Messages.list, filter),
		getName: id => {
			const v = remoteData.Messages.get(id)
			if(!v || !v.content) return ''
			//fromuser to touser re:subjectName
			const fromField = remoteData.Users.getName(v.fromuser)
			const toField = v.touser ? ' to ' + remoteData.Users.getName(v.touser) : ''
			//console.log('Messages getName')
			//console.log(v.subjectType)
			//console.log(v.subject)
			const subjectName = ' re: ' + remoteData[subjectDataField(v.subjectType)].getName(v.subject).replace(/^ re: /, '')
			return _.truncate(subjectName)
		},
		getSubjectObject: id => {return {subjectType: 10, subject: id}},
		//follow the message chain until reaching a message that is not about a message
		messageEventConnection: e => {
			const mConnect = m => {
				if(!m) return false
				const typeString = subjectDataField(m.subjectType)
				if(typeString !== 'Messages') return remoteData[typeString].messageEventConnection(e)(m)
				return mConnect(remoteData.Messages.get(m.subject))
			}
			return mConnect
		},
		eventConnectedFilter: e => m => {
			const cachePath = '' + e.subject + '.' + e.subjectType + '.' + m.subject + '.' + m.subjectType
			const cacheValue = _.get(eventConnectedCache, cachePath)
			if(!_.isUndefined(cacheValue)) return cacheValue
			const typeString = subjectDataField(m.subjectType)
			//console.log('remoteData.Messages.eventConnectedFilter cachePath')
			//console.log(typeString)
			//console.log(cachePath)
			const connected = (m && (!e || remoteData[typeString].messageEventConnection(e)(m))) && true || false 
			//console.log('remoteData.Messages.eventConnectedFilter event')
			//console.log(e)
			//console.log('remoteData.Messages.eventConnectedFilter message')
			//console.log(m)
			//console.log('remoteData.Messages.eventConnectedFilter typeString')
			//console.log(typeString)
			//console.log('remoteData.Messages.eventConnectedFilter connected')
			//console.log(connected)
			if(!_.isUndefined(m) && !_.isUndefined(e)) _.set(eventConnectedCache, cachePath, connected)
			return connected

		},
		discussionOf: id => remoteData.Messages.list.filter(m => m.baseMessage === id),
		aboutType: sType => remoteData.Messages.list.filter(m => m.subjectType === sType),
		ofType: mType => remoteData.Messages.list.filter(m => m.messageType === mType),
		byAuthor: author => remoteData.Messages.list.filter(m => m.fromuser === author),
		ofAndAbout: (mType, sType) => remoteData.Messages.list.filter(m => m.messageType === mType && m.subjectType === sType),
		ofAboutAndBy: (mType, sType, author) => remoteData.Messages.list.filter(m => m.messageType === mType && m.subjectType === sType && m.fromuser === author),
		aboutSets: () => remoteData.Messages.list.filter(m => m.subjectType === 3),
		gameTimeRatings: () => remoteData.Messages.aboutSets().filter(m => m.messageType === 2),
		setAverageRating: setId => {
			const gameTimeRatings = remoteData.Messages.gameTimeRatings()
			const filtered = gameTimeRatings
				.filter(m => (m.subject === setId))
			const retVal = _.meanBy(filtered,
				m => parseInt(m.content, 10))
			//console.log('msg length: ' + remoteData.Messages.list.length)
			//console.log('filtered length: ' + filtered.length)
			//console.log('setAverageRating: ' + retVal)
			//console.log('setId: ' + setId)
			//console.log('gameTimeRatings.length: ' + gameTimeRatings.length)
			return retVal ? retVal : 0
		},
		lastCheckin: userId => remoteData.Messages.list
			.filter(m => m.fromuser === userId && m.messageType === 3)
			.sort(timeStampSort)
			.reduce((pv, cv, i) => !i ? cv : pv, false),
		recentCommentsAll: () => remoteData.Messages.list
			.filter(m => m.messageType === 1),
		recentDiscussionAll: viewer => remoteData.Messages.list
			.filter(m => !viewer || viewer !== m.fromuser)
			.filter(m => m.messageType === 8 || m.messageType === 1)
			.filter(m => remoteData.MessagesMonitors.unread(m.id))
			.sort(timeStampSort),
			//, viewer => '' + viewer + '.' + remoteData.Messages.lastRemoteLoad + '.' + remoteData.MessagesMonitors.lastRemoteLoad),
		recentDiscussions: viewer => _.uniqBy(remoteData.Messages.recentDiscussionAll(viewer)
			.map(message => message.baseMessage ? remoteData.Messages.get(message.baseMessage) : message), 'id'),
		recentDiscussionEvent: (viewer, event) => remoteData.Messages.recentDiscussionAll(viewer)
			.filter(remoteData.Messages.eventConnectedFilter(event)),
		centerObjects: () => {
			const baseMessages = remoteData.Messages.list
				.filter(m => !m.baseMessage)

			const discussionMessages = remoteData.Messages.list
				.filter(m => m.baseMessage)

			//reduce the discussionMessages into an object organized by baseMessage
			const discussionByBase = discussionMessages.reduce((discussObj, message) => {
				const baseMessage = '' + message.baseMessage
				discussObj[baseMessage] = discussObj[baseMessage] ? discussObj[baseMessage] : []
				discussObj[baseMessage].push(message)
				return discussObj
			}, {})
		},
		virginSubject: subjectObject => !_.some(remoteData.Messages.list,
			m => (m.subjectType === subjectObject.subjectType) && (m.subject === subjectObject.subject)),
		forArtist: artistId => remoteData.Messages.list
			.filter(m => (m.subjectType === 2) && (m.subject === artistId)),
		forSet: setId => remoteData.Messages.aboutSets()
			.filter(m => m.subject === setId),
		forArtistReviewCard: artistId => remoteData.Messages.list
			.filter(m => (m.subjectType === 2) && (m.subject === artistId) && m.fromuser)
			.reduce((final, me) => {
				if(!final[me.fromuser]) final[me.fromuser] = []
				final[me.fromuser].push(me)
				final[me.fromuser] = final[me.fromuser]
					.sort((a, b) => {
						if(a.messageType - b.messageType) return a.messageType - b.messageType
						return timeStampSort(a, b)
					})
				return final
			}, {}),
		forced: ({artistIds, festivalId}) => _.uniq(remoteData.Messages.list
			.filter(m => m.fromuser ===  m.touser && m.subjectType === 2 && m.messageType === 4 && _.includes(artistIds, m.subject))
			.filter(m => researchApplicable(m.content, {festivalId: festivalId}))
			.map(m => m.subject)),
		skipped: ({artistIds, festivalId}) => _.uniq(remoteData.Messages.list
			.filter(m => m.fromuser ===  m.touser && m.subjectType === 2 && m.messageType === 5 && _.includes(artistIds, m.subject))
			.filter(m => researchApplicable(m.content, {festivalId: festivalId}))
			.map(m => m.subject)),
		saved: ({artistIds, festivalId}) => _.uniq(remoteData.Messages.list
			.filter(m => m.fromuser ===  m.touser && m.subjectType === 2 && m.messageType === 6 && _.includes(artistIds, m.subject))
			.filter(m => researchApplicable(m.content, {festivalId: festivalId}))
			.map(m => m.subject)),
		hidden: ({artistIds, festivalId}) => _.uniq(remoteData.Messages.list
			.filter(m => m.fromuser ===  m.touser && m.subjectType === 2 && m.messageType === 7 && _.includes(artistIds, m.subject))
			.filter(m => researchApplicable(m.content, {festivalId: festivalId}))
			.map(m => m.subject)),
		recentRatings: ({artistIds, author}) => _.uniq(remoteData.Messages.list
			.filter(m => m.subjectType === 2 && m.messageType === 2 && m.fromuser === author && _.includes(artistIds, m.subject))
			.filter(m => moment(m.timestamp).add(1, 'y').isAfter())
			.map(m => m.subject)),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Messages, 'remoteData.Messages', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Messages, 'remoteData.Messages', undefined, options),
		loadForFestival: festivalId => {
			if(!festivalId) {
				return Promise.reject('No festivalId')
			}
			//console.log('loadForFestival')
			//console.log(festivalId)
			const eventSubjectObject = remoteData.Festivals.getSubjectObject(festivalId)
			//check if the festival has already been loaded
			const dataFieldName = 'Messages'
			const end = dataFieldName + '/forFestival/'
			if(!bulkUpdateSubjectCache[end]) bulkUpdateSubjectCache[end] = {}

			const alreadyLoaded = bulkUpdateSubjectCache[end][festivalId]
			if(alreadyLoaded) return Promise.resolve(true)
			bulkUpdateSubjectCache[end][festivalId] = true


			//get the raw data
			const bulkUpdatePromise = auth.getAccessToken()
				.then(token => m.request(reqOptionsCreate(tokenFunction(token))(end + festivalId, 'GET')()))
				.then(result => result.data)
				.catch(err => {
					bulkUpdateSubjectCache[end][festivalId] = false
					console.log('remoteData.Messages loadForFestival bulkUpdatePromise')
					console.log(err)
				})

			//append to mem
			const memAppend = bulkUpdatePromise
				.then(remoteData.Messages.backfillList)
				.then(result => {
					m.redraw()
					return result
				})
				.catch(err => {
					bulkUpdateSubjectCache[end][festivalId] = false
					console.log('remoteData.Messages loadForFestival memAppend')
					console.log(err)
				})
				/*
				.then(result => {
					console.log('loadForFestival memAppend')
					console.log(remoteData.Messages.list.length)
					return result
				})
				*/

			//append to local
			const localAppend = bulkUpdatePromise
				.then(unionLocalList('remoteData.' + dataFieldName, {updateMeta: true}))
				.catch(err => {
					bulkUpdateSubjectCache[end][festivalId] = false
					console.log('remoteData.Messages loadForFestival localAppend')
					console.log(err)
				})

			//update local meta data
			const localMetaUpdate = bulkUpdatePromise
				//.then(logResult)
				.then(calcMeta)
				.then(meta => remoteData.Messages.setMeta(meta))
				.catch(err => {
					bulkUpdateSubjectCache[end][festivalId] = false
					console.log('remoteData.Messages loadForFestival localMetaUpdate')
					console.log(err)
				})

			return Promise.all([memAppend, localAppend, localMetaUpdate])
				.catch(err => {
					bulkUpdateSubjectCache[end][festivalId] = false
					console.log('remoteData.Messages loadForFestival Promise.all')
					console.log(err)
				})

		},		
		loadForArtist: artistId => {
			const eventSubjectObject = remoteData.Festivals.getSubjectObject(artistId)
			//check if the artist has already been loaded
			const dataFieldName = 'Messages'
			const end = dataFieldName + '/forArtist/'
			if(!bulkUpdateSubjectCache[end]) bulkUpdateSubjectCache[end] = {}

			const alreadyLoaded = bulkUpdateSubjectCache[end][artistId]
			if(alreadyLoaded) return
			bulkUpdateSubjectCache[end][artistId] = true


			//get the raw data
			const bulkUpdatePromise = auth.getAccessToken()
				.then(token => m.request(reqOptionsCreate(tokenFunction(token))(end + artistId, 'GET')()))
				.then(result => result.data)
				.catch(err => {
					bulkUpdateSubjectCache[end][artistId] = false
					console.log('remoteData.Messages loadForArtist bulkUpdatePromise')
					console.log(err)
				})

			//append to mem
			const memAppend = bulkUpdatePromise
			/*
				.then(result => {
					console.log('memAppend')
					console.log(result)
					return result
				})
				*/
				.then(remoteData.Messages.backfillList)
				.then(result => {
					if(result.length) m.redraw()
					return result
				})
				.catch(err => {
					bulkUpdateSubjectCache[end][artistId] = false
					console.log('remoteData.Messages loadForArtist memAppend')
					console.log(err)
				})
				/*
				.then(result => {
					console.log('loadForArtist memAppend')
					console.log(remoteData.Messages.list.length)
					return result
				})
				*/

			//append to local
			const localAppend = bulkUpdatePromise
				.then(unionLocalList('remoteData.' + dataFieldName, {updateMeta: true}))
				.catch(err => {
					bulkUpdateSubjectCache[end][artistId] = false
					console.log('remoteData.Messages loadForArtist localAppend')
					console.log(err)
				})

			//update local meta data
			const localMetaUpdate = bulkUpdatePromise
				//.then(logResult)
				.then(calcMeta)
				.then(meta => remoteData.Messages.setMeta(meta))
				.catch(err => {
					bulkUpdateSubjectCache[end][artistId] = false
					console.log('remoteData.Messages loadForArtist localMetaUpdate')
					console.log(err)
				})

			return Promise.all([memAppend, localAppend, localMetaUpdate])
				.catch(err => {
					bulkUpdateSubjectCache[end][artistId] = false
					console.log('remoteData.Messages loadForArtist Promise.all')
					console.log(err)
				})

		},
		create: data => {
			const dataFieldName = 'Messages'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.then(remoteData.Messages.remoteLoad)
				.catch(logResult)
		},
		upsert: data => {
			const end = 'Messages'
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end, 'PUT')(data)))
				.then(remoteData.Messages.remoteLoad)
				.catch(logResult)

		},
		updateInstance: (id, data) => {
			const end = 'Messages/' + id
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end, 'PUT')(data)))
				.then(remoteData.Messages.loadList)
				.catch(logResult)

		}
	},
	MessagesMonitors: {
		fieldName: 'MessagesMonitors',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.MessagesMonitors.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.MessagesMonitors.list = _.unionBy(newList, remoteData.MessagesMonitors.list, 'id')
			remoteData.MessagesMonitors.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.MessagesMonitors.setMeta(combineMetas(remoteData.MessagesMonitors.meta, newMeta))
			remoteData.MessagesMonitors.list = _.unionBy(newList, remoteData.MessagesMonitors.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.MessagesMonitors.meta = defaultMeta()
			remoteData.MessagesMonitors.list = []
			remoteData.MessagesMonitors.lastRemoteLoad = 0
		},
		reload: () => remoteData.MessagesMonitors.lastRemoteLoad = ts() - remoteData.MessagesMonitors.remoteInterval + 1,
		remoteInterval: 60,
		get: id => _.find(remoteData.MessagesMonitors.list, p => p.id === id),
		getMany: ids => remoteData.MessagesMonitors.list.filter(d => ids.indexOf(d.id) > -1),
		unread: id => _.every(remoteData.MessagesMonitors.list, v => v.message !== id),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.MessagesMonitors, 'remoteData.MessagesMonitors', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.MessagesMonitors, 'remoteData.MessagesMonitors', undefined, options),
		markRead: id => {
			const data = {message:id}
			//mark locally
			remoteData.MessagesMonitors.list.push(data)
			//send to server
			remoteData.MessagesMonitors.create(data)

		},
		create: data => {
			const dataFieldName = 'MessagesMonitors'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.then(remoteData.MessagesMonitors.remoteLoad)
				.then(remoteData.Messages.remoteLoad)
				.catch(logResult)
		},
		batchCreate: data => {
			const end = 'MessagesMonitors/batchCreate/'
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.MessagesMonitors.remoteLoad)
				.catch(logResult)
		},
		batchDelete: data => {
			const end = 'MessagesMonitors/batchDelete'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.MessagesMonitors.remoteLoad)
				.catch(logResult)
		}
	},
	Intentions: {
		fieldName: 'Intentions',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Intentions.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Intentions.list = _.unionBy(newList, remoteData.Intentions.list, 'id')
			remoteData.Intentions.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Intentions.setMeta(combineMetas(remoteData.Intentions.meta, newMeta))
			remoteData.Intentions.list = _.unionBy(newList, remoteData.Intentions.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Intentions.meta = defaultMeta()
			remoteData.Intentions.list = []
			remoteData.Intentions.lastRemoteLoad = 0
		},
		reload: () => remoteData.Intentions.lastRemoteLoad = ts() - remoteData.Intentions.remoteInterval + 1,
		remoteInterval: 60,
		get: id => _.find(remoteData.Intentions.list, p => p.id === id),
		getMany: ids => remoteData.Intentions.list.filter(d => ids.indexOf(d.id) > -1),
		forSubject: subjectObject => _.some(remoteData.Intentions.list, i => subjectObject.subject === i.subject && subjectObject.subjectType === i.subjectType),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Intentions, 'remoteData.Intentions', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Intentions, 'remoteData.Intentions', undefined, options),
		setIntent: subjectObject => {
			const data = subjectObject
			//mark locally
			remoteData.Intentions.list.push(data)
			//send to server
			remoteData.Intentions.create(data)

		},
		clearIntent: subjectObject => {
			const intentIds = remoteData.Intentions.list
				.filter(i => i.subject === subjectObject.subject && i.subjectType === subjectObject.subjectType)
				.map(i => i.id)

			//mark in memory
			remoteData.Intentions.list = remoteData.Intentions.list
				.filter(i => i.subject !== subjectObject.subject || i.subjectType !== subjectObject.subjectType)
			
			//mark locally
			localforage.setItem('remoteData.Intentions', remoteData.Intentions.list)

			//send to server
			//console.log('remoteData.Intentions.clearIntent')
			//console.log(subjectObject)
			//console.log(intentIds)
			//console.log(remoteData.Intentions.list)
			remoteData.Intentions.batchDelete(intentIds)

		},
		create: data => {
			const dataFieldName = 'Intentions'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.then(remoteData.Intentions.loadList)
				.catch(logResult)
		},
		batchCreate: data => {
			const end = 'Intentions/batchCreate/'
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Intentions.loadList)
				.catch(logResult)
		},
		batchDelete: data => {
			const end = 'Intentions/batchDelete'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Intentions.loadList)
				.catch(logResult)
		}
	},
	Images: {
		fieldName: 'Images',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Images.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Images.list = _.unionBy(newList, remoteData.Images.list, 'id')
			remoteData.Images.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Images.setMeta(combineMetas(remoteData.Images.meta, newMeta))
			remoteData.Images.list = _.unionBy(newList, remoteData.Images.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Images.meta = defaultMeta()
			remoteData.Images.list = []
			remoteData.Images.lastRemoteLoad = 0
		},
		reload: () => remoteData.Images.lastRemoteLoad = ts() - remoteData.Images.remoteInterval + 1,
		remoteInterval: 3600,
		get: id => _.find(remoteData.Images.list, p => p.id === id),
		getMany: ids => remoteData.Images.list.filter(d => ids.indexOf(d.id) > -1),
		getTitle: id => remoteData.Images.get(id).title,
		getSrc: id => remoteData.Images.get(id).url,
		getAttributionAr: id => {
			const el = remoteData.Images.get(id)
			return el ? [el.title, el.sourceUrl, el.author, el.license, el.licenseUrl] : []
		},
		getName: id => remoteData.Images.getTitle(id),
		messageEventConnection: e => m => false,
		forArtist: artistId => remoteData.Images.list
			.filter(m => (m.subjectType === 2) && (m.subject === artistId)),
		forSubject: (subjectType, subject) => remoteData.Images.list
			.filter(m => (m.subjectType === subjectType) && (m.subject === subject)),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Images, 'remoteData.Images', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Images, 'remoteData.Images', undefined, options),
		create: data => {
			const dataFieldName = 'Images'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.then(() => remoteData[dataFieldName].list.push(data))
				.then(remoteData.Images.remoteLoad)
				.catch(logResult)
		}

	},
	Series: {
		fieldName: 'Series',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Series.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Series.list = _.unionBy(newList, remoteData.Series.list, 'id')
			remoteData.Series.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Series.setMeta(combineMetas(remoteData.Series.meta, newMeta))
			remoteData.Series.list = _.unionBy(newList, remoteData.Series.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Series.meta = defaultMeta()
			remoteData.Series.list = []
			remoteData.Series.lastRemoteLoad = 0
		},
		reload: () => remoteData.Series.lastRemoteLoad = ts() - remoteData.Series.remoteInterval + 1,
		remoteInterval: 3600,
		get: id => _.find(remoteData.Series.list, p => p.id === id),
		getMany: ids => remoteData.Series.list.filter(d => ids.indexOf(d.id) > -1),
		idFields: () => remoteData.Series.list.length ? 
			Object.keys(remoteData.Series.list[0]).filter(idFieldFilter) : 
			[],
		getEventName: id => {
			//console.log('remoteData.Series.getEventName')
			//console.log(id)
			const v = remoteData.Series.get(id)
			//console.log(v)
			if(!v || !v.name) return ''
			return v.name
		},
		getEventNames: () => remoteData.Series.list.map(x => x.name),
		getEventNamesWithIds: () => remoteData.Series.list
			.map(x => [x.name, x.id])
			.sort(sortNamesWithIdsByName),
		getName: id => remoteData.Series.getEventName(id),
		getSubFestivalIds: id => {
			//console.log('Series getSubFestivalIds for ' + id + ' chosen from among ' + remoteData.Festivals.list.length)
			return remoteData.Festivals.list.filter(s => s.series === id).map(s => s.id)
		},
		getSubDateIds: (id, filter = x => x) => {
			const festivals = remoteData.Series.getSubFestivalIds(id)
			return remoteData.Dates.list.filter(s => festivals.indexOf(s.festival) > -1)
				.filter(filter)
				.map(s => s.id)
		},
		getSubDayIds: id => {
			const dates = remoteData.Series.getSubDateIds(id)
			return remoteData.Days.list.filter(s => dates.indexOf(s.date) > -1).map(s => s.id)
		},
		getSubSetIds: id => {
			const days = remoteData.Series.getSubDayIds(id)
			return remoteData.Sets.list.filter(s => days.indexOf(s.day) > -1).map(s => s.id)
		},
		getSubIds: id => remoteData.Series.getSubFestivalIds(id),
		getSubjectObject: id => {return {subjectType: 6, subject: id}},
		getVenueIds: id => remoteData.Dates.getMany(
				remoteData.Series.getSubDateIds(id)
		)
			.sort((a, b) => {
				const am = moment(a.baseDate).utc()
				const bm = moment(b.baseDate).utc()
				return am.diff(bm)
			})
			.map(date => date.venue),
		noFutureDates: (waitDays = 180) => remoteData.Series.list
			.filter(s => !s.hiatus)
			.filter(s => !remoteData.Series.getSubDateIds(s.id, date => {
				//baseDate is after waitDays days ago
				return moment(date.basedate).isAfter(moment().subtract(waitDays, 'days'))
			}).length),
		activeDate: id => _.some(
			remoteData.Series.getSubDateIds(id), 
			remoteData.Dates.active
		) ,
		isEvent: subject => subject.subjectType === 6,
		messageEventConnection: e => m => remoteData.Series.isEvent(m) && 
			remoteData.Series.isEvent(e) && 
			m.subject === e.subject,
		patternMatch: (pattern, count = 5) => {
			const result = _.take(smartSearch(remoteData.Series.list,
					[pattern], {name: true}
					), count)
					.map(x => x.entry)
			//console.log('Series list count ' + remoteData.Series.list.length)
			//console.log('Series Pattern match count ' + result.length)
			//console.log('Series Pattern  ' + pattern)
			return result
		},
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Series, 'remoteData.Series', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Series, 'remoteData.Series', undefined, options),
		create: data => {
			const dataFieldName = 'Series'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
			},
		updateInstance: (id, data) => {
			const end = 'Series/' + id
			const currentEl = remoteData.Series.get(id)
			const newEl = _.assign({}, currentEl, data)
			console.log('remoteData.Series updateInstance')
			console.log(currentEl)
			console.log(newEl)
			console.log(data)
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end, 'PUT')(newEl)))
				.then(() => remoteData.Series.backfillList([newEl]))
				.then(() => unionLocalList('remoteData.Series', {updateMeta: false})([newEl]))
				.then(remoteData.Series.loadList)
				.then(result => {
					console.log('remoteData.Series updateInstance promise')
					console.log(remoteData.Series.get(id))
					return result
				})
				.catch(logResult)

		}

	},
	Festivals: {
		fieldName: 'Festivals',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Festivals.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Festivals.list = _.unionBy(newList, remoteData.Festivals.list, 'id')
			remoteData.Festivals.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Festivals.setMeta(combineMetas(remoteData.Festivals.meta, newMeta))
			remoteData.Festivals.list = _.unionBy(newList, remoteData.Festivals.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Festivals.meta = defaultMeta()
			remoteData.Festivals.list = []
			remoteData.Festivals.lastRemoteLoad = 0
		},
		reload: () => remoteData.Festivals.lastRemoteLoad = ts() - remoteData.Festivals.remoteInterval + 1,
		remoteInterval: 3600,
		idFields: () => remoteData.Festivals.list.length ? 
			Object.keys(remoteData.Festivals.list[0]).filter(idFieldFilter) : 
			[],
		get: id => _.find(remoteData.Festivals.list, p => p.id === id),
		getMany: ids => remoteData.Festivals.list.filter(d => ids.indexOf(d.id) > -1),
		getSeriesId: id => {
			const fest = _.find(remoteData.Festivals.list, p => p.id === id)
			if(!fest) return
			return fest.series
		},
		getSubDateIds: id => {
			return remoteData.Dates.list.filter(s => s.festival === id).map(s => s.id)
		},
		getSubDayIds: id => {
			const dates = remoteData.Festivals.getSubDateIds(id)
			return remoteData.Days.list.filter(s => dates.indexOf(s.date) > -1).map(s => s.id)
		},
		getSubSetIds: id => {
			const days = remoteData.Festivals.getSubDayIds(id)
			return remoteData.Sets.list.filter(s => days.indexOf(s.day) > -1).map(s => s.id)
		},
		getSuperId: id => remoteData.Festivals.getSeriesId(id),
		getSubIds: id => remoteData.Festivals.getSubDateIds(id),
		getPeerIds: id => remoteData.Series.getSubIds(remoteData.Festivals.getSuperId(id))
			.filter(x => x !== id),
		getLineupArtistIds: id => remoteData.Lineups.getFestivalArtistIds(id),
		getResearchList: (id, author) => {
			const artists = remoteData.Artists.getMany(remoteData.Lineups.getFestivalArtistIds(id))
			const artistIds = artists
				.map(a => a.id)
			const researchObject = {
				forces: remoteData.Messages.forced({
					artistIds: artistIds,
					festivalId: id
				}),
				skips: remoteData.Messages.skipped({
					artistIds: artistIds,
					festivalId: id
				}),
				saves: remoteData.Messages.saved({
					artistIds: artistIds,
					festivalId: id
				}),
				hides: remoteData.Messages.hidden({
					artistIds: artistIds,
					festivalId: id
				}),
				recents: remoteData.Messages.recentRatings({
					artistIds: artistIds,
					author: author
				})
			}
			//console.log('remoteData.Festivals.getResearchList ' + id + ' ' + author)
			//console.log('remoteData.Festivals.getResearchList recents', researchObject.recents)
			return artists
				.filter(a => {
					//in
					const forced = _.includes(researchObject.forces, a.id)
					//out
					const recent = !forced && _.includes(researchObject.recents, a.id)
					const skipped = !forced && !recent && _.includes(researchObject.skips, a.id)
					const saved = !forced && !recent && !skipped && _.includes(researchObject.saves, a.id)
					const hidden = !forced && !recent && !skipped && !saved && _.includes(researchObject.hides, a.id)
					return forced || !recent && !skipped && !saved && !hidden
				})
				.sort((a, b) => {
					const aPriId = remoteData.Lineups.getPriFromArtistFest(a.id, id)
					const bPriId = remoteData.Lineups.getPriFromArtistFest(b.id, id)
					if(aPriId === bPriId) return a.name.localeCompare(b.name)
					const aPriLevel = remoteData.ArtistPriorities.getLevel(aPriId)
					const bPriLevel = remoteData.ArtistPriorities.getLevel(bPriId)
					return aPriLevel - bPriLevel
				})},
		eventActive: id => remoteData.Festivals.get(id) && (parseInt(remoteData.Festivals.get(id).year, 10) >= (new Date().getFullYear())),
		activeDate: id => _.some(
			remoteData.Festivals.getSubDateIds(id), 
			remoteData.Dates.active
		) ,
		getEventName: id => {
			const v = remoteData.Festivals.get(id)
			if(!v || !v.year) return ''
			return remoteData.Series.getEventName(v.series) + ' ' + v.year
		},
		getEventNames: () => remoteData.Festivals.list.map(x => remoteData.Series.getEventName(x.series) + ' ' + x.year),
		getEventNamesWithIds: superId => remoteData.Festivals.list
			.filter(e => !superId || e.series === superId)
			.map(x => [remoteData.Festivals.getEventName(x.id), x.id])
			.sort(sortNamesWithIdsByName),
		getName: id => remoteData.Festivals.getEventName(id),
		getSubjectObject: id => {return {subjectType: 7, subject: id}},
		future: (daysAhead = 0) => {
			//console.log(JSON.stringify(remoteData.Festivals.meta) + '.' + JSON.stringify(remoteData.Dates.meta))
			const dateMethod = daysAhead ? 'soon' : 'future'
			const futureDates = remoteData.Dates[dateMethod](daysAhead)
			//console.log(futureDates.length)
			return remoteData.Festivals.getMany(futureDates
				.map(d => d.festival))
		}, 
		isEvent: subject => subject.subjectType === 7,
		messageEventConnection: e => m => remoteData.Festivals.isEvent(m) && 
			remoteData.Festivals.isEvent(e) && 
			m.subject === e.subject,
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Festivals, 'remoteData.Festivals', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Festivals, 'remoteData.Festivals', undefined, options),
		intended: () => {
			//console.log('' + remoteData.Festivals.list.length + '-' + remoteData.Dates.list.length)
			const futures = remoteData.Festivals.future()
			//console.log('intended')
			//console.log(remoteData.Intentions.list)
			return futures.filter(festival => remoteData.Intentions.forSubject(remoteData.Festivals.getSubjectObject(festival.id)))
		},
		create: data => {
			const dataFieldName = 'Festivals'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.catch(logResult)
		}
	},
	Dates: {
		fieldName: 'Dates',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Dates.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Dates.list = _.unionBy(newList, remoteData.Dates.list, 'id')
			remoteData.Dates.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Dates.setMeta(combineMetas(remoteData.Dates.meta, newMeta))
			remoteData.Dates.list = _.unionBy(newList, remoteData.Dates.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		reload: () => remoteData.Dates.lastRemoteLoad = ts() - remoteData.Dates.remoteInterval + 1,
		remoteInterval: 3600,
		clear: () => {
			remoteData.Dates.meta = defaultMeta()
			remoteData.Dates.list = []
			remoteData.Dates.lastRemoteLoad = 0
		},
		idFields: () => remoteData.Dates.list.length ? 
			Object.keys(remoteData.Dates.list[0]).filter(idFieldFilter) : 
			[],
		get: id => _.find(remoteData.Dates.list, p => p.id === id),
		getMany: ids => remoteData.Dates.list.filter(d => ids.indexOf(d.id) > -1),
		getFestivalId: id => {
			const date = remoteData.Dates.get(id)
			if(!date) return
			return date.festival
		},
		getSeriesId: id => {
			return remoteData.Festivals.getSeriesId(remoteData.Dates.getFestivalId(id))
		},
		getSubDayIds: id => {
			return remoteData.Days.list.filter(s => s.date === id).map(s => s.id)
		},
		getSubSetIds: id => {
			const days = remoteData.Dates.getSubDayIds(id)
			return remoteData.Sets.list.filter(s => days.indexOf(s.day) > -1).map(s => s.id)
		},
		getSuperId: id => remoteData.Dates.getFestivalId(id),
		getSubIds: id => remoteData.Dates.getSubDayIds(id),
		getPeerIds: id => remoteData.Festivals.getSubIds(remoteData.Dates.getSuperId(id))
			.filter(x => x !== id),
		getLineupArtistIds: id => {
			const festivalId = remoteData.Dates.getFestivalId(id)
			if(!festivalId) return
			return remoteData.Lineups.getFestivalArtistIds(festivalId)
		},
		getEventName: id => {
			const v = remoteData.Dates.get(id)
			if(!v || !v.name) return ''
			return remoteData.Festivals.getEventName(v.festival) + ' ' + v.name
		},
		getEventNames: () => remoteData.Dates.list.map(x => remoteData.Festivals.getEventName(x.festival) + ' ' + x.name),
		getEventNamesWithIds: superId => remoteData.Dates.list
			.filter(e => !superId || e.festival === superId)
			.map(x => [remoteData.Festivals.getEventName(x.festival) + ' ' + x.name, x.id])
			.sort(sortNamesWithIdsByName),
		getName: id => remoteData.Dates.getEventName(id),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Dates, 'remoteData.Dates', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Dates, 'remoteData.Dates', undefined, options),
		getBaseMoment: id => {
					const cached = _.get(dateBaseCache, 'base.' + id)
					const cachedZone = _.get(dateBaseCache, 'base.zone.' + id)
					//if(cached) console.log('Dates.getBaseMoment cached+zone',cached, cachedZone)
					if(cached) return moment.tz(cached, cachedZone)
					const date = remoteData.Dates.get(id)
					if(!date) throw 'remoteData.Dates.getBaseMoment nonexistent date ' + id
					const timezone = remoteData.Venues.getTimezone(date.venue)
					//console.log('Dates.getBaseMoment timezone',timezone)
					const momentString = date.basedate + ' 10:00'
					const momentFormat = 'Y-M-D H:mm'
					const m = moment.tz(momentString, momentFormat, timezone)
					if(!timezone) return moment(m)
					_.set(dateBaseCache, 'base.' + id, m.valueOf())
					_.set(dateBaseCache, 'base.zone.' + id, timezone)
					return moment(m)
				},
		getStartMoment: id => {
					const cached = _.get(dateBaseCache, 'start.' + id)
					if(cached) return moment(cached)
					const m = moment(remoteData.Dates.getBaseMoment(id)).subtract(1, 'days')
					_.set(dateBaseCache, 'start.' + id, m.valueOf())
					return moment(m)
				},
		getEndMoment: id => {
					const cached = _.get(dateBaseCache, 'end.' + id)
					if(cached) return moment(cached)
					const days = remoteData.Dates.getSubDayIds(id)
					const m = moment(remoteData.Dates.getStartMoment(id)).add(days.length + 2, 'days')
					_.set(dateBaseCache, 'end.' + id, m.valueOf())
					return moment(m)
				},
		active: id => moment().isBetween(remoteData.Dates.getStartMoment(id), remoteData.Dates.getEndMoment(id)),
		future: id => moment().isBefore(remoteData.Dates.getStartMoment(id)),
		ended: id => moment().isAfter(remoteData.Dates.getEndMoment(id)),
		getSubjectObject: id => {return {subjectType: 8, subject: id}},
		datedFestivals: () => {
			//console.log('' + remoteData.Festivals.list.length + '-' + remoteData.Dates.list.length)
			const futureDates = remoteData.Dates.future()
			//console.log(futureDates.length)
			return remoteData.Festivals.getMany(futureDates
				.map(d => d.festival))
		},
		upcomingDatedFestivals: (daysAhead = 14) => {
			//console.log('' + remoteData.Festivals.list.length + '-' + remoteData.Dates.list.length)
			const futureDates = remoteData.Dates.soon(daysAhead)
			//console.log('remoteData.Dates.upcomingDatedFestivals')
			//console.log(daysAhead)
			//console.log(futureDates.length)
			return remoteData.Festivals.getMany(futureDates
				.map(d => d.festival))
		},
		isEvent: subject => subject.subjectType === 8,
		messageEventConnection: e => m => remoteData.Dates.isEvent(m) && 
			remoteData.Dates.isEvent(e) && 
			m.subject === e.subject,
		current: () => remoteData.Dates.list.filter(d => {
			//now is greater than the start moment but less than the end moment
			var now = moment()
			var start = remoteData.Dates.getStartMoment(d.id)
			var end = remoteData.Dates.getEndMoment(d.id)
			return now.isBetween(start, end, 'day')
		}),
		soon: (daysAhead = 30) => {
			//console.log('remoteData.Dates soon ' + daysAhead)
			const current = remoteData.Dates.current()
				.map(d => d.id)
			return remoteData.Dates.list.filter(d => {
				//now is greater than the start moment but less than the end moment
				var now = moment()
				var start = remoteData.Dates.getStartMoment(d.id)
				var end = moment().add(daysAhead, 'days')
				return start.isBetween(now, end, 'day')
			})
				.filter(d => current.indexOf(d.id) < 0)
		},
		future: () => {
			const current = remoteData.Dates.current()
				.map(d => d.id)
			return remoteData.Dates.list
				.filter(d => current.indexOf(d.id) < 0)
				.filter(d => {
					//now is greater than now
					var now = moment()
					var start = remoteData.Dates.getStartMoment(d.id)
					return start.isAfter(now, 'day')
				})
		},
		checkedIn: (userId = auth.userId()) => remoteData.Dates.current()
			.filter(date => remoteData.Messages.getFiltered({subject: date.id, subjectType: 8, messageType: 3, fromuser: userId}).length),
		createWithDays: data => {
			const dataFieldName = 'Dates/createWithDays'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.catch(logResult)
		}
	},
	Days: {
		fieldName: 'Days',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Days.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Days.list = _.unionBy(newList, remoteData.Days.list, 'id')
			remoteData.Days.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Days.setMeta(combineMetas(remoteData.Days.meta, newMeta))
			remoteData.Days.list = _.unionBy(newList, remoteData.Days.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Days.meta = defaultMeta()
			remoteData.Days.list = []
			remoteData.Days.lastRemoteLoad = 0
		},
		reload: () => remoteData.Days.lastRemoteLoad = ts() - remoteData.Days.remoteInterval + 1,
		remoteInterval: 3600,
		idFields: () => remoteData.Days.list.length ? 
			Object.keys(remoteData.Days.list[0]).filter(idFieldFilter) : 
			[],
		get: id => _.find(remoteData.Days.list, p => p.id === id),
		getMany: ids => remoteData.Days.list.filter(d => ids.indexOf(d.id) > -1),
		getDateId: id => {
			const day = remoteData.Days.get(id)
			//console.log('remoteData.Days.getDateId', id, day)
			//console.log('remoteData.Days.getDateId list length', remoteData.Days.list.length)
			if(!day) return
			return day.date
		},
		getFestivalId: id => {
			return remoteData.Dates.getFestivalId(remoteData.Days.getDateId(id))
		},
		getSeriesId: id => {
			return remoteData.Festivals.getSeriesId(remoteData.Dates.getFestivalId(remoteData.Days.getDateId(id)))
			
		},
		getSubSetIds: id => {
			return remoteData.Sets.list.filter(s => s.day === id).map(s => s.id)
		},
		getSuperId: id => remoteData.Days.getDateId(id),
		getSubIds: id => remoteData.Days.getSubSetIds(id),
		getPeerIds: id => remoteData.Dates.getSubIds(remoteData.Days.getSuperId(id))
			.filter(x => x !== id),
		
		getEventName: id => {
			const v = remoteData.Days.get(id)
			if(!v || !v.name) return ''
			return remoteData.Dates.getEventName(v.date) + ' ' + v.name
		},
		getEventNames: () => remoteData.Days.list.map(x => remoteData.Dates.getEventName(x.date) + ' ' + x.name),
		getEventNamesWithIds: superId => remoteData.Days.list
			.filter(e => !superId || e.date === superId)
			.map(x => [remoteData.Dates.getEventName(x.date) + ' ' + x.name, x.id])
			.sort(sortNamesWithIdsByName),
		getName: id => remoteData.Days.getEventName(id),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Days, 'remoteData.Days', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Days, 'remoteData.Days', undefined, options),
		getBaseMoment: id => {
			if(!id) return
			
			const superMoment = remoteData.Dates.getBaseMoment(remoteData.Days.getSuperId(id))

			return moment(superMoment.add(remoteData.Days.get(id).daysOffset, 'days'))
		},
		active: id => moment().isBetween(remoteData.Days.getBaseMoment(id), remoteData.Days.getBaseMoment(id).add(24, 'hours')),
		future: id => moment().isBefore(remoteData.Days.getStartMoment(id)),
		ended: id => moment().isAfter(remoteData.Days.getEndMoment(id)),
		getSubjectObject: id => {return {subjectType: 9, subject: id}},
		isEvent: subject => subject.subjectType === 9,
		messageEventConnection: e => m => remoteData.Days.isEvent(m) && 
			remoteData.Days.isEvent(e) && 
			m.subject === e.subject,
	},
	Lineups: {
		fieldName: 'Lineups',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Lineups.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Lineups.list = _.unionBy(newList, remoteData.Lineups.list, 'id')
			remoteData.Lineups.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Lineups.setMeta(combineMetas(remoteData.Lineups.meta, newMeta))
			remoteData.Lineups.list = _.unionBy(newList, remoteData.Lineups.list, 'id')
			return newList
		},
		append: data => appendData(remoteData.Lineups)(data),
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Lineups.meta = defaultMeta()
			remoteData.Lineups.list = []
			remoteData.Lineups.lastRemoteLoad = 0
		},
		reload: () => remoteData.Lineups.lastRemoteLoad = ts() - remoteData.Lineups.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.Lineups.list.filter(d => ids.indexOf(d.id) > -1),
		getPriFromArtistFest: _.memoize((artist, fest) => {
					const target = _.find(remoteData.Lineups.list, p => p.festival === fest && p.band === artist)
					if(!target) return
					return target.priority
				}, (a, b) => '' + a + '.' + b),
		getIdFromArtistFest: (artist, fest) => {
			//console.log('remoteData.lineups.getIdFromArtistFest')
			//console.log(artist)
			//console.log(fest)
			const target = _.find(remoteData.Lineups.list, p => p.festival === fest && p.band === artist)
			if(!target) return
			return target.id
		},
		getFromArtistFest: (artist, fest) => _.find(remoteData.Lineups.list, p => p.festival === fest && p.band === artist),
		artistLineups: artist => remoteData.Lineups.list
			.filter(p => p.band === artist),
		peakArtistPriLevel: _.memoize(artist => _.min(remoteData.Lineups.artistLineups(artist)
			.map(l => remoteData.ArtistPriorities.getLevel(l.priority))
			.filter(l => l)), 
		artist => '' + artist + '-' + remoteData.Lineups.list.length + '-' + remoteData.ArtistPriorities.list.length),
		festivalsForArtist: _.memoize(artist => _.uniq(remoteData.Lineups.artistLineups(artist)
			.map(p => p.festival)), 
		artist => '' + artist + '-' + remoteData.Lineups.list.length),
		artistInLineup: _.memoize(artist => _.some(remoteData.Lineups.list,
			p => p.band === artist)),
		artistInFestival: _.memoize((artist, fest) => _.some(remoteData.Lineups.list,
			p => p.band === artist && p.festival === fest), (artist, fest) => '' + artist + '-' + fest),
		forFestival: fest => remoteData.Lineups.list.filter(l => l.festival === fest),
		festHasLineup: fest => _.some(remoteData.Lineups.list, l => l.festival === fest),
		getFestivalArtistIds: (fest, lineupFilter = x => x ) => remoteData.Lineups.list
			.filter(l => l.festival === fest)
			.filter(lineupFilter)
			.map(l => l.band),
		getNotFestivalArtistIds: fest => {
			const excludeIds = remoteData.Lineups.getFestivalArtistIds(fest)
			return remoteData.Artists.list
				.filter(artist => excludeIds.indexOf(artist.id) < 0)
				.map(artist => artist.id)
		},
		//this returns lineups with unscheduled set
		getUnscheduledForFestival: festivalId => remoteData.Lineups.forFestival(festivalId)
			.filter(l => l.unscheduled)
		,
		//this returns festival objects for each festival where all 
		//artists have the same, default priority (i.e., headliners
		//need to be entered) from amongst a supplied group of ids
		//(or from all festivals if no ids supplied)
		allPrioritiesDefaultFestivals: festIds => (festIds.length ? remoteData.Festivals.getMany(festIds) : remoteData.Festivals.list)
			.filter(f => remoteData.Lineups.festHasLineup(f.id))
			.map(f => {
				//console.log('allPrioritiesDefaultFestivals')
				//console.log(f)
				return f
			})
			.filter(f => !remoteData.Lineups.forFestival(f.id)
				//find if at least two different priorities are used
				.reduce((found, lineup, i, arr) => {
				//console.log('allPrioritiesDefaultFestivals')
				//console.log(found)
				//console.log(lineup)
					//multiple pris found alreadt (found === true)
					//or 1 pri found already and it is differnet than the current pri
					if(found === true || found && lineup.priority && lineup.priority !== found) {
						return true
					} 
					//special case if this the last iteration return false
					else if(i + 1 === arr.length) {
						return false
					}
					//one or both are not valid or not unique, so return the good one and keep looking
					return found ? found : lineup.priority
				}, 0)
			),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Lineups, 'remoteData.Lineups', forceRemoteLoad, options),
		remoteLoad: (options = {}) => loadRemote(remoteData.Lineups, 'remoteData.Lineups', undefined, options),
		create: data => {
			const dataFieldName = 'Lineups'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.then(() => remoteData[dataFieldName].list.push(data))
				.then(remoteData.Lineups.remoteLoad)
				.catch(logResult)
		},
		upload: (data, festivalId) => {
			const dataFieldName = 'Artists/festivalLineup/' + festivalId
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.then(remoteData.Lineups.remoteLoad)
				.then(remoteData.Artists.remoteLoad)
				.catch(logResult)
		},
		addArtist: (data, festivalId) => {
			const dataFieldName = 'Artists/addToLineup/' + festivalId
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.then(artistData => {
					//console.log('artistData')
					//console.log(artistData)
					remoteData.Artists.append(artistData.id.artist)
					remoteData.Lineups.append(artistData.id.lineup)
					m.redraw()
					return artistData
				})
				//.then(logResult)
				.then(remoteData.Lineups.remoteLoad)
				.then(remoteData.Artists.remoteLoad)
				.catch(logResult)
		},
		batchDelete: data => {
			const end = 'Lineups/batchDelete'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(() => remoteData.Lineups.loadList(true))
				//TODO: add function to update local and mem with the delete
				.catch(logResult)
		},
		batchUpdate: data => {
			const end = 'Lineups/batchUpdate'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Lineups.remoteLoad)
				.catch(logResult)
		}
	},
	Sets: {
		fieldName: 'Sets',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Sets.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Sets.list = _.unionBy(newList, remoteData.Sets.list, 'id')
			remoteData.Sets.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Sets.setMeta(combineMetas(remoteData.Sets.meta, newMeta))
			remoteData.Sets.list = _.unionBy(newList, remoteData.Sets.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Sets.meta = defaultMeta()
			remoteData.Sets.list = []
			remoteData.Sets.lastRemoteLoad = 0
		},
		reload: () => remoteData.Sets.lastRemoteLoad = ts() - remoteData.Sets.remoteInterval + 1,
		remoteInterval: 3600,
		idFields: () => remoteData.Sets.list.length ? 
			Object.keys(remoteData.Sets.list[0]).filter(idFieldFilter) : 
			[],
		get: id => _.find(remoteData.Sets.list, p => p.id === id),
		getMany: ids => remoteData.Sets.list.filter(d => ids.indexOf(d.id) > -1),
		getDayId: id => {
			const set = remoteData.Sets.get(id)
			if(!set) return
			return set.day
		},
		getDateId: id => {
			return remoteData.Days.getDateId(remoteData.Sets.getDayId(id))
		},
		getFestivalId: id => {
			return remoteData.Dates.getFestivalId(remoteData.Days.getDateId(remoteData.Sets.getDayId(id)))
		},
		getSeriesId: id => {
			return remoteData.Festivals.getSeriesId(remoteData.Dates.getFestivalId(remoteData.Days.getDateId(remoteData.Sets.getDayId(id))))
			
		},
		getArtistId: id => {
			//console.log('remoteData.Sets.getArtistId ' + id)
			//console.log('remoteData.Sets.list ' + remoteData.Sets.list.length)
			const set = remoteData.Sets.get(id)
			if(!set) return
			return set.band
		},
		getArtistName: id => {
			//console.log('remoteData.Sets.getArtistName ' + id)
			return remoteData.Artists.getName(remoteData.Sets.getArtistId(id))
			
		},
		wellAttended: (min = 2) => {
			//at least min checkins

		},
		topSets: () => {
			//at least two checkins
			//more than half people who checked in rated it 5
		},
		getSuperId: id => remoteData.Sets.getDayId(id),
		getPeerIds: id => remoteData.Days.getSubIds(remoteData.Sets.getSuperId(id))
			.filter(x => x !== id),
		getEventName: id => remoteData.Sets.getArtistName(id) + ': ' + remoteData.Festivals.getEventName(remoteData.Sets.getFestivalId(id)),
		getEventNames: () => remoteData.Sets.list.map(x => remoteData.Sets.getEventName(x.id)),
		getEventNamesWithIds: superId => remoteData.Sets.list
			.filter(e => !superId || e.day === superId)
			.map(x => [remoteData.Sets.getEventName(x.id), x.id])
			.sort(sortNamesWithIdsByName),
		getName: id => remoteData.Sets.getEventName(id),
		forDayAndStage: (day, stage) => remoteData.Sets.list
			.filter(s => s.day === day && s.stage === stage),
		forArtist: artistId => remoteData.Sets.list
			.filter(s => s.band === artistId),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Sets, 'remoteData.Sets', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Sets, 'remoteData.Sets', undefined, options),
		getStartMoment: id => {
			const superMoment = remoteData.Days.getBaseMoment(remoteData.Sets.getSuperId(id))
			return superMoment.add(remoteData.Sets.get(id).start, 'minutes')
		},
		getEndMoment: id => {
			const superMoment = remoteData.Days.getBaseMoment(remoteData.Sets.getSuperId(id))
			return superMoment.add(remoteData.Sets.get(id).end, 'minutes')
		},
		getSetTimeText: id => {
			//console.log('remoteData.Sets.getSetTimeText ' + id)
			const startMoment = remoteData.Sets.getStartMoment(id)
			const endMoment = remoteData.Sets.getEndMoment(id)
			return startMoment.format('h:mm') + '-' + endMoment.format('h:mm')
		},
		active: id => moment().isBetween(remoteData.Sets.getStartMoment(id), remoteData.Sets.getEndMoment(id)),
		future: id => moment().isBefore(remoteData.Sets.getStartMoment(id)),
		ended: id => moment().isAfter(remoteData.Sets.getEndMoment(id)),
		getSubjectObject: id => {return {subjectType: 3, subject: id}},
		getTimeString: id => remoteData.Sets.getSetTimeText(id),
		datedLinedFestivals: (daysAhead = 14) => remoteData.Dates.upcomingDatedFestivals(daysAhead)
			//that have a lineup
			.filter(festival => remoteData.Lineups.festHasLineup(festival.id)),

			//find festivals that have a date
		unscheduledLineupFestivals: (daysAhead = 14) => remoteData.Sets
			.datedLinedFestivals(daysAhead)
			//and at least one artist in lineup that does not have a set with a start time
			.filter(festival => {
				const festivalSetIds = remoteData.Festivals.getSubSetIds(festival.id)
				const festivalSets = remoteData.Sets.getMany(festivalSetIds)
				const scheduledSets = festivalSets.filter(s => s.start)

				return _.some(
					remoteData.Lineups.getFestivalArtistIds(festival.id),
					artistId => !_.some(scheduledSets, s => s.band === artistId)
			)})
		,
		artistMissingDayFestivals: (daysAhead = 14) => remoteData.Sets
			.datedLinedFestivals(daysAhead)
			//and at least one artist in lineup that does not have a set with a start time
			.filter(festival => {
				const festivalSetIds = remoteData.Festivals.getSubSetIds(festival.id)
				const festivalSets = remoteData.Sets.getMany(festivalSetIds)
				const daySets = festivalSets.filter(s => s.day)
				const artistIds = remoteData.Lineups.getFestivalArtistIds(festival.id, l => !l.unscheduled)
				if(false && festival.id === 68) {
				console.log('artistMissingDayFestivals')
				console.log(daySets)
				console.log(artistIds)

				}

				return _.some(
					artistIds,
					artistId => !_.some(daySets, s => s.band === artistId)
				)
			})
		,
		artistMissingStageFestivals: (daysAhead = 14) => remoteData.Sets
			.datedLinedFestivals(daysAhead)
			//and at least one artist in lineup that does not have a set with a start time
			.filter(festival => {
				const festivalSetIds = remoteData.Festivals.getSubSetIds(festival.id)
				const festivalSets = remoteData.Sets.getMany(festivalSetIds)
				const stageSets = festivalSets.filter(s => s.stage)

				return _.some(
					remoteData.Lineups.getFestivalArtistIds(festival.id, l => !l.unscheduled),
					artistId => !_.some(stageSets, s => s.band === artistId)
				)
			})
		,
		isEvent: subject => subject.subjectType === 3,
		messageEventConnection: e => m => remoteData.Sets.isEvent(m) && 
			remoteData.Sets.isEvent(e) && 
			m.subject === e.subject,
		createForDays: (daysObject) => {
			const end = 'Sets/forDay/'
			const optionFuncs = Object.keys(daysObject)
				.map(day => {
					return token => reqOptionsCreate(tokenFunction(token))(end + day)({
						artistIds: daysObject[day]
					})})
			const reqPromiseArray = function (result) {
				return optionFuncs.map(optionFunc => m.request(optionFunc(result)))

			}
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => Promise.all(reqPromiseArray(result)))
				.then(remoteData.Sets.remoteLoad)
				.catch(logResult)
		},
		batchCreate: data => {
			const end = 'Sets/batchCreate'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Sets.remoteLoad)
				.catch(logResult)
		},
		batchDelete: data => {
			const end = 'Sets/batchDelete'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Sets.remoteLoad)
				.catch(logResult)
		},
		batchUpdate: data => {
			const end = 'Sets/batchUpdate'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Sets.remoteLoad)
				.catch(logResult)
		},
		upsert: data => {
			const end = 'Sets'
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end, 'PUT')(data)))
				.then(remoteData.Sets.remoteLoad)
				.catch(logResult)

		},
		delete: data => {
			const end = 'Sets/' + data.id
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end, 'DELETE')(data)))
				.then(remoteData.Sets.remoteLoad)
				.catch(logResult)

		}
	},
	Venues: {
		fieldName: 'Venues',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Venues.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Venues.list = _.unionBy(newList, remoteData.Venues.list, 'id')
			remoteData.Venues.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Venues.setMeta(combineMetas(remoteData.Venues.meta, newMeta))
			remoteData.Venues.list = _.unionBy(newList, remoteData.Venues.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		reload: () => remoteData.Venues.lastRemoteLoad = ts() - remoteData.Venues.remoteInterval + 1,
		remoteInterval: 3600,
		clear: () => {
			remoteData.Venues.meta = defaultMeta()
			remoteData.Venues.list = []
			remoteData.Venues.lastRemoteLoad = 0
		},
		get: id => _.find(remoteData.Venues.list, p => p.id === id),
		getMany: ids => remoteData.Venues.list.filter(d => ids.indexOf(d.id) > -1),
		idFields: () => remoteData.Venues.list.length ? 
			Object.keys(remoteData.Venues.list[0]).filter(idFieldFilter) : 
			[],
		getPlaceName: id => {
			const v = remoteData.Venues.get(id)
			if(!v || !v.name) return ''
			return v.name
		},
		getTimezone: id => {
			const v = remoteData.Venues.get(id)
			//console.log('Venues.getTimezone', id, v)
			if(!v || !v.name) return ''
			return v.timezone
		},
		getPlaceNames: () => remoteData.Venues.list.map(x => x.name),
		getPlaceNamesWithIds: () => remoteData.Venues.list.map(x => [x.name, x.id])
			.sort(sortNamesWithIdsByName),
		getName: id => remoteData.Venues.getPlaceName(id),
		getDateIds: id => remoteData.Dates.list
			.filter(d => d.venue === id)
			.map(d => d.id),
		getSubjectObject: id => {return {subjectType: 5, subject: id}},
		isVenue: subject => subject.subjectType === 5,
		//a message about a venue is connected to an event if:
		//the event is associated with a date that has been/will be at the venue
		messageEventConnection: e => m => remoteData.Venues.isVenue(m) && (m.subject === e.id ||
			_.find(getDateIds(m.subject), 
				d => remoteData.Dates.messageEventConnection(e)(
					remoteData.Dates.getSubjectObject(d)
				)
			)
		),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Venues, 'remoteData.Venues', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Venues, 'remoteData.Venues', undefined, options),
		create: data => {
			const dataFieldName = 'Venues'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(dataFieldName)(data)))
				.then(remoteData.Venues.remoteLoad)
				.catch(logResult)
		}
	},
	Organizers: {
		fieldName: 'Organizers',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Organizers.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Organizers.list = _.unionBy(newList, remoteData.Organizers.list, 'id')
			remoteData.Organizers.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Organizers.setMeta(combineMetas(remoteData.Organizers.meta, newMeta))
			remoteData.Organizers.list = _.unionBy(newList, remoteData.Organizers.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Organizers.meta = defaultMeta()
			remoteData.Organizers.list = []
			remoteData.Organizers.lastRemoteLoad = 0
		},
		reload: () => remoteData.Organizers.lastRemoteLoad = ts() - remoteData.Organizers.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.Organizers.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Organizers, 'remoteData.Organizers', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Organizers, 'remoteData.Organizers', undefined, options),
	},
	Places: {
		fieldName: 'Places',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Places.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Places.list = _.unionBy(newList, remoteData.Places.list, 'id')
			remoteData.Places.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Places.setMeta(combineMetas(remoteData.Places.meta, newMeta))
			remoteData.Places.list = _.unionBy(newList, remoteData.Places.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Places.meta = defaultMeta()
			remoteData.Places.list = []
			remoteData.Places.lastRemoteLoad = 0
		},
		reload: () => remoteData.Places.lastRemoteLoad = ts() - remoteData.Places.remoteInterval + 1,
		remoteInterval: 3600,
		get: id => _.find(remoteData.Places.list, p => p.id === id),
		getMany: ids => remoteData.Places.list.filter(d => ids.indexOf(d.id) > -1),
		getFiltered: filter => _.filter(remoteData.Places.list, filter),
		getFestivalId: id => {
			const place = remoteData.Places.get(id)
			if(!place) return
			return place.festival
		},
		forFestival: festivalId => _.uniqBy(remoteData.Places.list
			.filter(d => d.festival === festivalId), x => x.name)
			.sort((a, b) => a.priority - b.priority),
		forSeries: seriesId => _.uniqBy(_.flatMap(
			remoteData.Series.getSubIds(seriesId),
			remoteData.Places.forFestival
		), x => x.name),
		prevPlaces: festivalId => remoteData.Places.forFestival(
			_.max(remoteData.Festivals.getPeerIds(festivalId))
		),
		idFields: () => remoteData.Places.list.length ? 
			Object.keys(remoteData.Places.list[0]).filter(idFieldFilter) : 
			[],
		getName: id => remoteData.Places.get(id).name,
		missingStageFestivals: (daysAhead = 14) => remoteData.Festivals.future(daysAhead)
			.filter(festival => !remoteData.Places.forFestival(festival.id).length),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Places, 'remoteData.Places', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Places, 'remoteData.Places', undefined, options),
		stagesForFestival: data => {
			const end = 'Places/batchCreate/'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			//console.log('stagesForFestival')
			//console.log(data)
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Places.remoteLoad)
				.catch(logResult)
		},
		batchDelete: data => {
			const end = 'Places/batchDelete'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.Places.remoteLoad)
				.catch(logResult)
		}
	},
	ArtistPriorities: {
		fieldName: 'ArtistPriorities',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.ArtistPriorities.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.ArtistPriorities.list = _.unionBy(newList, remoteData.ArtistPriorities.list, 'id')
			remoteData.ArtistPriorities.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.ArtistPriorities.setMeta(combineMetas(remoteData.ArtistPriorities.meta, newMeta))
			remoteData.ArtistPriorities.list = _.unionBy(newList, remoteData.ArtistPriorities.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.ArtistPriorities.meta = defaultMeta()
			remoteData.ArtistPriorities.list = []
			remoteData.ArtistPriorities.lastRemoteLoad = 0
		},
		reload: () => remoteData.ArtistPriorities.lastRemoteLoad = ts() - remoteData.ArtistPriorities.remoteInterval + 1,
		remoteInterval: 3600,
		get: id => _.find(remoteData.ArtistPriorities.list, p => p.id === id),
		getMany: ids => remoteData.ArtistPriorities.list.filter(d => ids.indexOf(d.id) > -1),
		getName: id => {
			const data = remoteData.ArtistPriorities.get(id)
			if(!data) return
			return data.name

		},
		getLevel: id => {
			const data = remoteData.ArtistPriorities.get(id)
			if(!data) return
			return data.level

		},
		loadList: (forceRemoteLoad, options) => updateList(remoteData.ArtistPriorities, 'remoteData.ArtistPriorities', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.ArtistPriorities, 'remoteData.ArtistPriorities', undefined, options),
	},
	StagePriorities: {
		fieldName: 'StagePriorities',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.StagePriorities.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.StagePriorities.list = _.unionBy(newList, remoteData.StagePriorities.list, 'id')
			remoteData.StagePriorities.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.StagePriorities.setMeta(combineMetas(remoteData.StagePriorities.meta, newMeta))
			remoteData.StagePriorities.list = _.unionBy(newList, remoteData.StagePriorities.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.StagePriorities.meta = defaultMeta()
			remoteData.StagePriorities.list = []
			remoteData.StagePriorities.lastRemoteLoad = 0
		},
		reload: () => remoteData.StagePriorities.lastRemoteLoad = ts() - remoteData.StagePriorities.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.StagePriorities.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.StagePriorities, 'remoteData.StagePriorities', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.StagePriorities, 'remoteData.StagePriorities', undefined, options),
	},
	StageLayouts: {
		fieldName: 'StageLayouts',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.StageLayouts.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.StageLayouts.list = _.unionBy(newList, remoteData.StageLayouts.list, 'id')
			remoteData.StageLayouts.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.StageLayouts.setMeta(combineMetas(remoteData.StageLayouts.meta, newMeta))
			remoteData.StageLayouts.list = _.unionBy(newList, remoteData.StageLayouts.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.StageLayouts.meta = defaultMeta()
			remoteData.StageLayouts.list = []
			remoteData.StageLayouts.lastRemoteLoad = 0
		},
		reload: () => remoteData.StageLayouts.lastRemoteLoad = ts() - remoteData.StageLayouts.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.StageLayouts.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.StageLayouts, 'remoteData.StageLayouts', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.StageLayouts, 'remoteData.StageLayouts', undefined, options),
	},
	PlaceTypes: {
		fieldName: 'PlaceTypes',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.PlaceTypes.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.PlaceTypes.list = _.unionBy(newList, remoteData.PlaceTypes.list, 'id')
			remoteData.PlaceTypes.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.PlaceTypes.setMeta(combineMetas(remoteData.PlaceTypes.meta, newMeta))
			remoteData.PlaceTypes.list = _.unionBy(newList, remoteData.PlaceTypes.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.PlaceTypes.meta = defaultMeta()
			remoteData.PlaceTypes.list = []
			remoteData.PlaceTypes.lastRemoteLoad = 0
		},
		reload: () => remoteData.PlaceTypes.lastRemoteLoad = ts() - remoteData.PlaceTypes.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.PlaceTypes.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.PlaceTypes, 'remoteData.PlaceTypes', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.PlaceTypes, 'remoteData.PlaceTypes', undefined, options),
	},
	ArtistAliases: {
		fieldName: 'ArtistAliases',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.ArtistAliases.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.ArtistAliases.list = _.unionBy(newList, remoteData.ArtistAliases.list, 'id')
			remoteData.ArtistAliases.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.ArtistAliases.setMeta(combineMetas(remoteData.ArtistAliases.meta, newMeta))
			remoteData.ArtistAliases.list = _.unionBy(newList, remoteData.ArtistAliases.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.ArtistAliases.meta = defaultMeta()
			remoteData.ArtistAliases.list = []
			remoteData.ArtistAliases.lastRemoteLoad = 0
		},
		reload: () => remoteData.ArtistAliases.lastRemoteLoad = ts() - remoteData.ArtistAliases.remoteInterval + 1,
		remoteInterval: 3600,
		get: id => _.find(remoteData.ArtistAliases.list, p => p.id === id),
		getMany: ids => remoteData.ArtistAliases.list.filter(d => ids.indexOf(d.id) > -1),
		forArtist: artistId => remoteData.ArtistAliases.list
			.filter(d => d.band === artistId),
		idFields: () => remoteData.ArtistAliases.list.length ? 
			Object.keys(remoteData.ArtistAliases.list[0]).filter(idFieldFilter) : 
			[],
		loadList: (forceRemoteLoad, options) => updateList(remoteData.ArtistAliases, 'remoteData.ArtistAliases', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.ArtistAliases, 'remoteData.ArtistAliases', undefined, options),
		batchCreate: data => {
			const end = 'ArtistAliases/batchCreate/'
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.ArtistAliases.remoteLoad)
				.catch(logResult)
		},
		batchDelete: data => {
			const end = 'ArtistAliases/batchDelete'
			//((assume data was validated in form))
			//((assume server will add user field))
			//submit to server
			//set last remote load to 0
			return auth.getAccessToken()
				.then(result => m.request(reqOptionsCreate(tokenFunction(result))(end)(data)))
				.then(remoteData.ArtistAliases.remoteLoad)
				.catch(logResult)
		}
	},
	ParentGenres: {
		fieldName: 'ParentGenres',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.ParentGenres.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.ParentGenres.list = _.unionBy(newList, remoteData.ParentGenres.list, 'id')
			remoteData.ParentGenres.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.ParentGenres.setMeta(combineMetas(remoteData.ParentGenres.meta, newMeta))
			remoteData.ParentGenres.list = _.unionBy(newList, remoteData.ParentGenres.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.ParentGenres.meta = defaultMeta()
			remoteData.ParentGenres.list = []
			remoteData.ParentGenres.lastRemoteLoad = 0
		},
		reload: () => remoteData.ParentGenres.lastRemoteLoad = ts() - remoteData.ParentGenres.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.ParentGenres.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.ParentGenres, 'remoteData.ParentGenres', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.ParentGenres, 'remoteData.ParentGenres', undefined, options),
	},
	Genres: {
		fieldName: 'Genres',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Genres.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Genres.list = _.unionBy(newList, remoteData.Genres.list, 'id')
			remoteData.Genres.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Genres.setMeta(combineMetas(remoteData.Genres.meta, newMeta))
			remoteData.Genres.list = _.unionBy(newList, remoteData.Genres.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Genres.meta = defaultMeta()
			remoteData.Genres.list = []
			remoteData.Genres.lastRemoteLoad = 0
		},
		reload: () => remoteData.Genres.lastRemoteLoad = ts() - remoteData.Genres.remoteInterval + 2,
		remoteInterval: 3600,
		getMany: ids => remoteData.Genres.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Genres, 'remoteData.Genres', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Genres, 'remoteData.Genres', undefined, options),
	},
	ArtistGenres: {
		fieldName: 'ArtistGenres',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.ArtistGenres.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.ArtistGenres.list = _.unionBy(newList, remoteData.ArtistGenres.list, 'id')
			remoteData.ArtistGenres.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.ArtistGenres.setMeta(combineMetas(remoteData.ArtistGenres.meta, newMeta))
			remoteData.ArtistGenres.list = _.unionBy(newList, remoteData.ArtistGenres.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.ArtistGenres.meta = defaultMeta()
			remoteData.ArtistGenres.list = []
			remoteData.ArtistGenres.lastRemoteLoad = 0
		},
		reload: () => remoteData.ArtistGenres.lastRemoteLoad = ts() - remoteData.ArtistGenres.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.ArtistGenres.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.ArtistGenres, 'remoteData.ArtistGenres', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.ArtistGenres, 'remoteData.ArtistGenres', undefined, options),
	},
	MessageTypes: {
		fieldName: 'MessageTypes',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.MessageTypes.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.MessageTypes.list = _.unionBy(newList, remoteData.MessageTypes.list, 'id')
			remoteData.MessageTypes.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.MessageTypes.setMeta(combineMetas(remoteData.MessageTypes.meta, newMeta))
			remoteData.MessageTypes.list = _.unionBy(newList, remoteData.MessageTypes.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.MessageTypes.meta = defaultMeta()
			remoteData.MessageTypes.list = []
			remoteData.MessageTypes.lastRemoteLoad = 0
		},
		reload: () => remoteData.MessageTypes.lastRemoteLoad = ts() - remoteData.MessageTypes.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.MessageTypes.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.MessageTypes, 'remoteData.MessageTypes', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.MessageTypes, 'remoteData.MessageTypes', undefined, options),
	},
	SubjectTypes: {
		fieldName: 'SubjectTypes',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.SubjectTypes.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.SubjectTypes.list = _.unionBy(newList, remoteData.SubjectTypes.list, 'id')
			remoteData.SubjectTypes.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.SubjectTypes.setMeta(combineMetas(remoteData.SubjectTypes.meta, newMeta))
			remoteData.SubjectTypes.list = _.unionBy(newList, remoteData.SubjectTypes.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.SubjectTypes.meta = defaultMeta()
			remoteData.SubjectTypes.list = []
			remoteData.SubjectTypes.lastRemoteLoad = 0
		},
		reload: () => remoteData.SubjectTypes.lastRemoteLoad = ts() - remoteData.SubjectTypes.remoteInterval + 1,
		remoteInterval: 3600,
		getMany: ids => remoteData.SubjectTypes.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.SubjectTypes, 'remoteData.SubjectTypes', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.SubjectTypes, 'remoteData.SubjectTypes', undefined, options),
	},
	Users: {
		fieldName: 'Users',
		list: [],
		meta: defaultMeta(),
		setMeta: meta => remoteData.Users.meta = _.clone(meta),
		assignList: ([newList, lastRemoteLoad]) => {
			remoteData.Users.list = _.unionBy(newList, remoteData.Users.list, 'id')
			remoteData.Users.lastRemoteLoad = lastRemoteLoad
		},
		backfillList: newList => {
			const newMeta = calcMeta(newList)
			remoteData.Users.setMeta(combineMetas(remoteData.Users.meta, newMeta))
			remoteData.Users.list = _.unionBy(newList, remoteData.Users.list, 'id')
			return newList
		},
		lastRemoteLoad: 0,
		clear: () => {
			remoteData.Users.meta = defaultMeta()
			remoteData.Users.list = []
			remoteData.Users.lastRemoteLoad = 0
		},
		reload: () => remoteData.Users.lastRemoteLoad = ts() - remoteData.Users.remoteInterval + 1,
		remoteInterval: 3600,
		get: id => _.find(remoteData.Users.list, p => p.id === id),
		getMany: ids => remoteData.Users.list.filter(d => ids.indexOf(d.id) > -1),
		loadList: (forceRemoteLoad, options) => updateList(remoteData.Users, 'remoteData.Users', forceRemoteLoad, options),
		remoteLoad: (options) => loadRemote(remoteData.Users, 'remoteData.Users', '/api/Profiles', options),
		getName: id => {
			const data = remoteData.Users.get(id)
			if(!data) return ''
			return data.username

		},
		getPic: id => {
			const data = remoteData.Users.get(id)
			if(!data) return ''
			return data.picture

		}
	}
}



export const clearData = () => {
	_.forOwn(remoteData, dataField => dataField.clear())
}

var initDataPromiseCache = false
const defaultOptions = {
	skipRedraw: true,
	debug: false,
	forceRedraw: false
}
export const initData = (options = defaultOptions) => {
	if(!initDataPromiseCache) {
		clearData()
		const promise = Promise.all(_.keys(remoteData)
			.map(dataFieldName => remoteData[dataFieldName].loadList(false, options))
		)
			//.then(() => console.log('redraw prepped'))
			.then(() => m.redraw())
			//.then(() => console.log('redraw launched'))
		initDataPromiseCache = promise

	}
	return initDataPromiseCache

}