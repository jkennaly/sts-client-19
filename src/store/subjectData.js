// subjectData.js

import _ from 'lodash'

import {remoteData} from './data.js'
import {reviewArrays} from '../services/reviewArrays'
import {reqOptionsCreate, tokenFunction} from '../services/requests.js'
import {timeStampSort} from '../services/sorts.js'
import {sameSubject} from '../services/subjectFunctions';
import Auth from '../services/auth.js'
const auth = new Auth()

const subjectDataField = type => {return {
	'10': 'Messages',
	'9': 'Days',
	'8': 'Dates',
	'7': 'Festivals',
	'6': 'Series',
	'5': 'Venues',
	'4': 'Places',
	'3': 'Sets',
	'2': 'Artists',
	'1': 'Users'
}[type]}

const artistSets = so => remoteData.Sets.forArtist(so.subject)
	.map(s => s.id)
	.map(id => {return {subject: id, subjectType: 3}})

const secondarySubjectObjects = type => {return {
	//Messages
	'10': so => [],
	//Days
	'9': so => [],
	//Dates
	'8': so => [],
	//Festivals
	'7': so => [],
	//Series
	'6': so => [],
	//Venues
	'5': so => [],
	//Places
	'4': so => [],
	//Sets
	'3': so => {
		const theSet = remoteData.Sets.get(so.subject)
		//console.log('subjectData secondarySubjectObjects for ', so, theSet)
		if(theSet && theSet.band) return [
			{subject: theSet.band, subjectType: 2},
			...artistSets(so)
		]
		return []

	},
	//Artists
	'2': artistSets,
	//Users
	'1': so => []
}[type]}

const getRating = (sub, type, author) => {
	const mType = 2
	const authorRatings = remoteData.Messages.ofAboutAndBy(mType, type, author)
	const subRating = authorRatings.filter(m => m.subject === sub)
		.sort(timeStampSort)

	const message = subRating[0]
	return message
}

const getRatingAverage = ({subject, subjectType}) => {
	//get each user with a rating
	const allPrimaryRaters = _.uniq(remoteData.Messages.getFiltered({
		subject: subject,
		subjectType: subjectType,
		messageType: 2
	}).map(m => parseInt(m.fromuser, 10)))
	//get the rating from each user
	const allRatings = allPrimaryRaters.map(author => getRating(subject, subjectType, author))
	//average each users rating
	const average = allRatings.reduce((acc, r, i, arr) => acc + r / arr.length, 0)
	return average
}

const getComment = (sub, type, author) => {
	const mType = 1
	const authorRatings = remoteData.Messages.ofAboutAndBy(mType, type, author)
	const subRating = authorRatings.filter(m => m.subject === sub)

	const message = subRating[0]
	return message
}

const ts = () => Math.round((new Date()).getTime() / 1000)
const userIdsActive = subjectObject => {
	const directMessages = remoteData.Messages.getFiltered(_.assign({}, subjectObject, {messageType: 3}))
	return [
	//invalid
	x => [],
	//user
	x => [],
	//artist
	x => [],
	//set
	x => _.uniq(directMessages.map(m => m.fromuser)),
	//place
	x => [],
	//venue
	x => [],
	//series
	x => [],
	//festival
	x => [],
	//date
	x => _.uniq(directMessages.map(m => m.fromuser)),
	//day
	x => _.uniq(directMessages.map(m => m.fromuser)),
	//message
	x => []
][subjectObject.subjectType]()
} 
const eventActive = primaryField => subjectObject => [
	//invalid
	x => false,
	//user
	x => false,
	//artist
	x => false,
	//set
	primaryField.active,
	//place
	x => true,
	//venue
	x => true,
	//series
	primaryField.activeDate,
	//festival
	primaryField.activeDate,
	//date
	primaryField.active,
	//day
	primaryField.active,
	//message
	x => false
][subjectObject.subjectType](subjectObject.subject)
const eventEnded = primaryField => subjectObject => [
	//invalid
	x => false,
	//user
	x => false,
	//artist
	x => false,
	//set
	primaryField.ended,
	//place
	x => false,
	//venue
	x => false,
	//series
	x => false,
	//festival
	x => false,
	//date
	primaryField.ended,
	//day
	primaryField.ended,
	//message
	x => false
][subjectObject.subjectType](subjectObject.subject)
const eventFuture = primaryField => subjectObject => [
	//invalid
	x => false,
	//user
	x => false,
	//artist
	x => false,
	//set
	primaryField.future,
	//place
	x => false,
	//venue
	x => false,
	//series
	x => false,
	//festival
	x => false,
	//date
	primaryField.future,
	//day
	primaryField.future,
	//message
	x => false
][subjectObject.subjectType](subjectObject.subject)

var subjectLoaded = {}
/*
f(7) < f(6)
f(8) < f(7)
f(9) < f(8)
f(3) < f(9)



*/

export const subjectData = {
	MESSAGE: 10,
	SERIES: 6,
	FESTIVAL: 7,
	DATE: 8,
	DAY: 9,
	SET: 3,
	VENUE: 5,
	PLACE: 4,
	ARTIST: 2,
	USER: 1,
	get: (subjectObject) => remoteData[subjectDataField(subjectObject.subjectType)]
			.get(subjectObject.subject),
	getManySingleType: (subjectObjectAr) => {
		if(!subjectObjectAr || !subjectObjectAr.length) return []
		return remoteData[subjectDataField(subjectObjectAr[0].subjectType)]
			.getMany(subjectObjectAr.map(so => so.subject))
	},
	name: (sub, type) => {
		if(!sub) return
		const suba = !sub.subject ? sub : sub.subject
		const typea = !sub.subjectType ? type : sub.subjectType
		return typea && suba ? remoteData[subjectDataField(typea)].getName(suba) : ''

	},
	data: ({subject, subjectType}) => subjectType && subject ? remoteData[subjectDataField(subjectType)].get(subject) : '',
	ratingBy: (sub, type, author = auth.userId()) => {
		//console.log('subjectData ratingBy sub: ' + sub + 'type: ' + type + 'author: ' + author)
		const message = getRating(sub, type, author)
		const rate = message && message.content ? parseInt(message.content, 10) : 0
		return rate
	},
	ratingId: (sub, type, author = auth.userId()) => {
		const message = getRating(sub, type, author)
		const id = message && message.id
		return id
	},
	ratingObject: (subjectObject, author = auth.userId()) => {
		const {subject} = subjectObject
		const {subjectType} = subjectObject
		//the gold rating is the user's most recent rating for the subject
		const message = getRating(subject, subjectType, author)
		const goldRating = message && message.content && parseInt(message.content, 10)
		//console.log('ratingsObject gold', goldRating)
		if(goldRating) return _.assign({}, {author: author, rating: goldRating, color: 'gold'}, subjectObject)
		//the green rating is the average of the users relatedRatings
		const relatedSubjects = secondarySubjectObjects(subjectType)(subjectObject)
		//console.log('ratingsObject relatedSubjects', relatedSubjects)
		const relatedRatings = relatedSubjects
			.map(({subject, subjectType}) => getRating(subject, subjectType, author))
			.filter(_.isInteger)
		const greenRating = relatedRatings.reduce((avg, r, i, arr) => avg + r / arr.length, 0)
		//console.log('ratingsObject green', greenRating)
		if(greenRating) return _.assign({}, {author: author, rating: goldRating, color: 'forestgreen'}, subjectObject)
		//the black rating is the average of all avable ratings for the primary, or if none, the secondarties
		const primaryRatings = remoteData.Messages.getFiltered({messageType: 2, subject: subject, subjectType: subjectType})
			.map(m => m && m.content && parseInt(m.content, 10))
			.filter(x => x)
		const secondaryRatings = _.uniqBy((primaryRatings.length ? [] : relatedSubjects)
			.map(sub => remoteData.Messages.getFiltered(_.assign({}, sub, {messageType: 2})))
			.reduce((pv, cv) => [...pv, ...cv], []),
			r => `${r.fromuser}.${r.subject}.${r.subjectType}`)
			.map(m => m && m.content && parseInt(m.content, 10))
			.filter(x => x)
		const allRatings = [...primaryRatings, ...secondaryRatings].filter(x => x)
		const blackRating = allRatings.length ? allRatings.reduce((avg, r, i, arr) => avg + r / arr.length, 0) : 0
//console.log('ratingsObject black', blackRating)
		
		return blackRating ? _.assign({}, {author: author, rating: blackRating, color: 'black'}, subjectObject) : _.assign({}, {author: author, rating: 0, color: 'black'}, subjectObject)
	},
	commentBy: (sub, type, author) => {
		const message = getComment(sub, type, author)
		const comment = message && message.content ? message.content : ''
		//console.log('subjectData authorRatings ' + authorRatings.length)
		//console.log('subjectData aboutArtists ' + aboutArtists.length)
		//console.log('subjectData ratings ' + ratings.length)
		//console.log('subjectData byAuthor ' + byAuthor.length)
		//console.log('subjectData byAuthor add ' + (author + 1))
		//console.log('subjectData byFromuser add ' + (remoteData.Messages.list[0].fromuser + 1))
		//console.log('subjectData subRating ' + subRating.length)
		return comment
	},
	commentId: (sub, type, author) => {
		const message = getComment(sub, type, author)
		const id = message && message.id
		return id
	},
	ended: subjectObject => subjectObject && subjectObject.subject && eventEnded(remoteData[subjectDataField(subjectObject.subjectType)])(subjectObject),
	active: subjectObject => subjectObject && subjectObject.subject && eventActive(remoteData[subjectDataField(subjectObject.subjectType)])(subjectObject),
	future: subjectObject => subjectObject && subjectObject.subject && eventFuture(remoteData[subjectDataField(subjectObject.subjectType)])(subjectObject),
	checkIn: subjectObject => {
		const primaryField = remoteData[subjectDataField(subjectObject.subjectType)]
		if(eventActive(primaryField)(subjectObject)) {
			remoteData.Messages.create({
		        //fromuser: attrs.user,
		        subject: subjectObject.subject,
		        subjectType: subjectObject.subjectType,
		        messageType: 3,
		        content: 0
		    })
		}},
	checkedIn: (subjectObject = {subject: auth.userId(), subjectType: subjectData.USER}, options = {}) => {
		//console.log('subjectData checkedIn', subjectObject, options)
		if(!subjectObject.subject) return false
		const subjectObjectSpecsUser = subjectObject.subjectType === subjectData.USER
		//with options.date and subjectObject specifies a user
			//if there is an active date associated with the user return the id
		if(subjectObjectSpecsUser && (options.date || options.eventType === subjectData.DATE)) {
			//console.log('subjectData checkedIn', subjectObject, options)
			const lastCheckin = remoteData.Messages.lastCheckin(subjectObject.subject)
			//console.log('subjectData lastCheckin', lastCheckin)
			const assocDate = subjectData.dates(lastCheckin)
				.reduce((pv, cv, i) => !i ? cv : pv, false)
			//console.log('subjectData assocDate', assocDate)
			if(assocDate && assocDate.id) return assocDate.id
		//with options.day and subjectObject specifies a user
			//if there is an active day associated with the user return the id
		} else if(subjectObjectSpecsUser && (options.day || options.eventType === subjectData.DAY)) {
			//console.log('subjectData checkedIn', subjectObject, options)
			const lastCheckin = remoteData.Messages.lastCheckin(subjectObject.subject)
			//console.log('subjectData lastCheckin', lastCheckin)
			const assocDay = subjectData.days(lastCheckin)
				.reduce((pv, cv, i) => !i ? cv : pv, false)
			//console.log('subjectData assocDay', assocDay)
			if(assocDay && assocDay.id) return assocDay.id
		//with options.set and subjectObject specifies a user
			//if there is an active set associated with the user return the id
		} else if(subjectObjectSpecsUser && (options.set || options.eventType === subjectData.SET)) {
			//console.log('subjectData checkedIn', subjectObject, options)
			const lastCheckin = remoteData.Messages.lastCheckin(subjectObject.subject)
			//console.log('subjectData lastCheckin', lastCheckin)
			const assocSet = subjectData.sets(lastCheckin)
				.reduce((pv, cv, i) => !i ? cv : pv, false)
			//console.log('subjectData assocSet', assocSet)
			if(assocSet && assocSet.id) return assocSet.id
		}
		//no valid options
			//this can either return 
				//the checkinSubjectObject if subjectObject specifies a user
				//checkinSubjectObjects for currently checked in (directly only, so it works better for who else is checked into a set than a date) users if subjectObject is checkinable
		if(subjectObjectSpecsUser) {
			return remoteData.Messages.lastCheckin(subjectObject.subject)
		}

		const subjectCheckinsFilter = _.assign({}, subjectObject, {messageType: 3})
		//console.log('subjectData subjectCheckinsFilter', subjectCheckinsFilter)
		const subjectDirectCheckins = remoteData.Messages.getFiltered(subjectCheckinsFilter)
			.reduce((pv, checkin) => {
				const active = remoteData.Messages.lastCheckin(checkin.fromuser).id === checkin.id
				if(active) {
					pv.active.push(checkin)
				} else {
					pv.ended.push(checkin)
				}
				return pv
			}, {active: [], ended: []})

		return subjectDirectCheckins

	},
	feelingClass: subjectObject => {
		const rating = subjectData.ratingObject(subjectObject)
		const strength = rating.color === 'black' ? 'weak' : 'strong'
		const feeling = !rating.rating ? '' :
			rating.rating < 3 ? 'hate' :
			rating.rating < 4 ? 'like' :
			'love'
		return feeling && `gt-feeling-${strength}-${feeling}` || 'gt-feeling-unsure'
	},
	imagePreset: type => 'artist',
	connectedData: subjectObject => {
		//get non-event data needed to display a detail view of the subject

		//first check if bulk data on subject has already been collected:


		//festival detail:
		//nonmessages:
		//artists in the lineup

		//messages with subjects:
		//event
		//all superEvents
		//all subEvents
		//all artists in lineup
		//future: all places for festival
	},
	dates: (subjectObject) => {
		if(!subjectObject) return []
		const primaryField = remoteData[subjectDataField(subjectObject.subjectType)]
		const lowerDates = primaryField.getSubDateIds ? primaryField.getSubDateIds(subjectObject.subject) : []
		const higherDates = primaryField.getDateId ? [primaryField.getDateId(subjectObject.subject)] : []
		const allDates = [...(lowerDates ? lowerDates : []), ...(higherDates ? higherDates : [])]
			.filter(x => x)
		//console.log('subjectData dates', subjectObject, allDates, primaryField.getDateId(subjectObject.subject))
		return remoteData.Dates.getMany(allDates)
	},
	festivals: (subjectObject) => {
		if(!subjectObject) return []
		const primaryField = remoteData[subjectDataField(subjectObject.subjectType)]
		const lowerFestivals = primaryField.getSubFestivalIds ? primaryField.getSubFestivalIds(subjectObject.subject) : []
		const higherFestivals = primaryField.getFestivalId ? [primaryField.getFestivalId(subjectObject.subject)] : []
		const allFestivals = [...(lowerFestivals ? lowerFestivals : []), ...(higherFestivals ? higherFestivals : [])]
			.filter(x => x)
		//console.log('subjectData Festivals', subjectObject, allFestivals, primaryField.getFestivalId(subjectObject.subject))
		return remoteData.Festivals.getMany(allFestivals)
	},
	days: (subjectObject) => {
		if(!subjectObject) return []
		const primaryField = remoteData[subjectDataField(subjectObject.subjectType)]
		const lowerDays = primaryField.getSubDayIds ? primaryField.getSubDayIds(subjectObject.subject) : []
		const higherDays = primaryField.getDayId ? [primaryField.getDayId(subjectObject.subject)] : []
		const allDays = [...(lowerDays ? lowerDays : []), ...(higherDays ? higherDays : [])]
			.filter(x => x)
		//console.log('subjectData dates', subjectObject, allDates, primaryField.getDateId(subjectObject.subject))
		return remoteData.Days.getMany(allDays)
	},
	sets: (subjectObject) => {
		if(!subjectObject) return []
		const dataField = remoteData[subjectDataField(subjectObject.subjectType)]
		const ids = dataField.getSubSetIds ? dataField.getSubSetIds(subjectObject.subject) : []
		return remoteData.Sets.getMany(ids)
	},
	subEvent: (main, possibleSub) => {
		//get level for subs
		//get subjectData method name for possibleSub level
		const method = subjectDataField(possibleSub.subjectType).toLowerCase()
		const subs = subjectData[method](main)
		const retVal = subs.length && _.some(subs, s => s.id === possibleSub.subject)
		//console.log('subjectData subEvent', main, possibleSub, method, subs, retVal)
		return retVal
	},
	places: (subjectObject) => {
		if(!subjectObject) return []
		return subjectData.festivals(subjectObject)
			.map(festival => { return{subject: festival.id, subjectType: subjectData.FESTIVAL}})
			.map(remoteData.Places.getFiltered)
			//.filter(s => console.log('subjectData.places festival', s) || true)
			.reduce((pv, cv) => [...pv, ...cv], [])
	},
	users: (subjectObject) => {
		if(!subjectObject) return []
		//return all users active on the subjectObject
		const users = remoteData.Users.getMany(userIdsActive(subjectObject))
		return users
		
	},
	loadMessagesForSubject: subjectObject => {
		//reject if invalid parameters
		if(!subjectObject || !subjectObject.subject) return Promise.reject('invalid Subject Data for load')
		const dataFieldName = 'Messages'
		const baseUrl = dataFieldName
		const secondarySubjects = secondarySubjectObjects(subjectObject.subjectType)(subjectObject)
		const whereString = JSON.stringify({
			or: [subjectObject, ...secondarySubjects]
				.map(so => {return {and: [
					{subject: so.subject},
					{subjectType: so.subjectType}
				]};})
		})

		const end = baseUrl + `?filter={"where":${whereString}}`


		//return and resolve to empty array if 
		const cachePath =  `${subjectObject.subjectType}.${subjectObject.subject}`

		const alreadyLoaded = _.get(subjectLoaded, cachePath, false)
		if(alreadyLoaded) return Promise.resolve([])
		_.set(subjectLoaded, cachePath, true)


		const dataField = remoteData[subjectDataField(subjectObject.subjectType)]
		//get the raw data
		const bulkUpdatePromise = auth.getAccessToken()
			.then(token => m.request(reqOptionsCreate(tokenFunction(token))(end, 'GET')()))
			.then(result => result.data)
			.then(dataField.backfillList)
			.then(unionLocalList('remoteData.' + dataFieldName, {updateMeta: true}))
			.catch(err => {
				//set cache back to empty
				_.set(subjectLoaded, cachePath, false)
				console.error('subjectData loadFor bulkUpdatePromise catch')
				console.dir(subjectObject)
				console.error(err)
			})

		return bulkUpdatePromise
	},
	getDetail: (subjectObject) => {
		//console.log('subjectData getDetail', secondarySubjectObjects(subjectObject.subjectType)(subjectObject.subject))
		const primaryField = remoteData[subjectDataField(subjectObject.subjectType)]
		const name = primaryField.getName(subjectObject.subject)
		if(/undefined/.test(name)) return {}
		const subStrings = [
			primaryField.getTimeString ? primaryField.getTimeString(subjectObject.subject) : ''
		].filter(x => x)
		const subjectRating = subjectData.ratingBy(subjectObject.subject, subjectObject.subjectType, auth.userId())
		//checkin is allowed if subject is:
			//a series/festival/date with an ongoing date (checked in stored at date)
			//an ongoing day (also checkins to date if not already)
			//an ongoing set (also day/date if not checked)
			//a place
			//a venue
		const reviewAllowed = [
			//invalid
			false,
			//user
			false,
			//artist
			true,
			//set
			true,
			//place
			true,
			//venue
			true,
			//series
			true,
			//festival
			true,
			//date
			true,
			//day
			true,
			//message
			false

		][subjectObject.subjectType]
		const checkinAllowed = eventActive(primaryField)(subjectObject)
		const lastCheckin = checkinAllowed && remoteData.Messages.lastCheckin(auth.userId())
		//console.log('SetDetail lastCheckin', lastCheckin)
		const checkedIn = checkinAllowed && subjectObject.subject === lastCheckin.subject && subjectObject.subjectType === lastCheckin.subjectType

		const relatedMessages = remoteData.Messages.getFiltered(subjectObject)


		const allPrimaryReviewMessages = relatedMessages
			.filter(m => m.messageType === 1 || m.messageType === 2)
		//console.log('subjectData getDetail', subjectObject, name)

		
		const secondaryReviewSubjects = secondarySubjectObjects(subjectObject.subjectType)(subjectObject)
		const useSecondary = secondaryReviewSubjects && secondaryReviewSubjects.length

		//console.log('subjectData.getDetail secondaryReviewSubjects', secondaryReviewSubjects)

		const secondaryReviewMessages = (useSecondary ? secondaryReviewSubjects : [])
			.map(remoteData.Messages.getFiltered)
			//.filter(m => console.log('subjectData secondaryReviewMessages', m))
			.reduce((pv, cv) => [...pv, ...cv], [])

		//console.log('subjectData.getDetail secondaryReviewMessages', secondaryReviewMessages)
		
		const reviews = reviewArrays([...allPrimaryReviewMessages, ...secondaryReviewMessages])
		//console.log('subjectData.getDetail reviews', reviews)

		const checkins = subjectData.checkedIn(subjectObject)
		//console.log('subjectData.getDetail checkins', checkins)
		//merge the checkins with the reviews
		/*
		const checkinsWithReviews = _.map(checkins, state => state.map(checkin => {
			const matchedReview = reviews.find(r => r.author === checkin.fromuser && sameSubject(r, checkin))
			const assignReview = matchedReview ? matchedReview : {
				author: checkin.fromuser,
				comment: '',
				commentId: 0,
				rating: 0,
				ratingId: 0,
				subjectObject: checkin,
				timestamp: checkin.timestamp
			}
			return _.assign({}, checkin, {review: assignReview})
		}))
		*/


		const myReviews = reviews.filter(r => r.author === auth.userId())
		const friendReviews = reviews.filter(r => r.author !== auth.userId())
		const detailObject = {
			name: name,
			subStrings: subStrings,
			rating: subjectRating,
			checkinAllowed: checkinAllowed,
			checkins: checkins,
			reviewAllowed: reviewAllowed,
			checkedIn: checkedIn,
			myReviews: myReviews,
			friendReviews: friendReviews,
			type: subjectDataField(subjectObject.subjectType)
		}
		return detailObject
/*
		
		*/
	}
}